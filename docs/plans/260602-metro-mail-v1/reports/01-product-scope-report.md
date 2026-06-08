# Metro Mail V1 Product Scope

## Decision Log
- Product: internal-only company email web app.
- Deployment: single company, one Cloudflare account, one initial custom domain.
- Identity: admin provisions a company email account; user signs in with that email.
- External mail: each provisioned account can send and receive email with outside addresses.
- UX: social/chat-style direct-message inbox, not Gmail clone.
- Conversation model: external sender appears as a DM contact; thread renders chronologically as bubbles.
- Images: user can upload, drag-drop, or paste images; external inline and attached images render in thread.

## V1 Must Have
- Fork `cloudflare/agentic-inbox`.
- Cloudflare Access protected app.
- Provisioned account allowlist mapped to mailbox identity.
- Inbox conversation list and chronological chat thread.
- External inbound email routing.
- External outbound send and reply.
- Private R2 storage for attachments and image objects.
- Image thumbnail, full preview, download.
- Basic unread state and browser-visible new-message indicator.
- Basic keyword search from upstream if reusable.
- Admin config via deployment config or minimal admin route, not full domain onboarding UI.

## Explicitly Deferred
- Multi-tenant SaaS.
- Multi-company domain onboarding.
- Shared mailbox assignment and ticket workflow.
- Internal notes.
- Custom role builder and granular permissions.
- CRM.
- AI agent and natural-language search.
- Native mobile app.
- IMAP, POP3, SMTP-client compatibility.
- Custom application-level encryption beyond Cloudflare managed encryption at rest.
- Permanent destructive delete; prefer archive if needed.

## V1 Security Baseline
- Cloudflare Access remains outer trust boundary.
- Application verifies authenticated Access identity maps to provisioned mailbox.
- R2 bucket stays private.
- Attachment retrieval goes through authenticated Worker route.
- Validate MIME type, size, and safe image formats.
- Block active-content image formats such as SVG in first release.
- Never render untrusted HTML directly.

## Open Questions For Plan
- Use Access OTP only, or add app-level OTP after Access? Recommend Access only for V1.
- Include forward in first build? Recommend defer until reply pipeline stable.
- Allow GIF in first build? Recommend JPEG, PNG, WebP first; add GIF only if parser and preview path are safe.
