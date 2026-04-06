import { useState, useEffect } from 'react';
import type { Book } from '../types';
import { GenreTag, StarRating } from '../App';
import { fetchCoverUrl, isBadCoverUrl } from '../utils/cover';

// Light-theme placeholder palette — tonal, editorial
const GENRE_PALETTE: Record<string, { bg: string; accent: string; text: string }> = {
  Fantasy:       { bg: 'linear-gradient(160deg,#EDE8F8 0%,#DDD4F5 100%)', accent: '#7C3AED', text: '#5B21B6' },
  Romance:       { bg: 'linear-gradient(160deg,#FDE8F0 0%,#FBD0E3 100%)', accent: '#DB2777', text: '#9D174D' },
  'Sci-Fi':      { bg: 'linear-gradient(160deg,#E8F0FE 0%,#D4E4FF 100%)', accent: '#2563EB', text: '#1E40AF' },
  Fiction:       { bg: 'linear-gradient(160deg,#E8F5F0 0%,#D0EBE1 100%)', accent: '#067D55', text: '#065F46' },
  'Non-Fiction': { bg: 'linear-gradient(160deg,#F5F5F0 0%,#E8E8E0 100%)', accent: '#4B4B4B', text: '#374151' },
  Biography:     { bg: 'linear-gradient(160deg,#FEF3E8 0%,#FDE8CC 100%)', accent: '#B45309', text: '#92400E' },
  Mystery:       { bg: 'linear-gradient(160deg,#E8F5EC 0%,#D0EBD8 100%)', accent: '#059669', text: '#064E3B' },
  Western:       { bg: 'linear-gradient(160deg,#FDF3E8 0%,#FAEBD0 100%)', accent: '#92400E', text: '#78350F' },
  War:           { bg: 'linear-gradient(160deg,#FEE8E8 0%,#FDD8D8 100%)', accent: '#B91C1C', text: '#7F1D1D' },
  'Young Adult': { bg: 'linear-gradient(160deg,#E8F9FE 0%,#CCF0FB 100%)', accent: '#0E7490', text: '#164E63' },
  Thriller:      { bg: 'linear-gradient(160deg,#EEE8FE 0%,#DDD4FC 100%)', accent: '#4F46E5', text: '#3730A3' },
  Historical:    { bg: 'linear-gradient(160deg,#FEF5E8 0%,#FCECD0 100%)', accent: '#B45309', text: '#92400E' },
  Crime:         { bg: 'linear-gradient(160deg,#FEE8EE 0%,#FCD4DF 100%)', accent: '#BE123C', text: '#9F1239' },
};
const DEFAULT_PALETTE = { bg: 'linear-gradient(160deg,#F1F1ED 0%,#E8E8E0 100%)', accent: '#006241', text: '#065F46' };

export default function BookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  const [cover, setCover] = useState<string | null>(book.coverUrl || null);
  const [coverError, setCoverError] = useState(false);
  const [fetchedFallback, setFetchedFallback] = useState(false);
  const [hover, setHover] = useState(false);
  const palette = GENRE_PALETTE[book.genres[0]] || DEFAULT_PALETTE;

  useEffect(() => {
    setCoverError(false);
    setFetchedFallback(false);
    const storedUrl = book.coverUrl;
    if (!storedUrl || isBadCoverUrl(storedUrl)) {
      // No cover or known-bad stored URL — fetch fresh
      fetchCoverUrl(book.title, book.author).then(url => { if (url) setCover(url); });
    } else {
      setCover(storedUrl);
    }
  }, [book.id]);

  // When the stored URL 404s, try fetching a fresh one from the API
  function handleCoverError() {
    if (!fetchedFallback) {
      setFetchedFallback(true);
      fetchCoverUrl(book.title, book.author).then(url => {
        if (url && url !== cover) {
          setCover(url);
          setCoverError(false);
        } else {
          setCoverError(true);
        }
      });
    } else {
      setCoverError(true);
    }
  }

  const statusDot = {
    Completed:      '#067D55',
    Reading:        '#D97706',
    'Want to Read': '#A8A8A0',
    DNF:            '#DC2626',
  }[book.status] || '#A8A8A0';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#FFFFFF',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hover ? 'translateY(-3px)' : 'none',
        boxShadow: hover
          ? '0px 16px 40px rgba(27,28,25,0.12)'
          : book.status === 'Reading'
            ? '0px 8px 24px rgba(0,98,65,0.10), 0 0 0 1.5px rgba(6,125,85,0.25)'
            : '0px 8px 24px rgba(27,28,25,0.06)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Cover */}
      <div style={{ width: '100%', aspectRatio: '2/3', overflow: 'hidden', position: 'relative' }}>
        {cover && !coverError ? (
          <img src={cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={handleCoverError} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: palette.bg,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'space-between', padding: '14px 10px 16px',
            position: 'relative',
          }}>
            {/* Thin spine line */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', background: `linear-gradient(180deg, transparent 0%, ${palette.accent}40 30%, ${palette.accent}40 70%, transparent 100%)` }} />
            {/* Icon */}
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${palette.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📖</div>
            {/* Title */}
            <div style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 4px' }}>
              <span style={{
                fontFamily: "'Newsreader', serif", fontSize: 10.5, fontWeight: 600,
                color: palette.text, textAlign: 'center', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
              }}>
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
          background: statusDot,
          boxShadow: `0 0 0 2px rgba(255,255,255,0.9)`,
        }} />
        {/* Reading progress bar at bottom of cover */}
        {book.status === 'Reading' && book.pagesRead && book.pageCount && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.4)' }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.round((book.pagesRead / book.pageCount) * 100))}%`, background: 'linear-gradient(90deg, #067D55, #006241)' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 11px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.35, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
          {book.title}
        </div>
        <div style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
