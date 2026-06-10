import { useState } from 'react';
import type { Book, Genre } from '../../types';
import type { Recommendation } from '../../data/recommendations';
import { getEarnedReaderTitle, getIndexStats, getReadingStats } from '../../lib/bookStats';
import BookCard from '../BookCard';
import { S } from '../sharedStyles';
import { GenreTag } from '../sharedUi';

interface IndexRoomProps {
  books: Book[];
  currentlyReading: Book[];
  recommendations: Recommendation[];
  onNavigate: (view: 'home' | 'library' | 'stats' | 'discover') => void;
  onSelectBook: (book: Book) => void;
  onAddBook: () => void;
}

export default function IndexRoom({ books, currentlyReading, recommendations, onSelectBook, onAddBook }: IndexRoomProps) {
  const indexStats = getIndexStats(books, new Date().getFullYear());
  const readingStats = getReadingStats(books);
  const earnedTitle = getEarnedReaderTitle(books);
  const primaryReading = currentlyReading[0] ?? null;
  const nextRecommendations = recommendations.slice(0, 6);

  return (
    <div style={S.content}>
      <section className="home-hero" style={{ background: 'linear-gradient(135deg,#FFFFFF 0%,#F4FBF7 100%)', borderRadius: 12, padding: '24px 26px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 18, alignItems: 'center', boxShadow: '0px 14px 36px rgba(27,28,25,0.07)', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#067D55', marginBottom: 8 }}>Current title</div>
          <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 40, fontWeight: 600, color: '#2D2D2D', lineHeight: 1, margin: 0 }}>{earnedTitle.title}</h1>
          {earnedTitle.nextTitle && (
            <p style={{ margin: '10px 0 0', color: '#5A5A52', fontSize: 14, lineHeight: 1.5 }}>{earnedTitle.progress}% toward {earnedTitle.nextTitle}</p>
          )}
        </div>
        <button type="button" onClick={onAddBook} style={{ ...S.btnPrimary, whiteSpace: 'nowrap' }}>Add book</button>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(280px,0.85fr)', gap: 18, alignItems: 'start', marginBottom: 28 }}>
        <section>
          <SectionTitle title="Now reading" />
          {primaryReading ? (
            <button type="button" onClick={() => onSelectBook(primaryReading)} style={{ width: '100%', padding: 0, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: "'Manrope', sans-serif" }}>
              <BookCard book={primaryReading} onClick={() => undefined} variant="archiveFeature" />
            </button>
          ) : (
            <button type="button" onClick={onAddBook} style={{ width: '100%', border: '1px dashed rgba(6,125,85,0.35)', background: '#FFFFFF', borderRadius: 12, padding: 24, color: '#006241', fontSize: 14, fontWeight: 800, boxShadow: '0px 8px 24px rgba(27,28,25,0.05)', cursor: 'pointer' }}>
              Add what you are reading
            </button>
          )}
        </section>

        <section>
          <SectionTitle title="Reading pulse" />
          <div style={{ display: 'grid', gap: 10 }}>
            <PulseRow value={indexStats.completedThisYear.toLocaleString()} label="completed this year" />
            <PulseRow value={readingStats.pagesLeft.toLocaleString()} label="pages left" />
            <PulseRow value={`${readingStats.averageProgress}%`} label="average progress" />
          </div>
        </section>
      </div>

      <section>
        <SectionTitle title="Recommended next" />
        {nextRecommendations.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
            {nextRecommendations.map((rec) => (
              <RecommendationCard key={`${rec.title}-${rec.author}`} rec={rec} />
            ))}
          </div>
        ) : (
          <EmptyPanel title="No recommendations yet" text="Add a few books so the next shelf can start taking shape." />
        )}
      </section>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
      <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 600, color: '#2D2D2D', fontStyle: 'italic', margin: 0 }}>{title}</h2>
    </div>
  );
}

function PulseRow({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: '17px 18px', boxShadow: '0px 8px 24px rgba(27,28,25,0.06)' }}>
      <div style={{ fontFamily: "'Newsreader', serif", fontSize: 28, fontWeight: 600, color: '#2D2D2D', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#6B6B6B', marginTop: 7 }}>{label}</div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const cover = rec.isbn ? `https://covers.openlibrary.org/b/isbn/${rec.isbn}-M.jpg` : null;

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '58px minmax(0,1fr)', gap: 14, boxShadow: '0px 8px 24px rgba(27,28,25,0.06)' }}>
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
