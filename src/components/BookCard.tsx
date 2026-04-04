import { useState, useEffect } from 'react';
import type { Book } from '../types';
import { GenreTag, StarRating } from '../App';
import { fetchCoverUrl } from '../utils/cover';

export default function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const [cover, setCover] = useState<string | null>(book.coverUrl || null);
  const [hover, setHover] = useState(false);

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
            onError={() => setCover(null)} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(160deg,#302B3E 0%,#1C1921 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, padding: 12,
          }}>
            <span style={{ fontSize: 26, opacity: 0.4 }}>📖</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 10, fontWeight: 600, color: '#F5CC7A', textAlign: 'center', lineHeight: 1.4, opacity: 0.85 }}>
              {book.title}
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
