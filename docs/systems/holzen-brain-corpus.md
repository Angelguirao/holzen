# Holzen brain corpus

**Owner:** this page (runtime + DB). Editorial vault: sibling **`holzen-brain/`**.

Holzen’s pause Signal cards can retrieve **approved passages** from extracted books, papers, and essays. The wiki is the map and the law. Chunks are an index (same split as LifeOS ADR 002 — do **not** store this index in the LifeOS project).

## Loop

```
Calibre/Zotero/clip → holzen-brain extract/compile/review
        → npm run serve (service role)
        → holzen_works + holzen_chunks
        → companion-orchestrate Signal: catalog → corpus → cache → live → curated
```

| Piece | Role |
|---|---|
| `holzen-brain/raw/` | Clips and stubs (git) |
| `holzen-brain/corpus/` | Full extracted markdown (gitignored except `corpus/product/`) |
| `holzen-brain/wiki/` | Sources + thought + product law |
| `serve.yaml` | What may ship this run |
| `deny.yaml` | Never-ritual phrases/domains |
| `holzen_works` | Work metadata + `serve_in` |
| `holzen_chunks` | FTS + `vector(1536)` passages |
| RPC `holzen_hybrid_search_chunks` | RRF; **service_role only** |

## Signal

Phase toggle: `COMPANION_PHASE_CORPUS` (default on). Empty tables miss through. `companion_serves.serve_source` may be `corpus`.

Live Perplexity remains the **news** path (allowlisted `signal_sources`). Corpus is the **slow library**.

## Ops

1. Open `holzen-brain` as an Obsidian vault.
2. Import EPUB/PDF to Calibre/Zotero; `npm run extract -- file.epub --slug … --kind books`.
3. Clip essays to `raw/articles/`; `npm run compile`; `npm run review -- approve …`.
4. List the work in `serve.yaml`; `npm run serve` with `HOLZEN_SUPABASE_*` + `OPENROUTER_API_KEY`.
5. Apply migration `20260816140000_holzen_brain_corpus.sql` (local Docker first).

User-facing pause UI does not dump chapters — only a short cited card.
