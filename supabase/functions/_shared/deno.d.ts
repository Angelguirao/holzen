// Ambient declarations so the Vite/Node TypeScript checker stops flagging
// Deno-only globals and remote URL imports inside `supabase/functions/`.
// These files actually run on the Supabase Deno edge runtime — this shim
// is purely to keep the local TS server quiet during frontend dev.

declare namespace Deno {
  export const env: {
    get(name: string): string | undefined;
    set(name: string, value: string): void;
    toObject(): Record<string, string>;
  };
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
  ): void;
  export function readTextFile(path: string | URL): Promise<string>;
  export function readFile(path: string | URL): Promise<Uint8Array>;
}

// Allow `import ... from "https://esm.sh/..."` and other URL imports
// (npm:, jsr:, deno.land, etc.) without TS2307. The wildcard form is what
// the TypeScript compiler actually honors for arbitrary specifier prefixes.
declare module "https://*" {
  const value: any;
  export = value;
}
declare module "http://*" {
  const value: any;
  export = value;
}
declare module "npm:*" {
  const value: any;
  export = value;
}
declare module "jsr:*" {
  const value: any;
  export = value;
}