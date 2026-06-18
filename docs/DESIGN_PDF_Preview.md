# Design Spec — In-App Document Preview (P0-1)

**Status:** Proposed
**Owner:** Engineering
**Related:** `PRODUCT_AUDIT_Smartsheet_Parity.md` (gap P0-1), `BETA_READINESS.md`
**Goal:** Let a broker read an attached document (especially an Offering Memorandum PDF) *inside* DrainSheets — zoom, page through, see metadata — without downloading. This closes the single highest-frequency document action observed in the Smartsheet video.

---

## 1. Context & constraints (from the actual codebase)

What already exists and must be respected:

- **Storage is private.** Bucket `documents` is `public = false`; access is via short-lived signed URLs from `generateDownloadUrl` (`SIGNED_URL_EXPIRY_SECONDS = 60`). Storage RLS requires `can_access_property` + org membership. **Preview must reuse this path — no public URLs, no leaking `file_path`.**
- **Supported types** (`lib/documents/constants.ts`): `pdf, doc, docx, xls, xlsx, png, jpeg`. Max **25 MB**.
- **Server actions are the security boundary.** Every document read goes through `requireProfile()` + RLS. Preview will too.
- **Entry points that list documents today:**
  - `components/documents/compact-documents-list.tsx` — the **Attachments panel** (Row/Sheet/All). *Primary entry point — this is exactly the panel the broker used in the video.*
  - `app/(dashboard)/documents/[id]/page.tsx` — metadata-only detail page (no render today).
  - `components/documents/documents-table.tsx` + `document-row-actions.tsx` — global Documents list.
- **The metadata sidebar already has its data**: `DocumentWithRelations` carries uploader, size, type, dates, property, prospect. The video's preview sidebar (Filename / File size / Date uploaded / Created by / Description) maps almost 1:1.

What does *not* exist: any preview/iframe/PDF render code; a `description` field on documents; document versioning. This spec adds preview only; description and versioning are noted as optional add-ons, not requirements.

### Renderability decision (deliberate)

| Type | Strategy | Rationale |
|------|----------|-----------|
| **PDF** | Render with **`react-pdf`** (wraps `pdfjs-dist`) — custom zoom + page nav | Consistent cross-browser controls that match the Smartsheet viewer; the dominant CRE file type (OMs, flyers, site plans). |
| **PNG / JPEG** | Native `<img>` with zoom | Trivial, fast. |
| **DOC/DOCX/XLS/XLSX** | **Graceful fallback**: "Preview isn't available for this file type" + prominent Download | Browsers can't render Office files; the only inline option (MS Office web viewer) requires a *public* URL and would break the private-bucket security model. The broker only previewed PDFs/images in the video, so this is an acceptable, honest fallback. |

> Lighter alternative if we want zero new dependencies in v1: render PDFs in a native `<iframe src={signedUrl}>` (browser's built-in viewer gives zoom/print/download for free). It ships faster but yields inconsistent chrome across browsers and no custom controls. **Recommendation: ship `react-pdf` for the "best possible" experience; keep iframe as the documented fallback if the worker setup causes friction.**

---

## 2. User flow

### Primary flow — preview an OM from a prospect row (mirrors the video)

1. Broker opens a property sheet and selects a prospect row → **Attachments panel** opens in **Row** scope.
2. The panel lists row documents (e.g. `OM 675 Oceanport Way.pdf`). Broker **clicks the filename** (or a new "Preview" affordance).
3. A **Preview dialog** opens immediately with a loading skeleton; in the background a server action returns a fresh signed *preview* URL (RLS-checked).
4. The PDF's **first page renders**; the **metadata sidebar** shows Filename, Type, Size, Uploaded by, Date uploaded, Property/Prospect links (and Description if present).
5. Broker **zooms** (− / Fit / +), **pages** through (‹ Page 2 / 14 ›), and can **Download** or **Delete** (if permitted) from the same header — no context switch.
6. Broker presses **Esc** (or ×) → dialog closes, returns to the panel with scroll position intact.

### Secondary flows

- **From the global Documents table** (`/documents`): click a row or choose **Preview** in the `…` menu → same dialog.
- **From the document detail page** (`/documents/[id]`): the page **embeds the preview pane inline** (not a modal) above the existing metadata, plus Download/Delete. This becomes the shareable/deep-linkable preview.
- **Unsupported type** (Office docs): dialog opens to the fallback panel with a Download button and a one-line explanation.
- **Image**: same dialog, `<img>` render, zoom buttons (and native pinch-zoom on touch).

### State / edge transitions

- **Loading:** skeleton in the render pane; controls disabled.
- **Signed-URL expired or fetch fails:** inline error with a **Retry** button (re-requests a fresh URL); never a blank pane.
- **File > render threshold (e.g. > 25 MB or very high page count):** show "This file is large — open/download instead" with Download, to protect mobile/low-memory devices.
- **Empty/no documents:** unchanged existing empty states; preview is never reachable.

---

## 3. Acceptance criteria

**Opening & entry points**
- [ ] Clicking a document filename in the Attachments panel (`compact-documents-list`) opens the Preview dialog for that document.
- [ ] The global Documents table opens the same dialog via row click and via a **Preview** item in the `…` actions menu.
- [ ] `/documents/[id]` renders the preview inline (PDF/image) above the metadata, with Download/Delete present.
- [ ] The dialog opens optimistically (skeleton visible) within 100 ms of the click, before the URL resolves.

**PDF rendering**
- [ ] A multi-page PDF renders the first page on open and supports next/previous page navigation showing `Page X / N`.
- [ ] Zoom controls (−, Fit-to-width, +) change render scale; Fit is the default on open.
- [ ] Rendering uses `react-pdf`/`pdfjs-dist` with the worker served locally (no third-party CDN at runtime; CSP-safe).

**Image rendering**
- [ ] PNG and JPEG render via `<img>` with zoom in/out and reset-to-fit.

**Unsupported types**
- [ ] DOC/DOCX/XLS/XLSX open to a fallback panel stating preview is unavailable, with a working Download button. No broken/blank render.

**Actions within preview**
- [ ] Download triggers the existing signed-URL download (forced `download` disposition) and works for every supported type.
- [ ] Delete is shown only when `canDeleteDocument(profile, document)` is true; confirming deletes, closes the dialog, and refreshes the originating list.
- [ ] The metadata sidebar shows Filename, Type label, File size, Uploaded by, Date uploaded, and Property/Prospect links matching `DocumentWithRelations`.

**Security & permissions**
- [ ] The preview URL is produced by a server action behind `requireProfile()`; an editor without access to a property cannot obtain a preview URL (RLS returns no row → action errors).
- [ ] No raw `file_path` or service-role key reaches the client; only a time-limited signed URL.
- [ ] An expired/invalid URL produces an inline error with Retry, not a crash or blank pane.
- [ ] Preview uses inline content-disposition (does **not** force a download); Download uses download disposition.

**UX, a11y, responsive**
- [ ] `Esc` and the × button close the dialog; focus returns to the triggering element; focus is trapped while open.
- [ ] Keyboard: ←/→ change pages, +/−/0 zoom in/out/reset (when render pane focused).
- [ ] On viewports < 768 px the preview is a full-screen sheet; metadata sidebar collapses behind a toggle.
- [ ] Loading, error, and unsupported states each have explicit UI (no indefinite spinner).

**Quality gates**
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` pass.
- [ ] No regression to existing download/delete flows in panel, table, and detail page.

---

## 4. Affected files

### New
- `src/components/documents/document-preview-dialog.tsx` — modal shell: header (filename, actions, close), body slot, metadata sidebar, keyboard handling, focus trap.
- `src/components/documents/document-preview-pane.tsx` — type router → `PdfPreview` | `ImagePreview` | `UnsupportedPreview`; owns zoom/page state, loading/error/Retry.
- `src/components/documents/document-preview-provider.tsx` — lightweight context + `useDocumentPreview()` so any list item can call `openPreview(document)` without prop-drilling a dialog.
- `src/lib/documents/previewable.ts` — `getPreviewKind(mimeType): "pdf" | "image" | "unsupported"` + size/page guards.
- `src/lib/documents/pdf-worker.ts` (or Next config) — pin `pdfjs-dist` worker to a local asset.

### Modified
- `src/actions/documents.ts` — add `generatePreviewUrl(documentId)`: same RLS lookup as `generateDownloadUrl`, but returns a signed URL with **inline** disposition and a longer preview expiry (e.g. 300 s); optionally log `previewed` (see §6). Add `PREVIEW_URL_EXPIRY_SECONDS` to `lib/documents/constants.ts`.
- `src/components/documents/compact-documents-list.tsx` — make the filename a button that calls `openPreview(document)`; keep Download/Delete.
- `src/components/documents/documents-table.tsx` — row click + add **Preview** affordance.
- `src/components/documents/document-row-actions.tsx` — add a **Preview** menu item (`onClick → openPreview`).
- `src/app/(dashboard)/documents/[id]/page.tsx` — embed `DocumentPreviewPane` inline above the existing metadata grid.
- `src/app/(dashboard)/layout.tsx` **or** `src/components/layout/attachments-panel.tsx` — mount `DocumentPreviewProvider` high enough that panel and tables share one dialog instance.
- `package.json` — add `react-pdf` (+ transitive `pdfjs-dist`).
- *(Optional)* `supabase/migrations/*_documents_description.sql` + `document-upload-form.tsx` + detail page — add editable `description` to fully match the video's sidebar.

---

## 5. Implementation plan

**Phase A — Server: preview URL (≈0.5 day)**
1. Add `PREVIEW_URL_EXPIRY_SECONDS` (e.g. 300) to `constants.ts`.
2. Add `generatePreviewUrl(documentId)` in `actions/documents.ts`: reuse the `generateDownloadUrl` RLS lookup; call `createSignedUrl(file_path, PREVIEW_URL_EXPIRY_SECONDS)` (inline — do **not** pass `{ download: true }`). Return `{ url, mimeType, fileName }`. Decide logging per §6.

**Phase B — Library + render primitives (≈1 day)**
3. Install `react-pdf`; configure the pdf.js worker as a local asset (`pdf-worker.ts` / Next asset import) so there's no runtime CDN dependency (CSP-friendly).
4. Build `previewable.ts` (`getPreviewKind`, size/page guards).
5. Build `document-preview-pane.tsx`: `PdfPreview` (page nav + zoom via `react-pdf`), `ImagePreview` (`<img>` + zoom), `UnsupportedPreview` (message + Download); loading skeleton + error/Retry.

**Phase C — Dialog shell + provider (≈1 day)**
6. Build `document-preview-dialog.tsx` on the existing `ui/dialog`: header (file icon, filename, Download, conditional Delete, ×), body = `DocumentPreviewPane`, right metadata sidebar from `DocumentWithRelations`. Add keyboard (Esc/←/→/+/−/0), focus trap, responsive full-screen sheet < 768 px.
7. Build `document-preview-provider.tsx` + `useDocumentPreview()`; mount the provider once in the dashboard layout (or attachments panel root).

**Phase D — Wire entry points (≈0.5 day)**
8. `compact-documents-list.tsx`: filename → `openPreview`.
9. `documents-table.tsx` + `document-row-actions.tsx`: row click + Preview menu item.
10. `documents/[id]/page.tsx`: embed `DocumentPreviewPane` inline.

**Phase E — Hardening & QA (≈1 day)**
11. Verify RLS: an editor without property access gets an error from `generatePreviewUrl` (extend `tests/rls` or a manual matrix).
12. Test matrix: multi-page PDF, 25 MB PDF, PNG, JPEG, DOCX (fallback), expired URL (Retry), delete-from-preview refresh, keyboard, mobile sheet.
13. Run `typecheck` / `lint` / `build`.

**Total: ≈4 engineering-days** (matches the audit's P0-1 estimate of 3–5 days). `react-pdf` worker setup is the only real risk; the iframe fallback de-risks it.

---

## 6. Open decisions (recommended defaults)

1. **Log previews as activity?** *Recommended: no* — logging every PDF open would flood the activity feed and drown create/upload/share signal. If an audit trail is later required, add a `previewed` action but **exclude it from the dashboard feed** and surface it only in a per-document history.
2. **`react-pdf` vs native `<iframe>`?** *Recommended: `react-pdf`* for consistent Smartsheet-like controls; fall back to iframe only if worker bundling proves troublesome.
3. **Add `description` + versioning now?** *Recommended: defer.* Description is a tiny add that completes the sidebar (do it if cheap); versioning is P2 in the audit and out of scope here.
4. **Preview URL expiry.** *Recommended: 300 s* — long enough for page nav/zoom re-fetches, short enough to stay safe; download keeps its 60 s.
