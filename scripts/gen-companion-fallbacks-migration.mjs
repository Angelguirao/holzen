/**
 * Reads supabase/functions/_shared/fallback-seed.json and writes
 * supabase/migrations/<timestamp>_companion_fallbacks.sql
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const seedPath = path.join(root, "supabase/functions/_shared/fallback-seed.json");
const outPath = path.join(root, "supabase/migrations/20260329260000_companion_fallbacks.sql");

const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const POOLS = ["signal", "grounding", "history", "zoom_out", "reflection"];

const valueRows = [];
for (const pool of POOLS) {
  const arr = seed[pool];
  if (!Array.isArray(arr)) throw new Error(`Missing pool ${pool}`);
  arr.forEach((payload, i) => {
    const json = JSON.stringify(payload);
    const escaped = json.replace(/\\/g, "\\\\").replace(/'/g, "''");
    valueRows.push(`  ('${pool}', ${i}, '${escaped}'::jsonb, true)`);
  });
}

const sql = `-- Last-resort hardcoded fallback pools (editable by admins; edge loaders prefer DB over file seed).
CREATE TABLE IF NOT EXISTS public.companion_fallbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_type text NOT NULL CHECK (pool_type IN ('signal', 'grounding', 'history', 'zoom_out', 'reflection')),
  sort_order integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companion_fallbacks_pool_active_order
  ON public.companion_fallbacks (pool_type, is_active, sort_order);

COMMENT ON TABLE public.companion_fallbacks IS 'Hardcoded fallback pool items; service role reads for generation; admins CRUD via dashboard.';

ALTER TABLE public.companion_fallbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select companion_fallbacks"
  ON public.companion_fallbacks FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert companion_fallbacks"
  ON public.companion_fallbacks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update companion_fallbacks"
  ON public.companion_fallbacks FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete companion_fallbacks"
  ON public.companion_fallbacks FOR DELETE TO authenticated
  USING (public.is_admin());

INSERT INTO public.companion_fallbacks (pool_type, sort_order, payload, is_active)
VALUES
${valueRows.join(",\n")};
`;

fs.writeFileSync(outPath, sql, "utf8");
console.log("Wrote", outPath, "rows:", valueRows.length);
