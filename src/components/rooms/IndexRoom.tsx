import { useState } from 'react';
import type { Book, Genre } from '../../types';
import type { Recommendation } from '../../data/recommendations';
import { getArchiveStats, getIndexStats } from '../../lib/bookStats';
import { getCoverCandidates } from '../../utils/cover';
import { GenreTag, S, StarRating } from '../../App';

type RoomView = 'archive' | 'reading' | 'discovery';

interface IndexRoomProps {
  books: Book[];
  currentlyReading: Book[];
  recommendations: Recommendation[];
  onNavigate: (view: RoomView) => void;
  onSelectBook: (book: Book) => void;
}

export default function IndexRoom({ books, currentlyReading, recommendations, onNavigate, onSelectBook }: IndexRoomProps) {
  const year = new Date().getFullYear();
  const indexStats = getIndexStats(books, year);
  const archiveStats = getArchiveStats(books);
  const existingTitles = new Set(books.map(book => book.title.toLowerCase()));
  const recommendation = recommendations.find(rec => !existingTitles.has(rec.title.toLowerCase())) ?? recommendations[0] ?? null;

  return (
    <>
      <div className="room-topbar" style={S.topbar}>
        <span style={S.pageTitle}>Index</span>
        <div className="room-topbar-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button style={S.btnGhost} onClick={() => onNavigate('reading')}>Reading</button>
          <button style={S.btnGhost} onClick={() => onNavigate('archive')}>Archive</button>
          <button style={S.btnPrimary} onClick={() => onNavigate('discovery')}>Discovery</button>
        </div>
      </div>

      <div style={S.content}>
        <div className="index-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard label={`${year} completions`} value={indexStats.completedThisYear.toLocaleString()} />
          <StatCard label="Currently reading" value={indexStats.currentlyReading.toLocaleString()} />
          <StatCard label="Archive size" value={indexStats.archiveSize.toLocaleString()} />
          <StatCard label="Strongest pattern" value={indexStats.strongestPattern?.label ?? 'No pattern yet'} detail={indexStats.strongestPattern ? `${indexStats.strongestPattern.count} matches` : undefined} />
        </div>

        <div className="index-room-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, alignItems: 'start' }}>
          <section>
            <SectionTitle title="Currently Reading" action="Open Reading Room" onAction={() => onNavigate('reading')} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {currentlyReading.slice(0, 2).map(book => (
                <ReadingPreview key={book.id} book={book} onClick={() => onSelectBook(book)} />
              ))}
              {currentlyReading.length === 0 && (
                <EmptyPanel title="No active reads" text="Start a book from the archive or add a new one." />
              )}
            </div>
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <SectionTitle title="Archive Health" action="Open Archive" onAction={() => onNavigate('archive')} />
              <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 18, boxShadow: '0px 8px 24px rgba(27,28,25,0.06)' }}>
                <HealthRow label="Total books" value={archiveStats.totalBooks} />
                <HealthRow label="Missing covers" value={archiveStats.missingCovers} />
                <HealthRow label="Metadata to review" value={archiveStats.metadataReview} />
                <div style={{ height: 1, background: 'rgba(45,45,45,0.08)', margin: '12px 0' }} />
                <HealthRow label="Completed" value={archiveStats.statusCounts.Completed} />
                <HealthRow label="Want to read" value={archiveStats.statusCounts['Want to Read']} />
              </div>
            </div>

            {recommendation && (
              <div>
                <SectionTitle title="Discovery Preview" action="See More" onAction={() => onNavigate('discovery')} />
                <RecommendationPreview rec={recommendation} />
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '18px 18px 16px', boxShadow: '0px 8px 24px rgba(27,28,25,0.06)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6B6B6B', marginBottom: 9 }}>{label}</div>
      <div style={{ fontFamily: "'Newsreader', serif", fontSize: 25, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.1 }}>{value}</div>
      {detail && <div style={{ fontSize: 11, color: '#8A8A82', marginTop: 6 }}>{detail}</div>}
    </div>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
      <span style={{ fontFamily: "'Newsreader', serif", fontSize: 18, fontWeight: 600, color: '#2D2D2D', fontStyle: 'italic' }}>{title}</span>
      <button onClick={onAction} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: '#006241', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        {action}
      </button>
    </div>
  );
}

function ReadingPreview({ book, onClick }: { book: Book; onClick: () => void }) {
  const covers = getCoverCandidates(book);
  const pct = getProgress(book);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: '100%', border: 'none', textAlign: 'left', background: '#FFFFFF', borderRadius: 12, padding: 16, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0px 8px 24px rgba(27,28,25,0.06)', cursor: 'pointer', fontFamily: "'Manrope', sans-serif" }}
    >
      <Cover title={book.title} urls={covers} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 17, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.25 }}>{book.title}</div>
        <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2, marginBottom: 10 }}>{book.author}</div>
        <ProgressBar pct={pct} />
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 180 }}>
        {book.genres.slice(0, 2).map(genre => <GenreTag key={genre} genre={genre} />)}
        {book.rating ? <StarRating rating={book.rating} /> : null}
      </div>
    </button>
  );
}

function RecommendationPreview({ rec }: { rec: Recommendation }) {
  const cover = rec.isbn ? `https://covers.openlibrary.org/b/isbn/${rec.isbn}-M.jpg` : null;

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 16, display: 'flex', gap: 14, boxShadow: '0px 8px 24px rgba(27,28,25,0.06)' }}>
      <Cover title={rec.title} urls={cover ? [cover] : []} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 16, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.25 }}>{rec.title}</div>
        <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 3 }}>{rec.author}{rec.pages ? ` / ${rec.pages} pages` : ''}</div>
        <div style={{ fontSize: 12, color: '#4B4B4B', lineHeight: 1.5, marginTop: 9 }}>{rec.reason}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {rec.genres.slice(0, 2).map(genre => <GenreTag key={genre} genre={genre as Genre} />)}
        </div>
      </div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, color: '#4B4B4B', padding: '5px 0' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700, color: '#2D2D2D' }}>{value.toLocaleString()}</span>
    </div>
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 22, color: '#6B6B6B', boxShadow: '0px 8px 24px rgba(27,28,25,0.06)' }}>
      <div style={{ fontFamily: "'Newsreader', serif", fontSize: 17, color: '#2D2D2D', marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}

function Cover({ title, urls }: { title: string; urls: string[] }) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const url = urls.find(candidate => !failedUrls.includes(candidate)) ?? null;

  return (
    <div style={{ width: 58, flexShrink: 0, aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(160deg,#E8F5F0,#C8E8DC)', boxShadow: '2px 4px 14px rgba(27,28,25,0.14)' }}>
      {url
        ? <img src={url} alt="" onError={() => setFailedUrls(prev => prev.includes(url) ? prev : [...prev, url])} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, color: '#006241', fontFamily: "'Newsreader', serif", fontSize: 10, textAlign: 'center', lineHeight: 1.4 }}>{title}</div>
      }
    </div>
  );
}

function ProgressBar({ pct }: { pct: number | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, maxWidth: 240, height: 5, background: '#F1F1ED', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct !== null ? `${pct}%` : '0%', background: 'linear-gradient(90deg, #067D55, #006241)', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 600 }}>{pct !== null ? `${pct}%` : 'In progress'}</span>
    </div>
  );
}

function getProgress(book: Book): number | null {
  if (!book.pageCount || !book.pagesRead) return null;
  return Math.min(100, Math.round((book.pagesRead / book.pageCount) * 100));
}
