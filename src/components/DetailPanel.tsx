import { useState, useEffect } from 'react';
import type { Book } from '../types';
import { GenreTag, StarRating } from '../App';
import { fetchCoverUrl } from '../utils/cover';

export default function DetailPanel({ book, onClose, onEdit, onDelete }: {
  book: Book; onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [cover, setCover] = useState<string | null>(book.coverUrl || null);
  const [coverError, setCoverError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setCover(book.coverUrl || null);
    setCoverError(false);
    setConfirmDelete(false);
    if (!book.coverUrl) {
      fetchCoverUrl(book.title, book.author).then(url => { if (url) setCover(url); });
    }
  }, [book.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
    Completed:      { bg: 'rgba(6,125,85,0.10)',  color: '#067D55', dot: '#067D55' },
    Reading:        { bg: 'rgba(217,119,6,0.10)',  color: '#D97706', dot: '#D97706' },
    'Want to Read': { bg: 'rgba(45,45,45,0.07)',   color: '#6B6B6B', dot: '#A8A8A0' },
    DNF:            { bg: 'rgba(220,38,38,0.10)',  color: '#DC2626', dot: '#DC2626' },
  };
  const ss = statusStyle[book.status] || statusStyle['Want to Read'];

  function daysBetween(a?: string, b?: string) {
    if (!a || !b) return null;
    const diff = new Date(b).getTime() - new Date(a).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  const days = daysBetween(book.startDate, book.finishDate);

  function fmtDate(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const pct = (book.pagesRead && book.pageCount) ? Math.min(100, Math.round((book.pagesRead / book.pageCount) * 100)) : null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(27,28,25,0.45)', zIndex: 100, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 520, background: '#FAF9F4', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 60px rgba(27,28,25,0.15)', position: 'relative', animation: 'slideIn 0.28s cubic-bezier(0.16,1,0.3,1)' }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Top action bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderBottom: '1px solid rgba(45,45,45,0.08)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: '#6B6B6B' }}>Book Detail</span>
          <button
            onClick={onClose}
            style={{ background: 'rgba(45,45,45,0.08)', border: 'none', width: 28, height: 28, borderRadius: '50%', fontSize: 13, cursor: 'pointer', color: '#4B4B4B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Split layout: cover + metadata */}
        <div style={{ display: 'flex', gap: 0, padding: '28px 24px', borderBottom: '1px solid rgba(45,45,45,0.08)' }}>
          {/* Cover — 45% */}
          <div style={{ width: '42%', flexShrink: 0, paddingRight: 22 }}>
            <div style={{ aspectRatio: '2/3', borderRadius: 10, overflow: 'hidden', boxShadow: '0px 12px 32px rgba(27,28,25,0.14)', background: 'linear-gradient(160deg,#E8F5F0,#C8E8DC)' }}>
              {cover && !coverError
                ? <img src={cover} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setCoverError(true)} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, opacity: 0.5 }}>📖</div>
              }
            </div>
          </div>

          {/* Metadata — 58% */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <div style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic' as const, fontSize: 20, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.3, marginBottom: 5 }}>{book.title}</div>
            <div style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 14 }}>{book.author}</div>

            {/* Metadata ribbon */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' as const }}>
              {book.pageCount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  <span style={{ fontSize: 12, color: '#4B4B4B', fontWeight: 500 }}>{book.pageCount.toLocaleString()} pp</span>
                </div>
              )}
              {book.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <StarRating rating={book.rating} size={13} />
                  <span style={{ fontSize: 12, color: '#4B4B4B', fontWeight: 500 }}>{book.rating}</span>
                </div>
              )}
              {book.format && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B6B6B" strokeWidth="1.6"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  <span style={{ fontSize: 12, color: '#4B4B4B', fontWeight: 500 }}>{book.format}</span>
                </div>
              )}
            </div>

            {/* Status badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '4px 11px', borderRadius: 12, background: ss.bg, color: ss.color, marginBottom: 12 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ss.dot, flexShrink: 0 }} />
              {book.status}
            </div>

            {/* Reading progress */}
            {book.status === 'Reading' && pct !== null && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: '#6B6B6B' }}>Reading progress</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#006241' }}>{pct}%</span>
                </div>
                <div style={{ height: 5, background: '#F1F1ED', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #067D55, #006241)', borderRadius: 3 }} />
                </div>
              </div>
            )}

            {/* Genre tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
              {book.genres.map(g => <GenreTag key={g} genre={g} />)}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', flex: 1 }}>
          {/* Metadata rows */}
          <Row label="Started"  value={fmtDate(book.startDate)} />
          <Row label="Finished" value={book.finishDate ? `${fmtDate(book.finishDate)}${days ? ` · ${days} days` : ''}` : '—'} />
          <Row label="Series"   value={book.seriesType === 'Standalone' || !book.seriesName
            ? (book.seriesType || '—')
            : `${book.seriesName}${book.seriesPosition ? ` #${book.seriesPosition}` : ''} · ${book.seriesType}`} />

          {book.tropes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Tropes</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginTop: 6 }}>
                {book.tropes.map(t => (
                  <span key={t} style={{ background: 'rgba(0,98,65,0.08)', color: '#006241', fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 10 }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Personal Notes */}
          {book.notes && (
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Personal Notes</div>
              <div style={{ marginTop: 8, padding: '12px 14px', background: '#F1F1ED', borderRadius: 8, fontSize: 13, color: '#4B4B4B', fontStyle: 'italic' as const, lineHeight: 1.7 }}>
                {book.notes}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(45,45,45,0.08)', display: 'flex', gap: 8 }}>
          <button
            onClick={onEdit}
            style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13, fontFamily: "'Manrope', sans-serif", cursor: 'pointer', border: 'none', fontWeight: 600, background: 'linear-gradient(160deg, #067D55 0%, #006241 100%)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,98,65,0.25)' }}
          >
            Edit Book
          </button>
          {confirmDelete ? (
            <>
              <button onClick={onDelete} style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '1px solid rgba(220,38,38,0.35)', background: 'rgba(220,38,38,0.08)', color: '#DC2626', fontWeight: 600 }}>Confirm Delete</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '1px solid rgba(45,45,45,0.18)', background: 'transparent', color: '#4B4B4B' }}>Cancel</button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: '1px solid rgba(220,38,38,0.25)', background: 'transparent', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '1px',
  color: '#6B6B6B', fontWeight: 700, marginBottom: 0,
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', marginBottom: 14, alignItems: 'flex-start', gap: 16 }}>
      <div style={{ ...labelStyle, width: 80, flexShrink: 0, paddingTop: 1 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#2D2D2D', lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}
