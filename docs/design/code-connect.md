# Figma Code Connect (Holzen ↔ Nox)

Links **Nox** components in Figma to **Holzen** implementations so Dev Mode and the Figma MCP server show production snippets (`@/components/ui/*`) instead of generic JSX.

## Figma files

| File | Key | Use |
|------|-----|-----|
| Nox Components | `5CTApv6IlReBfdB0YS6zxq` | Action, Form, Feedback, Navigation sets |
| Nox Foundations | `c6vKLjDHRKfpluorJlT90n` | Tokens (no Code Connect mappings yet) |
| Wireframes | `wFCCcvr3uOQRzwkjAfSiNI` | Product screens — map screen-by-screen later |

Inventory and variant names: [`nox/components/README.md`](nox/components/README.md).

## Requirements

- **Figma Organization or Enterprise** plan
- **Full Design or Dev Mode seat** on that plan
- [Personal access token](https://help.figma.com/hc/en-us/articles/8085703771159) with Code Connect scope

Without the right seat, `figma connect publish` and Figma MCP Code Connect tools return a plan error.

## Setup (one time)

1. Create a token at Figma → Settings → Security → Personal access tokens.
2. Add to a gitignored env file (local only):

   ```bash
   # .env.figma.local (gitignored — add to your shell profile or direnv)
   FIGMA_ACCESS_TOKEN=figd_...
   ```

3. Install deps (includes `@figma/code-connect`):

   ```bash
   npm install
   ```

## Publish mappings

Dry-run (validate without writing to Figma):

```bash
npm run code-connect:dry-run
```

Publish to the Nox Components library:

```bash
npm run code-connect:publish
```

Unpublish (remove CLI-published connections):

```bash
npm run code-connect:unpublish
```

## Repo layout

| Path | Role |
|------|------|
| `figma.config.json` | CLI parser, include globs, `@/` import paths |
| `src/code-connect/nox-figma.ts` | Nox file key + URL helper |
| `src/components/ui/*.figma.tsx` | Colocated React Code Connect mappings |

### Mapped today

| Figma (Nox) | Node | Holzen code |
|-------------|------|-------------|
| `Action/Button` | `23:432` | `Button` |
| `Form/Text-field` | `111:67` | `Input` |
| `Form/Tag` | `203:193` | `Badge` |
| `Feedback/Loading-spinner` | `71:434` | `LoadingSpinner` |
| `Navigation/Process-stepper` | `61:217` | `ProcessStepper` |

Add mappings by copying a `.figma.tsx` file, pointing `noxComponentUrl("…")` at the component set node (from Figma → Copy link to selection), and running dry-run.

## Cursor / MCP

When Code Connect is published, Figma MCP `get_design_context` prefers connected snippets for mapped components — useful for implementing Wireframes against real Holzen UI.

Holzen’s `.cursor/mcp.json.example` does not include Figma; enable the Figma MCP plugin in Cursor globally (already available in this workspace).

## Alternative: Code Connect UI

You can also map components inside Figma (GitHub-linked UI). CLI and UI share the same MCP output; **CLI mappings must be edited in the repo**, UI mappings in Figma. Many teams use both.
