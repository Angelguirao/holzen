export const SUPABASE_PROJECT_REFS = {
  production: "geqkxsnyqvhtascjghuu",
};

const TARGETS = {
  prod: {
    key: "production",
    label: "production",
    projectRef: process.env.SUPABASE_PROD_PROJECT_REF?.trim() || SUPABASE_PROJECT_REFS.production,
  },
  production: {
    key: "production",
    label: "production",
    projectRef: process.env.SUPABASE_PROD_PROJECT_REF?.trim() || SUPABASE_PROJECT_REFS.production,
  },
};

export function resolveSupabaseTarget(rawTarget = "production") {
  const key = rawTarget.trim().toLowerCase();
  const target = TARGETS[key];
  if (!target) {
    throw new Error(`Unknown target: ${rawTarget}. Use prod or production.`);
  }
  return target;
}

export function formatSupabaseTarget(target) {
  return `${target.label} (${target.projectRef})`;
}
