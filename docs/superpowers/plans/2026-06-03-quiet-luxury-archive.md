# Quiet Luxury Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved richer Quiet Luxury visual system first in Archive while preserving current Book Tracker behavior.

**Architecture:** Add small Archive-specific helpers for view statistics and metadata quality signals, then introduce focused Archive UI components/patterns without changing storage or book data shape. Keep the current add/edit/import/export flows intact and reuse existing cover fallback behavior.

**Tech Stack:** React, TypeScript, Vite, Vitest, inline style objects matching the current app style, existing `Book`, `Status`, `Genre`, `Format`, and metadata fields.

---

## File Structure

- Create: `src/components/rooms/archiveQuality.ts`
  - Pure helper functions for quality/care counts and metadata labels.
- Create: `src/components/rooms/archiveQuality.test.ts`
  - Unit coverage for the quality/care logic.
- Create: `src/components/rooms/archiveStyles.ts`
  - Quiet Luxury palette, typography, spacing, and focused Archive style objects.
- Modify: `src/components/rooms/ArchiveRoom.tsx`
  - Replace the current grouped grid layout with the richer Quiet Luxury Archive layout, cover mode, ledger mode, quality summary, and refined control strip.
- Modify: `src/components/BookCard.tsx`
  - Add a restrained `variant` prop for the Archive shelf/current-stack treatment while preserving the default behavior elsewhere.
- Modify: `src/components/DetailPanel.tsx`
  - Polish the panel to match the new visual system without changing edit/delete behavior.
- Modify: `src/index.css`
  - Add mobile rules for the new Archive classes only.

## Task 1: Archive Quality Helpers

**Files:**
- Create: `src/components/rooms/archiveQuality.ts`
- Create: `src/components/rooms/archiveQuality.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Create `src/components/rooms/archiveQuality.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Book } from '../../types';
import {
  getArchiveQualitySummary,
  getBookQualityState,
  metadataQualityLabel,
} from './archiveQuality';

const baseBook: Book = {
  id: 'book-1',
  title: 'Book',
  author: 'Author',
  status: 'Want to Read',
  genres: ['Fiction'],
  tropes: [],
  metadataStatus: 'reviewed',
};

describe('archive quality helpers', () => {
  it('labels reviewed, candidate, and manual metadata states', () => {
    expect(metadataQualityLabel('reviewed')).toBe('Reviewed');
    expect(metadataQualityLabel('candidate')).toBe('Candidate');
    expect(metadataQualityLabel('manual')).toBe('Manual');
    expect(metadataQualityLabel(undefined)).toBe('Manual');
  });

  it('detects missing covers before metadata issues', () => {
    expect(getBookQualityState({ ...baseBook, coverUrl: undefined, coverCandidates: [] })).toEqual({
      tone: 'care',
      label: 'Missing cover',
    });
  });

  it('detects manual and candidate metadata states', () => {
    expect(getBookQualityState({ ...baseBook, coverUrl: 'cover.jpg', metadataStatus: 'manual' })).toEqual({
      tone: 'manual',
      label: 'Manual',
    });
    expect(getBookQualityState({ ...baseBook, coverUrl: 'cover.jpg', metadataStatus: 'candidate' })).toEqual({
      tone: 'candidate',
      label: 'Candidate',
    });
  });

  it('summarizes archive care counts', () => {
    const books: Book[] = [
      { ...baseBook, id: '1', coverUrl: 'cover.jpg', metadataStatus: 'reviewed' },
      { ...baseBook, id: '2', metadataStatus: 'manual' },
      { ...baseBook, id: '3', coverUrl: 'cover.jpg', metadataStatus: 'candidate' },
      { ...baseBook, id: '4', coverCandidates: ['cover-a.jpg'], metadataStatus: 'manual' },
    ];

    expect(getArchiveQualitySummary(books)).toEqual({
      reviewed: 1,
      candidate: 1,
      manual: 2,
      missingCover: 1,
      needsCare: 3,
    });
  });
});
```

- [ ] **Step 2: Run tests and confirm they fail**

Run:

```bash
npm run test -- src/components/rooms/archiveQuality.test.ts
```

Expected: fail because `./archiveQuality` does not exist.

- [ ] **Step 3: Implement the helpers**

Create `src/components/rooms/archiveQuality.ts`:

```ts
import type { Book, MetadataStatus } from '../../types';

export type QualityTone = 'reviewed' | 'candidate' | 'manual' | 'care';

export interface BookQualityState {
  tone: QualityTone;
  label: string;
}

export interface ArchiveQualitySummary {
  reviewed: number;
  candidate: number;
  manual: number;
  missingCover: number;
  needsCare: number;
}

export function metadataQualityLabel(status?: MetadataStatus): string {
  if (status === 'reviewed') return 'Reviewed';
  if (status === 'candidate') return 'Candidate';
  return 'Manual';
}

export function hasReliableCover(book: Book): boolean {
  return Boolean(book.coverUrl || (book.coverCandidates && book.coverCandidates.length > 0));
}

export function getBookQualityState(book: Book): BookQualityState {
  if (!hasReliableCover(book)) return { tone: 'care', label: 'Missing cover' };
  if (book.metadataStatus === 'candidate') return { tone: 'candidate', label: 'Candidate' };
  if (book.metadataStatus === 'reviewed') return { tone: 'reviewed', label: 'Reviewed' };
  return { tone: 'manual', label: 'Manual' };
}

export function getArchiveQualitySummary(books: Book[]): ArchiveQualitySummary {
  return books.reduce<ArchiveQualitySummary>(
    (summary, book) => {
      if (!hasReliableCover(book)) summary.missingCover += 1;

      if (book.metadataStatus === 'reviewed') summary.reviewed += 1;
      else if (book.metadataStatus === 'candidate') summary.candidate += 1;
      else summary.manual += 1;

      summary.needsCare = summary.missingCover + summary.candidate + summary.manual;
      return summary;
    },
    { reviewed: 0, candidate: 0, manual: 0, missingCover: 0, needsCare: 0 },
  );
}
```

- [ ] **Step 4: Run helper tests**

Run:

```bash
npm run test -- src/components/rooms/archiveQuality.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit helper task**

```bash
git add src/components/rooms/archiveQuality.ts src/components/rooms/archiveQuality.test.ts
git commit -m "test: add archive quality helpers"
```

## Task 2: Quiet Luxury Archive Styles

**Files:**
- Create: `src/components/rooms/archiveStyles.ts`

- [ ] **Step 1: Add the Archive style module**

Create `src/components/rooms/archiveStyles.ts`:

```ts
import type { CSSProperties } from 'react';
import type { QualityTone } from './archiveQuality';

export const archiveTone = {
  page: '#f7f4ec',
  surface: '#fffdfa',
  shell: '#efebe1',
  sidebar: '#f0eee8',
  border: '#d8d3c8',
  ink: '#171715',
  muted: '#5e5a52',
  faint: '#777269',
  green: '#0c553d',
  care: '#8c3d32',
  brass: '#b9a36f',
};

export const archiveFont = {
  serif: "'Newsreader', Georgia, serif",
  sans: "'Manrope', 'Avenir Next', 'Segoe UI', sans-serif",
};

export const qualityToneStyle: Record<QualityTone, CSSProperties> = {
  reviewed: { color: archiveTone.green, borderColor: 'rgba(12,85,61,0.26)', background: 'rgba(12,85,61,0.07)' },
  candidate: { color: '#8a641f', borderColor: 'rgba(185,163,111,0.38)', background: 'rgba(185,163,111,0.12)' },
  manual: { color: archiveTone.muted, borderColor: archiveTone.border, background: 'rgba(255,253,250,0.72)' },
  care: { color: archiveTone.care, borderColor: 'rgba(140,61,50,0.28)', background: 'rgba(140,61,50,0.07)' },
};

export const archiveStyles = {
  room: {
    flex: 1,
    overflowY: 'auto',
    background: `radial-gradient(circle at 78% 12%, rgba(185,163,111,0.18), transparent 28%), linear-gradient(135deg, ${archiveTone.page}, ${archiveTone.shell})`,
    color: archiveTone.ink,
    padding: '36px 42px 46px',
  } satisfies CSSProperties,
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: archiveTone.faint,
    fontWeight: 700,
  } satisfies CSSProperties,
  title: {
    fontFamily: archiveFont.serif,
    fontWeight: 400,
    fontSize: 64,
    lineHeight: 0.88,
    margin: 0,
    letterSpacing: -1.8,
  } satisfies CSSProperties,
  surface: {
    background: 'rgba(255,253,250,0.86)',
    border: `1px solid ${archiveTone.border}`,
    borderRadius: 24,
    boxShadow: '0 18px 44px rgba(44,36,24,0.06)',
  } satisfies CSSProperties,
  pillButton: {
    height: 44,
    borderRadius: 999,
    fontSize: 13,
    fontFamily: archiveFont.sans,
    cursor: 'pointer',
  } satisfies CSSProperties,
};
```

- [ ] **Step 2: Type-check the style module**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 3: Commit style module**

```bash
git add src/components/rooms/archiveStyles.ts
git commit -m "feat: add quiet luxury archive style tokens"
```

## Task 3: Archive Layout And View Modes

**Files:**
- Modify: `src/components/rooms/ArchiveRoom.tsx`

- [ ] **Step 1: Import helpers and add view mode state**

In `src/components/rooms/ArchiveRoom.tsx`, add imports:

```ts
import { getArchiveQualitySummary, getBookQualityState } from './archiveQuality';
import { archiveStyles, archiveTone, qualityToneStyle } from './archiveStyles';
```

Inside `ArchiveRoom`, after `filterOpen`:

```ts
const [viewMode, setViewMode] = useState<'covers' | 'ledger'>('covers');
const qualitySummary = getArchiveQualitySummary(books);
```

- [ ] **Step 2: Replace the topbar with the Quiet Luxury room shell**

Replace the current return fragment from the opening `<>` through the active filter chip area with:

```tsx
<div className="archive-room" style={archiveStyles.room}>
  <header className="archive-header" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 34, alignItems: 'end', marginBottom: 32 }}>
    <div>
      <div style={{ ...archiveStyles.eyebrow, marginBottom: 12 }}>Archive</div>
      <h1 style={archiveStyles.title}>Library</h1>
      <p style={{ maxWidth: 530, margin: '17px 0 0', color: archiveTone.muted, fontSize: 14, lineHeight: 1.65 }}>
        A quieter catalogue for the books you kept, the books still moving through you, and the records that deserve care.
      </p>
    </div>
    <div className="archive-stat-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 86px)', gap: 24 }}>
      <ArchiveStat label="Books" value={books.length} />
      <ArchiveStat label="Reading" value={reading.length} />
      <ArchiveStat label="Care" value={qualitySummary.needsCare} care />
    </div>
  </header>

  <section className="archive-controls" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 38 }}>
    <div style={{ position: 'relative' }}>
      <span style={{ ...S.searchIcon, left: 18 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </span>
      <input
        style={{
          height: 46,
          width: '100%',
          background: 'rgba(255,253,250,0.84)',
          border: `1px solid ${archiveTone.border}`,
          borderRadius: 999,
          padding: '0 18px 0 42px',
          color: archiveTone.ink,
          fontFamily: "'Manrope', sans-serif",
          fontSize: 13,
          outline: 'none',
          boxShadow: '0 12px 30px rgba(44,36,24,0.05)',
        }}
        placeholder="Search by title, author, series, note..."
        value={search}
        onChange={event => onSearch(event.target.value)}
      />
    </div>
    <div className="archive-control-actions" style={{ display: 'flex', gap: 8 }}>
      <button onClick={() => setFilterOpen(open => !open)} style={archiveSecondaryButton}>
        Filters{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}
      </button>
      <button style={archiveSecondaryButton} onClick={onImport}>Import</button>
      <button style={archivePrimaryButton} onClick={onExport}>Export</button>
      <button style={archivePrimaryButton} onClick={onAddBook}>Add book</button>
    </div>
    {filterOpen && (
      <ArchiveFilterPopover
        activeFilterCount={activeFilterCount}
        clearFilters={clearFilters}
        filterGenre={filterGenre}
        onFilterGenre={onFilterGenre}
        filterFormat={filterFormat}
        onFilterFormat={onFilterFormat}
        filterRating={filterRating}
        onFilterRating={onFilterRating}
        close={() => setFilterOpen(false)}
      />
    )}
  </section>
```

Also close the new wrapper at the end of the component with `</div>`.

- [ ] **Step 3: Add Archive helper components below `ArchiveRoom`**

Add these below `ArchiveRoom`:

```tsx
const archivePrimaryButton = {
  ...archiveStyles.pillButton,
  border: 'none',
  background: archiveTone.ink,
  color: archiveTone.page,
  padding: '0 20px',
  fontWeight: 650,
  boxShadow: '0 12px 24px rgba(23,23,21,0.12)',
};

const archiveSecondaryButton = {
  ...archiveStyles.pillButton,
  border: `1px solid ${archiveTone.border}`,
  background: archiveTone.surface,
  color: '#34312c',
  padding: '0 18px',
  fontWeight: 600,
};

function ArchiveStat({ label, value, care }: { label: string; value: number; care?: boolean }) {
  return (
    <div style={{ borderTop: `1px solid ${care ? archiveTone.care : archiveTone.ink}`, paddingTop: 11 }}>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 31, lineHeight: 1, color: care ? archiveTone.care : archiveTone.ink }}>{value}</div>
      <div style={{ fontSize: 9, letterSpacing: 1.9, textTransform: 'uppercase', color: archiveTone.faint, marginTop: 6 }}>{label}</div>
    </div>
  );
}
```

- [ ] **Step 4: Move filter popover into a local component**

Create `ArchiveFilterPopover` in the same file with the existing filter chip content, preserving all current filter behavior:

```tsx
function ArchiveFilterPopover({
  activeFilterCount,
  clearFilters,
  filterGenre,
  onFilterGenre,
  filterFormat,
  onFilterFormat,
  filterRating,
  onFilterRating,
  close,
}: {
  activeFilterCount: number;
  clearFilters: () => void;
  filterGenre: Genre | 'All';
  onFilterGenre: (genre: Genre | 'All') => void;
  filterFormat: Format | 'All';
  onFilterFormat: (format: Format | 'All') => void;
  filterRating: number;
  onFilterRating: (rating: number) => void;
  close: () => void;
}) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={close} />
      <div style={{ position: 'absolute', top: 126, right: 42, zIndex: 50, ...archiveStyles.surface, padding: '18px 20px', width: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.8, color: archiveTone.faint }}>Filters</span>
          {activeFilterCount > 0 && <button onClick={clearFilters} style={{ fontSize: 11, color: archiveTone.ink, cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }}>Clear all</button>}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={S.filterLabel}>Genre</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            <FilterChip label="All" active={filterGenre === 'All'} onClick={() => onFilterGenre('All')} />
            {allGenres.map(genre => <FilterChip key={genre} label={genre} active={filterGenre === genre} onClick={() => onFilterGenre(genre)} />)}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={S.filterLabel}>Format</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {allFormats.map(format => <FilterChip key={format} label={format === 'All' ? 'All Formats' : format} active={filterFormat === format} onClick={() => onFilterFormat(format)} />)}
          </div>
        </div>
        <div>
          <div style={S.filterLabel}>Minimum Rating</div>
          <div style={{ display: 'flex', gap: 5 }}>
            <FilterChip label="Any" active={filterRating === 0} onClick={() => onFilterRating(0)} />
            <FilterChip label="3+" active={filterRating === 3} onClick={() => onFilterRating(filterRating === 3 ? 0 : 3)} />
            <FilterChip label="4+" active={filterRating === 4} onClick={() => onFilterRating(filterRating === 4 ? 0 : 4)} />
            <FilterChip label="5" active={filterRating === 5} onClick={() => onFilterRating(filterRating === 5 ? 0 : 5)} />
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Replace content sections with shelf + ledger mode**

Inside the new wrapper after the controls, render:

```tsx
<section className="archive-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 278px', gap: 38 }}>
  <div>
    {reading.length > 0 && (
      <>
        <ArchiveSectionHeader title="Current stack" count={reading.length} />
        <div className="archive-current-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 46 }}>
          {reading.slice(0, 3).map(book => <BookCard key={book.id} book={book} onClick={() => onSelectBook(book)} variant="archiveFeature" />)}
        </div>
      </>
    )}

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <ArchiveSectionHeader title="Shelf" count={books.length} compact />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setViewMode('covers')} style={viewToggleStyle(viewMode === 'covers')}>Covers</button>
        <button onClick={() => setViewMode('ledger')} style={viewToggleStyle(viewMode === 'ledger')}>Ledger</button>
      </div>
    </div>

    {viewMode === 'covers'
      ? <ArchiveShelf books={books} onSelect={onSelectBook} />
      : <ArchiveLedger books={books} onSelect={onSelectBook} />}
  </div>

  <ArchiveCarePanel summary={qualitySummary} />
</section>
```

Add the referenced local components using the same helper imports:

```tsx
function ArchiveSectionHeader({ title, count, compact }: { title: string; count?: number; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: compact ? 0 : 18 }}>
      <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 30, fontWeight: 400, margin: 0, letterSpacing: -0.4 }}>{title}</h2>
      {count !== undefined && <div style={{ fontSize: 10, letterSpacing: 1.9, textTransform: 'uppercase', color: archiveTone.faint }}>{count} books</div>}
    </div>
  );
}

function viewToggleStyle(active: boolean) {
  return {
    height: 29,
    border: active ? 'none' : `1px solid ${archiveTone.border}`,
    borderRadius: 999,
    background: active ? archiveTone.ink : archiveTone.surface,
    color: active ? archiveTone.page : archiveTone.muted,
    padding: '0 12px',
    fontSize: 11,
    cursor: 'pointer',
  };
}

function ArchiveShelf({ books, onSelect }: { books: Book[]; onSelect: (book: Book) => void }) {
  return <div className="archive-shelf-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 18 }}>{books.map(book => <BookCard key={book.id} book={book} onClick={() => onSelect(book)} variant="archiveShelf" />)}</div>;
}

function ArchiveLedger({ books, onSelect }: { books: Book[]; onSelect: (book: Book) => void }) {
  return (
    <div style={{ ...archiveStyles.surface, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr .8fr .8fr .6fr', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${archiveTone.border}`, fontSize: 10, letterSpacing: 1.7, textTransform: 'uppercase', color: archiveTone.faint, fontWeight: 700 }}>
        <div>Title</div><div>Status</div><div>Quality</div><div>Rating</div>
      </div>
      {books.map(book => {
        const quality = getBookQualityState(book);
        return (
          <button key={book.id} onClick={() => onSelect(book)} style={{ width: '100%', display: 'grid', gridTemplateColumns: '2fr .8fr .8fr .6fr', gap: 12, padding: '14px 16px', border: 'none', borderBottom: `1px solid ${archiveTone.border}`, background: archiveTone.surface, textAlign: 'left', cursor: 'pointer', alignItems: 'center' }}>
            <div><strong>{book.title}</strong><div style={{ fontSize: 12, color: archiveTone.muted, marginTop: 3 }}>{book.author}</div></div>
            <div style={{ fontSize: 12, color: archiveTone.muted }}>{book.status}</div>
            <QualityBadge tone={quality.tone} label={quality.label} />
            <div style={{ fontSize: 12, color: archiveTone.muted }}>{book.rating ?? '—'}</div>
          </button>
        );
      })}
    </div>
  );
}

function QualityBadge({ tone, label }: { tone: keyof typeof qualityToneStyle; label: string }) {
  return <span style={{ ...qualityToneStyle[tone], border: `1px solid ${qualityToneStyle[tone].borderColor}`, borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 650, whiteSpace: 'nowrap' }}>{label}</span>;
}

function ArchiveCarePanel({ summary }: { summary: ReturnType<typeof getArchiveQualitySummary> }) {
  return (
    <aside style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
      <div style={{ ...archiveStyles.surface, padding: 20 }}>
        <div style={archiveStyles.eyebrow}>Care index</div>
        <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 46, lineHeight: 1, marginTop: 14 }}>{summary.needsCare}</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: archiveTone.muted, marginTop: 8 }}>small imperfections keeping the library from feeling complete.</div>
        <div style={{ height: 1, background: archiveTone.border, margin: '20px 0' }} />
        <CareRow label="Missing covers" value={summary.missingCover} />
        <CareRow label="Manual metadata" value={summary.manual} />
        <CareRow label="Candidate metadata" value={summary.candidate} />
      </div>
    </aside>
  );
}

function CareRow({ label, value }: { label: string; value: number }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4e4941', marginBottom: 11 }}><span>{label}</span><span>{value}</span></div>;
}
```

- [ ] **Step 6: Run type/build check**

Run:

```bash
npm run build
```

Expected: pass. If TypeScript complains about style object literal types, add `satisfies React.CSSProperties` or explicit `as const` only to the affected style values.

- [ ] **Step 7: Commit Archive layout task**

```bash
git add src/components/rooms/ArchiveRoom.tsx
git commit -m "feat: apply quiet luxury archive layout"
```

## Task 4: BookCard Archive Variants

**Files:**
- Modify: `src/components/BookCard.tsx`

- [ ] **Step 1: Add variant prop**

Change the component signature:

```ts
type BookCardVariant = 'default' | 'archiveShelf' | 'archiveFeature';

export default function BookCard({
  book,
  onClick,
  variant = 'default',
}: {
  book: Book;
  onClick: () => void;
  variant?: BookCardVariant;
}) {
```

- [ ] **Step 2: Add variant-derived dimensions and surface styles**

After `const cover = ...`, add:

```ts
const isArchiveVariant = variant !== 'default';
const isFeature = variant === 'archiveFeature';
const cardRadius = isArchiveVariant ? 24 : 10;
const coverRadius = isArchiveVariant ? '5px 13px 13px 5px' : 0;
```

Update the outer card style:

```ts
background: isArchiveVariant ? 'rgba(255,253,250,0.86)' : '#FFFFFF',
border: isArchiveVariant ? '1px solid #d8d3c8' : 'none',
borderRadius: cardRadius,
padding: isArchiveVariant ? 15 : 0,
boxShadow: hover
  ? isArchiveVariant ? '0 24px 48px rgba(44,36,24,0.12)' : '0px 16px 40px rgba(27,28,25,0.12)'
  : isArchiveVariant ? '0 18px 44px rgba(44,36,24,0.06)' : book.status === 'Reading'
    ? '0px 8px 24px rgba(0,98,65,0.10), 0 0 0 1.5px rgba(6,125,85,0.25)'
    : '0px 8px 24px rgba(27,28,25,0.06)',
```

For Archive variants, use a two-column feature layout:

```tsx
{isFeature ? (
  <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 15 }}>
    <BookCover />
    <BookInfo compact />
  </div>
) : (
  <>
    <BookCover />
    <BookInfo />
  </>
)}
```

Extract the current cover JSX into `BookCover` and info JSX into `BookInfo` local functions inside `BookCard` so behavior remains identical.

- [ ] **Step 3: Preserve fallback and error behavior**

Keep `handleCoverError`, `fetchCoverUrl`, `getCoverCandidates`, progress bar, status dot, genre tag, and star rating logic exactly as currently implemented. Only move the JSX into local functions and alter styles based on `variant`.

- [ ] **Step 4: Run tests/build**

Run:

```bash
npm run test
npm run build
```

Expected: both pass.

- [ ] **Step 5: Commit BookCard variants**

```bash
git add src/components/BookCard.tsx
git commit -m "feat: add quiet luxury book card variants"
```

## Task 5: Detail Panel Polish

**Files:**
- Modify: `src/components/DetailPanel.tsx`

- [ ] **Step 1: Apply richer Quiet Luxury surface styling**

Update the overlay and panel styles:

```tsx
<div
  style={{ position: 'fixed', inset: 0, background: 'rgba(23,23,21,0.38)', zIndex: 100, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(6px)' }}
  onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
>
  <div style={{ width: 540, background: '#f7f4ec', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '-18px 0 70px rgba(23,23,21,0.16)', position: 'relative', animation: 'slideIn 0.28s cubic-bezier(0.16,1,0.3,1)' }}>
```

- [ ] **Step 2: Update title and action styling**

Change the top label from `Book Detail` to `Selected volume`. Use the serif title style from the Archive:

```tsx
<div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 28, fontWeight: 400, color: '#171715', lineHeight: 1.12, marginBottom: 6 }}>{book.title}</div>
```

Replace the primary edit button with a black pill and the delete button with restrained outline styling. Preserve the confirm-delete two-step behavior.

- [ ] **Step 3: Add quiet quality row**

Near the existing metadata row section, render:

```tsx
{book.metadataStatus && <Row label="Quality" value={metadataStatusLabel[book.metadataStatus] || book.metadataStatus} />}
{!cover && <Row label="Cover" value="Missing cover" />}
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 5: Commit detail polish**

```bash
git add src/components/DetailPanel.tsx
git commit -m "feat: polish detail panel for quiet luxury archive"
```

## Task 6: Responsive Archive CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add mobile rules for Archive classes**

Append inside the existing `@media (max-width: 720px)` block:

```css
  .archive-room {
    padding: 24px 16px 34px !important;
  }

  .archive-header {
    grid-template-columns: 1fr !important;
    gap: 22px !important;
  }

  .archive-header h1 {
    font-size: 48px !important;
  }

  .archive-stat-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 14px !important;
  }

  .archive-controls {
    grid-template-columns: 1fr !important;
  }

  .archive-control-actions {
    flex-wrap: wrap !important;
  }

  .archive-main-grid {
    grid-template-columns: 1fr !important;
  }

  .archive-current-grid {
    grid-template-columns: 1fr !important;
  }

  .archive-shelf-grid {
    grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)) !important;
  }
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 3: Commit responsive CSS**

```bash
git add src/index.css
git commit -m "fix: tune quiet luxury archive responsiveness"
```

## Task 7: Full Verification And Browser QA

**Files:**
- No code changes unless verification reveals a defect.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run lint
npm run test
npm run build
```

Expected:

- lint exits 0
- Vitest shows 5 test files passing, including `archiveQuality.test.ts`
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

- [ ] **Step 3: Browser QA desktop**

Verify:

- Archive loads with richer Quiet Luxury styling.
- Search filters visible books.
- Filter popover opens, applies genre/format/rating filters, and clear all works.
- Covers mode shows the shelf view.
- Ledger mode switches to dense rows and selecting a row opens detail.
- Add book opens the existing intake.
- Export downloads JSON.
- Import accepts a valid JSON file.
- Missing-cover fallback is visible for books without covers.
- Detail panel opens, closes, edits, and keeps delete confirmation behavior.

- [ ] **Step 4: Browser QA mobile**

Set viewport to `390x844`.

Verify:

- Archive header does not overlap.
- Search and action buttons wrap cleanly.
- Current stack is single-column.
- Shelf grid is usable.
- Ledger rows remain readable or horizontally manageable.
- Detail panel remains usable.

- [ ] **Step 5: Commit any verification fixes**

If fixes were needed:

```bash
git add <changed-files>
git commit -m "fix: resolve quiet luxury archive QA issues"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

Spec coverage:

- Whole-app visual system is covered by Task 2 and limited style reuse.
- Archive full treatment is covered by Tasks 3, 4, 5, and 6.
- Metadata quality signals are covered by Tasks 1 and 3.
- No full review queue is built; Task 3 adds only quiet summary/entry-point presentation.
- Add/edit/import/export behavior is preserved and verified in Task 7.
- Room renaming is not included.

Unresolved-language scan:

- No unresolved planning markers remain.
- Code snippets define all new helpers and components referenced by later steps.

Type consistency:

- `QualityTone`, `ArchiveQualitySummary`, `getArchiveQualitySummary`, `getBookQualityState`, and `metadataQualityLabel` are introduced in Task 1 and reused consistently.
- `BookCard` variants are introduced as `'default' | 'archiveShelf' | 'archiveFeature'` and referenced from Archive only.
