import { useState } from 'react';
import type { Book, Format, Genre, Status } from '../../types';
import BookCard from '../BookCard';
import { S } from '../sharedStyles';
import { FilterChip } from '../sharedUi';

type FilterStatus = Status | 'All';

interface ArchiveRoomProps {
  books: Book[];
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
  const completed = books.filter(book => book.status === 'Completed');
  const wantToRead = books.filter(book => book.status === 'Want to Read');
  const dnf = books.filter(book => book.status === 'DNF');
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilterCount = (filterGenre !== 'All' ? 1 : 0) + (filterFormat !== 'All' ? 1 : 0) + (filterRating > 0 ? 1 : 0) + (filterStatus !== 'All' ? 1 : 0);

  function clearFilters() {
    onFilterGenre('All');
    onFilterFormat('All');
    onFilterRating(0);
    onFilterStatus('All');
  }

  return (
    <>
      <div className="room-topbar" style={S.topbar}>
        <span style={S.pageTitle}>Archive</span>
        <div className="room-topbar-actions" style={S.topbarRight}>
          <div style={{ position: 'relative' }}>
            <span style={S.searchIcon}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input style={S.searchInput} placeholder="Search books, authors..." value={search} onChange={event => onSearch(event.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setFilterOpen(open => !open)} style={{ ...S.btnGhost, border: activeFilterCount > 0 ? '1px solid rgba(0,98,65,0.4)' : S.btnGhost.border, color: activeFilterCount > 0 ? '#006241' : S.btnGhost.color, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filters
              {activeFilterCount > 0 && <span style={{ background: '#006241', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>{activeFilterCount}</span>}
            </button>
            {filterOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setFilterOpen(false)} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, background: '#FFFFFF', borderRadius: 12, boxShadow: '0 16px 48px rgba(27,28,25,0.14)', padding: '18px 20px', width: 320 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B6B6B' }}>Filters</span>
                    {activeFilterCount > 0 && <button onClick={clearFilters} style={{ fontSize: 11, color: '#006241', cursor: 'pointer', border: 'none', background: 'transparent', padding: 0 }}>Clear all</button>}
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
            )}
          </div>
          <button style={S.btnPrimary} onClick={onAddBook}>+ Add Book</button>
          <button style={S.btnGhost} onClick={onExport}>Export</button>
          <button style={S.btnGhost} onClick={onImport}>Import</button>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div style={{ padding: '8px 32px', display: 'flex', gap: 6, alignItems: 'center', borderBottom: 'none', background: '#F1F1ED', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#6B6B6B', marginRight: 4 }}>Active:</span>
          {filterStatus !== 'All' && <FilterChip label={filterStatus} active onClick={() => onFilterStatus('All')} />}
          {filterGenre !== 'All' && <FilterChip label={filterGenre} active onClick={() => onFilterGenre('All')} />}
          {filterFormat !== 'All' && <FilterChip label={filterFormat} active onClick={() => onFilterFormat('All')} />}
          {filterRating > 0 && <FilterChip label={`${filterRating}+`} active onClick={() => onFilterRating(0)} />}
          <button onClick={clearFilters} style={{ marginLeft: 4, fontSize: 11, color: '#006241', cursor: 'pointer', border: 'none', background: 'transparent' }}>Clear all</button>
        </div>
      )}

      <div style={S.content}>
        {reading.length > 0 && <><SectionHeader title="Currently Reading" count={reading.length} sub /><BookGrid books={reading} onSelect={onSelectBook} /></>}
        {completed.length > 0 && <><SectionHeader title="Completed" count={completed.length} sub /><BookGrid books={completed} onSelect={onSelectBook} /></>}
        {wantToRead.length > 0 && <><SectionHeader title="Want to Read" count={wantToRead.length} sub /><BookGrid books={wantToRead} onSelect={onSelectBook} /></>}
        {dnf.length > 0 && <><SectionHeader title="Did Not Finish" count={dnf.length} sub /><BookGrid books={dnf} onSelect={onSelectBook} /></>}
        {books.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B6B6B' }}>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 18 }}>No books found</div>
          </div>
        )}
      </div>
    </>
  );
}

function BookGrid({ books, onSelect }: { books: Book[]; onSelect: (book: Book) => void }) {
  return <div style={S.bookGrid}>{books.map(book => <BookCard key={book.id} book={book} onClick={() => onSelect(book)} />)}</div>;
}

function SectionHeader({ title, count, sub }: { title: string; count?: number; sub?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: sub ? 14 : 20, marginTop: sub ? 28 : 0 }}>
      <span style={{ fontFamily: "'Newsreader', serif", fontSize: sub ? 15 : 18, fontWeight: 600, color: '#2D2D2D', fontStyle: sub ? 'normal' : 'italic' }}>{title}</span>
      {count !== undefined && <span style={{ fontSize: 12, color: '#6B6B6B' }}>{count} books</span>}
    </div>
  );
}
