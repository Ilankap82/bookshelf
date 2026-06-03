# Quiet Luxury Archive Design

Date: 2026-06-03

## Goal

Create a polished, beautiful visual system for Book Tracker that remains useful. The design direction is **Richer Quiet Luxury**: restrained, premium, atmospheric, and precise.

This pass defines the whole-app visual system, then applies it first to the Archive. Archive should become materially more beautiful while preserving the app's existing workflows.

## Design Direction

The approved target is the richer Quiet Luxury sample, not the plainer baseline.

The app should feel:

- calm and premium
- warm without becoming beige or nostalgic
- literary without using heavy book metaphors
- beautiful through proportion, light, typography, and object treatment
- useful through precision, scannability, and quiet metadata signals

Avoid:

- generic SaaS dashboard patterns
- faux-old library cosplay
- loud decorative panels
- dense admin-console energy as the default mode
- visual polish that hides important book or metadata information

## Visual System

### Palette

Use a restrained palette built around:

- ivory and warm off-white surfaces
- soft warm gray borders and dividers
- ink black for primary actions and high-emphasis text
- muted library green as a secondary institutional accent
- one quiet warning/care color, such as oxblood, for repair or quality signals
- optional brass warmth only as a subtle atmospheric accent

The interface should not read as beige-on-beige. Contrast must remain clear, especially for controls, metadata, and mobile use.

### Typography

Use a refined serif for:

- room titles
- selected-book moments
- high-level numeric stats
- occasional literary emphasis

Use a clean, highly legible sans for:

- controls
- metadata
- lists
- filters
- body copy
- dense scanning surfaces

Typography should feel expensive because of scale, spacing, and restraint, not because of ornate fonts.

### Layout And Surfaces

The layout should use:

- more negative space than the current first-wave UI
- tighter alignment and consistent spacing
- fewer generic cards
- paper/porcelain-like surfaces with quiet borders
- soft depth only where it reinforces hierarchy
- rounded forms used sparingly and consistently

Panels should feel like composed surfaces, not stacked dashboard widgets.

### Covers

Covers should become premium objects:

- consistent aspect ratio
- subtle shadow
- stable fallback treatment
- no noisy placeholder art
- missing-cover states should be elegant and informative

The Archive should let book covers carry much of the beauty, while still supporting metadata scanning.

## Archive Scope

Archive is the first implementation target for the full visual treatment.

Archive should include:

- a refined room header with title, short subtitle, and compact stats
- a primary search control
- quiet filter/import/export controls
- a default cover/shelf browsing mode
- a denser ledger/list mode for scanning
- a current-reading section with premium book-object cards
- a quiet quality/care summary for metadata and cover issues
- selected-book/detail affordances that match the new system

Archive should still support:

- search
- filters
- add book
- edit book
- import
- export
- cover fallback behavior
- metadata fields already present in the app

## Metadata Quality Signals

Surface metadata quality without building the full review workflow yet.

Use existing concepts where possible:

- reviewed
- manual
- candidate
- missing cover
- failed source

Quality signals should be small, elegant, and easy to scan. They should make the library feel maintained, not broken.

The review queue remains a future feature. In this pass, it appears only as a quiet summary or entry point.

## Interaction Model

Archive should feel calm, but not slow.

Interactions:

- default to cover/shelf browsing
- include a ledger/list toggle for dense scanning
- keep search prominent and always easy to reach
- make filters feel precise and lightweight
- open a refined detail panel on book selection
- keep add/import/export available but visually secondary
- keep metadata quality visible in book rows/cards and summary areas

Motion should be minimal: soft hover, focus, and selected states only.

## Out Of Scope

This pass does not include:

- room renaming
- full metadata review queue workflow
- new API integrations
- major data model changes
- complete redesign of every room
- changes to core add/edit/import/export behavior

Index, Reading, and Discovery may receive foundational system updates only where needed for visual consistency.

## Implementation Constraints

Preserve current app behavior. This is a design-system and Archive-layout pass, not a feature expansion.

Edits should be focused and traceable to:

- visual system tokens and shared patterns
- Archive layout and components
- cover/object treatment
- quiet metadata quality labels
- responsive polish needed for the new Archive

Avoid broad refactors unless a small extraction is required to keep the Archive implementation understandable.

## Verification

The implementation is accepted when:

- Archive looks materially more beautiful and premium
- Archive remains more useful, not less
- search, filters, add/edit, import/export still work
- metadata search and cover fallback behavior are not regressed
- desktop and mobile Archive views are usable
- `npm run lint` passes
- `npm run test` passes
- `npm run build` passes

Browser QA should include:

- Archive default cover/shelf mode
- ledger/list mode
- search and filter controls
- add/edit book flow
- import/export
- book detail panel
- missing-cover fallback
- mobile viewport
