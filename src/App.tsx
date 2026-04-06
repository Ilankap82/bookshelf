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

type View = 'home' | 'library' | 'discovery' | 'stats';
type FilterStatus = Status | 'All';

const STORAGE_KEY = 'bookshelf_data';
const USER_KEY = 'bookshelf_user';

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
  color: string;
}

function loadUser(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: 'Reader', role: 'Lead Curator', initials: 'R', color: '#006241' };
}

function saveUser(u: UserProfile) {
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}

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
  const [view, setView] = useState<View>('home');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [filterGenre, setFilterGenre] = useState<Genre | 'All'>('All');
  const [filterFormat, setFilterFormat] = useState<string>('All');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null | 'new'>(null);
  const [user, setUser] = useState<UserProfile>(loadUser);
  const [editingUser, setEditingUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateUser(u: UserProfile) {
    setUser(u);
    saveUser(u);
    setEditingUser(false);
  }

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

  const currentlyReading = books.filter(b => b.status === 'Reading');

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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FAF9F4', color: '#2D2D2D', fontFamily: "'Manrope', sans-serif" }}>
      <Sidebar
        view={view}
        onViewChange={(v: string) => setView(v as View)}
        counts={counts}
        currentlyReading={currentlyReading[0] || null}
        filterStatus={filterStatus}
        onFilterStatus={(s: FilterStatus) => { setFilterStatus(s); setView('library'); }}
        onAddBook={() => setEditingBook('new')}
        user={user}
        onEditUser={() => setEditingUser(true)}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {view === 'home' && (
          <HomeView
            books={filteredBooks}
            allBooks={books}
            currentlyReading={currentlyReading}
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
            user={user}
          />
        )}
        {view === 'library' && (
          <LibraryView
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
            currentlyReading={currentlyReading[0] || null}
            user={user}
          />
        )}
        {view === 'discovery' && <RecommendationsView recommendations={RECOMMENDATIONS} books={books} onAddToList={addToWantToRead} />}
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

      {editingUser && (
        <UserEditModal user={user} onSave={updateUser} onClose={() => setEditingUser(false)} />
      )}
    </div>
  );
}

// ─── User Edit Modal ──────────────────────────────────────────────────────────
function UserEditModal({ user, onSave, onClose }: { user: UserProfile; onSave: (u: UserProfile) => void; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const AVATAR_COLORS = ['#006241','#7C3AED','#DB2777','#2563EB','#B45309','#0E7490'];

  const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'R';

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), role: role.trim() || 'Lead Curator', initials, color: user.color });
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(27,28,25,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'#FAF9F4', borderRadius:16, padding:'32px 36px', width:400, boxShadow:'0 24px 60px rgba(27,28,25,0.18)' }}>
        <div style={{ fontFamily:"'Newsreader',serif", fontStyle:'italic', fontSize:22, fontWeight:600, color:'#2D2D2D', marginBottom:6 }}>Your Profile</div>
        <div style={{ fontSize:13, color:'#6B6B6B', marginBottom:24 }}>Set your name to personalize your archive.</div>

        {/* Avatar preview */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg,${user.color},${user.color}99)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:700, color:'#fff', fontFamily:"'Newsreader',serif", boxShadow:'0 8px 24px rgba(0,98,65,0.25)' }}>
            {initials}
          </div>
        </div>

        {/* Color picker */}
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:24 }}>
          {AVATAR_COLORS.map(c => (
            <div key={c} onClick={() => onSave({ ...user, name, role, initials, color: c })}
              style={{ width:24, height:24, borderRadius:'50%', background:c, cursor:'pointer', border: user.color === c ? '3px solid #2D2D2D' : '3px solid transparent', transition:'border 0.15s' }} />
          ))}
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:1, color:'#6B6B6B', marginBottom:7 }}>Your Name</div>
          <input
            autoFocus
            style={{ width:'100%', background:'#FFFFFF', border:'1px solid rgba(45,45,45,0.18)', borderRadius:8, padding:'10px 14px', fontSize:14, fontFamily:"'Manrope',sans-serif", color:'#2D2D2D', outline:'none', boxSizing:'border-box' as const }}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Julian"
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:1, color:'#6B6B6B', marginBottom:7 }}>Title / Role</div>
          <input
            style={{ width:'100%', background:'#FFFFFF', border:'1px solid rgba(45,45,45,0.18)', borderRadius:8, padding:'10px 14px', fontSize:14, fontFamily:"'Manrope',sans-serif", color:'#2D2D2D', outline:'none', boxSizing:'border-box' as const }}
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="e.g. Lead Curator"
          />
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleSave} style={{ flex:1, padding:'11px 0', borderRadius:8, fontSize:14, fontFamily:"'Manrope',sans-serif", cursor:'pointer', border:'none', fontWeight:600, background:'linear-gradient(160deg,#067D55,#006241)', color:'#FFFFFF', boxShadow:'0 2px 8px rgba(0,98,65,0.25)' }}>
            Save Profile
          </button>
          <button onClick={onClose} style={{ padding:'11px 18px', borderRadius:8, fontSize:13, cursor:'pointer', border:'1px solid rgba(45,45,45,0.18)', background:'transparent', color:'#4B4B4B' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 500,
        cursor: 'pointer', whiteSpace: 'nowrap' as const, flexShrink: 0, userSelect: 'none' as const,
        border: active ? '1px solid rgba(0,98,65,0.35)' : '1px solid rgba(45,45,45,0.14)',
        background: active ? 'rgba(0,98,65,0.10)' : hover ? 'rgba(45,45,45,0.06)' : 'transparent',
        color: active ? '#006241' : hover ? '#2D2D2D' : '#6B6B6B',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </div>
  );
}

export function GenreTag({ genre }: { genre: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Fantasy:       { bg: 'rgba(124,58,237,0.10)',  color: '#6D28D9' },
    Romance:       { bg: 'rgba(219,39,119,0.10)',  color: '#BE185D' },
    'Sci-Fi':      { bg: 'rgba(37,99,235,0.10)',   color: '#1D4ED8' },
    Fiction:       { bg: 'rgba(0,98,65,0.10)',     color: '#006241' },
    'Non-Fiction': { bg: 'rgba(45,45,45,0.08)',    color: '#4B4B4B' },
    Biography:     { bg: 'rgba(180,83,9,0.10)',    color: '#92400E' },
    Mystery:       { bg: 'rgba(5,150,105,0.10)',   color: '#047857' },
    Western:       { bg: 'rgba(120,53,15,0.10)',   color: '#78350F' },
    War:           { bg: 'rgba(127,29,29,0.10)',   color: '#7F1D1D' },
    'Young Adult': { bg: 'rgba(6,182,212,0.10)',   color: '#0E7490' },
    Thriller:      { bg: 'rgba(79,70,229,0.10)',   color: '#4338CA' },
    Historical:    { bg: 'rgba(146,64,14,0.10)',   color: '#92400E' },
  };
  const s = map[genre] || { bg: 'rgba(45,45,45,0.08)', color: '#4B4B4B' };
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: s.bg, color: s.color, whiteSpace: 'nowrap' as const, letterSpacing: '0.2px' }}>
      {genre}
    </span>
  );
}

export function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return <span style={{ fontSize: size, color: '#D97706', letterSpacing: -0.5 }}>{'★'.repeat(full)}{half ? '½' : ''}</span>;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

// ─── Glassmorphic User Cluster ───────────────────────────────────────────────
function UserCluster({ user }: { user: UserProfile }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(250,249,244,0.70)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.55)',
      borderRadius: 20,
      padding: '5px 12px 5px 7px',
      boxShadow: '0 2px 12px rgba(27,28,25,0.07)',
      flexShrink: 0,
    }}>
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: user.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#FFFFFF',
        fontFamily: "'Manrope', sans-serif",
        flexShrink: 0,
      }}>
        {user.initials}
      </div>
      {/* Name */}
      <span style={{ fontSize: 13, fontWeight: 600, color: '#2D2D2D', whiteSpace: 'nowrap' as const }}>
        {user.name.split(' ')[0]}
      </span>
      {/* Tertiary notification dot */}
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#067D55', flexShrink: 0 }} />
    </div>
  );
}

// ─── Home View ────────────────────────────────────────────────────────────────
function HomeView({ books, currentlyReading, search, onSearch, filterGenre, onFilterGenre,
  filterFormat, onFilterFormat, filterRating, onFilterRating, onSelectBook,
  onAddBook, onExport, onImport, user }: any) {
  const allGenres: Genre[] = ['Fantasy','Romance','Sci-Fi','Fiction','Non-Fiction','Biography','Mystery','Western','War','Young Adult','Thriller','Historical'];
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilterCount = (filterGenre !== 'All' ? 1 : 0) + (filterFormat !== 'All' ? 1 : 0) + (filterRating > 0 ? 1 : 0);
  function clearFilters() { onFilterGenre('All'); onFilterFormat('All'); onFilterRating(0); }

  return (
    <>
      {/* Top bar — No-Line Rule: tonal background shift, no border */}
      <div style={S.topbar}>
        {/* display-lg greeting per spec */}
        <div style={{ display: 'flex', flexDirection: 'column' as const }}>
          <span style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic' as const, fontSize: 26, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.15 }}>
            {getGreeting()}{user?.name && user.name !== 'Reader' ? `, ${user.name.split(' ')[0]}` : ''}
          </span>
          <span style={{ fontSize: 12, color: '#8A8A82', marginTop: 2 }}>
            {books.length} books in your archive
          </span>
        </div>
        <div style={S.topbarRight}>
          {/* Pill search */}
          <div style={{ position: 'relative' }}>
            <span style={S.searchIcon}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input style={S.searchInput} placeholder="Search books, authors..." value={search} onChange={e => onSearch(e.target.value)} />
          </div>
          {/* Filters */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setFilterOpen(o => !o)} style={{ ...S.btnGhost, border: activeFilterCount > 0 ? '1px solid rgba(0,98,65,0.4)' : (S.btnGhost as any).border, color: activeFilterCount > 0 ? '#006241' : (S.btnGhost as any).color, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filters
              {activeFilterCount > 0 && <span style={{ background: '#006241', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>{activeFilterCount}</span>}
            </button>
            {filterOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setFilterOpen(false)} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, background: '#FFFFFF', borderRadius: 12, boxShadow: '0 16px 48px rgba(27,28,25,0.14)', padding: '18px 20px', width: 320 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#6B6B6B' }}>Filters</span>
                    {activeFilterCount > 0 && <span onClick={clearFilters} style={{ fontSize: 11, color: '#006241', cursor: 'pointer' }}>Clear all</span>}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={S.filterLabel}>Genre</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                      <FilterChip label="All" active={filterGenre === 'All'} onClick={() => onFilterGenre('All')} />
                      {allGenres.map(g => <FilterChip key={g} label={g} active={filterGenre === g} onClick={() => onFilterGenre(g)} />)}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={S.filterLabel}>Format</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                      {['All','eBook','Audio Book','Print'].map(f => <FilterChip key={f} label={f === 'All' ? 'All Formats' : f} active={filterFormat === f} onClick={() => onFilterFormat(f)} />)}
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
          {/* Glassmorphic user cluster */}
          <UserCluster user={user} />
        </div>
      </div>

      <div style={S.content}>
        {/* Currently Immersed section */}
        {currentlyReading.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <SectionHeader title="Currently Immersed" />
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
              {currentlyReading.slice(0, 2).map((book: Book) => (
                <CurrentlyImmersedCard key={book.id} book={book} onClick={() => onSelectBook(book)} />
              ))}
            </div>
          </div>
        )}

        {/* The Archive */}
        <SectionHeader title="The Archive" count={books.length} />
        {activeFilterCount > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: '#6B6B6B', alignSelf: 'center' }}>Active filters:</span>
            {filterGenre !== 'All' && <FilterChip label={filterGenre} active onClick={() => onFilterGenre('All')} />}
            {filterFormat !== 'All' && <FilterChip label={filterFormat} active onClick={() => onFilterFormat('All')} />}
            {filterRating > 0 && <FilterChip label={`★ ${filterRating}+`} active onClick={() => onFilterRating(0)} />}
          </div>
        )}
        {books.filter((b: Book) => b.status === 'Reading').length > 0 && (
          <><SectionHeader title="Currently Reading" count={books.filter((b: Book) => b.status === 'Reading').length} sub /><BookGrid books={books.filter((b: Book) => b.status === 'Reading')} onSelect={onSelectBook} /></>
        )}
        {books.filter((b: Book) => b.status === 'Completed').length > 0 && (
          <><SectionHeader title="Completed" count={books.filter((b: Book) => b.status === 'Completed').length} sub /><BookGrid books={books.filter((b: Book) => b.status === 'Completed')} onSelect={onSelectBook} /></>
        )}
        {books.filter((b: Book) => b.status === 'Want to Read').length > 0 && (
          <><SectionHeader title="Want to Read" count={books.filter((b: Book) => b.status === 'Want to Read').length} sub /><BookGrid books={books.filter((b: Book) => b.status === 'Want to Read')} onSelect={onSelectBook} /></>
        )}
        {books.filter((b: Book) => b.status === 'DNF').length > 0 && (
          <><SectionHeader title="Did Not Finish" count={books.filter((b: Book) => b.status === 'DNF').length} sub /><BookGrid books={books.filter((b: Book) => b.status === 'DNF')} onSelect={onSelectBook} /></>
        )}
        {books.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B6B6B' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 18 }}>Your archive awaits its first entry</div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Library View ─────────────────────────────────────────────────────────────
function LibraryView({ books, search, onSearch, filterGenre, onFilterGenre, filterFormat, onFilterFormat,
  filterRating, onFilterRating, filterStatus, onSelectBook, onAddBook, onExport, onImport, currentlyReading, user }: any) {
  const completed  = books.filter((b: Book) => b.status === 'Completed');
  const wantToRead = books.filter((b: Book) => b.status === 'Want to Read');
  const dnf        = books.filter((b: Book) => b.status === 'DNF');
  void filterStatus;
  const allGenres: Genre[] = ['Fantasy','Romance','Sci-Fi','Fiction','Non-Fiction','Biography','Mystery','Western','War','Young Adult','Thriller','Historical'];
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilterCount = (filterGenre !== 'All' ? 1 : 0) + (filterFormat !== 'All' ? 1 : 0) + (filterRating > 0 ? 1 : 0);
  function clearFilters() { onFilterGenre('All'); onFilterFormat('All'); onFilterRating(0); }

  return (
    <>
      <div style={S.topbar}>
        <span style={S.pageTitle}>My Library</span>
        <div style={S.topbarRight}>
          <div style={{ position: 'relative' }}>
            <span style={S.searchIcon}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input style={S.searchInput} placeholder="Search books, authors..." value={search} onChange={e => onSearch(e.target.value)} />
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setFilterOpen(o => !o)} style={{ ...S.btnGhost, border: activeFilterCount > 0 ? '1px solid rgba(0,98,65,0.4)' : (S.btnGhost as any).border, color: activeFilterCount > 0 ? '#006241' : (S.btnGhost as any).color, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filters
              {activeFilterCount > 0 && <span style={{ background: '#006241', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 }}>{activeFilterCount}</span>}
            </button>
            {filterOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setFilterOpen(false)} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50, background: '#FFFFFF', borderRadius: 12, boxShadow: '0 16px 48px rgba(27,28,25,0.14)', padding: '18px 20px', width: 320 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#6B6B6B' }}>Filters</span>
                    {activeFilterCount > 0 && <span onClick={clearFilters} style={{ fontSize: 11, color: '#006241', cursor: 'pointer' }}>Clear all</span>}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={S.filterLabel}>Genre</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                      <FilterChip label="All" active={filterGenre === 'All'} onClick={() => onFilterGenre('All')} />
                      {allGenres.map(g => <FilterChip key={g} label={g} active={filterGenre === g} onClick={() => onFilterGenre(g)} />)}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={S.filterLabel}>Format</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                      {['All','eBook','Audio Book','Print'].map(f => <FilterChip key={f} label={f === 'All' ? 'All Formats' : f} active={filterFormat === f} onClick={() => onFilterFormat(f)} />)}
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
          {user && <UserCluster user={user} />}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div style={{ padding: '8px 32px', display: 'flex', gap: 6, alignItems: 'center', borderBottom: 'none', background: '#F1F1ED' }}>
          <span style={{ fontSize: 11, color: '#6B6B6B', marginRight: 4 }}>Active:</span>
          {filterGenre !== 'All' && <FilterChip label={filterGenre} active onClick={() => onFilterGenre('All')} />}
          {filterFormat !== 'All' && <FilterChip label={filterFormat} active onClick={() => onFilterFormat('All')} />}
          {filterRating > 0 && <FilterChip label={`★ ${filterRating}+`} active onClick={() => onFilterRating(0)} />}
        </div>
      )}

      <div style={S.content}>
        {currentlyReading && (filterStatus === 'All' || filterStatus === 'Reading') && (
          <CurrentlyImmersedCard book={currentlyReading} onClick={() => {}} />
        )}
        {completed.length > 0  && <><SectionHeader title="Completed"      count={completed.length}  sub /><BookGrid books={completed}  onSelect={onSelectBook} /></>}
        {wantToRead.length > 0 && <><SectionHeader title="Want to Read"   count={wantToRead.length} sub /><BookGrid books={wantToRead} onSelect={onSelectBook} /></>}
        {dnf.length > 0        && <><SectionHeader title="Did Not Finish" count={dnf.length}         sub /><BookGrid books={dnf}        onSelect={onSelectBook} /></>}
        {books.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B6B6B' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <div style={{ fontFamily: "'Newsreader', serif", fontSize: 18 }}>No books found</div>
          </div>
        )}
      </div>
    </>
  );
}

function CurrentlyImmersedCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const [cover, setCover] = useState<string | null>(book.coverUrl || null);
  useEffect(() => {
    if (!cover) {
      fetchCoverUrl(book.title, book.author).then(url => { if (url) setCover(url); });
    }
  }, []);
  const pct = (book.pagesRead && book.pageCount) ? Math.min(100, Math.round((book.pagesRead / book.pageCount) * 100)) : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#FFFFFF', borderRadius: 12, padding: '20px 24px',
        display: 'flex', gap: 20, alignItems: 'center',
        boxShadow: '0px 12px 32px rgba(27,28,25,0.06)',
        cursor: 'pointer', transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0px 16px 40px rgba(27,28,25,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0px 12px 32px rgba(27,28,25,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{ width: 68, flexShrink: 0, aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden', boxShadow: '3px 5px 16px rgba(27,28,25,0.18)' }}>
        {cover
          ? <img src={cover} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#E8F5F0,#C8E8DC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📖</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#006241', fontWeight: 700, marginBottom: 5 }}>Currently Immersed</div>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 600, color: '#2D2D2D', marginBottom: 2, lineHeight: 1.25 }}>{book.title}</div>
        <div style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 12 }}>{book.author}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, maxWidth: 220, height: 5, background: '#F1F1ED', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct !== null ? `${pct}%` : '0%', background: 'linear-gradient(90deg, #067D55, #006241)', borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500 }}>
            {pct !== null ? `${pct}%` : 'In progress'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        {book.genres.slice(0, 2).map(g => <GenreTag key={g} genre={g} />)}
        {book.rating ? <StarRating rating={book.rating} /> : null}
      </div>
      <button style={{ ...S.btnPrimary, flexShrink: 0, fontSize: 12, padding: '7px 14px' }}>
        Continue Reading
      </button>
    </div>
  );
}

function BookGrid({ books, onSelect }: { books: Book[]; onSelect: (b: Book) => void }) {
  return <div style={S.bookGrid}>{books.map(b => <BookCard key={b.id} book={b} onClick={() => onSelect(b)} />)}</div>;
}

function SectionHeader({ title, count, sub }: { title: string; count?: number; sub?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: sub ? 14 : 20, marginTop: sub ? 28 : 0 }}>
      <span style={{ fontFamily: "'Newsreader', serif", fontSize: sub ? 15 : 18, fontWeight: 600, color: '#2D2D2D', fontStyle: sub ? 'normal' : 'italic' as const }}>{title}</span>
      {count !== undefined && <span style={{ fontSize: 12, color: '#6B6B6B' }}>{count} books</span>}
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
export const S = {
  topbar: {
    // No-Line Rule: no 1px border — use background tonal shift for separation
    background: '#F1F1ED',
    padding: '0 28px',
    display: 'flex' as const,
    alignItems: 'center' as const,
    height: 62,
    gap: 12,
    flexShrink: 0,
  },
  pageTitle: {
    fontFamily: "'Newsreader', serif",
    fontStyle: 'italic' as const,
    fontSize: 20,
    fontWeight: 600,
    color: '#2D2D2D',
  },
  topbarRight: {
    marginLeft: 'auto',
    display: 'flex' as const,
    gap: 10,
    alignItems: 'center' as const,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none' as const,
    color: '#8A8A82',
    display: 'flex',
    alignItems: 'center',
  },
  // Pill-shaped search per spec
  searchInput: {
    background: '#FAF9F4',
    border: '1px solid rgba(45,45,45,0.12)',
    borderRadius: 20,
    padding: '7px 14px 7px 35px',
    fontSize: 13,
    fontFamily: "'Manrope', sans-serif",
    color: '#2D2D2D',
    width: 210,
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  btnPrimary: {
    padding: '8px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'Manrope', sans-serif",
    cursor: 'pointer',
    border: 'none',
    fontWeight: 600,
    background: 'linear-gradient(160deg, #067D55 0%, #006241 100%)',
    color: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,98,65,0.25)',
    transition: 'box-shadow 0.15s ease, transform 0.15s ease',
  },
  btnGhost: {
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: "'Manrope', sans-serif",
    cursor: 'pointer',
    border: '1px solid rgba(45,45,45,0.15)',
    fontWeight: 500,
    background: 'rgba(255,255,255,0.6)',
    color: '#4B4B4B',
    transition: 'background 0.15s ease',
  },
  filterBar: {
    padding: '0 32px',
    display: 'flex' as const,
    gap: 6,
    alignItems: 'center' as const,
    background: '#F1F1ED',
    height: 46,
    flexShrink: 0,
    overflowX: 'auto' as const,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    color: '#6B6B6B',
    marginBottom: 8,
  },
  content: {
    padding: '28px 32px',
    flex: 1,
    overflowY: 'auto' as const,
    background: '#FAF9F4',
  },
  bookGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))',
    gap: 16,
    marginBottom: 36,
  },
};
