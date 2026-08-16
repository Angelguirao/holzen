-- Holzen brain corpus: works + chunks + hybrid retrieve (FTS + pgvector RRF).
-- Editorial SoT is sibling repo holzen-brain. Chunks are an index, not meaning SoT.
-- Execute: service_role only (companion-orchestrate). No authenticated dump of book text.

create extension if not exists vector with schema extensions;

create table if not exists public.holzen_works (
  id text primary key,
  kind text not null default 'essay',
  title text not null,
  author text,
  cite_url text,
  wiki_path text,
  corpus_path text,
  serve_in text[] not null default '{}',
  status text not null default 'published',
  quality integer not null default 3,
  updated_at timestamptz not null default now(),
  constraint holzen_works_kind_check check (kind in ('book', 'paper', 'essay', 'article', 'product')),
  constraint holzen_works_status_check check (status in ('draft', 'published')),
  constraint holzen_works_quality_check check (quality between 1 and 5)
);

comment on table public.holzen_works is
  'Catalogue of corpus works projected from holzen-brain serve.yaml. Not user-facing library UI.';

create table if not exists public.holzen_chunks (
  id text primary key,
  work_id text not null references public.holzen_works (id) on delete cascade,
  chunk_index integer not null,
  heading text,
  body text not null,
  content_sha text,
  fts tsvector generated always as (
    to_tsvector('english', coalesce(heading, '') || ' ' || coalesce(body, ''))
  ) stored,
  embedding extensions.vector(1536),
  updated_at timestamptz not null default now(),
  constraint holzen_chunks_body_len check (char_length(body) <= 12000)
);

comment on table public.holzen_chunks is
  'Extracted book/paper/essay passages for hybrid retrieve. Full files stay in holzen-brain corpus/.';

create index if not exists holzen_chunks_fts_idx on public.holzen_chunks using gin (fts);
create index if not exists holzen_chunks_work_idx on public.holzen_chunks (work_id, chunk_index);
create index if not exists holzen_chunks_embedding_idx
  on public.holzen_chunks
  using hnsw (embedding extensions.vector_cosine_ops)
  where embedding is not null;

create index if not exists holzen_works_serve_in_idx on public.holzen_works using gin (serve_in);

alter table public.holzen_works enable row level security;
alter table public.holzen_chunks enable row level security;

drop policy if exists holzen_works_deny_anon on public.holzen_works;
drop policy if exists holzen_works_deny_authenticated on public.holzen_works;
drop policy if exists holzen_works_admin_read on public.holzen_works;
drop policy if exists holzen_chunks_deny_anon on public.holzen_chunks;
drop policy if exists holzen_chunks_deny_authenticated on public.holzen_chunks;

create policy holzen_works_deny_anon on public.holzen_works
  as restrictive for all to anon using (false) with check (false);

create policy holzen_works_admin_read on public.holzen_works
  for select to authenticated
  using (public.is_admin());

create policy holzen_chunks_deny_anon on public.holzen_chunks
  as restrictive for all to anon using (false) with check (false);

create policy holzen_chunks_deny_authenticated on public.holzen_chunks
  as restrictive for all to authenticated using (false) with check (false);

create or replace function public.holzen_hybrid_search_chunks(
  query_text text,
  query_embedding extensions.vector(1536),
  serve_filter text default 'ritual',
  match_count int default 8,
  full_text_weight float default 1,
  semantic_weight float default 1,
  rrf_k int default 50
)
returns table (
  id text,
  work_id text,
  title text,
  cite_url text,
  heading text,
  body text,
  rrf_score float
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with eligible as (
    select c.id
    from public.holzen_chunks c
    join public.holzen_works w on w.id = c.work_id
    where w.status = 'published'
      and serve_filter = any (w.serve_in)
  ),
  full_text as (
    select
      c.id,
      row_number() over (
        order by ts_rank_cd(c.fts, websearch_to_tsquery('english', query_text)) desc
      ) as rank_ix
    from public.holzen_chunks c
    where c.id in (select eligible.id from eligible)
      and query_text is not null
      and length(trim(query_text)) > 0
      and c.fts @@ websearch_to_tsquery('english', query_text)
    order by rank_ix
    limit least(match_count, 30) * 2
  ),
  semantic as (
    select
      c.id,
      row_number() over (order by c.embedding <=> query_embedding) as rank_ix
    from public.holzen_chunks c
    where c.id in (select eligible.id from eligible)
      and c.embedding is not null
      and query_embedding is not null
    order by rank_ix
    limit least(match_count, 30) * 2
  )
  select
    c.id,
    c.work_id,
    w.title,
    w.cite_url,
    c.heading,
    left(c.body, 1800) as body,
    (
      coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
      coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
    )::float as rrf_score
  from full_text
  full outer join semantic on full_text.id = semantic.id
  join public.holzen_chunks c on c.id = coalesce(full_text.id, semantic.id)
  join public.holzen_works w on w.id = c.work_id
  order by rrf_score desc
  limit least(match_count, 30);
$$;

revoke all on function public.holzen_hybrid_search_chunks(
  text, extensions.vector, text, int, float, float, int
) from public, anon, authenticated;

grant execute on function public.holzen_hybrid_search_chunks(
  text, extensions.vector, text, int, float, float, int
) to service_role;

alter table public.companion_serves
  drop constraint if exists companion_serves_serve_source_check;

alter table public.companion_serves
  add constraint companion_serves_serve_source_check
  check (serve_source in ('live', 'library', 'catalog', 'corpus', 'cache', 'curated', 'empty'));

comment on column public.companion_serves.serve_source is
  'live | catalog | library (legacy) | corpus (holzen_chunks) | cache | curated | empty';
