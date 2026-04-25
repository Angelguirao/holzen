// Ambient declarations so the local TS/Vite checker stops flagging Deno
// edge code. Deno itself supplies `lib.deno.ns.d.ts` (real Deno namespace),
// so we ONLY shim remote URL specifiers here — no Deno globals.
//
// Each declaration uses a Proxy-friendly catch-all named export so that any
// `import { Foo } from "https://..."` resolves to `any` instead of TS2305.

declare module "https://*" {
  // deno-lint-ignore no-explicit-any
  const anyExport: any;
  export = anyExport;
}
declare module "http://*" {
  // deno-lint-ignore no-explicit-any
  const anyExport: any;
  export = anyExport;
}
declare module "npm:*" {
  // deno-lint-ignore no-explicit-any
  const anyExport: any;
  export = anyExport;
}
declare module "jsr:*" {
  // deno-lint-ignore no-explicit-any
  const anyExport: any;
  export = anyExport;
}
