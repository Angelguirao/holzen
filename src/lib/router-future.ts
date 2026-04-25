/**
 * React Router v7 migration flags (opt-in early).
 * Use on every top-level `BrowserRouter` / `MemoryRouter` so behavior matches production and Vitest stays free of v7 deprecation noise.
 */
export const reactRouterFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;
