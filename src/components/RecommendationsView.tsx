import { useState } from 'react';
import type { Book } from '../types';
import type { Recommendation } from '../data/recommendations';
import { FilterChip, GenreTag } from '../App';
import { S } from '../App';

const MOODS = ['All', 'Cozy', 'Page-turner', 'Emotional', 'Epic & long', 'Light read', 'Dark & complex'];

const GENRE_CATEGORIES = [
  { label: 'Fiction',       icon: '✍️', color: 'rgba(0,98,65,0.10)',    textColor: '#006241' },
  { label: 'Non-Fiction',   icon: '📰', color: 'rgba(45,45,45,0.08)',   textColor: '#4B4B4B' },
  { label: 'Fantasy',       icon: '🧙', color: 'rgba(124,58,237,0.10)', textColor: '#6D28D9' },
  { label: 'Sci-Fi',        icon: '🚀', color: 'rgba(37,99,235,0.10)',  textColor: '#1D4ED8' },
  { label: 'Romance',       icon: '💌', color: 'rgba(219,39,119,0.10)', textColor: '#BE185D' },
  { label: 'Mystery',       icon: '🔍', color: 'rgba(5,150,105,0.10)',  textColor: '#047857' },
  { label: 'Biography',     icon: '👤', color: 'rgba(180,83,9,0.10)',   textColor: '#92400E' },
  { label: 'Thriller',      icon: '⚡', color: 'rgba(79,70,229,0.10)',  textColor: '#4338CA' },
];

const QUOTES = [
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", author: "Jane Austen" },
  { text: "So it goes.", author: "Kurt Vonnegut" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
];

const todayQuote = QUOTES[new Date().getDate() % QUOTES.length];

export default function RecommendationsView({ recommendations, books, onAddToList }: {
  recommendations: Recommendation[]; books: Book[]; onAddToList: (r: Recommendation) => void;
}) {
  const [mood, setMood] = useState('All');
  const alreadyHave = new Set(books.map(b => b.title.toLowerCase()));

  const filtered = recommendations.filter(r => {
    if (alreadyHave.has(r.title.toLowerCase())) return false;
    if (mood !== 'All' && !r.moods.includes(mood)) return false;
    return true;
  });

  return (
    <>
      <div style={S.topbar}>
        <span style={S.pageTitle}>Discovery Hub</span>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6B6B6B' }}>
          Curated for your taste
        </div>
      </div>

      <div style={S.content}>

        {/* Quote of the Day hero */}
        <div style={{
          background: 'linear-gradient(135deg,#006241 0%,#004D31 100%)',
          borderRadius: 14, padding: '28px 32px', marginBottom: 28,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circle */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 2, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>Editorial Selection</div>
          <div style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic' as const, fontSize: 20, fontWeight: 500, color: '#FFFFFF', lineHeight: 1.6, marginBottom: 12, maxWidth: 600, position: 'relative', zIndex: 1 }}>
            "{todayQuote.text}"
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 500, position: 'relative', zIndex: 1 }}>
            — {todayQuote.author}
          </div>
        </div>

        {/* Genre categories grid */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic' as const, fontSize: 17, fontWeight: 600, color: '#2D2D2D', marginBottom: 14 }}>Browse by Category</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {GENRE_CATEGORIES.map(gc => (
              <div
                key={gc.label}
                onClick={() => setMood('All')}
                style={{
                  padding: '16px 14px', borderRadius: 10, background: gc.color,
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(27,28,25,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: 20 }}>{gc.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: gc.textColor }}>{gc.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended for You */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
            <span style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic' as const, fontSize: 17, fontWeight: 600, color: '#2D2D2D' }}>Recommended for You</span>
            <span style={{ fontSize: 12, color: '#6B6B6B' }}>{filtered.length} books</span>
          </div>

          {/* Mood filter */}
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Mood:</span>
            {MOODS.map(m => <FilterChip key={m} label={m} active={mood === m} onClick={() => setMood(m)} />)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(r => <RecCard key={r.id} rec={r} onAdd={() => onAddToList(r)} />)}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B6B6B' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✨</div>
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: 16 }}>No recommendations match this mood.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function RecCard({ rec, onAdd }: { rec: Recommendation; onAdd: () => void }) {
  const [cover] = useState<string | null>(rec.isbn ? `https://covers.openlibrary.org/b/isbn/${rec.isbn}-M.jpg` : null);
  const [hover, setHover] = useState(false);
  const [added, setAdded] = useState(false);

  function handleAdd() { onAdd(); setAdded(true); }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#FFFFFF', borderRadius: 12, padding: '18px 22px', display: 'flex', gap: 18, cursor: 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0px 16px 40px rgba(27,28,25,0.10)' : '0px 8px 24px rgba(27,28,25,0.06)',
      }}
    >
      {/* Cover */}
      <div style={{
        width: 72, flexShrink: 0, aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden',
        background: 'linear-gradient(160deg,#E8F5F0,#C8E8DC)',
        boxShadow: '2px 4px 14px rgba(27,28,25,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Newsreader', serif", fontSize: 10, color: '#006241', textAlign: 'center', padding: 6, lineHeight: 1.4,
      }}>
        {cover
          ? <img src={cover} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : rec.title
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Match badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, background: 'rgba(0,98,65,0.08)', color: '#006241', padding: '2px 9px', borderRadius: 10, marginBottom: 7 }}>
          ✦ Matches your taste
        </div>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 15, fontWeight: 600, color: '#2D2D2D', marginBottom: 2 }}>{rec.title}</div>
        <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 8 }}>{rec.author}{rec.pages ? ` · ${rec.pages} pages` : ''}</div>
        <div style={{ fontSize: 12, color: '#4B4B4B', lineHeight: 1.6, marginBottom: 10, fontStyle: 'italic' as const }}>{rec.reason}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const }}>
          {rec.genres.map(g => <GenreTag key={g} genre={g} />)}
          {rec.moods.slice(0, 2).map(m => (
            <span key={m} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: 'rgba(14,116,144,0.10)', color: '#0E7490' }}>{m}</span>
          ))}
          <button
            onClick={() => window.open(`https://openlibrary.org/search?q=${encodeURIComponent(rec.title + ' ' + rec.author)}`, '_blank')}
            style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8, border: '1px solid rgba(45,45,45,0.18)', background: 'transparent', color: '#4B4B4B', cursor: 'pointer', marginLeft: 'auto' }}
          >
            Look up
          </button>
          <button
            onClick={handleAdd}
            disabled={added}
            style={{
              fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 8,
              border: added ? '1px solid rgba(6,125,85,0.30)' : '1px solid rgba(0,98,65,0.30)',
              background: added ? 'rgba(6,125,85,0.10)' : 'linear-gradient(160deg,#067D55,#006241)',
              color: added ? '#067D55' : '#FFFFFF',
              cursor: added ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {added ? '✓ Added' : '+ Want to Read'}
          </button>
        </div>
      </div>
    </div>
  );
}
