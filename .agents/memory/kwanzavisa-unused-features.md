---
name: KwanzaVisa unused-feature removal
description: Auth/KYC/virtual-card backend routes existed but were never called by the frontend; cards used a mock provider. Removed entirely along with Resend email.
---

KwanzaVisa's API server had `auth`, `kyc`, and `cards` (+ their admin counterparts) fully scaffolded (routes, DB schema, OpenAPI paths/schemas) but the frontend never called them — confirmed by grepping actual hook usage in `artifacts/kwanzavisa/src`. The `cards` feature's provider (`cardProvider.ts`) was an explicit hardcoded mock/stub, not a real integration.

**Why:** Scaffolded-but-unwired backend surface accumulates silently in this codebase (generated from OpenAPI, so it looks "real" even when unused). Don't trust route/schema existence as a signal of being live — verify against actual frontend consumption.

**How to apply:** Before removing or trusting an API surface as "in use," grep the frontend for actual hook/fetch calls to it, not just its existence in `routes/index.ts` or the OpenAPI spec. When removing: also check DB row counts before dropping tables (safe here — all were empty), and check for orphaned deps (`bcryptjs`, `jsonwebtoken`, `multer`, `cookie-parser`, `resend`) and orphaned generated OpenAPI schemas — `orval codegen` doesn't clean unreferenced hand-written schema blocks, you must remove them from `openapi.yaml` yourself.
