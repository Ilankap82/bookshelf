import { useState } from 'react';

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
