# Reading Command Center Redesign

Date: 2026-06-06

## Goal

Redesign Book Tracker around a clear product spine: a **personal reading command center**.

The app should feel useful, polished, and alive without becoming a generic media storefront or a maintenance console. It should help the reader continue reading, understand their habits, add books with minimal manual work, and discover what to read next.

## Current Problems

The current app has good technical foundations but weak product shape.

Confirmed issues:

- the app already uses React, Tailwind, Vite, Radix-style UI, and Vitest; the stack is not the problem
- Archive exposes internal data-quality concepts such as care, ledger, manual, and candidate as if they were user features
- covers are resolved inconsistently across cards, detail panels, sidebar, and recommendations
- books can show covers in one surface and placeholders in another
- some public-source covers are wrong, placeholder-like, old, or visually damaged
- add-book and book-detail flows still feel too manual
- Discovery is too small, static, and bland
- recommendations cannot be declined
- Settings lets the user type their own title, but titles should be earned
- reading stats exist in code but are not surfaced as a core destination

## Product Structure

The redesigned app should have five main destinations.

### Home

Home is the command center.

It should lead with:

- current reading
- progress and next action
- quick add/search
- a compact reading-stats snapshot
- earned title or milestone progress
- a small recommendation shelf

Home should answer: "Where am I in my reading life, and what should I do next?"

### Library

Library replaces the current Archive framing.

It should provide:

- visual shelves of all books
- search
- useful filters
- clean list mode if needed for scanning
- normal book-management actions

It should not expose "Archive health," "care," or ledger language as primary user-facing concepts.

### Add Book

Add Book should be search-first.

The user enters a title, author, or ISBN. The app searches free public sources, shows candidate matches, and creates a mostly complete book record from the selected result.

Manual entry remains available, but only as a fallback.

### Stats

Stats returns as a first-class destination.

It should include:

- books completed
- pages read
- current-reading progress
- pages left
- reading pace
- average rating
- format breakdown
- genre breakdown
- rating distribution
- goals and milestones
- earned titles

### Discover

Discover becomes a richer recommendation area.

It should include:

- more visible recommendations
- shelf-like sections
- richer recommendation cards
- Save action
- Not interested action
- local hiding of declined recommendations

## Book Detail

Book Detail is the shared place to learn about and manage a book.

It should show:

- cover
- title and author
- description when available
- published year
- publisher
- page count
- language
- format
- status
- reading progress
- rating
- notes
- edit action
- refresh metadata action when useful

Book Detail should feel like a useful book profile, not just an edit preview.

## Covers And Metadata

Covers and metadata should be handled as one shared system.

### Shared Cover Resolver

Create one cover resolver used everywhere:

- Home
- Library cards
- Sidebar or compact reading surfaces
- Book Detail
- Discover

Resolution order:

1. verified stored cover URL
2. stored cover candidates
3. live public API lookup
4. elegant fallback

The resolver should:

- skip known bad cover URLs
- skip known placeholder-like sources where detectable
- try multiple candidates before falling back
- save a better resolved cover into the book record when found
- avoid repeated live fetching for the same unresolved state

Small rationale: public book data is messy, so the app needs ranked candidates and fallback behavior instead of trusting the first returned image.

### Metadata Search

Use free public sources by default:

- Open Library
- Google Books

No paid AI should be required for ordinary metadata in this wave.

Add-book metadata should try to populate:

- title
- author
- description
- cover candidates
- published year
- publisher
- page count
- language
- ISBN/source IDs when available

### Metadata Repair

Missing or weak data should become a quiet action, not a warning dashboard.

Book Detail should include a "refresh metadata" action for books that need it. The app may track metadata state internally, but the user-facing UI should not make the library feel broken.

## Discovery

Discovery should become more like a useful recommendation shelf.

Recommendation cards should include:

- cover
- title
- author
- short description
- year or pages when known
- genre or mood tags
- why it might fit
- Save action
- Not interested action

Declined recommendations should stay hidden locally.

Discovery sections can include:

- Because you liked...
- Shorter reads
- Different direction
- Popular in your genres

For this wave, recommendations may remain local/static plus metadata-enriched. Smarter recommendation logic can come later without introducing paid AI now.

## Stats And Awards

Stats should become central again.

The app should show reading data in a way that is motivating and legible, not like an admin dashboard.

Earned titles should be derived from real activity. Settings/profile should no longer let the user type their own title.

Example title inputs:

- total books tracked
- completed books
- pages read
- genre breadth
- ratings added
- reading streak or recent activity if available

The profile can still allow editing name/avatar details, but title should be earned.

## Visual Direction

Use the approved command-center direction.

The app should borrow selectively from the references:

- Hoopla: horizontal shelves and strong browsing rhythm
- Bookly: current-reading progress, sessions, goals, stats, and awards
- Kindle: simple library actions and direct book access

The final product should not clone any one of them. It should feel like a personal reading cockpit: warm, precise, cover-forward, and useful.

Avoid:

- generic SaaS dashboard feel
- decorative slop
- exposing internal repair states as major UI
- overbuilding a public storefront
- beige-on-beige visual monotony

## First Implementation Wave

Wave one should be ambitious but bounded.

In scope:

- keep the existing React, Tailwind, Vite, and local-storage app
- rework navigation around Home, Library, Add, Stats, Discover
- replace Archive framing with Library
- remove Archive care/ledger as a primary user-facing section
- build the shared cover resolver
- use the shared resolver across visible book surfaces
- improve metadata search and add-book flow
- add metadata refresh from Book Detail
- restore Stats as a real destination
- replace editable user title with earned title display
- upgrade Discovery with richer cards, Save, and Not interested
- keep all data local in browser storage
- avoid paid AI for this wave

Out of scope:

- backend database
- authentication
- social/sharing features
- paid AI recommendation pipeline
- full production-grade recommendation engine
- complete rewrite from scratch
- unrelated code cleanup

## Implementation Notes

Prefer surgical changes that follow existing app patterns.

Likely code areas:

- `src/App.tsx` for navigation and app-level state
- `src/components/rooms/IndexRoom.tsx` or replacement Home structure
- `src/components/rooms/ArchiveRoom.tsx` renamed or reframed as Library
- `src/components/BookCard.tsx`
- `src/components/DetailPanel.tsx`
- `src/components/BookIntakePanel.tsx`
- `src/components/RecommendationsView.tsx`
- `src/components/StatsDashboard.tsx`
- `src/utils/cover.ts`
- `src/lib/metadata.ts`
- `src/lib/bookStats.ts`
- local-storage migration if new persisted fields are added

Do not refactor unrelated UI or data code unless required by the approved redesign.

## Verification

The work is accepted when:

- Home clearly feels like a reading command center
- Library no longer presents internal archive-health or ledger language as a core feature
- books that show covers in detail also show covers in Library/Home where the same data exists
- bad or known placeholder covers are skipped where known
- add-book flow can create a mostly complete book from public metadata
- manual entry remains possible but secondary
- Book Detail can show and refresh metadata
- Discovery has richer cards and working Save/Not interested actions
- declined recommendations stay hidden locally
- Stats is reachable as a main destination
- earned title is based on activity, not a manually typed role
- desktop and mobile layouts are usable
- `npm run lint` passes
- `npm run test` passes
- `npm run build` passes

Browser QA should include:

- Home on desktop and mobile
- Library shelf/list behavior
- Book Detail for a book with full metadata
- Book Detail for a book with weak metadata
- Add Book search and save flow
- cover fallback behavior
- Discovery Save and Not interested
- Stats and earned title display
