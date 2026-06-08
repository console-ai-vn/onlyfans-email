# VSBG Box — Design Guidelines

UI/UX conventions for the VSBG Box app. Built on **Tailwind v4** + **`@cloudflare/kumo`** + **Phosphor icons**.

> **Aesthetic:** chat-style email client (Telegram/Slack feel), not a Gmail clone. Vietnamese copy in product UI. Internal-only tool — no marketing polish.

---

## 1. Design system

| Layer | Library | Why |
|---|---|---|
| Tailwind | `tailwindcss@^4.1.4` | CSS-first config (`@source` in `app/index.css`) |
| Primitives | `@cloudflare/kumo@^1.13.0` | Cloudflare's design system; consistent with internal CF tools |
| Icons | `@phosphor-icons/react@^2.1.10` | Open-source, tree-shakable, two weights (`regular`, `bold`) |
| Markdown | `react-markdown@^10.1.0` + `remark-gfm@^4.0.1` | Agent chat render only |

### 1.1 Forbidden UI libs

No MUI, no shadcn/ui, no Ant Design, no Chakra, no Mantine. Kumo only.

### 1.2 CSS architecture

```css
/* app/index.css */
@source "../node_modules/@cloudflare/kumo/dist/**/*.{js,jsx,ts,tsx}";
@import "@cloudflare/kumo/styles/tailwind";
@import "tailwindcss";
```

No `tailwind.config.{js,ts}` file — Tailwind v4 reads `@source` directives from CSS.

---

## 2. Color & type tokens

**Always use Kumo semantic tokens.** Never hardcode hex.

| Token | Use |
|---|---|
| `bg-kumo-recessed` | App background |
| `bg-kumo-tint` | Hover/active surfaces |
| `bg-kumo-fill` | Subtle fill (badges, chips) |
| `bg-kumo-base` | Surface base (cards, dialogs) |
| `text-kumo-default` | Body text |
| `text-kumo-subtle` | Secondary text |
| `text-kumo-strong` | Headings, emphasis |
| `text-kumo-brand` | Brand accent (links, CTAs) |
| `text-kumo-success` / `text-kumo-danger` / `text-kumo-warning` | Status |
| `border-kumo-line` | Hairline dividers |
| `text-kumo-inactive` | Disabled / placeholder |

```tsx
// good
<div className="bg-kumo-recessed text-kumo-default border-kumo-line">

// bad
<div className="bg-[#1a1a1a] text-white border-[#333]">
```

The landing page (`app/routes/landing.tsx`) **does** use raw hex because it is a one-off marketing surface, not the app shell. Keep that boundary: **inside the app → tokens only**.

---

## 3. Typography

Kumo + Tailwind defaults. No custom font imports.

| Use | Class |
|---|---|
| Page title | `text-2xl font-semibold tracking-[-0.04em]` |
| Section title | `text-sm font-semibold` |
| Body | `text-sm` (default) |
| Secondary | `text-xs text-kumo-subtle` |
| Code | `font-mono text-[11px]` |

---

## 4. Spacing

Tailwind v4 default scale. Prefer `gap-2` / `gap-3` / `gap-4` over magic numbers. Card padding: `p-4`. Section padding: `p-6` to `p-8`.

---

## 5. Component patterns

### 5.1 Skeleton

```tsx
import { Button, Dialog, Text } from "@cloudflare/kumo";
import { Envelope } from "@phosphor-icons/react";

interface Props {
  mailboxId: string;
  onClose: () => void;
}

export function CreateFolderDialog({ mailboxId, onClose }: Props) {
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

### 5.2 Rules

- One component per file. **Named export** (not default), except route components which are the default export of the route file.
- Filename = component name in PascalCase.
- `interface Props` (not `type Props`).
- No prop-spreading (`{...rest}`) without justification.
- Local sub-components for large parents: `EmailPanel.tsx` + `email-panel/` subfolder (`EmailPanelDialogs.tsx`, `EmailPanelHeader.tsx`, `EmailPanelToolbar.tsx`, `SingleMessageView.tsx`, `ThreadMessage.tsx`).

### 5.3 Large files (tech debt)

These exceed 300 LOC and need refactoring. **Do not add new features to them without a refactor first.**

| File | LOC | Issue |
|---|---|---|
| `app/components/AgentPanel.tsx` | 592 | Mixes chat UI, message rendering, tool call rendering |
| `app/components/EmailPanel.tsx` | 440 | Mixes thread render, social timeline, state controls |
| `app/routes/home.tsx` | 366 | Mailbox list + create/delete dialogs + auto-create |
| `app/routes/email-list.tsx` | 352 | Threaded list + pagination + empty states |
| `app/hooks/useComposeForm.ts` | 287 | Composer state machine |

See [`project-roadmap.md`](./project-roadmap.md) § 3.5 for the refactor plan.

---

## 6. Icons

Use Phosphor `regular` weight by default, `bold` for active states (e.g. `StarIcon` filled when email is starred). Always specify `size`:

```tsx
<StarIcon size={16} weight={isStarred ? "fill" : "regular"} />
```

Common icon imports:

```tsx
import {
  Envelope, EnvelopeOpen, Star, PaperPlaneRight, Trash,
  ArrowBendUpLeft, MagnifyingGlass, Gear, Plugs, Wrench,
  Check, Copy, X, Warning, ArrowSquareOut,
} from "@phosphor-icons/react";
```

---

## 7. Vietnamese copy

VSBG Box is a Vietnamese product. **User-facing strings are Vietnamese** in the app shell; the landing page is bilingual (mostly Vietnamese).

| Tone | Example |
|---|---|
| Direct, friendly | "Đăng nhập bằng OTP", "Đã ghi nhận yêu cầu", "Gửi proposal ảnh qua feed" |
| Lowercase, action-oriented | "drafted a reply", "marked as read" |
| No marketing fluff | "Internal only — Chặn gửi ra ngoài" not "Enterprise-grade secure communication platform" |

Agent chat messages (English) stay English — the model is English-tuned and translations add latency.

---

## 8. Mobile

- The app is **responsive**, not native. Target ≥ 360px viewport.
- `MobileSocialInboxCard` (`app/components/MobileSocialInboxCard.tsx`) is the dedicated mobile thread card; it shows status, priority, and snippet without the desktop toolbar.
- Touch targets ≥ 44×44px.
- `useUIStore.isSidebarOpen` toggles the sidebar drawer on mobile.

---

## 9. Accessibility

- `aria-label` on icon-only buttons (see `CopyButton` in `MCPPanel.tsx`).
- Tooltip wrapping with `asChild` for non-button triggers.
- Sandboxed email iframe (`EmailIframe.tsx`) is `aria-hidden` from the main a11y tree — its content is read by `EmailPanel.tsx`'s parallel plain-text summary.
- Color is never the only signal — status uses icon + text + color.

---

## 10. Forms

See [`code-standards.md`](./code-standards.md) § 5. No `react-hook-form`, no `formik`. Plain `useState` + `<form onSubmit>` + `Input required` for HTML5 validation.

---

## 11. MCP panel hardcoded list (drift)

`MCPPanel.tsx` has a hardcoded 14-tool list. The server exposes 20 tools (see `workers/mcp/index.ts`). **The list drifts every time a tool is added.** Plan: move to a `useMCPTools()` query that hits `/mcp` `tools/list`. Tracked in [`project-roadmap.md`](./project-roadmap.md) § 3.6.

---

## 12. `window.confirm` is banned

3 places currently use `window.confirm` (bypasses design system, jarring UX). Replace with Kumo `Dialog` + `<Dialog.Header>` + `<Banner variant="warning">` for destructive actions. Tracked in [`project-roadmap.md`](./project-roadmap.md) § 3.10.

---

## 13. Indent

Tabs everywhere. **Except `app/entry.server.tsx`** which uses 2-space (legacy from upstream fork). Tracked for normalization in § 3.9.
