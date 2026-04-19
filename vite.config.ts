import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Defaults when `VITE_SUPABASE_*` are unset: local `npm run dev`, and `vite build` without env
// (e.g. Lovable preview). Override with `.env` / CI / Lovable Cloud vars for another project.
// `localstack` never uses these — use `.env.localstack` / Docker Supabase only.
const FALLBACK_SUPABASE_URL = "https://edgbwdecaoottowliimu.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZ2J3ZGVjYW9vdHRvd2xpaW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzgyMzcsImV4cCI6MjA4ODMxNDIzN30.ZNh2feSmMhdZmEk6omdd8q5HDjBHytz-gzktI0txwM8";

// --- Observability fallbacks ---------------------------------------------------------------
// VITE_* vars are build-time browser values, NOT secrets. Lovable's secrets UI explicitly
// rejects them for this reason. These values are public by design:
//   - Sentry DSN is domain-restricted on the vendor side (Sentry project → Allowed Domains).
//   - PostHog project key is write-only for specific event types and domain-throttled.
// Follow the same hardcoded-fallback pattern used above for Supabase. Empty string = feature
// is a no-op (initSentry / initPostHog check for presence and bail silently).
//
// To enable observability in the hosted build, replace the empty strings below with your
// project values and push. To rotate, change here and push again. To disable, set back to "".
const FALLBACK_SENTRY_DSN = "";
const FALLBACK_POSTHOG_KEY = "";
const FALLBACK_POSTHOG_HOST = "https://us.i.posthog.com";

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
  // CI should set VITE_APP_VERSION = Git SHA; local builds fall back to "dev".
  const appVersion = env.VITE_APP_VERSION || process.env.VITE_APP_VERSION || "dev";

  // Observability: env override (for local dev / CI) with repo fallback (for Lovable builds).
  const sentryDsn = env.VITE_SENTRY_DSN || FALLBACK_SENTRY_DSN;
  const posthogKey = env.VITE_POSTHOG_KEY || FALLBACK_POSTHOG_KEY;
  const posthogHost = env.VITE_POSTHOG_HOST || FALLBACK_POSTHOG_HOST;

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
      "import.meta.env.VITE_SENTRY_DSN": JSON.stringify(sentryDsn),
      "import.meta.env.VITE_POSTHOG_KEY": JSON.stringify(posthogKey),
      "import.meta.env.VITE_POSTHOG_HOST": JSON.stringify(posthogHost),
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
