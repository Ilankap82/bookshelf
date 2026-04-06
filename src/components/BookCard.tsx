import { useState, useEffect } from 'react';
import type { Book } from '../types';
import { GenreTag, StarRating } from '../App';
import { fetchCoverUrl } from '../utils/cover';

const GENRE_PALETTE: Record<string, { bg: string; accent: string; spine: string }> = {
  Fantasy:       { bg: 'linear-gradient(160deg,#2A1F3D 0%,#1A1428 100%)', accent: '#A98EE0', spine: 'rgba(169,142,224,0.35)' },
  Romance:       { bg: 'linear-gradient(160deg,#3D1F2A 0%,#281418 100%)', accent: '#F0A0A0', spine: 'rgba(240,160,160,0.35)' },
  'Sci-Fi':      { bg: 'linear-gradient(160deg,#1A2B3D 0%,#111C28 100%)', accent: '#7AAEE8', spine: 'rgba(122,174,232,0.35)' },
  Fiction:       { bg: 'linear-gradient(160deg,#2D2418 0%,#1C1610 100%)', accent: '#F5CC7A', spine: 'rgba(245,204,122,0.35)' },
  'Non-Fiction': { bg: 'linear-gradient(160deg,#1E2220 0%,#141715 100%)', accent: '#A8C8A8', spine: 'rgba(168,200,168,0.30)' },
  Biography:     { bg: 'linear-gradient(160deg,#2E2216 0%,#1C1510 100%)', accent: '#E8C090', spine: 'rgba(232,192,144,0.35)' },
  Mystery:       { bg: 'linear-gradient(160deg,#1D2828 0%,#121919 100%)', accent: '#A0D0A0', spine: 'rgba(160,208,160,0.30)' },
  Western:       { bg: 'linear-gradient(160deg,#2C2010 0%,#1C1408 100%)', accent: '#D4B08A', spine: 'rgba(212,176,138,0.35)' },
  War:           { bg: 'linear-gradient(160deg,#2A1C1C 0%,#1A1010 100%)', accent: '#D09090', spine: 'rgba(208,144,144,0.30)' },
  'Young Adult': { bg: 'linear-gradient(160deg,#1A2C30 0%,#101C20 100%)', accent: '#80C8D8', spine: 'rgba(128,200,216,0.35)' },
  Thriller:      { bg: 'linear-gradient(160deg,#201A2E 0%,#14101E 100%)', accent: '#A090C8', spine: 'rgba(160,144,200,0.30)' },
  Historical:    { bg: 'linear-gradient(160deg,#28200E 0%,#181408 100%)', accent: '#C8A870', spine: 'rgba(200,168,112,0.30)' },
  Crime:         { bg: 'linear-gradient(160deg,#1E1818 0%,#131010 100%)', accent: '#C09898', spine: 'rgba(192,152,152,0.30)' },
};
const DEFAULT_PALETTE = { bg: 'linear-gradient(160deg,#302B3E 0%,#1C1921 100%)', accent: '#F5CC7A', spine: 'rgba(245,204,122,0.25)' };

export default function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const [cover, setCover] = useState<string | null>(book.coverUrl || null);
  const [hover, setHover] = useState(false);
  const palette = GENRE_PALETTE[book.genres[0]] || DEFAULT_PALETTE;

  useEffect(() => {
    if (!cover) {
      fetchCoverUrl(book.title, book.author).then(url => { if (url) setCover(url); });
    }
  }, []);

  const statusDot = {
    Completed:      { bg: '#6BBFB0', glow: 'rgba(107,191,176,0.6)' },
    Reading:        { bg: '#E8A838', glow: 'rgba(232,168,56,0.7)' },
    'Want to Read': { bg: 'rgba(240,234,224,0.25)', glow: 'none' },
    DNF:            { bg: '#E07878', glow: 'rgba(224,120,120,0.5)' },
  }[book.status] || { bg: 'rgba(240,234,224,0.25)', glow: 'none' };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#1C1921',
        border: book.status === 'Reading'
          ? '1px solid rgba(232,168,56,0.45)'
          : hover ? '1px solid rgba(232,168,56,0.30)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hover ? 'translateY(-4px)' : 'none',
        boxShadow: hover ? '0 14px 36px rgba(0,0,0,0.55)' : book.status === 'Reading' ? '0 0 0 1px rgba(232,168,56,0.20)' : 'none',
        transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
      }}
    >
      {/* Cover */}
      <div style={{ width: '100%', aspectRatio: '2/3', overflow: 'hidden', position: 'relative' }}>
        {cover ? (
          <img src={cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: palette.bg,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'space-between', padding: '14px 10px 16px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Spine accent line */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', background: `linear-gradient(180deg, transparent 0%, ${palette.spine} 30%, ${palette.spine} 70%, transparent 100%)` }} />
            {/* Top decoration */}
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `radial-gradient(circle, ${palette.accent}26 0%, transparent 70%)`, border: `1px solid ${palette.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, opacity: 0.7 }}>📖</div>
            {/* Title block */}
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 2px' }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 10, fontWeight: 700, color: palette.accent, textAlign: 'center', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                {book.title}
              </span>
            </div>
            {/* Author */}
            <span style={{ fontSize: 9, color: `${palette.accent}99`, textAlign: 'center', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
              {book.author}
            </span>
          </div>
        )}
        {/* Status dot */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 7, height: 7, borderRadius: '50%',
          background: statusDot.bg,
          boxShadow: statusDot.glow !== 'none' ? `0 0 7px ${statusDot.glow}` : 'none',
        }} />
      </div>

      {/* Info */}
      <div style={{ padding: '10px 11px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#F0EAE0', lineHeight: 1.35, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
          {book.title}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(240,234,224,0.5)', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {book.author}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          {book.genres[0] && <GenreTag genre={book.genres[0]} />}
          {book.rating ? <StarRating rating={book.rating} size={11} /> : null}
        </div>
      </div>
    </div>
  );
}
