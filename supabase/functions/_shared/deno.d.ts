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

// Allow `import ... from "https://esm.sh/..."` and other URL/specifier
// imports (npm:, jsr:, https:, http:) without TS2307. TypeScript's module
// wildcard matching accepts any literal prefix followed by `*`, so these
// declarations cover every remote specifier shape used by Deno edge code.
declare module "https://*" {
  // deno-lint-ignore no-explicit-any
  const value: any;
  export = value;
}
declare module "http://*" {
  // deno-lint-ignore no-explicit-any
  const value: any;
  export = value;
}
declare module "npm:*" {
  // deno-lint-ignore no-explicit-any
  const value: any;
  export = value;
}
declare module "jsr:*" {
  // deno-lint-ignore no-explicit-any
  const value: any;
  export = value;
}
// Final catch-all so any other unknown specifier (e.g. `deno.land/...`)
// also resolves to a permissive `any` shape rather than TS2307.
declare module "*" {
  // deno-lint-ignore no-explicit-any
  const value: any;
  export default value;
}