// Ambient declarations so the Vite/Node TypeScript checker stops flagging
// Deno-only globals and remote URL imports inside `supabase/functions/`.
// These files actually run on the Supabase Deno edge runtime — this shim
// is purely to keep the local TS server quiet during frontend dev.

declare const Deno: {
  env: {
    get(name: string): string | undefined;
    set(name: string, value: string): void;
    toObject(): Record<string, string>;
  };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  readTextFile(path: string | URL): Promise<string>;
  readFile(path: string | URL): Promise<Uint8Array>;
  // Catch-all for any other Deno API touched by edge code.
  [key: string]: unknown;
};

// Allow `import ... from "https://esm.sh/..."` and other URL imports
// (npm:, jsr:, deno.land, etc.) without TS2307.
declare module "https://*";
declare module "http://*";
declare module "npm:*";
declare module "jsr:*";