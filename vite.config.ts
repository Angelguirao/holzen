import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Defaults when `VITE_SUPABASE_*` are unset: local `npm run dev`, and `vite build` without env
// (e.g. Lovable preview). Override with `.env` / CI / Lovable Cloud vars for another project.
// `localstack` never uses these — use `.env.localstack` / Docker Supabase only.
const FALLBACK_SUPABASE_URL = "https://edgbwdecaoottowliimu.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZ2J3ZGVjYW9vdHRvd2xpaW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzgyMzcsImV4cCI6MjA4ODMxNDIzN30.ZNh2feSmMhdZmEk6omdd8q5HDjBHytz-gzktI0txwM8";

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
    },
    plugins: [
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
        },
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
