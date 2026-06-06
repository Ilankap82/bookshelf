# Reading Command Center Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved spine-first redesign so Book Tracker becomes a personal reading command center with reliable covers, richer metadata, restored stats, earned titles, and better discovery.

**Architecture:** Keep the existing React, TypeScript, Vite, Tailwind, Radix-style, Vitest, and local-storage app. Add small pure helpers for cover resolution, metadata enrichment, recommendation hiding, and earned titles, then wire those helpers into focused UI changes across Home, Library, Detail, Add Book, Stats, and Discover.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, localStorage, Open Library public API, Google Books public API, existing inline style/Tailwind hybrid patterns, existing `Book`, `Recommendation`, metadata, and storage types.

---

## File Structure

- Modify: `src/types.ts`
  - Add persisted fields needed for cover verification and recommendation decline state only if existing fields cannot express them.
- Modify: `src/App.tsx`
  - Rework top-level navigation state around `home`, `library`, `stats`, and `discover`; keep Add Book as a modal action.
  - Add book-update callbacks needed for resolved covers and metadata refresh.
  - Add declined recommendation state.
- Modify or replace: `src/components/rooms/IndexRoom.tsx`
  - Become the Home command center.
- Modify or rename: `src/components/rooms/ArchiveRoom.tsx`
  - Reframe as Library and remove user-facing archive-health/care/ledger emphasis.
- Modify: `src/components/Sidebar.tsx`
  - Navigation labels, earned title display, and settings/profile simplification.
- Modify: `src/components/BookCard.tsx`
  - Use the shared cover resolver state/contract instead of independent ad hoc fetching.
- Modify: `src/components/DetailPanel.tsx`
  - Show richer metadata and expose refresh metadata.
- Modify: `src/components/BookIntakePanel.tsx`
  - Strengthen search-first add flow.
- Modify: `src/components/RecommendationsView.tsx`
  - Add richer recommendation cards, Save, and Not interested.
- Modify: `src/components/StatsDashboard.tsx`
  - Restore as a first-class destination and include earned titles.
- Modify: `src/data/recommendations.ts`
  - Add richer fields where needed without introducing a paid API.
- Modify: `src/lib/metadata.ts`
  - Add metadata merge/refresh helpers.
- Modify: `src/lib/bookStats.ts`
  - Add earned title and milestone helpers.
- Modify: `src/lib/storage.ts`
  - Add local migration only if new persisted fields are introduced.
- Modify: `src/utils/cover.ts`
  - Build the single shared cover candidate and resolver layer.
- Add tests as needed:
  - `src/utils/cover.test.ts`
  - `src/lib/metadata.test.ts`
  - `src/lib/bookStats.test.ts`
  - `src/lib/storage.test.ts`
  - focused component-adjacent tests only where pure helpers are extracted.

## Task 1: Cover Resolver Foundation

**Files:**
- Modify: `src/utils/cover.ts`
- Modify: `src/utils/cover.test.ts`
- Modify: `src/types.ts` only if a `coverStatus` or `verifiedCoverUrl` field is required after inspecting current usage.

- [ ] **Step 1: Inspect current cover call sites**

Run:

```bash
rg "fetchCoverUrl|getCoverCandidates|getPrimaryCoverUrl|coverUrl|coverCandidates" src
```

Expected: identify all current cover surfaces in `BookCard.tsx`, `DetailPanel.tsx`, `Sidebar.tsx`, recommendation cards, stats/current-reading surfaces, metadata creation, and tests.

- [ ] **Step 2: Write failing tests for unified cover behavior**

Extend `src/utils/cover.test.ts` with tests for:

```ts
import { describe, expect, it } from 'vitest';
import {
  cleanCoverCandidates,
  getCoverCandidates,
  getPrimaryCoverUrl,
  isBadCoverUrl,
  resolveStoredCover,
} from './cover';

describe('shared cover resolution', () => {
  it('prefers a clean stored cover before candidates', () => {
    expect(resolveStoredCover({
      coverUrl: 'https://example.com/main.jpg',
      coverCandidates: ['https://example.com/other.jpg'],
    })).toEqual({
      url: 'https://example.com/main.jpg',
      source: 'stored',
    });
  });

  it('falls back to the first clean candidate when stored cover is bad', () => {
    expect(resolveStoredCover({
      coverUrl: 'https://covers.openlibrary.org/b/id/12468631-L.jpg',
      coverCandidates: ['https://example.com/candidate.jpg'],
    })).toEqual({
      url: 'https://example.com/candidate.jpg',
      source: 'candidate',
    });
  });

  it('returns null when every known cover is bad or empty', () => {
    expect(resolveStoredCover({
      coverUrl: 'https://covers.openlibrary.org/b/id/8743161-L.jpg',
      coverCandidates: ['', 'https://covers.openlibrary.org/b/id/12468631-L.jpg'],
    })).toEqual({
      url: null,
      source: 'missing',
    });
  });

  it('removes failed URLs from candidates', () => {
    expect(getCoverCandidates(
      {
        coverUrl: 'https://example.com/a.jpg',
        coverCandidates: ['https://example.com/b.jpg'],
      },
      ['https://example.com/a.jpg'],
    )).toEqual(['https://example.com/b.jpg']);
  });
});
```

- [ ] **Step 3: Run cover tests and verify failure**

Run:

```bash
npm run test -- src/utils/cover.test.ts
```

Expected: fail because `resolveStoredCover` does not exist.

- [ ] **Step 4: Implement `resolveStoredCover`**

Add to `src/utils/cover.ts`:

```ts
export interface ResolvedStoredCover {
  url: string | null;
  source: 'stored' | 'candidate' | 'missing';
}

export function resolveStoredCover(
  book: Pick<Book, 'coverUrl' | 'coverCandidates'>,
  failedUrls: string[] = [],
): ResolvedStoredCover {
  const candidates = getCoverCandidates(book, failedUrls);
  const storedCover = book.coverUrl && !failedUrls.includes(book.coverUrl) && !isBadCoverUrl(book.coverUrl)
    ? book.coverUrl
    : null;

  if (storedCover) return { url: storedCover, source: 'stored' };
  if (candidates[0]) return { url: candidates[0], source: 'candidate' };
  return { url: null, source: 'missing' };
}
```

- [ ] **Step 5: Run cover tests**

Run:

```bash
npm run test -- src/utils/cover.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit cover resolver foundation**

```bash
git add src/utils/cover.ts src/utils/cover.test.ts src/types.ts
git commit -m "feat: add shared cover resolver foundation"
```

## Task 2: Metadata Merge And Refresh Helpers

**Files:**
- Modify: `src/lib/metadata.ts`
- Modify: `src/lib/metadata.test.ts`

- [ ] **Step 1: Write failing tests for metadata merge behavior**

Add tests to `src/lib/metadata.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Book } from '../types';
import { mergeBookWithMetadataResult } from './metadata';
import type { MetadataSearchResult } from './metadata';

const existingBook: Book = {
  id: 'book-1',
  title: 'Existing Title',
  author: 'Existing Author',
  status: 'Reading',
  genres: ['Fiction'],
  tropes: ['quiet'],
  pagesRead: 42,
  notes: 'Keep my note',
};

const result: MetadataSearchResult = {
  sourceName: 'google-books',
  sourceId: 'gb-1',
  title: 'Fetched Title',
  author: 'Fetched Author',
  publishedYear: 2020,
  publisher: 'Fetched Press',
  pageCount: 320,
  language: 'en',
  isbn10: ['1234567890'],
  isbn13: ['9781234567890'],
  coverCandidates: ['https://example.com/cover.jpg'],
};

describe('mergeBookWithMetadataResult', () => {
  it('fills missing metadata without replacing user reading state', () => {
    expect(mergeBookWithMetadataResult(existingBook, result)).toMatchObject({
      id: 'book-1',
      title: 'Existing Title',
      author: 'Existing Author',
      status: 'Reading',
      genres: ['Fiction'],
      tropes: ['quiet'],
      pagesRead: 42,
      notes: 'Keep my note',
      publishedYear: 2020,
      publisher: 'Fetched Press',
      pageCount: 320,
      language: 'en',
      coverUrl: 'https://example.com/cover.jpg',
      coverCandidates: ['https://example.com/cover.jpg'],
      metadataStatus: 'candidate',
      metadataSources: ['google-books'],
    });
  });

  it('does not overwrite existing user-entered page count or cover', () => {
    const merged = mergeBookWithMetadataResult(
      { ...existingBook, pageCount: 111, coverUrl: 'https://example.com/original.jpg' },
      result,
    );

    expect(merged.pageCount).toBe(111);
    expect(merged.coverUrl).toBe('https://example.com/original.jpg');
    expect(merged.coverCandidates).toEqual([
      'https://example.com/original.jpg',
      'https://example.com/cover.jpg',
    ]);
  });
});
```

- [ ] **Step 2: Run metadata tests and verify failure**

Run:

```bash
npm run test -- src/lib/metadata.test.ts
```

Expected: fail because `mergeBookWithMetadataResult` does not exist.

- [ ] **Step 3: Implement metadata merge helper**

Add to `src/lib/metadata.ts`:

```ts
export function mergeBookWithMetadataResult(book: Book, result: MetadataSearchResult): Book {
  const coverCandidates = Array.from(new Set([
    book.coverUrl,
    ...(book.coverCandidates ?? []),
    ...result.coverCandidates,
  ].filter((candidate): candidate is string => Boolean(candidate))));

  return {
    ...book,
    subtitle: book.subtitle,
    description: book.description,
    publishedYear: book.publishedYear ?? result.publishedYear,
    publisher: book.publisher ?? result.publisher,
    pageCount: book.pageCount ?? result.pageCount,
    language: book.language ?? result.language,
    coverUrl: book.coverUrl ?? result.coverCandidates[0],
    coverCandidates,
    metadataStatus: 'candidate',
    metadataSources: Array.from(new Set([...(book.metadataSources ?? []), metadataSourceName(result.sourceName)])),
    sourceIds: {
      ...book.sourceIds,
      ...sourceIdsFromResult(result),
    },
  };
}
```

- [ ] **Step 4: Run metadata tests**

Run:

```bash
npm run test -- src/lib/metadata.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit metadata helper**

```bash
git add src/lib/metadata.ts src/lib/metadata.test.ts
git commit -m "feat: add metadata merge helper"
```

## Task 3: Earned Titles And Stats Foundation

**Files:**
- Modify: `src/lib/bookStats.ts`
- Modify: `src/lib/bookStats.test.ts`

- [ ] **Step 1: Write failing tests for earned title calculation**

Add tests to `src/lib/bookStats.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Book } from '../types';
import { getEarnedReaderTitle } from './bookStats';

const baseBook: Book = {
  id: 'book-1',
  title: 'Book',
  author: 'Author',
  status: 'Want to Read',
  genres: ['Fiction'],
  tropes: [],
};

describe('earned reader titles', () => {
  it('starts every user at Reader', () => {
    expect(getEarnedReaderTitle([])).toEqual({
      title: 'Reader',
      level: 1,
      nextTitle: 'Page Finder',
      progress: 0,
    });
  });

  it('awards Page Finder after tracking three books', () => {
    const books = [1, 2, 3].map((n) => ({ ...baseBook, id: String(n) }));
    expect(getEarnedReaderTitle(books).title).toBe('Page Finder');
  });

  it('awards Lead Curator after twenty tracked books', () => {
    const books = Array.from({ length: 20 }, (_, index) => ({
      ...baseBook,
      id: String(index),
      status: index < 10 ? 'Completed' : 'Want to Read',
    } satisfies Book));

    expect(getEarnedReaderTitle(books)).toMatchObject({
      title: 'Lead Curator',
      level: 5,
    });
  });
});
```

- [ ] **Step 2: Run stats tests and verify failure**

Run:

```bash
npm run test -- src/lib/bookStats.test.ts
```

Expected: fail because `getEarnedReaderTitle` does not exist.

- [ ] **Step 3: Implement title helper**

Add to `src/lib/bookStats.ts`:

```ts
export interface EarnedReaderTitle {
  title: string;
  level: number;
  nextTitle: string | null;
  progress: number;
}

const TITLE_LEVELS = [
  { title: 'Reader', level: 1, threshold: 0 },
  { title: 'Page Finder', level: 2, threshold: 3 },
  { title: 'Avid Reader', level: 3, threshold: 5 },
  { title: 'Bibliophile', level: 4, threshold: 10 },
  { title: 'Lead Curator', level: 5, threshold: 20 },
] as const;

export function getEarnedReaderTitle(books: Book[]): EarnedReaderTitle {
  const trackedCount = books.length;
  const current = [...TITLE_LEVELS].reverse().find((level) => trackedCount >= level.threshold) ?? TITLE_LEVELS[0];
  const next = TITLE_LEVELS.find((level) => level.threshold > trackedCount) ?? null;

  return {
    title: current.title,
    level: current.level,
    nextTitle: next?.title ?? null,
    progress: next ? Math.min(100, Math.round((trackedCount / next.threshold) * 100)) : 100,
  };
}
```

- [ ] **Step 4: Run stats tests**

Run:

```bash
npm run test -- src/lib/bookStats.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit title helper**

```bash
git add src/lib/bookStats.ts src/lib/bookStats.test.ts
git commit -m "feat: add earned reader titles"
```

## Task 4: App Navigation And State Spine

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Update view model**

In `src/App.tsx`, change:

```ts
type View = 'index' | 'reading' | 'archive' | 'discovery';
```

to:

```ts
type View = 'home' | 'library' | 'stats' | 'discover';
```

Set initial state:

```ts
const [view, setView] = useState<View>('home');
```

- [ ] **Step 2: Wire StatsDashboard as a first-class view**

Import `StatsDashboard` in `src/App.tsx` if not already imported:

```ts
import StatsDashboard from './components/StatsDashboard';
```

Render:

```tsx
{view === 'home' && (
  <IndexRoom
    books={books}
    currentlyReading={currentlyReading}
    recommendations={RECOMMENDATIONS}
    onNavigate={setView}
    onSelectBook={setSelectedBook}
    onAddBook={() => setEditingBook('new')}
  />
)}
{view === 'library' && (
  <ArchiveRoom
    books={filteredBooks}
    allBooks={books}
    search={search}
    onSearch={setSearch}
    filterGenre={filterGenre}
    onFilterGenre={setFilterGenre}
    filterFormat={filterFormat}
    onFilterFormat={setFilterFormat}
    filterRating={filterRating}
    onFilterRating={setFilterRating}
    filterStatus={filterStatus}
    onFilterStatus={(s: FilterStatus) => setFilterStatus(s)}
    onSelectBook={setSelectedBook}
    onAddBook={() => setEditingBook('new')}
    onExport={exportData}
    onImport={() => fileInputRef.current?.click()}
  />
)}
{view === 'stats' && <StatsDashboard books={books} />}
{view === 'discover' && <RecommendationsView recommendations={RECOMMENDATIONS} books={books} onAddToList={addToWantToRead} />}
```

- [ ] **Step 3: Update status filter navigation**

Where status filters currently set archive view, change:

```ts
setView('archive');
```

to:

```ts
setView('library');
```

- [ ] **Step 4: Update Sidebar view labels and type**

In `src/components/Sidebar.tsx`, change:

```ts
type View = 'index' | 'reading' | 'archive' | 'discovery';
```

to:

```ts
type View = 'home' | 'library' | 'stats' | 'discover';
```

Replace main nav items with:

```tsx
<NavItem icon={Icons.home} label="Home" active={view === 'home'} onClick={() => onViewChange('home')} />
<NavItem icon={Icons.library} label="Library" badge={counts.all} active={view === 'library'} onClick={() => onViewChange('library')} />
<NavItem icon={Icons.stats} label="Stats" active={view === 'stats'} onClick={() => onViewChange('stats')} />
<NavItem icon={Icons.discovery} label="Discover" active={view === 'discover'} onClick={() => onViewChange('discover')} />
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: pass. If `IndexRoom` prop types fail because it does not yet accept `onAddBook`, add that optional prop in Task 5 instead and omit it here until Home is updated.

- [ ] **Step 6: Commit navigation spine**

```bash
git add src/App.tsx src/components/Sidebar.tsx
git commit -m "feat: add reading command center navigation"
```

## Task 5: Home Command Center

**Files:**
- Modify: `src/components/rooms/IndexRoom.tsx`
- Modify: `src/lib/bookStats.ts`
- Modify: `src/lib/bookStats.test.ts` only if additional Home stats are extracted.

- [ ] **Step 1: Inspect current IndexRoom props**

Run:

```bash
Get-Content -Raw src/components/rooms/IndexRoom.tsx
```

Expected: identify current stats, recommendation, and navigation usage before editing.

- [ ] **Step 2: Update props**

Ensure `IndexRoom` accepts:

```ts
interface IndexRoomProps {
  books: Book[];
  currentlyReading: Book[];
  recommendations: Recommendation[];
  onNavigate: (view: 'home' | 'library' | 'stats' | 'discover') => void;
  onSelectBook: (book: Book) => void;
  onAddBook: () => void;
}
```

- [ ] **Step 3: Use earned title and current-reading stats**

Import:

```ts
import { getEarnedReaderTitle, getIndexStats, getReadingStats } from '../../lib/bookStats';
```

Inside `IndexRoom`:

```ts
const indexStats = getIndexStats(books, new Date().getFullYear());
const readingStats = getReadingStats(books);
const earnedTitle = getEarnedReaderTitle(books);
const primaryReading = currentlyReading[0] ?? null;
const nextRecommendations = recommendations.slice(0, 6);
```

- [ ] **Step 4: Redesign first screen around command center sections**

Replace the top-level content with sections in this order:

```tsx
<section className="home-hero">
  <div>
    <div>Current title</div>
    <h1>{earnedTitle.title}</h1>
    {earnedTitle.nextTitle && <p>{earnedTitle.progress}% toward {earnedTitle.nextTitle}</p>}
  </div>
  <button onClick={onAddBook}>Add book</button>
</section>

<section>
  <h2>Now reading</h2>
  {primaryReading ? (
    <button onClick={() => onSelectBook(primaryReading)}>
      <BookCard book={primaryReading} onClick={() => onSelectBook(primaryReading)} />
    </button>
  ) : (
    <button onClick={onAddBook}>Add what you are reading</button>
  )}
</section>

<section>
  <h2>Reading pulse</h2>
  <div>{indexStats.completedThisYear} completed this year</div>
  <div>{readingStats.pagesLeft} pages left</div>
  <div>{readingStats.averageProgress}% average progress</div>
</section>

<section>
  <h2>Recommended next</h2>
  <div>{nextRecommendations.map(...cards...)}</div>
</section>
```

Use the existing style idioms in `IndexRoom.tsx`; do not introduce a new CSS framework.

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 6: Commit Home**

```bash
git add src/components/rooms/IndexRoom.tsx src/lib/bookStats.ts src/lib/bookStats.test.ts
git commit -m "feat: redesign home as reading command center"
```

## Task 6: Library Reframe

**Files:**
- Modify: `src/components/rooms/ArchiveRoom.tsx`
- Modify: `src/components/Sidebar.tsx` only if remaining label references appear.

- [ ] **Step 1: Remove archive-health/care/ledger user-facing language**

In `ArchiveRoom.tsx`, replace visible labels:

```text
Archive -> Library
Archive care -> Metadata refresh
Care -> Needs refresh
Ledger -> List
Care index -> Refresh queue
```

If the care panel remains, make it a secondary quiet metadata-refresh affordance and not a major dashboard.

- [ ] **Step 2: Make cover shelves the default Library experience**

Keep the current cover shelf default. If a list toggle remains, label it:

```tsx
<button>List</button>
```

not:

```tsx
<button>Ledger</button>
```

- [ ] **Step 3: Ensure empty state is normal**

Use:

```tsx
function ArchiveEmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '70px 0', color: archiveTone.faint }}>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 20 }}>No books found</div>
    </div>
  );
}
```

Do not mention data health in the empty state.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 5: Commit Library reframe**

```bash
git add src/components/rooms/ArchiveRoom.tsx src/components/Sidebar.tsx
git commit -m "feat: reframe archive as library"
```

## Task 7: Apply Shared Cover Resolver To Visible Surfaces

**Files:**
- Modify: `src/components/BookCard.tsx`
- Modify: `src/components/DetailPanel.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/RecommendationsView.tsx`
- Modify: `src/App.tsx` if resolved covers are saved to book records.

- [ ] **Step 1: Replace local cover selection with shared resolver**

In `BookCard.tsx`, replace local primary selection:

```ts
const coverCandidates = getCoverCandidates(book, failedUrls);
const candidateCover = coverCandidates[0] ?? null;
const fetchedFallback = fetchedCover?.bookId === book.id ? fetchedCover.url : null;
const cover = candidateCover || (fetchedFallback && !failedUrls.includes(fetchedFallback) ? fetchedFallback : null);
```

with:

```ts
const storedCover = resolveStoredCover(book, failedUrls);
const fetchedFallback = fetchedCover?.bookId === book.id ? fetchedCover.url : null;
const cover = storedCover.url || (fetchedFallback && !failedUrls.includes(fetchedFallback) ? fetchedFallback : null);
```

Keep `fetchCoverUrl` fallback for books with no stored cover.

- [ ] **Step 2: Make the same resolver change in DetailPanel**

Use the same `resolveStoredCover(book, failedUrls)` pattern in `DetailPanel.tsx`.

- [ ] **Step 3: Update Sidebar current-reading cover**

In `Sidebar.tsx`, replace:

```tsx
{currentlyReading.coverUrl ? <img src={currentlyReading.coverUrl} ... /> : '📖'}
```

with a small local helper:

```ts
import { resolveStoredCover } from '../utils/cover';
```

and:

```tsx
const sidebarCover = resolveStoredCover(currentlyReading).url;
```

Render the image only when `sidebarCover` exists.

- [ ] **Step 4: Add app-level cover persistence only after resolver works visually**

If repeated fetching still happens, add:

```ts
function updateBookCover(bookId: string, coverUrl: string) {
  allowBooksPersistence();
  setBooks(prev => prev.map(book => book.id === bookId
    ? {
        ...book,
        coverUrl,
        coverCandidates: Array.from(new Set([coverUrl, ...(book.coverCandidates ?? [])])),
      }
    : book,
  ));
}
```

Pass it to `BookCard` and `DetailPanel` only if needed. Do not add this callback before confirming repeated fetching remains a problem.

- [ ] **Step 5: Run cover and build checks**

Run:

```bash
npm run test -- src/utils/cover.test.ts
npm run build
```

Expected: pass.

- [ ] **Step 6: Commit shared resolver surfaces**

```bash
git add src/components/BookCard.tsx src/components/DetailPanel.tsx src/components/Sidebar.tsx src/components/RecommendationsView.tsx src/App.tsx
git commit -m "fix: use shared cover resolver across book surfaces"
```

## Task 8: Book Detail Metadata Refresh

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/DetailPanel.tsx`
- Modify: `src/lib/metadata.ts`
- Modify: `src/lib/metadata.test.ts`

- [ ] **Step 1: Add refresh callback in App**

In `App.tsx`, add:

```ts
async function refreshBookMetadata(book: Book) {
  const response = await searchBookMetadata({
    title: book.title,
    author: book.author,
    isbn: book.sourceIds?.isbn13?.[0] ?? book.sourceIds?.isbn10?.[0],
  });
  const bestResult = response.results[0];
  if (!bestResult) return;

  const updated = mergeBookWithMetadataResult(book, bestResult);
  addOrUpdateBook(updated);
  setSelectedBook(updated);
}
```

Import:

```ts
import { mergeBookWithMetadataResult, searchBookMetadata } from './lib/metadata';
```

- [ ] **Step 2: Pass refresh callback to DetailPanel**

Change:

```tsx
<DetailPanel book={selectedBook} onClose={...} onEdit={...} onDelete={...} />
```

to:

```tsx
<DetailPanel
  book={selectedBook}
  onClose={() => setSelectedBook(null)}
  onEdit={() => setEditingBook(selectedBook)}
  onDelete={() => deleteBook(selectedBook.id)}
  onRefreshMetadata={() => refreshBookMetadata(selectedBook)}
/>
```

- [ ] **Step 3: Add DetailPanel prop and button**

In `DetailPanel.tsx`, update props:

```ts
export default function DetailPanel({ book, onClose, onEdit, onDelete, onRefreshMetadata }: {
  book: Book;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefreshMetadata: () => void;
}) {
```

Add a secondary action:

```tsx
<button
  onClick={onRefreshMetadata}
  style={{ padding: '10px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', border: '1px solid #d8d3c8', background: 'transparent', color: '#4B4B4B' }}
>
  Refresh metadata
</button>
```

- [ ] **Step 4: Run metadata tests and build**

Run:

```bash
npm run test -- src/lib/metadata.test.ts
npm run build
```

Expected: pass.

- [ ] **Step 5: Commit metadata refresh**

```bash
git add src/App.tsx src/components/DetailPanel.tsx src/lib/metadata.ts src/lib/metadata.test.ts
git commit -m "feat: add book metadata refresh"
```

## Task 9: Search-First Add Book Flow

**Files:**
- Modify: `src/components/BookIntakePanel.tsx`
- Modify: `src/lib/metadata.ts`
- Modify: `src/lib/metadata.test.ts`

- [ ] **Step 1: Preserve search-first flow**

Keep the current search form, but change visible guidance from:

```text
Search first, then review before saving.
```

to:

```text
Search public book data first. Manual entry is still available if nothing matches.
```

- [ ] **Step 2: Show richer result metadata**

In each result row, include description when available only if `MetadataSearchResult` is extended to include it. If description is not available from current APIs yet, show:

```tsx
<div style={metadataStyle}>
  {[result.publishedYear, result.publisher, result.pageCount ? `${result.pageCount} pages` : undefined, result.language]
    .filter(Boolean)
    .join(' / ') || 'No extra details'}
</div>
```

- [ ] **Step 3: Add ISBN search field only if current title/author search is insufficient**

If adding ISBN, extend state:

```ts
const [isbn, setIsbn] = useState('');
```

and pass:

```ts
isbn: isbn.trim() || undefined,
```

to `searchBookMetadata`.

Do not add ISBN if it makes the form visually crowded on mobile; title/author search is acceptable for this wave.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 5: Commit add-book improvements**

```bash
git add src/components/BookIntakePanel.tsx src/lib/metadata.ts src/lib/metadata.test.ts
git commit -m "feat: improve search-first book intake"
```

## Task 10: Stats Destination And Earned Title Display

**Files:**
- Modify: `src/components/StatsDashboard.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/App.tsx` if `UserProfile.role` storage needs compatibility handling.

- [ ] **Step 1: Use earned title in StatsDashboard**

Import:

```ts
import { getEarnedReaderTitle } from '../lib/bookStats';
```

Inside `StatsDashboard`:

```ts
const earnedTitle = getEarnedReaderTitle(books);
```

Add a top panel:

```tsx
<Panel title="Reader Title">
  <div style={{ fontFamily: "'Newsreader', serif", fontSize: 34, color: '#2D2D2D' }}>{earnedTitle.title}</div>
  {earnedTitle.nextTitle && (
    <div style={{ marginTop: 8, fontSize: 13, color: '#6B6B6B' }}>
      {earnedTitle.progress}% toward {earnedTitle.nextTitle}
    </div>
  )}
</Panel>
```

- [ ] **Step 2: Stop displaying editable role as title**

In `Sidebar.tsx`, compute earned title from counts if passing all books is too invasive:

```tsx
const displayedRole = user.role;
```

should become a prop-driven earned title in this task if `Sidebar` receives `earnedTitle`.

Preferred App change:

```tsx
const earnedTitle = getEarnedReaderTitle(books);
<Sidebar ... earnedTitle={earnedTitle.title} />
```

Update Sidebar props:

```ts
earnedTitle: string;
```

Render:

```tsx
<div style={{ fontSize: 10, color: '#6B6B6B', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{earnedTitle}</div>
```

- [ ] **Step 3: Simplify profile modal role editing**

In `UserEditModal`, remove the editable "Title / Role" input. Keep name and avatar color. When saving, preserve existing `role` in storage for compatibility:

```ts
onSave({ name: name.trim(), role: user.role || 'Reader', initials, color: user.color });
```

- [ ] **Step 4: Run title tests and build**

Run:

```bash
npm run test -- src/lib/bookStats.test.ts
npm run build
```

Expected: pass.

- [ ] **Step 5: Commit stats/title work**

```bash
git add src/components/StatsDashboard.tsx src/components/Sidebar.tsx src/App.tsx
git commit -m "feat: restore stats and earned titles"
```

## Task 11: Discovery Save And Not Interested

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/RecommendationsView.tsx`
- Modify: `src/data/recommendations.ts`
- Modify: `src/lib/storage.ts` and `src/lib/storage.test.ts` only if declined IDs are stored with exported app data.

- [ ] **Step 1: Add declined recommendation state**

In `App.tsx`:

```ts
const DECLINED_RECS_KEY = 'bookshelf_declined_recommendations';

function loadDeclinedRecommendations(): string[] {
  try {
    const raw = localStorage.getItem(DECLINED_RECS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDeclinedRecommendations(ids: string[]) {
  localStorage.setItem(DECLINED_RECS_KEY, JSON.stringify(ids));
}
```

State:

```ts
const [declinedRecommendationIds, setDeclinedRecommendationIds] = useState<string[]>(loadDeclinedRecommendations);
```

Callback:

```ts
function declineRecommendation(id: string) {
  setDeclinedRecommendationIds(prev => {
    const next = Array.from(new Set([...prev, id]));
    saveDeclinedRecommendations(next);
    return next;
  });
}
```

- [ ] **Step 2: Pass declined IDs to Discovery**

Change Discovery render:

```tsx
{view === 'discover' && (
  <RecommendationsView
    recommendations={RECOMMENDATIONS}
    books={books}
    declinedRecommendationIds={declinedRecommendationIds}
    onAddToList={addToWantToRead}
    onDecline={declineRecommendation}
  />
)}
```

- [ ] **Step 3: Update RecommendationsView props**

```ts
export default function RecommendationsView({
  recommendations,
  books,
  declinedRecommendationIds,
  onAddToList,
  onDecline,
}: {
  recommendations: Recommendation[];
  books: Book[];
  declinedRecommendationIds: string[];
  onAddToList: (r: Recommendation) => void;
  onDecline: (id: string) => void;
}) {
```

Filter:

```ts
const declined = new Set(declinedRecommendationIds);
const filtered = recommendations.filter(r => {
  if (declined.has(r.id)) return false;
  if (alreadyHave.has(r.title.toLowerCase())) return false;
  if (mood !== 'All' && !r.moods.includes(mood)) return false;
  return true;
});
```

- [ ] **Step 4: Add Not interested button to RecCard**

Update props:

```ts
function RecCard({ rec, onAdd, onDecline }: { rec: Recommendation; onAdd: () => void; onDecline: () => void }) {
```

Render:

```tsx
<button
  onClick={onDecline}
  style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 8, border: '1px solid rgba(45,45,45,0.18)', background: 'transparent', color: '#4B4B4B', cursor: 'pointer' }}
>
  Not interested
</button>
```

- [ ] **Step 5: Add richer recommendation data only where cheap**

In `src/data/recommendations.ts`, add fields already supported by the UI such as `year`, `publisher`, or `description` only if the `Recommendation` type is extended. Use existing static data; do not add paid AI.

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 7: Commit Discovery**

```bash
git add src/App.tsx src/components/RecommendationsView.tsx src/data/recommendations.ts src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: add discovery decline actions"
```

## Task 12: Responsive Polish And Visual QA Fixes

**Files:**
- Modify: `src/index.css`
- Modify touched component files only where browser QA reveals concrete layout bugs.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run lint
npm run test
npm run build
```

Expected:

- lint exits 0
- all Vitest tests pass
- build exits 0

- [ ] **Step 2: Start local app**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 5177
```

Open:

```text
http://127.0.0.1:5177/bookshelf/
```

- [ ] **Step 3: Desktop browser QA**

Verify at a desktop viewport:

- Home leads with current reading, stats snapshot, earned title, add/search action, and recommendations.
- Library uses normal library language, not archive-health/care/ledger language.
- Library cover shelf loads covers that also appear in Book Detail.
- Book Detail shows metadata and refresh action.
- Add Book search returns public metadata and can save a book.
- Stats is reachable from main navigation.
- Profile displays earned title and no longer asks the user to type their title.
- Discover cards show Save and Not interested.
- Declined recommendations disappear after clicking Not interested.

- [ ] **Step 4: Mobile browser QA**

Set viewport to `390x844`.

Verify:

- no overlapping text or controls on Home
- Library shelves remain usable
- Add Book panel fits and search results are readable
- Detail panel remains usable
- Stats cards do not overflow
- Discovery buttons do not overlap card text

- [ ] **Step 5: Cover-specific QA**

Use books that currently demonstrate the problem.

Verify:

- if a book has a cover in Detail, the same cover appears in Library/Home where applicable
- known bad cover IDs remain skipped
- placeholder fallback is elegant and only appears when no usable cover exists
- lazy loading does not blank visible Library covers

- [ ] **Step 6: Commit QA fixes if needed**

If concrete QA fixes are needed:

```bash
git add src/index.css src/App.tsx src/components src/lib src/utils src/data
git commit -m "fix: polish reading command center QA issues"
```

If no fixes are needed, do not create an empty commit.

## Final Verification

- [ ] Run:

```bash
npm run lint
npm run test
npm run build
```

Expected: all pass.

- [ ] Confirm final git status:

```bash
git status --short --branch
```

Expected: clean working tree on the implementation branch.

## Self-Review

Spec coverage:

- Product structure is covered by Tasks 4, 5, 6, 10, and 11.
- Cover/metadata system is covered by Tasks 1, 2, 7, 8, and 9.
- Discovery Save and Not interested are covered by Task 11.
- Stats and earned titles are covered by Tasks 3 and 10.
- First-wave boundary is preserved: no backend, auth, paid AI, or full rewrite.
- Verification requirements are covered by Task 12 and Final Verification.

Placeholder scan:

- No unresolved planning markers are present.
- Conditional steps are explicitly bounded by observable evidence, such as repeated fetching or mobile crowding.

Type consistency:

- `resolveStoredCover`, `ResolvedStoredCover`, `mergeBookWithMetadataResult`, and `getEarnedReaderTitle` are introduced before use.
- Navigation names are consistently `home`, `library`, `stats`, and `discover`.
- Add Book remains a modal action, not a main view.
