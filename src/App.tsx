import { useState, useEffect, useMemo, useRef } from 'react';
import type { Book, Status, Genre, AppData } from './types';
import { SEED_BOOKS } from './data/seedBooks';
import { RECOMMENDATIONS } from './data/recommendations';
import type { Recommendation } from './data/recommendations';
import { fetchCoverUrl } from './utils/cover';
import BookCard from './components/BookCard';
import DetailPanel from './components/DetailPanel';
import BookForm from './components/BookForm';
import StatsDashboard from './components/StatsDashboard';
import RecommendationsView from './components/RecommendationsView';
import Sidebar from './components/Sidebar';

type View = 'library' | 'recs' | 'stats';
type FilterStatus = Status | 'All';

const STORAGE_KEY = 'bookshelf_data';

function loadData(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: AppData = JSON.parse(raw);
      if (parsed.books && parsed.books.length > 0) return parsed.books;
    }
  } catch {}
  return SEED_BOOKS;
}

function saveData(books: Book[]) {
  const data: AppData = { books, lastExported: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function App() {
  const [books, setBooks] = useState<Book[]>(loadData);
  const [view, setView] = useState<View>('library');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [filterGenre, setFilterGenre] = useState<Genre | 'All'>('All');
  const [filterFormat, setFilterFormat] = useState<string>('All');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null | 'new'>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveData(books); }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      if (filterStatus !== 'All' && b.status !== filterStatus) return false;
      if (filterGenre !== 'All' && !b.genres.includes(filterGenre)) return false;
      if (filterFormat !== 'All' && b.format !== filterFormat) return false;
      if (filterRating > 0 && (b.rating ?? 0) < filterRating) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!b.title.toLowerCase().includes(q) && !b.author.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [books, filterStatus, filterGenre, filterFormat, filterRating, search]);

  const currentlyReading = books.find(b => b.status === 'Reading');

  function addOrUpdateBook(book: Book) {
    setBooks(prev => {
      const idx = prev.findIndex(b => b.id === book.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = book; return next; }
      return [...prev, book];
    });
    setEditingBook(null);
    setSelectedBook(book);
  }

  function deleteBook(id: string) {
    setBooks(prev => prev.filter(b => b.id !== id));
    setSelectedBook(null);
  }

  function exportData() {
    const data: AppData = { books, lastExported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `bookshelf-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed: AppData = JSON.parse(ev.target?.result as string);
        if (parsed.books) setBooks(parsed.books);
      } catch { alert("Could not read file."); }
    };
    reader.readAsText(file); e.target.value = '';
  }

  function addToWantToRead(rec: Recommendation) {
    const newBook: Book = {
      id: Date.now().toString(), title: rec.title, author: rec.author,
      status: 'Want to Read', genres: rec.genres as Genre[], tropes: rec.tropes,
      pageCount: rec.pages, seriesType: 'Standalone',
    };
    setBooks(prev => [...prev, newBook]);
  }

  const counts = {
    all: books.length,
    completed: books.filter(b => b.status === 'Completed').length,
    reading: books.filter(b => b.status === 'Reading').length,
    wantToRead: books.filter(b => b.status === 'Want to Read').length,
    dnf: books.filter(b => b.status === 'DNF').length,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0C0F', color: '#F0EAE0', fontFamily: "'DM Sans',sans-serif" }}>
      <Sidebar view={view} onViewChange={setView} counts={counts} currentlyReading={currentlyReading}
        filterStatus={filterStatus} onFilterStatus={(s: FilterStatus) => { setFilterStatus(s); setView('library'); }} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {view === 'library' && (
          <LibraryView
            books={filteredBooks} allBooks={books} search={search} onSearch={setSearch}
            filterGenre={filterGenre} onFilterGenre={setFilterGenre}
            filterFormat={filterFormat} onFilterFormat={setFilterFormat}
            filterRating={filterRating} onFilterRating={setFilterRating}
            filterStatus={filterStatus} onFilterStatus={(s: FilterStatus) => setFilterStatus(s)}
            onSelectBook={setSelectedBook} onAddBook={() => setEditingBook('new')}
            onExport={exportData} onImport={() => fileInputRef.current?.click()}
            currentlyReading={currentlyReading}
          />
        )}
        {view === 'recs' && <RecommendationsView recommendations={RECOMMENDATIONS} books={books} onAddToList={addToWantToRead} />}
        {view === 'stats' && <StatsDashboard books={books} />}
      </main>

      {selectedBook && !editingBook && (
        <DetailPanel book={selectedBook} onClose={() => setSelectedBook(null)}
          onEdit={() => setEditingBook(selectedBook)} onDelete={() => deleteBook(selectedBook.id)} />
      )}

      {editingBook && (
        <BookForm book={editingBook === 'new' ? null : editingBook as Book}
          onSave={addOrUpdateBook} onClose={() => setEditingBook(null)} />
      )}

      <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importData} />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 500,
        cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0, userSelect: 'none' as const,
        border: active ? '1px solid rgba(232,168,56,0.45)' : '1px solid rgba(240,234,224,0.14)',
        background: active ? 'linear-gradient(135deg,rgba(232,168,56,0.22),rgba(232,168,56,0.10))'
          : hover ? 'rgba(240,234,224,0.09)' : 'rgba(240,234,224,0.05)',
        color: active ? '#F5CC7A' : hover ? '#F0EAE0' : 'rgba(240,234,224,0.6)',
        transition: 'all 0.12s',
      }}>
      {label}
    </div>
  );
}

export function GenreTag({ genre }: { genre: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Fantasy:       { bg: 'rgba(169,142,224,0.16)', color: '#A98EE0' },
    Romance:       { bg: 'rgba(224,120,120,0.16)', color: '#F0A0A0' },
    'Sci-Fi':      { bg: 'rgba(122,174,232,0.16)', color: '#7AAEE8' },
    Fiction:       { bg: 'rgba(232,168,56,0.15)',  color: '#F5CC7A' },
    'Non-Fiction': { bg: 'rgba(255,255,255,0.07)', color: 'rgba(240,234,224,0.55)' },
    Biography:     { bg: 'rgba(200,150,90,0.16)',  color: '#E8C090' },
    Mystery:       { bg: 'rgba(150,180,150,0.16)', color: '#A0D0A0' },
    Western:       { bg: 'rgba(180,140,80,0.16)',  color: '#D4B08A' },
    War:           { bg: 'rgba(180,100,100,0.16)', color: '#D09090' },
    'Young Adult': { bg: 'rgba(100,180,200,0.16)', color: '#80C8D8' },
    Thriller:      { bg: 'rgba(120,100,180,0.16)', color: '#A090C8' },
    Historical:    { bg: 'rgba(160,130,80,0.16)',  color: '#C8A870' },
  };
  const s = map[genre] || { bg: 'rgba(255,255,255,0.07)', color: 'rgba(240,234,224,0.55)' };
  return <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: s.bg, color: s.color, whiteSpace: 'nowrap' as const }}>{genre}</span>;
}

export function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return <span style={{ fontSize: size, color: '#E8A838', letterSpacing: -0.5 }}>{'★'.repeat(full)}{half ? '½' : ''}</span>;
}

// ─── Library View ─────────────────────────────────────────────────────────────
function LibraryView({ books, search, onSearch, filterGenre, onFilterGenre, filterFormat, onFilterFormat,
  filterRating, onFilterRating, filterStatus, onSelectBook, onAddBook, onExport, onImport, currentlyReading }: any) {
  const completed  = books.filter((b: Book) => b.status === 'Completed');
  const wantToRead = books.filter((b: Book) => b.status === 'Want to Read');
  const dnf        = books.filter((b: Book) => b.status === 'DNF');
  const reading    = books.filter((b: Book) => b.status === 'Reading');
  const allGenres: Genre[] = ['Fantasy','Romance','Sci-Fi','Fiction','Non-Fiction','Biography','Mystery','Western','War','Young Adult','Thriller','Historical'];
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = (filterGenre !== 'All' ? 1 : 0) + (filterFormat !== 'All' ? 1 : 0) + (filterRating > 0 ? 1 : 0);

  function clearFilters() {
    onFilterGenre('All');
    onFilterFormat('All');
    onFilterRating(0);
  }

  return (
    <>
      <div style={S.topbar}>
        <span style={S.pageTitle}>My Library</span>
        <div style={S.topbarRight}>
          <div style={{ position: 'relative' }}>
            <span style={S.searchIcon}>🔍</span>
            <input style={S.searchInput} placeholder="Search books, authors..." value={search} onChange={e => onSearch(e.target.value)} />
          </div>
          {/* Filter button with popover */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setFilterOpen(o => !o)}
              style={{
                ...S.btnGhost,
                border: activeFilterCount > 0 ? '1px solid rgba(232,168,56,0.45)' : S.btnGhost.border,
                color: activeFilterCount > 0 ? '#F5CC7A' : (S.btnGhost as any).color,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 13 }}>⊞</span>
              Filters
              {activeFilterCount > 0 && (
                <span style={{ background: 'linear-gradient(135deg,#F2BC45,#C88820)', color: '#0D0C0F', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>{activeFilterCount}</span>
              )}
            </button>
            {filterOpen && (
              <>
                {/* Backdrop */}
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setFilterOpen(false)} />
                {/* Popover */}
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                  background: '#1C1921', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', padding: '18px 20px',
                  width: 320, animation: 'fadeDown 0.15s ease',
                }}>
                  <style>{`@keyframes fadeDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }`}</style>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(240,234,224,0.45)' }}>Filters</span>
                    {activeFilterCount > 0 && (
                      <span onClick={clearFilters} style={{ fontSize: 11, color: '#F5CC7A', cursor: 'pointer', opacity: 0.8 }}>Clear all</span>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={S.filterLabel}>Genre</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      <FilterChip label="All" active={filterGenre === 'All'} onClick={() => onFilterGenre('All')} />
                      {allGenres.map(g => <FilterChip key={g} label={g} active={filterGenre === g} onClick={() => onFilterGenre(g)} />)}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={S.filterLabel}>Format</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {['All','eBook','Audio Book','Print'].map(f =>
                        <FilterChip key={f} label={f === 'All' ? 'All Formats' : f} active={filterFormat === f} onClick={() => onFilterFormat(f)} />
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={S.filterLabel}>Minimum Rating</div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <FilterChip label="Any" active={filterRating === 0} onClick={() => onFilterRating(0)} />
                      <FilterChip label="★ 3+" active={filterRating === 3} onClick={() => onFilterRating(filterRating === 3 ? 0 : 3)} />
                      <FilterChip label="★ 4+" active={filterRating === 4} onClick={() => onFilterRating(filterRating === 4 ? 0 : 4)} />
                      <FilterChip label="★ 5" active={filterRating === 5} onClick={() => onFilterRating(filterRating === 5 ? 0 : 5)} />
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

      {/* Active filter pills row — only shown when filters are active */}
      {activeFilterCount > 0 && (
        <div style={{ ...S.filterBar, height: 'auto', padding: '8px 32px', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(240,234,224,0.35)', marginRight: 4 }}>Active:</span>
          {filterGenre !== 'All' && <FilterChip label={filterGenre} active onClick={() => onFilterGenre('All')} />}
          {filterFormat !== 'All' && <FilterChip label={filterFormat} active onClick={() => onFilterFormat('All')} />}
          {filterRating > 0 && <FilterChip label={`★ ${filterRating}+`} active onClick={() => onFilterRating(0)} />}
        </div>
      )}

      <div style={S.content}>
        {currentlyReading && (filterStatus === 'All' || filterStatus === 'Reading') && (
          <NowReadingHero book={currentlyReading} onClick={() => onSelectBook(currentlyReading)} />
        )}
        {reading.length > 0 && filterStatus === 'All' && null}
        {completed.length > 0  && <><SectionHeader title="Completed"     count={completed.length}  /><BookGrid books={completed}  onSelect={onSelectBook} /></>}
        {wantToRead.length > 0 && <><SectionHeader title="Want to Read"  count={wantToRead.length} /><BookGrid books={wantToRead} onSelect={onSelectBook} /></>}
        {dnf.length > 0        && <><SectionHeader title="Did Not Finish" count={dnf.length}        /><BookGrid books={dnf}        onSelect={onSelectBook} /></>}
        {books.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(240,234,224,0.3)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <div>No books found</div>
          </div>
        )}
      </div>
    </>
  );
}

function NowReadingHero({ book, onClick }: { book: Book; onClick: () => void }) {
  const [cover, setCover] = useState<string | null>(book.coverUrl || null);
  useEffect(() => {
    if (!cover) {
      fetchCoverUrl(book.title, book.author).then(url => { if (url) setCover(url); });
    }
  }, []);
  return (
    <div style={S.nowHero} onClick={onClick}>
      <div style={S.nowHeroCover}>
        {cover ? <img src={cover} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }} /> : <div style={S.coverPh}>📖</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize:9,letterSpacing:2,textTransform:'uppercase',color:'#E8A838',fontWeight:700,marginBottom:5 }}>Now Reading</div>
        <div style={{ fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#F0EAE0',marginBottom:2,lineHeight:1.25 }}>{book.title}</div>
        <div style={{ fontSize:13,color:'rgba(240,234,224,0.55)',marginBottom:10 }}>{book.author}</div>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ flex:1,maxWidth:200,height:4,background:'rgba(255,255,255,0.08)',borderRadius:2,overflow:'hidden' }}>
            {(() => {
              const pct = (book.pagesRead && book.pageCount) ? Math.min(100, Math.round((book.pagesRead / book.pageCount) * 100)) : null;
              return <div style={{ height:'100%', width: pct !== null ? `${pct}%` : '0%', background:'linear-gradient(90deg,#B07820,#E8A838)', borderRadius:2 }} />;
            })()}
          </div>
          <span style={{ fontSize:11,color:'rgba(240,234,224,0.4)' }}>
            {(book.pagesRead && book.pageCount) ? `${Math.min(100, Math.round((book.pagesRead / book.pageCount) * 100))}%` : 'In progress'}
          </span>
        </div>
      </div>
      <div style={{ display:'flex',gap:6,alignItems:'center',flexShrink:0 }}>
        {book.genres.slice(0,2).map(g => <GenreTag key={g} genre={g} />)}
        {book.rating ? <StarRating rating={book.rating} /> : null}
      </div>
    </div>
  );
}

function BookGrid({ books, onSelect }: { books: Book[]; onSelect: (b: Book) => void }) {
  return <div style={S.bookGrid}>{books.map(b => <BookCard key={b.id} book={b} onClick={() => onSelect(b)} />)}</div>;
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{ display:'flex',alignItems:'baseline',gap:10,marginBottom:16 }}>
      <span style={{ fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:'#F0EAE0' }}>{title}</span>
      {count !== undefined && <span style={{ fontSize:12,color:'rgba(240,234,224,0.45)' }}>{count} books</span>}
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
export const S = {
  topbar: { background:'linear-gradient(180deg,#17141E 0%,#141218 100%)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 32px', display:'flex' as const, alignItems:'center' as const, height:66, gap:14, flexShrink:0 },
  pageTitle: { fontFamily:"'Playfair Display',serif", fontSize:21, fontWeight:700, color:'#F0EAE0' },
  topbarRight: { marginLeft:'auto', display:'flex' as const, gap:10, alignItems:'center' as const },
  searchIcon: { position:'absolute' as const, left:11, top:'50%', transform:'translateY(-50%)', fontSize:13, pointerEvents:'none' as const, opacity:0.35 },
  searchInput: { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, padding:'7px 12px 7px 34px', fontSize:13, fontFamily:"'DM Sans',sans-serif", color:'#F0EAE0', width:215, outline:'none' },
  btnPrimary: { padding:'8px 18px', borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:'pointer', border:'1px solid rgba(255,200,80,0.5)', fontWeight:600, background:'linear-gradient(160deg,#F2BC45 0%,#CC8E1E 100%)', color:'#0D0C0F', boxShadow:'0 2px 0 rgba(0,0,0,0.3),0 4px 14px rgba(232,168,56,0.4)' },
  btnGhost: { padding:'8px 16px', borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:'pointer', border:'1px solid rgba(240,234,224,0.18)', fontWeight:500, background:'rgba(240,234,224,0.07)', color:'rgba(240,234,224,0.75)' },
  filterBar: { padding:'0 32px', display:'flex' as const, gap:6, alignItems:'center' as const, background:'linear-gradient(180deg,#151319 0%,#121018 100%)', borderBottom:'1px solid rgba(255,255,255,0.05)', height:46, flexShrink:0, overflowX:'auto' as const },
  filterSep: { width:1, height:18, background:'rgba(255,255,255,0.10)', margin:'0 4px', flexShrink:0 },
  filterLabel: { fontSize:10, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'0.8px', color:'rgba(240,234,224,0.35)', marginBottom:8 },
  content: { padding:'28px 32px', flex:1, overflowY:'auto' as const },
  bookGrid: { display:'grid' as const, gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))', gap:16, marginBottom:36 },
  nowHero: { background:'linear-gradient(135deg,#1C1921 0%,#17141E 100%)', border:'1px solid rgba(232,168,56,0.22)', borderRadius:10, padding:'18px 22px', display:'flex' as const, gap:20, alignItems:'center' as const, marginBottom:32, cursor:'pointer', boxShadow:'0 0 0 1px rgba(232,168,56,0.08),0 8px 32px rgba(0,0,0,0.35)' },
  nowHeroCover: { width:62, flexShrink:0, aspectRatio:'2/3' as const, borderRadius:6, overflow:'hidden', boxShadow:'3px 5px 18px rgba(0,0,0,0.55)', border:'1px solid rgba(255,255,255,0.10)' },
  coverPh: { width:'100%', height:'100%', background:'linear-gradient(160deg,#302B3E,#1C1921)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, opacity:0.5 },
};
