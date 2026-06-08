# VSBG Box — Code Standards

> Project-wide conventions for TypeScript, imports, components, state, forms, API client, security, and tooling.
> All paths relative to repo root.

---

## 1. TypeScript

### 1.1 Config (`tsconfig.cloudflare.json`)

| Setting | Value | Notes |
|---|---|---|
| `strict` | `true` | Project-wide |
| `noImplicitAny` | **`false`** | Relaxed deliberately for AI SDK v6 tool overloads |
| `checkJs` | `true` | Type-checks JS in scope |
| `verbatimModuleSyntax` | `true` | Forces `import type` for type-only imports |
| `skipLibCheck` | `true` | Skips `.d.ts` from node_modules |
| `target` | `ES2022` | |
| `module` | `ES2022` | |
| `moduleResolution` | `bundler` | |
| `jsx` | `react-jsx` | React 19 + RR7 SSR |
| `lib` | `["DOM", "DOM.Iterable", "ES2022"]` | DOM lib included (workers need `Blob`, `ReadableStream`, `URL`) |
| `types` | `["vite/client", "@cloudflare/workers-types/experimental"]` | + `./worker-configuration.d.ts` via root `tsconfig.json` |
| `esModuleInterop` | `true` | |
| `resolveJsonModule` | `true` | |
| `noEmit` | `true` | Vite does the actual emit |
| `paths` | `{ "~/*": ["./app/*"] }` | **Frontend only** (workers use relative paths) |
| `include` | `.react-router/types/**/*`, `app/**/*`, `workers/**/*`, `shared/**/*`, `worker-configuration.d.ts` | |

`tsconfig.json` (root) is a project-references shell. `tsconfig.node.json` covers `vite.config.ts` only.

### 1.2 Type Generation

```bash
pnpm typecheck    # wrangler types → react-router typegen → tsc -b
```

This regenerates `worker-configuration.d.ts` (Cloudflare bindings types) and `.react-router/types/` (RR route types) on every check.

### 1.3 Type Conventions

- **Type-only imports**: `import type { Email } from "~/types";` (enforced by `verbatimModuleSyntax`).
- **Public types live in `app/types/index.ts`** and `workers/lib/schemas.ts` (Zod).
- The Zod schema is the source of truth for request bodies; the matching TS interface is derived (`z.infer`).
- Avoid `any`. When forced (e.g. AI SDK tool overloads), use the project-wide `noImplicitAny: false` exception rather than local `: any`.
- Don't re-declare global types; extend `Cloudflare.Env` via `worker-configuration.d.ts`.

---

## 2. Import Patterns

### 2.1 Frontend (TSX/TS in `app/`)

Always use the `~/*` path alias. **Never** use `../../../` in the app code.

```ts
// Components
import { EmailPanel } from "~/components/EmailPanel";
import { Sidebar } from "~/components/Sidebar";
import { RichTextEditor } from "~/components/RichTextEditor";
import { MobileSocialInboxCard } from "~/components/MobileSocialInboxCard";
import { ConversationStateControls } from "~/components/conversation-social/ConversationStateControls";

// Hooks
import { useUIStore } from "~/hooks/useUIStore";
import { useComposeForm } from "~/hooks/useComposeForm";

// Queries (TanStack Query)
import { useEmails, useSendEmail } from "~/queries/emails";
import { useMailboxes } from "~/queries/mailboxes";
import { queryKeys } from "~/queries/keys";

// Services
import { ApiError, get, post } from "~/services/api";

// Types
import type { Email, Mailbox, Folder, ConversationState } from "~/types";

// Lib utilities
import { escapeHtml, buildQuotedReplyBlock } from "~/lib/utils";
import { parseSearchQuery } from "~/lib/search-parser";
import { filesToImageAttachments } from "~/lib/image-attachments";

// Shared (DOM-agnostic)
import { formatListDate } from "shared/dates";
```

### 2.2 Backend (TS in `workers/` and `shared/`)

Workers and shared code use **relative imports** (no path alias):

```ts
// In workers/index.ts
import { app as apiApp, receiveEmail } from "./index";
import { getAccessEmail, normalizeEmail } from "./lib/access";
import { MailboxDO } from "./durableObject";
import { Folders } from "../shared/folders";
```

### 2.3 What You May Not Import

- **`app/` cannot import from `workers/`.** Workers are the runtime; the app talks to them only over HTTP.
- **`workers/` should not import from `app/`.** Workers ship a server build; the app build is a client/SSR build.
- **`shared/` is the only folder both sides may import from.** It must remain DOM-agnostic and side-effect-free.

---

## 3. Component Patterns

### 3.1 Library Choices

| Concern | Library | **Forbidden** |
|---|---|---|
| UI primitives | `@cloudflare/kumo` (Button, Input, Dialog, Empty, Loader, Pagination, Tooltip, Toasty, Banner, Badge, Select, Text, LinkProvider, TooltipProvider) | MUI, shadcn/ui, Ant Design, Chakra, Mantine |
| Styling | Tailwind v4 utility classes inline | CSS modules, `styled-components`, Sass, `.scss` |
| Icons | `@phosphor-icons/react` | Icon fonts, raw SVG imports |
| Layout | Tailwind grid/flex utilities | `<table>` for layout |

### 3.2 Color & Type Tokens

Use Kumo semantic tokens. **Never** hardcode colors or pick a hex literal (inside the app).

```tsx
// good
<div className="bg-kumo-recessed text-kumo-default border-kumo-line">
<button className="bg-kumo-tint text-kumo-strong hover:bg-kumo-fill">

// bad
<div className="bg-[#1a1a1a] text-white border-[#333]">
```

Token reference (non-exhaustive): `bg-kumo-recessed`, `bg-kumo-tint`, `bg-kumo-fill`, `bg-kumo-base`, `text-kumo-default`, `text-kumo-subtle`, `text-kumo-strong`, `text-kumo-brand`, `border-kumo-line`. Full guide: [`design-guidelines.md`](./design-guidelines.md) § 2.

> **Exception:** `app/routes/landing.tsx` is a one-off marketing surface and uses raw hex by design. Keep that boundary: **inside the app → tokens only**.

### 3.3 Tailwind v4

- Configured CSS-first in `app/index.css` via `@import "tailwindcss"` and `@source` to scan Kumo.
- No `tailwind.config.{js,ts}` file — use `@source` directives inside CSS.
- Prefer utility composition (`flex items-center gap-2`) over long single-class chains.

### 3.4 Component Skeleton

```tsx
import { Button, Dialog, Text } from "@cloudflare/kumo";
import { Envelope } from "@phosphor-icons/react";
import { useMailboxes } from "~/queries/mailboxes";

interface Props {
  mailboxId: string;
  onClose: () => void;
}

export function CreateFolderDialog({ mailboxId, onClose }: Props) {
  const { data } = useMailboxes();
  // ... local state, mutation, render
  return (
    <Dialog open onClose={onClose}>
      <Dialog.Header>
        <Envelope size={20} />
        <Text>New folder</Text>
      </Dialog.Header>
      {/* ... */}
    </Dialog>
  );
}
```

Conventions:
- One component per file. Filename = component name in PascalCase.
- Export the component as a **named export**, not default. (Route components are the default export of the route file.)
- `interface Props` (not `type Props`) for component props.
- No prop-spreading without justification (`{...rest}` is a smell).

### 3.5 Component Inventory

| Path | Notes |
|---|---|
| `app/components/AgentPanel.tsx` (592) | Chat UI + tool call render. **Refactor target** — see [`project-roadmap.md`](./project-roadmap.md) § 3.5. |
| `app/components/AgentSidebar.tsx` | Sidebar wrapper. |
| `app/components/ComposeEmail.tsx` | Modal compose. |
| `app/components/ComposePanel.tsx` | Split-pane compose. |
| `app/components/EmailAttachmentList.tsx` | Attachment row list. |
| `app/components/EmailIframe.tsx` | Sandboxed HTML render (DOMPurify + CSP). |
| `app/components/EmailPanel.tsx` (440) | Thread render + social timeline. **Refactor target.** |
| `app/components/Header.tsx` | Mailbox header. |
| `app/components/MailboxSplitView.tsx` | List + detail split. |
| `app/components/MCPPanel.tsx` (148) | MCP server URL + tools list. Hardcodes 14 tools (drift) — see § 11. |
| `app/components/MobileSocialInboxCard.tsx` (210) | V1.5 mobile thread card with status/priority. |
| `app/components/RichTextEditor.tsx` | TipTap composer. |
| `app/components/Sidebar.tsx` | Folder nav. |
| `app/components/conversation-social/ConversationStateControls.tsx` | Status/priority/assignee picker. |
| `app/components/conversation-social/SocialContextSheet.tsx` | Slide-over with notes + events. |
| `app/components/email-panel/EmailPanelDialogs.tsx` | Reply/forward/move dialogs. |
| `app/components/email-panel/EmailPanelHeader.tsx` | Email panel header strip. |
| `app/components/email-panel/EmailPanelToolbar.tsx` | Reply / reply-all / forward / move toolbar. |
| `app/components/email-panel/SingleMessageView.tsx` | Single message bubble. |
| `app/components/email-panel/ThreadMessage.tsx` | Thread message with attachments. |

---

## 4. State Management

### 4.1 Server State — TanStack Query v5

- All data fetching **must** be wrapped in a `useQuery`/`useMutation` hook from `app/queries/`.
- All query keys **must** go through the `queryKeys` factory in `app/queries/keys.ts`.
- Default `staleTime` is 30s (`app/root.tsx:32`).
- Default: **no refetch on focus, no retry on 4xx `ApiError`**.
- Mutations use `setError` to surface `ApiError` and call `onSettled` to invalidate the relevant keys.

Example — mutation with optimistic update + rollback:

```ts
// app/queries/emails.ts (abridged)
export function useUpdateEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => api.put(`/api/v1/mailboxes/${input.mailboxId}/emails/${input.id}`, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.emails.detail(input.mailboxId, input.id) });
      const previous = queryClient.getQueryData(queryKeys.emails.detail(input.mailboxId, input.id));
      queryClient.setQueryData(queryKeys.emails.detail(input.mailboxId, input.id), (old) => ({ ...old, ...input.patch }));
      return { previous };
    },
    onError: (_err, input, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKeys.emails.detail(input.mailboxId, input.id), ctx.previous);
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emails.detail(input.mailboxId, input.id) });
    },
  });
}
```

### 4.2 UI State — Zustand

- **One** global store: `useUIStore` in `app/hooks/useUIStore.ts`.
- Holds: `selectedEmailId`, `isComposing`, `composeOptions`, `isSidebarOpen`, `isAgentPanelOpen`, legacy `isComposeModalOpen`.
- **No** Redux. **No** Context Provider for global state.
- Keep store updates minimal — prefer deriving computed values at the call site.

### 4.3 Per-Component State

- `useState` for local form fields, dialog open/close, simple toggles.
- `useReducer` only when state transitions are non-trivial (currently unused).

---

## 5. Forms & Validation

- **No `react-hook-form`.** **No `formik`.** **No `zod` on the frontend** (Zod is a transitive dep of `@cloudflare/kumo` via `overrides`, not imported directly).
- Pattern: plain `useState` per field + `<form onSubmit>` + `Input required` for HTML5 validation.
- Inline checks (`if (!name) return;`) + error display via `<Banner variant="error">` and toasts.
- For multi-field forms with conditional logic (composer), use a custom hook (`useComposeForm` is the reference implementation in `app/hooks/useComposeForm.ts`).

```tsx
// app/routes/home.tsx — create mailbox form
const [newPrefix, setNewPrefix] = useState("");
const [selectedDomain, setSelectedDomain] = useState("");

async function handleCreate(e: React.FormEvent) {
  e.preventDefault();
  if (!newPrefix || !selectedDomain) return;
  await createMailbox.mutateAsync({ email: `${newPrefix}@${selectedDomain}` });
}
```

---

## 6. API Client (`app/services/api.ts`)

- **All** HTTP calls go through `request<T>()` in `app/services/api.ts`.
- Default `Content-Type: application/json`.
- 30-second timeout via `AbortController` + `AbortSignal.any` (so TanStack Query aborts also fire).
- `ApiError` carries `{ status, body }`. `body.error` is the human message.
- On `204 No Content`, returns `undefined` as `T`.
- All paths are under `/api/v1/`. **Public** paths under `/api/public/` (e.g. signup) are called via `fetch()` directly from `app/routes/landing.tsx`.

```ts
// app/services/api.ts (excerpt)
const REQUEST_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;
  constructor(status: number, body: Record<string, unknown>) {
    super((body.error as string) || `Request failed: ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
```

**Never** call `fetch()` directly from a component for `/api/v1/*` paths. Use the helpers (`get`, `post`, `put`, `del`) and let the client handle timeout + error normalisation.

---

## 7. Error Handling

### 7.1 Frontend

- All API errors bubble as `ApiError` and are surfaced in toasts (`useKumoToastManager`) or inline `<Banner variant="error">`.
- QueryClient is configured with a global `MutationCache` error logger in `app/root.tsx:43-49`.
- Components are expected to render a sensible empty/error state on data-fetch failure (e.g. `email-list.tsx` empty states).
- Inline `try/catch` for non-API errors (e.g. file reader failures in `useComposeForm`).

### 7.2 Backend

- **No global `app.onError()`** on the Hono app. Errors bubble to Cloudflare and return 500.
- Custom error types:
  - `AccessAuthorizationError` (`workers/lib/access.ts:1-6`) → caught in API routes → `403`.
  - `SenderValidationError` (`workers/lib/email-helpers.ts`) → caught in send/reply/forward → `400`.
- Inline error responses (mostly 4xx): `400` (validation, bad folder name), `403` (missing CF Access JWT, mailbox not authorized, **internal-only delivery blocked**), `404` (not found), `405` (mailbox deletion disabled), `429` (rate limit 20/hr, 100/day), `502` (outbound `sendEmail` failure).
- `console.error` / `console.warn` for logs.
- **Prompt-injection scanner fails closed** (`workers/lib/ai.ts:51-57`): on `ai.run` throw, returns `true` (skip auto-draft).
- **Inbound email errors are re-thrown** (`workers/app.ts:141-146`) so Cloudflare can retry or bounce — not silently dropped.
- Validation: Zod schemas in `workers/lib/schemas.ts` and inline in `workers/index.ts` (e.g. `CreateMailboxBody`, `SignupRequestBody`, `DraftBody`).

---

## 8. Security

### 8.1 XSS / HTML Injection

- **Every** email HTML body passes through DOMPurify **before** injection.
- Email bodies render in a **sandboxed `<iframe srcdoc>`** (`app/components/EmailIframe.tsx`):
  - `sandbox="allow-scripts allow-popups allow-top-navigation-by-user-activation"` — **no `allow-same-origin`**.
  - Strict CSP `<meta>` inside the iframe content.
  - Inline height-reporting via `postMessage`.
- Reply blocks, signatures, and plain-text extraction (`htmlToPlainText`) all go through DOMPurify.
- `escapeHtml` in `app/lib/utils.ts` is used when concatenating user-supplied fragments into HTML.

### 8.2 Content Security Policy

- A CSP `<meta>` is rendered in `EmailIframe.tsx` (strict — `default-src 'none'`, `script-src 'unsafe-inline'`, etc., scoped to the iframe).
- App-level CSP for the main document is the responsibility of the worker / dashboard settings (not currently set in app code; see [`project-roadmap.md`](./project-roadmap.md) V2-7).

### 8.3 Auth Trust Boundary

- **Never** trust a user identity passed from the client. The worker validates `cf-access-jwt-assertion` via `jose` + `createRemoteJWKSet` (`workers/app.ts:99-109`).
- In production, missing `POLICY_AUD` or `TEAM_DOMAIN` **fails closed** with 500 (`workers/app.ts:87-92`).
- Local dev: `x-dev-user-email` header sets the access email (DEV only).
- `DEMO_MODE=true` forces the first entry of `EMAIL_ADDRESSES` as the access email. **Not currently asserted against prod** (V3-7).

### 8.4 Secrets

- `POLICY_AUD` and `TEAM_DOMAIN` are **secrets** — set via `wrangler secret put` or the dashboard. **Never** in `wrangler.jsonc` `vars` (the current `wrangler.jsonc` still has them in `vars` for local convenience — see V2-3).
- `DOMAINS`, `EMAIL_ADDRESSES`, `ACCESS_EMAIL_ADDRESSES`, `DEMO_MODE` are public vars.

### 8.5 Internal-only delivery

- `getRecipientRouting` (`workers/lib/recipient-routing.ts`) blocks external recipients at the API with `403 "internal-only"`.
- This is **by design**. The product is for internal company mail.

---

## 9. Linting & Formatting

| Tool | Status |
|---|---|
| **ESLint** | **NOT configured.** No `.eslintrc*` or `eslint.config.*` in the project root. |
| **Prettier** | **NOT configured.** No `.prettierrc*` or `prettier.config.*` in the project root. |
| **TypeScript** | `pnpm typecheck` is the only enforced check. |

### 9.1 Recommended Setup (Gap)

Until ESLint/Prettier are added, follow these hand-enforced rules:

- **Indentation:** tabs (per `tsconfig.json` + files; visible in `workers/index.ts`).
  - **Exception:** `app/entry.server.tsx` uses 2-space (legacy from upstream fork). Tracked in [`project-roadmap.md`](./project-roadmap.md) V3-9.
- **Quotes:** double quotes for strings; single quotes only inside JSX attributes when needed.
- **Semicolons:** required (always present in the codebase).
- **Trailing commas:** multi-line only.
- **Line length:** aim for ≤120 chars; allow up to 140 in route files.
- **Imports order:** external → `@cloudflare/*` → `~/*` alias → `shared/*` → relative. One blank line between groups.
- **Naming:** see [`codebase-summary.md`](./codebase-summary.md) § 4.
- **No `console.log`** in source — use `console.warn`/`console.error` only.

> **TODO (gap):** Add `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `prettier` to `devDependencies`. Add `pnpm lint` and `pnpm format` scripts. Tracked in [`project-roadmap.md`](./project-roadmap.md) V3-1.

---

## 10. Performance Conventions

- **List views auto-refetch every 30s** (`email-list.tsx`).
- **TanStack Query `staleTime: 30s`** (`root.tsx:32`).
- **API client timeout: 30s** (`api.ts:7`).
- **Page size: 25** for email lists and search (`PAGE_SIZE`, `SEARCH_PAGE_SIZE`).
- **SSR-safe QueryClient** — fresh instance per request, lazy browser singleton (`root.tsx:55-64`).
- **No `Cache-Control` headers** are set on any response.
- **No memoization overhead** in render — TanStack Query returns referentially-stable data; Zustand selectors are used in components that need re-render isolation.
- **AI steps per chat message: 5** (`workers/agent/index.ts:351, 533`).

---

## 11. Known Drifts (Tech Debt)

These are concrete inconsistencies between the code and the docs/UI. Fix alongside any change in the area.

| Drift | Location | Fix |
|---|---|---|
| `MCPPanel` hardcodes 14 tools, server exposes 20 | `app/components/MCPPanel.tsx:48-63` vs `workers/mcp/index.ts` | Move to a `useMCPTools()` query (V3-6). |
| `ALLOW_FORWARDING` docs said `false` in some places, `true` in others | `workers/index.ts:38` is `true` | Trust the code: `ALLOW_FORWARDING = true`. |
| `app/entry.server.tsx` uses 2-space indent | rest of codebase uses tabs | Reformat (V3-9). |
| `window.confirm` in 3 components | `EmailPanel.tsx`, `email-list.tsx`, `home.tsx` | Replace with Kumo `Dialog` (V3-10). |
| `POLICY_AUD` / `TEAM_DOMAIN` in `wrangler.jsonc` `vars` | `wrangler.jsonc:33-34` | Move to secrets (V2-3). |
| `wrangler.jsonc` missing `send_email` block | `wrangler.jsonc` (whole file) | Add it (see [`deployment-guide.md`](./deployment-guide.md) § 3.4). |
| `SHOW_AGENT_SETTINGS` constant not in code | docs mention it; UI gates inline | Either add the constant in `workers/index.ts` like the others, or remove from docs. |
| `TS buildinfo` files in tree (gitignored but present) | `.react-router/types/`, `build/` | Already gitignored. Run `git clean -idx` before commits if you want them gone. |

---

## 12. Testing

- See [`codebase-summary.md`](./codebase-summary.md) § 5 for the test setup. Tests live in `tests/*.test.ts` and use `node --test`.
- When writing a new test, follow the existing pattern (`access.test.ts` is the reference):
  ```ts
  import assert from "node:assert/strict";
  import test from "node:test";
  import { /* fn under test */ } from "../<path>.ts";
  
  test("description", () => {
    assert.equal(/* ... */);
  });
  ```
- **No browser/E2E tests.** All tests are pure unit tests of `workers/lib/*`, `workers/durableObject/migrations.ts`, and `shared/*` modules.
- **No mocks** in the test files — they exercise the real helpers with crafted inputs.
- Migration-presence tests (e.g. `tests/internal-notes.test.ts:24-33`) use `mailboxMigrations.find(...)` + regex on SQL. Use this pattern when adding a new migration.
