import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Book, Format, Genre, Status } from '../../types';
import BookCard from '../BookCard';
import { S } from '../sharedStyles';
import { FilterChip } from '../sharedUi';
import { getArchiveQualitySummary, getBookQualityState } from './archiveQuality';
import type { ArchiveQualitySummary } from './archiveQuality';
import { archiveStyles, archiveTone, qualityToneStyle } from './archiveStyles';

type FilterStatus = Status | 'All';

interface ArchiveRoomProps {
  books: Book[];
  allBooks: Book[];
  search: string;
  onSearch: (search: string) => void;
  filterGenre: Genre | 'All';
  onFilterGenre: (genre: Genre | 'All') => void;
  filterFormat: Format | 'All';
  onFilterFormat: (format: Format | 'All') => void;
  filterRating: number;
  onFilterRating: (rating: number) => void;
  filterStatus: FilterStatus;
  onFilterStatus: (status: FilterStatus) => void;
  onSelectBook: (book: Book) => void;
  onAddBook: () => void;
  onExport: () => void;
  onImport: () => void;
}

const allGenres: Genre[] = ['Fantasy','Romance','Sci-Fi','Fiction','Non-Fiction','Biography','Mystery','Western','War','Young Adult','Thriller','Historical'];
const allFormats: Array<Format | 'All'> = ['All','eBook','Audio Book','Print','Book & Audio'];

export default function ArchiveRoom({
  books,
  allBooks,
  search,
  onSearch,
  filterGenre,
  onFilterGenre,
  filterFormat,
  onFilterFormat,
  filterRating,
  onFilterRating,
  filterStatus,
  onFilterStatus,
  onSelectBook,
  onAddBook,
  onExport,
  onImport,
}: ArchiveRoomProps) {
  const reading = books.filter(book => book.status === 'Reading');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'covers' | 'ledger'>('covers');
  const qualitySummary = getArchiveQualitySummary(allBooks);
  const activeFilterCount = (filterGenre !== 'All' ? 1 : 0) + (filterFormat !== 'All' ? 1 : 0) + (filterRating > 0 ? 1 : 0) + (filterStatus !== 'All' ? 1 : 0);

  function clearFilters() {
    onFilterGenre('All');
    onFilterFormat('All');
    onFilterRating(0);
    onFilterStatus('All');
  }

  return (
    <div className="archive-room" style={archiveStyles.room}>
      <header className="archive-header" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 24, alignItems: 'end', marginBottom: 24 }}>
        <div>
          <div style={{ ...archiveStyles.eyebrow, marginBottom: 12 }}>Archive</div>
          <h1 style={archiveStyles.title}>Library</h1>
          <p style={{ maxWidth: 620, margin: '18px 0 0', color: archiveTone.muted, fontSize: 15, lineHeight: 1.7 }}>
            A quieter catalogue for the books you kept, the books still moving through you, and the records that deserve care.
          </p>
        </div>
        <div className="archive-stat-strip" style={{ ...archiveStyles.surface, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(86px, 1fr))', gap: 1, overflow: 'hidden', minWidth: 340 }}>
          <ArchiveStat label="Books" value={books.length} />
          <ArchiveStat label="Reading" value={reading.length} />
          <ArchiveStat label="Care" value={qualitySummary.needsCare} />
        </div>
      </header>

      <div className="archive-controls" style={{ ...archiveStyles.surface, display: 'flex', gap: 10, alignItems: 'center', padding: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 220 }}>
          <span style={S.searchIcon}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input style={{ ...S.searchInput, width: '100%', background: 'rgba(255,253,250,0.74)', borderColor: archiveTone.border }} placeholder="Search books, authors..." value={search} onChange={event => onSearch(event.target.value)} />
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setFilterOpen(open => !open)} style={{ ...S.btnGhost, ...archiveStyles.pillButton, border: activeFilterCount > 0 ? '1px solid rgba(12,85,61,0.34)' : `1px solid ${archiveTone.border}`, color: activeFilterCount > 0 ? archiveTone.green : archiveTone.muted, background: 'rgba(255,253,250,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filters
            {activeFilterCount > 0 && <span style={{ background: archiveTone.green, color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>{activeFilterCount}</span>}
          </button>
          {filterOpen && (
            <ArchiveFilterPopover
              activeFilterCount={activeFilterCount}
              clearFilters={clearFilters}
              filterGenre={filterGenre}
              filterFormat={filterFormat}
              filterRating={filterRating}
              onClose={() => setFilterOpen(false)}
              onFilterGenre={onFilterGenre}
              onFilterFormat={onFilterFormat}
              onFilterRating={onFilterRating}
            />
          )}
        </div>
        <button style={{ ...S.btnGhost, ...archiveStyles.pillButton, border: `1px solid ${archiveTone.border}`, background: 'rgba(255,253,250,0.7)', color: archiveTone.muted }} onClick={onImport}>Import</button>
        <button style={{ ...S.btnGhost, ...archiveStyles.pillButton, border: `1px solid ${archiveTone.border}`, background: 'rgba(255,253,250,0.7)', color: archiveTone.muted }} onClick={onExport}>Export</button>
        <button style={{ ...S.btnPrimary, ...archiveStyles.pillButton, border: `1px solid ${archiveTone.green}`, background: archiveTone.green }} onClick={onAddBook}>+ Add Book</button>
      </div>

      {activeFilterCount > 0 && (
        <div style={{ padding: '4px 2px 18px', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: archiveTone.faint, marginRight: 4 }}>Active:</span>
          {filterStatus !== 'All' && <FilterChip label={filterStatus} active onClick={() => onFilterStatus('All')} />}
          {filterGenre !== 'All' && <FilterChip label={filterGenre} active onClick={() => onFilterGenre('All')} />}
          {filterFormat !== 'All' && <FilterChip label={filterFormat} active onClick={() => onFilterFormat('All')} />}
          {filterRating > 0 && <FilterChip label={`${filterRating}+`} active onClick={() => onFilterRating(0)} />}
          <button onClick={clearFilters} style={{ marginLeft: 4, fontSize: 11, color: archiveTone.green, cursor: 'pointer', border: 'none', background: 'transparent' }}>Clear all</button>
        </div>
      )}

      <div className="archive-main-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 22, alignItems: 'start' }}>
        <main style={{ display: 'grid', gap: 22 }}>
          {reading.length > 0 && (
            <section style={{ ...archiveStyles.surface, padding: 22 }}>
              <ArchiveSectionHeader title="Current stack" count={reading.length} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
                {reading.slice(0, 3).map(book => <ArchiveBookCard key={book.id} book={book} onClick={() => onSelectBook(book)} variant="archiveFeature" />)}
              </div>
            </section>
          )}

          <section style={{ ...archiveStyles.surface, padding: 22 }}>
            <ArchiveSectionHeader
              title="Shelf"
              count={books.length}
              action={(
                <div style={{ display: 'flex', gap: 4, padding: 3, border: `1px solid ${archiveTone.border}`, borderRadius: 999, background: 'rgba(240,238,232,0.72)' }}>
                  <button aria-pressed={viewMode === 'covers'} style={viewToggleStyle(viewMode === 'covers')} onClick={() => setViewMode('covers')}>Covers</button>
                  <button aria-pressed={viewMode === 'ledger'} style={viewToggleStyle(viewMode === 'ledger')} onClick={() => setViewMode('ledger')}>Ledger</button>
                </div>
              )}
            />
            {viewMode === 'covers' ? <ArchiveShelf books={books} onSelect={onSelectBook} /> : <ArchiveLedger books={books} onSelect={onSelectBook} />}
          </section>
        </main>
        <ArchiveCarePanel qualitySummary={qualitySummary} />
      </div>
    </div>
  );
}

type ArchiveBookCardProps = Parameters<typeof BookCard>[0] & {
  variant?: 'archiveFeature' | 'archiveShelf';
};

const ArchiveBookCard = BookCard as (props: ArchiveBookCardProps) => ReturnType<typeof BookCard>;

function ArchiveStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: '16px 18px', borderLeft: `1px solid ${archiveTone.border}`, background: 'rgba(255,253,250,0.54)' }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.8, color: archiveTone.faint, fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 6, fontFamily: "'Newsreader', Georgia, serif", fontSize: 30, lineHeight: 1, color: archiveTone.ink }}>{value}</div>
    </div>
  );
}

function ArchiveFilterPopover({
  activeFilterCount,
  clearFilters,
  filterGenre,
  filterFormat,
  filterRating,
  onClose,
  onFilterGenre,
  onFilterFormat,
  onFilterRating,
}: {
  activeFilterCount: number;
  clearFilters: () => void;
  filterGenre: Genre | 'All';
  filterFormat: Format | 'All';
  filterRating: number;
  onClose: () => void;
  onFilterGenre: (genre: Genre | 'All') => void;
  onFilterFormat: (format: Format | 'All') => void;
  onFilterRating: (rating: number) => void;
}) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={onClose} />
      <div className="archive-filter-popover" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, background: archiveTone.surface, border: `1px solid ${archiveTone.border}`, borderRadius: 16, boxShadow: '0 18px 46px rgba(44,36,24,0.14)', padding: '18px 20px', width: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: archiveTone.faint }}>Filters</span>
          {activeFilterCount > 0 && <button onClick={clearFilters} style={{ fontSize: 11, color: archiveTone.green, cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }}>Clear all</button>}
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

function ArchiveSectionHeader({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 24, fontWeight: 500, color: archiveTone.ink }}>{title}</span>
        {count !== undefined && <span style={{ fontSize: 12, color: archiveTone.faint }}>{count} books</span>}
      </div>
      {action}
    </div>
  );
}

function viewToggleStyle(active: boolean): CSSProperties {
  return {
    border: 'none',
    borderRadius: 999,
    background: active ? archiveTone.surface : 'transparent',
    color: active ? archiveTone.ink : archiveTone.faint,
    boxShadow: active ? '0 4px 14px rgba(44,36,24,0.08)' : 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    padding: '7px 13px',
  };
}

function ArchiveShelf({ books, onSelect }: { books: Book[]; onSelect: (book: Book) => void }) {
  if (books.length === 0) return <ArchiveEmptyState />;

  return (
    <div className="archive-shelf-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(142px, 1fr))', gap: 16 }}>
      {books.map(book => <ArchiveBookCard key={book.id} book={book} onClick={() => onSelect(book)} variant="archiveShelf" />)}
    </div>
  );
}

function ArchiveLedger({ books, onSelect }: { books: Book[]; onSelect: (book: Book) => void }) {
  if (books.length === 0) return <ArchiveEmptyState />;

  return (
    <div className="archive-ledger-list" style={{ display: 'grid', gap: 6 }}>
      {books.map(book => (
        <button className="archive-ledger-row" key={book.id} onClick={() => onSelect(book)} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) 110px 112px 76px', gap: 12, alignItems: 'center', width: '100%', padding: '12px 14px', border: `1px solid ${archiveTone.border}`, borderRadius: 14, background: 'rgba(255,253,250,0.62)', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', color: archiveTone.ink, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</span>
            <span style={{ display: 'block', color: archiveTone.faint, fontSize: 12, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author}</span>
          </span>
          <span style={{ color: archiveTone.muted, fontSize: 12 }}>{book.status}</span>
          <QualityBadge book={book} />
          <span style={{ color: archiveTone.muted, fontSize: 12, textAlign: 'right' }}>{book.rating ? `${book.rating}/5` : 'Unrated'}</span>
        </button>
      ))}
    </div>
  );
}

function QualityBadge({ book }: { book: Book }) {
  const quality = getBookQualityState(book);

  return (
    <span style={{ ...qualityToneStyle[quality.tone], justifySelf: 'start', border: '1px solid', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '4px 9px', whiteSpace: 'nowrap' }}>
      {quality.label}
    </span>
  );
}

function ArchiveCarePanel({ qualitySummary }: { qualitySummary: ArchiveQualitySummary }) {
  return (
    <aside style={{ ...archiveStyles.surface, padding: 20, position: 'sticky', top: 24 }}>
      <ArchiveSectionHeader title="Archive care" />
      <div style={{ display: 'grid', gap: 10 }}>
        <CareRow label="Needs care" value={qualitySummary.needsCare} tone="care" />
        <CareRow label="Missing cover" value={qualitySummary.missingCover} tone="care" />
        <CareRow label="Manual" value={qualitySummary.manual} tone="manual" />
        <CareRow label="Candidate" value={qualitySummary.candidate} tone="candidate" />
      </div>
    </aside>
  );
}

function CareRow({ label, value, tone }: { label: string; value: number; tone: keyof typeof qualityToneStyle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: `1px solid ${archiveTone.border}` }}>
      <span style={{ color: archiveTone.muted, fontSize: 13 }}>{label}</span>
      <span style={{ ...qualityToneStyle[tone], minWidth: 34, textAlign: 'center', border: '1px solid', borderRadius: 999, fontSize: 12, fontWeight: 700, padding: '4px 8px' }}>{value}</span>
    </div>
  );
}

function ArchiveEmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '70px 0', color: archiveTone.faint }}>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 20 }}>No books found</div>
    </div>
  );
}
