# React Router: opt into v7 future flags

**Status:** backlog — upgrade hygiene.

## Goal

Clear **React Router v6** console warnings by adopting documented **future flags** (`v7_startTransition`, `v7_relativeSplatPath`) ahead of v7, per [React Router upgrading guide](https://reactrouter.com/v6/upgrading/future).

## Rationale

DevTools shows two warnings: state updates will use **`React.startTransition`** in v7, and **relative route resolution within splat routes** is changing. Opting in early reduces surprise when upgrading.

## Direction

- Add **`future`** flags on **`createBrowserRouter`** / **`RouterProvider`** — or the **`BrowserRouter`**-equivalent pattern your version supports (verify against installed **`react-router-dom`** version).
- Smoke-test **`/`**, **`/welcome`**, nested routes, and any **splat** routes.

## Related

- [typed-navigation-state.md](typed-navigation-state.md) — navigation payloads while touching the router.
