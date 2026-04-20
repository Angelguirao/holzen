import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Defaults when `VITE_SUPABASE_*` are unset: local `npm run dev`, and `vite build` without env
// (e.g. Lovable preview). Override with `.env` / CI / Lovable Cloud vars for another project.
// `localstack` never uses these — use `.env.localstack` / Docker Supabase only.
const FALLBACK_SUPABASE_URL = "https://edgbwdecaoottowliimu.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZ2J3ZGVjYW9vdHRvd2xpaW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzgyMzcsImV4cCI6MjA4ODMxNDIzN30.ZNh2feSmMhdZmEk6omdd8q5HDjBHytz-gzktI0txwM8";

// Public observability config (Sentry DSN, PostHog key/host) lives in
// `src/config/public-env.ts` alongside the rest of the public browser config.
// Vite auto-exposes any `VITE_*` env var to `import.meta.env`, so there is
// nothing to wire here — `public-env.ts` applies fallbacks at module load.

/** ≤4 origins: Supabase (effective project URL) + fonts + CoinGecko (see docs/backlog/resource-hints-preconnect.md). */
function preconnectHeadSnippet(supabaseUrl: string): string {
  const lines = [
    "    <!-- Preconnects (vite): docs/backlog/resource-hints-preconnect.md -->",
  ];
  try {
    if (supabaseUrl) {
      const origin = new URL(supabaseUrl).origin;
      if (origin.startsWith("http://") || origin.startsWith("https://")) {
        lines.push(`    <link rel="preconnect" href="${origin}" />`);
      }
    }
  } catch {
    /* ignore invalid URL */
  }
  lines.push(
    '    <link rel="preconnect" href="https://fonts.googleapis.com" />',
    '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    '    <link rel="preconnect" href="https://api.coingecko.com" />',
  );
  return lines.join("\n");
}

/**
 * Resolve the release string injected as `__APP_VERSION__` (Sentry release + PostHog `$app_version`).
 * See `define` block in `defineConfig` below for how this flows into the bundle.
 */
function resolveAppVersion({
  explicit,
  isBuild,
}: {
  explicit?: string;
  isBuild: boolean;
}): string {
  if (explicit && explicit.trim()) return explicit.trim();

  // Dev server / tests: a stable placeholder is fine — no release health at stake.
  if (!isBuild) return "dev";

  // Prefer Git SHA — Lovable builds from the repo so this just works, and a SHA is the most
  // useful identifier for bisecting a crash back to a commit.
  try {
    const sha = execSync("git rev-parse --short=12 HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
      timeout: 2000,
    }).trim();
    if (sha) return sha;
  } catch {
    /* git unavailable (stripped workspace, non-git build worker) — fall through */
  }

  // Last resort: package.json version + base36 timestamp. Guarantees two deploys never collide,
  // even if somehow the worker has no git binary. Format: `0.0.0-b3m7wfq2` → sortable by deploy.
  let pkgVersion = "0.0.0";
  try {
    const pkg = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf8")) as {
      version?: string;
    };
    if (pkg.version) pkgVersion = pkg.version;
  } catch {
    /* keep default */
  }
  const stamp = Date.now().toString(36);
  return `${pkgVersion}-b${stamp}`;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHostedFallback =
    mode !== "localstack" && (command === "serve" || command === "build");
  const supabaseUrl = useHostedFallback
    ? env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL
    : env.VITE_SUPABASE_URL || "";
  const supabaseKey = useHostedFallback
    ? env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY
    : env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  // Release identifier shared with Sentry (frontend + edges) and PostHog (`$app_version`).
  // Resolution order so Lovable/local/CI all get a unique, useful release string without
  // requiring anyone to remember to set VITE_APP_VERSION:
  //   1. Explicit `VITE_APP_VERSION` (env/CI/Lovable override — always wins).
  //   2. Short Git SHA via `git rev-parse` (works on Lovable + any git-based build worker).
  //   3. `package.json#version` + build-time epoch slug, so two deploys without git still differ.
  // Falls back to `"dev"` only for non-build commands (dev server / tests) where a real release
  // makes no sense. Sentry release-health breaks the moment two deploys share a release ID, so
  // guaranteeing uniqueness per build is the whole point of this ladder.
  const appVersion = resolveAppVersion({
    explicit: env.VITE_APP_VERSION || process.env.VITE_APP_VERSION,
    isBuild: command === "build",
  });

  // Source-map upload gated on CI-only secrets; plugin is a no-op without them.
  const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
  const sentryOrg = process.env.SENTRY_ORG;
  const sentryProject = process.env.SENTRY_PROJECT;
  const sentryPluginEnabled =
    command === "build" && !!sentryAuthToken && !!sentryOrg && !!sentryProject;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseKey),
      "__BUILD_TIME__": JSON.stringify(new Date().toISOString()),
      "__APP_VERSION__": JSON.stringify(appVersion),
    },
    // Sentry needs hidden source maps so stack traces resolve without shipping maps to users.
    build: {
      sourcemap: sentryPluginEnabled ? "hidden" : false,
    },
    plugins: [
      {
        name: "holzen-inject-preconnect",
        transformIndexHtml(html: string) {
          if (!html.includes("</head>")) return html;
          return html.replace(
            "</head>",
            `${preconnectHeadSnippet(supabaseUrl)}\n  </head>`,
          );
        },
      },
      react(),
      (mode === "development" || mode === "hosted" || mode === "localstack") &&
        componentTagger(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        registerType: "prompt",
        injectRegister: false,
        includeAssets: ["icon-512.png"],
        manifest: false,
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
        },
      }),
      // Must be last — uploads source maps after the build finishes.
      sentryPluginEnabled &&
        sentryVitePlugin({
          authToken: sentryAuthToken,
          org: sentryOrg,
          project: sentryProject,
          release: { name: appVersion },
          sourcemaps: { filesToDeleteAfterUpload: ["dist/**/*.map"] },
          telemetry: false,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@holzen-pause-context": path.resolve(
          __dirname,
          "./supabase/functions/_shared/pause-context-suffix.ts",
        ),
      },
    },
  };
});
