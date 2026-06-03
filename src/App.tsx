import { useState, useEffect, useMemo, useRef } from 'react';
import type { Book, Status, Genre, Format } from './types';
import { SEED_BOOKS } from './data/seedBooks';
import { RECOMMENDATIONS } from './data/recommendations';
import type { Recommendation } from './data/recommendations';
import { loadBooksFromStorageResult, parseImportedData, saveBooksToStorage, serializeAppData } from './lib/storage';
import DetailPanel from './components/DetailPanel';
import BookForm from './components/BookForm';
import BookIntakePanel from './components/BookIntakePanel';
import RecommendationsView from './components/RecommendationsView';
import Sidebar from './components/Sidebar';
import IndexRoom from './components/rooms/IndexRoom';
import ReadingRoom from './components/rooms/ReadingRoom';
import ArchiveRoom from './components/rooms/ArchiveRoom';

type View = 'index' | 'reading' | 'archive' | 'discovery';
type FilterStatus = Status | 'All';
type InitialData = { books: Book[]; canPersistInitialBooks: boolean };

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
  } catch {
    return { name: 'Reader', role: 'Lead Curator', initials: 'R', color: '#006241' };
  }
  return { name: 'Reader', role: 'Lead Curator', initials: 'R', color: '#006241' };
}

function saveUser(u: UserProfile) {
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}

function loadData(): InitialData {
  const storedBooks = loadBooksFromStorageResult();
  if (storedBooks.status === 'valid') return { books: storedBooks.books, canPersistInitialBooks: true };
  return { books: SEED_BOOKS, canPersistInitialBooks: storedBooks.status === 'missing' };
}

function saveData(books: Book[]) {
  saveBooksToStorage(books);
}

export default function App() {
  const [initialData] = useState(loadData);
  const [books, setBooks] = useState<Book[]>(initialData.books);
  const [view, setView] = useState<View>('index');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [filterGenre, setFilterGenre] = useState<Genre | 'All'>('All');
  const [filterFormat, setFilterFormat] = useState<Format | 'All'>('All');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null | 'new'>(null);
  const [user, setUser] = useState<UserProfile>(loadUser);
  const [editingUser, setEditingUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canPersistBooksRef = useRef(initialData.canPersistInitialBooks);

  function updateUser(u: UserProfile) {
    setUser(u);
    saveUser(u);
    setEditingUser(false);
  }

  useEffect(() => {
    if (!canPersistBooksRef.current) return;
    saveData(books);
  }, [books]);

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

  function allowBooksPersistence() {
    canPersistBooksRef.current = true;
  }

  function addOrUpdateBook(book: Book) {
    allowBooksPersistence();
    setBooks(prev => {
      const idx = prev.findIndex(b => b.id === book.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = book; return next; }
      return [...prev, book];
    });
    setEditingBook(null);
    setSelectedBook(book);
  }

  function deleteBook(id: string) {
    allowBooksPersistence();
    setBooks(prev => prev.filter(b => b.id !== id));
    setSelectedBook(null);
  }

  function exportData() {
    const blob = new Blob([serializeAppData(books)], { type: 'application/json' });
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
        const result = ev.target?.result;
        if (typeof result !== 'string') throw new Error('Import file must be text.');
        allowBooksPersistence();
        setBooks(parseImportedData(result).books);
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
    allowBooksPersistence();
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
    <div className="book-tracker-shell" style={{ display: 'flex', minHeight: '100vh', background: '#FAF9F4', color: '#2D2D2D', fontFamily: "'Manrope', sans-serif" }}>
      <Sidebar
        view={view}
        onViewChange={setView}
        counts={counts}
        currentlyReading={currentlyReading[0] || null}
        filterStatus={filterStatus}
        onFilterStatus={(s: FilterStatus) => { setFilterStatus(s); setView('archive'); }}
        onAddBook={() => setEditingBook('new')}
        user={user}
        onEditUser={() => setEditingUser(true)}
      />

      <main className="book-tracker-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {view === 'index' && (
          <IndexRoom
            books={books}
            currentlyReading={currentlyReading}
            recommendations={RECOMMENDATIONS}
            onNavigate={setView}
            onSelectBook={setSelectedBook}
          />
        )}
        {view === 'reading' && (
          <ReadingRoom books={books} onSelectBook={setSelectedBook} />
        )}
        {view === 'archive' && (
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
        {view === 'discovery' && <RecommendationsView recommendations={RECOMMENDATIONS} books={books} onAddToList={addToWantToRead} />}
      </main>

      {selectedBook && !editingBook && (
        <DetailPanel book={selectedBook} onClose={() => setSelectedBook(null)}
          onEdit={() => setEditingBook(selectedBook)} onDelete={() => deleteBook(selectedBook.id)} />
      )}

      {editingBook === 'new' && (
        <BookIntakePanel
          onSave={addOrUpdateBook} onClose={() => setEditingBook(null)} />
      )}

      {editingBook && editingBook !== 'new' && (
        <BookForm book={editingBook}
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

