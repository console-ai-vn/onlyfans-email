# Phase 04: Private Images Attachments

## Context links
- [plan.md](./plan.md)
- [researcher-02-v1-auth-images.md](./research/researcher-02-v1-auth-images.md)
- [01-product-scope-report.md](./reports/01-product-scope-report.md)

## Overview
Date: 2026-06-02  
Priority: P2  
Implementation status: in progress  
Review status: automated validation passed; browser verification pending  

Add private image upload, paste, drop, preview, inline rendering, and download on top of upstream R2-backed attachment flow.

## Key Insights
- Private R2 stays the storage primitive.
- Worker-authenticated retrieval is preferred over public bucket exposure.
- JPEG/PNG/WebP only in V1; SVG and GIF deferred.

## Requirements
- Support upload, drag-drop, and paste for images.
- Enforce `10MB` per image and `25MB` total message payload.
- Render thumbnails/full preview and allow download.
- Store images privately and gate retrieval through authenticated Worker routes.

## Architecture
Reuse upstream attachment pipeline, but add MIME allowlist, size enforcement, image metadata handling, and authenticated blob delivery route backed by private R2 keys.

## Related code files
- Expected after clone: `workers/email-sender.ts`, attachment helpers under `workers/lib/*`
- Expected after clone: inbound MIME parsing surfaces, likely under `workers/*`
- Expected after clone: `app/components/ComposeEmail.tsx`, `ComposePanel.tsx`, `EmailAttachmentList.tsx`, `RichTextEditor.tsx`

## Implementation Steps
1. Audit existing attachment storage and outbound MIME assembly.
2. Add composer-side upload/paste/drop affordances and validation messaging.
3. Add server-side MIME/type/size validation and private object-key policy.
4. Implement authenticated image fetch/preview/download route.
5. TDD checkpoint: add coverage for size/type rejection, image retrieval authorization, and inline image rendering fallback.

## Todo list
- [x] Confirm upstream attachment object model.
- [x] Enforce JPEG/PNG/WebP allowlist.
- [x] Enforce `10MB` image and `25MB` message limits.
- [x] Reuse upstream private preview/download path and add ownership check.
- [x] Add tests for auth + validation on image endpoints.
- [x] Drop unsupported inbound attachment formats without dropping the email.
- [ ] Verify paste/drop/upload visually on a deployed preview.

## Success Criteria
- Users can send and view allowed images privately without exposing bucket contents publicly.

## Risk Assessment
Largest risk is unsafe MIME/render behavior; keep first release narrow and reject active-content formats.

## Security Considerations
Validate type server-side, never serve public bucket URLs, and authorize every blob request against mailbox ownership.

## Next steps
Finish with Phase 05 once image flows pass build verification and basic regression checks.
