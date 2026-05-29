import { useState } from 'react';
import type { Book } from '../../types';
import { getReadingStats } from '../../lib/bookStats';
import { getCoverCandidates } from '../../utils/cover';
import { S } from '../sharedStyles';
import { GenreTag } from '../sharedUi';

interface ReadingRoomProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
}

export default function ReadingRoom({ books, onSelectBook }: ReadingRoomProps) {
  const readingBooks = books.filter(book => book.status === 'Reading');
  const stats = getReadingStats(books);

  return (
    <>
      <div style={S.topbar}>
        <span style={S.pageTitle}>Reading</span>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6B6B6B' }}>
          {stats.activeCount} active books
        </div>
      </div>

      <div style={S.content}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard label="Active" value={stats.activeCount.toLocaleString()} />
          <StatCard label="Pages left" value={stats.pagesLeft.toLocaleString()} />
          <StatCard label="Average progress" value={`${stats.averageProgress}%`} />
          <StatCard label="Stalled" value={stats.stalledCount.toLocaleString()} />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
          <span style={{ fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 600, color: '#2D2D2D', fontStyle: 'italic' }}>Active Reading</span>
          <span style={{ fontSize: 12, color: '#6B6B6B' }}>{readingBooks.length} books</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {readingBooks.map(book => (
            <ReadingBookRow key={book.id} book={book} onClick={() => onSelectBook(book)} />
          ))}
          {readingBooks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#6B6B6B' }}>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: 18 }}>No active reading books</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Books marked Reading will appear here.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ReadingBookRow({ book, onClick }: { book: Book; onClick: () => void }) {
  const [failedCoverUrls, setFailedCoverUrls] = useState<string[]>([]);
  const cover = getCoverCandidates(book, failedCoverUrls)[0] ?? null;
  const progress = getProgress(book);
  const pagesLeft = book.pageCount ? Math.max(0, book.pageCount - (book.pagesRead ?? 0)) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: '100%', border: 'none', textAlign: 'left', background: '#FFFFFF', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 18, alignItems: 'center', boxShadow: '0px 8px 24px rgba(27,28,25,0.06)', cursor: 'pointer', fontFamily: "'Manrope', sans-serif" }}
    >
      <div style={{ width: 62, flexShrink: 0, aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(160deg,#E8F5F0,#C8E8DC)', boxShadow: '2px 4px 14px rgba(27,28,25,0.14)' }}>
        {cover
          ? <img src={cover} alt="" onError={() => setFailedCoverUrls(prev => prev.includes(cover) ? prev : [...prev, cover])} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, color: '#006241', fontFamily: "'Newsreader', serif", fontSize: 10, textAlign: 'center', lineHeight: 1.4 }}>{book.title}</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.25 }}>{book.title}</div>
        <div style={{ fontSize: 13, color: '#6B6B6B', marginTop: 2, marginBottom: 12 }}>{book.author}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, maxWidth: 360, height: 6, background: '#F1F1ED', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #067D55, #006241)', borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 700 }}>{progress}%</span>
        </div>
      </div>
      <div style={{ minWidth: 150, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ fontSize: 12, color: '#4B4B4B', fontWeight: 700 }}>
          {pagesLeft !== null ? `${pagesLeft.toLocaleString()} pages left` : 'No page count'}
        </div>
        <div style={{ fontSize: 11, color: '#8A8A82' }}>
          {book.pagesRead ?? 0}{book.pageCount ? ` / ${book.pageCount}` : ''} pages
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {book.genres.slice(0, 2).map(genre => <GenreTag key={genre} genre={genre} />)}
        </div>
      </div>
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '18px 18px 16px', boxShadow: '0px 8px 24px rgba(27,28,25,0.06)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B6B6B', marginBottom: 9 }}>{label}</div>
      <div style={{ fontFamily: "'Newsreader', serif", fontSize: 25, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

function getProgress(book: Book): number {
  if (!book.pageCount) return 0;
  return Math.min(100, Math.round(((book.pagesRead ?? 0) / book.pageCount) * 100));
}
