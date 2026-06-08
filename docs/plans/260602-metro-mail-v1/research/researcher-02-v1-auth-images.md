# Research 2: Metro Mail V1 auth + images

Scope: official docs only. Focus on minimal V1 boundaries, Cloudflare Access-compatible auth, mailbox identity, MIME image flow, private R2 delivery, and security/phase split.

## 1) V1 boundary

- V1 should treat this as a single-company, admin-provisioned mail system with one primary mailbox per user.
- Keep identity and mailbox separate in data model:
  - `user_id` = internal app principal
  - `mailbox_id` = internal mail principal
  - `email_address` = external RFC mailbox string, unique, immutable after provisioning
  - `display_name` = mutable profile field
- Reasoning: Cloudflare Access OTP policies are keyed to approved email addresses, so email should be the canonical login identifier for V1. This is an inference from Access docs, not a hard platform requirement. [Cloudflare OTP](https://developers.cloudflare.com/cloudflare-one/identity/one-time-pin/) [Access policies](https://developers.cloudflare.com/cloudflare-one/policies/access/index.md)

## 2) Auth options compatible with Cloudflare Access

- Primary user login: Cloudflare Access One-time PIN to approved email addresses.
  - Access can send OTP to approved emails as an alternative to an IdP.
  - Access policies can allow users by email address.
  - OTP is a fit for an internal company rollout with admin-provisioned mailboxes. [Cloudflare OTP](https://developers.cloudflare.com/cloudflare-one/identity/one-time-pin/) [Access setup](https://developers.cloudflare.com/access/setting-up-access/)
- Optional browser-based enterprise login: IdP-backed Access login, if the company later wants SSO.
  - Cloudflare Access can be configured with identity providers, including generic OIDC / SAML. [Generic OIDC](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/generic-oidc/index.md)
- Optional non-browser automation:
  - Managed OAuth for protected resources is supported for non-browser clients.
  - Service tokens are the fallback for headless / automated workflows.
  - Keep these out of the user-facing login path for V1 unless admin automation needs them. [Authenticate coding agents](https://developers.cloudflare.com/cloudflare-one/access-controls/authenticate-agents/) [Managed OAuth](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/managed-oauth/) [Service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)

## 3) Mailbox identity model

- Canonical mailbox identity should be the email address string plus an immutable internal mailbox ID.
- Do not use external sender identity as the user identity.
- Recommended constraints:
  - one mailbox per person in V1
  - no aliases / shared inboxes in V1 unless there is a hard business need
  - store external recipients separately from internal mailbox records
- Why: Access login, policy grants, and audit flows all center on email identity, so reusing that as the mailbox login/primary key keeps V1 simple. [Cloudflare OTP](https://developers.cloudflare.com/cloudflare-one/identity/one-time-pin/) [Access policies](https://developers.cloudflare.com/cloudflare-one/policies/access/index.md)

## 4) MIME image pipeline

- For inline images in mail, use `multipart/related` with an HTML root and `cid:` references.
  - RFC 2387 defines `multipart/related` for aggregate MIME body parts.
  - The `start` parameter can point to the root body part.
  - `cid:` URLs refer to a MIME body part via `Content-ID`. [RFC 2387](https://www.rfc-editor.org/rfc/rfc2387) [RFC 2392](https://www.rfc-editor.org/rfc/rfc2392)
- For each image part:
  - use `Content-Type: image/*`
  - assign globally unique `Content-ID`
  - mark inline presentation with `Content-Disposition: inline` when appropriate
  - mark downloadable files with `Content-Disposition: attachment` [RFC 2392](https://www.rfc-editor.org/rfc/rfc2392) [MDN Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition)
- Suggested V1 pipeline:
  - upload/paste image in composer
  - store original binary in private R2
  - generate internal object key and message part record
  - render HTML body with `cid:` references for inline display
  - fall back to attachment rendering if the client cannot resolve `cid:` [RFC 2387](https://www.rfc-editor.org/rfc/rfc2387)

## 5) Private R2 delivery

- Keep the bucket private for V1.
- Use presigned URLs for temporary GET/PUT access.
  - presigned URLs are time-limited, client-side signed, and do not expose R2 credentials
  - expiry is configurable from 1 second to 7 days
  - suitable for direct upload and short-lived download links [R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- Do not use public `r2.dev` exposure for private mailbox assets.
  - public development URLs make bucket contents internet-accessible [R2 Public Buckets](https://developers.cloudflare.com/r2/data-access/public-buckets/)
- If message access must be centrally authorized, proxy delivery through the app/Worker and mint presigned URLs server-side.

## 6) Limits / security

- Enforce allowlist on image MIME types only.
- Cap image size and total attachment count per message in V1.
- Strip or ignore client-supplied filename/content-type when deriving storage policy.
- Treat raw uploads as untrusted:
  - validate MIME type server-side
  - normalize image metadata if needed
  - generate sanitized derivatives for display if the product requires it
- Keep download URLs short-lived and scope them to a single object. [R2 Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

## 7) Phased implementation

- Phase 1:
  - admin provisions mailbox
  - user logs in with Access OTP
  - text-only send/receive
  - raw message storage and threading
- Phase 2:
  - image upload/paste
  - private R2 storage
  - inline `cid:` rendering
  - attachment downloads
- Phase 3:
  - optional IdP login
  - Managed OAuth / service tokens for automation
  - quota, retention, moderation, and audit hardening

## Unresolved questions

- Should V1 accept only one company domain, or also external guest mailboxes?
- Should sent mail be stored as raw RFC 5322/MIME source, normalized JSON, or both?
- What is the maximum inline image size for composer + receive?
- Do we need shared inboxes, aliases, or forwarding in V1?
- Will Access OTP be the only login method at launch, or do we need IdP from day one?
