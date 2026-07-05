export const SUPABASE_PROJECT_REFS = {
  staging: "ksplyxxdvandkwzundql",
  production: "geqkxsnyqvhtascjghuu",
};

const TARGETS = {
  staging: {
    key: "staging",
    label: "staging",
    projectRef: process.env.SUPABASE_STAGING_PROJECT_REF?.trim() || SUPABASE_PROJECT_REFS.staging,
  },
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
    throw new Error(`Unknown target: ${rawTarget}. Use staging, prod, or production.`);
  }
  return target;
}

export function formatSupabaseTarget(target) {
  return `${target.label} (${target.projectRef})`;
}
