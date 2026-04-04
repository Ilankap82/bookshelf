import { useState, useEffect } from 'react';
import type { Book } from '../types';
import { GenreTag, StarRating } from '../App';
import { fetchCoverUrl } from '../utils/cover';

export default function DetailPanel({ book, onClose, onEdit, onDelete }: {
  book: Book; onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [cover, setCover] = useState<string | null>(book.coverUrl || null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setCover(book.coverUrl || null);
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
    Completed:      { bg: 'rgba(107,191,176,0.15)', color: '#6BBFB0', dot: '#6BBFB0' },
    Reading:        { bg: 'rgba(232,168,56,0.15)',  color: '#E8A838', dot: '#E8A838' },
    'Want to Read': { bg: 'rgba(240,234,224,0.08)', color: 'rgba(240,234,224,0.55)', dot: 'rgba(240,234,224,0.3)' },
    DNF:            { bg: 'rgba(224,120,120,0.15)', color: '#E07878', dot: '#E07878' },
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

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.60)', zIndex:100, display:'flex', justifyContent:'flex-end', backdropFilter:'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width:400, background:'#141218', height:'100%', overflowY:'auto', display:'flex', flexDirection:'column', borderLeft:'1px solid rgba(255,255,255,0.10)', boxShadow:'-12px 0 60px rgba(0,0,0,0.60)', position:'relative', animation:'slideIn 0.28s cubic-bezier(0.16,1,0.3,1)' }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', width:30, height:30, borderRadius:'50%', fontSize:13, cursor:'pointer', color:'rgba(240,234,224,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>✕</button>

        {/* Hero */}
        <div style={{ padding:'28px 24px 22px', display:'flex', gap:18, borderBottom:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(180deg,rgba(232,168,56,0.08) 0%,rgba(232,168,56,0.02) 50%,transparent 100%)', position:'relative' }}>
          <div style={{ width:86, flexShrink:0, aspectRatio:'2/3', borderRadius:6, overflow:'hidden', boxShadow:'4px 6px 24px rgba(0,0,0,0.55)', border:'1px solid rgba(255,255,255,0.10)' }}>
            {cover
              ? <img src={cover} alt={book.title} style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={() => setCover(null)} />
              : <div style={{ width:'100%',height:'100%',background:'linear-gradient(160deg,#3E384F,#1C1921)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,opacity:0.5 }}>📖</div>
            }
          </div>
          <div style={{ flex:1, minWidth:0, paddingTop:4 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#F0EAE0', lineHeight:1.3, marginBottom:4 }}>{book.title}</div>
            <div style={{ fontSize:13, color:'rgba(240,234,224,0.55)', marginBottom:10 }}>{book.author}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
              {book.genres.map(g => <GenreTag key={g} genre={g} />)}
            </div>
            {book.rating && <div style={{ fontSize:17, color:'#E8A838', letterSpacing:-0.5, marginBottom:8 }}><StarRating rating={book.rating} size={17} /></div>}
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:12, background:ss.bg, color:ss.color }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:ss.dot }} />
              {book.status}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'22px 24px', flex:1 }}>
          <Row label="Started"  value={fmtDate(book.startDate)} />
          <Row label="Finished" value={book.finishDate ? `${fmtDate(book.finishDate)}${days ? ` · ${days} days` : ''}` : '—'} />
          <Row label="Pages"    value={book.pageCount ? book.pageCount.toLocaleString() : '—'} />
          <Row label="Format"   value={book.format || '—'} />
          <Row label="Series"   value={book.seriesType === 'Standalone' || !book.seriesName
            ? (book.seriesType || '—')
            : `${book.seriesName}${book.seriesPosition ? ` #${book.seriesPosition}` : ''} · ${book.seriesType}`} />
          {book.tropes.length > 0 && (
            <div style={{ display:'flex', marginBottom:16, alignItems:'flex-start' }}>
              <div style={labelStyle}>Tropes</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {book.tropes.map(t => (
                  <span key={t} style={{ background:'rgba(232,168,56,0.12)', color:'#F5CC7A', fontSize:11, fontWeight:500, padding:'3px 9px', borderRadius:10, border:'1px solid rgba(232,168,56,0.20)' }}>{t}</span>
                ))}
              </div>
            </div>
          )}
          {book.notes && (
            <div style={{ display:'flex', marginBottom:16, alignItems:'flex-start' }}>
              <div style={labelStyle}>Notes</div>
              <div style={{ fontSize:13, color:'rgba(240,234,224,0.6)', fontStyle:'italic', lineHeight:1.6 }}>{book.notes}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding:'16px 24px 22px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:8 }}>
          <button onClick={onEdit} style={{ flex:1, padding:'9px 0', borderRadius:8, fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:'pointer', border:'1px solid rgba(255,200,80,0.5)', fontWeight:600, background:'linear-gradient(160deg,#F2BC45 0%,#CC8E1E 100%)', color:'#0D0C0F' }}>
            Edit Book
          </button>
          {confirmDelete ? (
            <>
              <button onClick={onDelete} style={{ padding:'9px 14px', borderRadius:8, fontSize:12, cursor:'pointer', border:'1px solid rgba(224,120,120,0.5)', background:'rgba(224,120,120,0.18)', color:'#E07878', fontWeight:600 }}>Confirm</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding:'9px 14px', borderRadius:8, fontSize:12, cursor:'pointer', border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.07)', color:'rgba(240,234,224,0.7)', fontWeight:500 }}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} style={{ padding:'9px 14px', borderRadius:8, fontSize:13, cursor:'pointer', border:'1px solid rgba(224,120,120,0.25)', background:'transparent', color:'#E07878' }}>🗑</button>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  width: 100, flexShrink: 0, fontSize: 11,
  textTransform: 'uppercase', letterSpacing: '0.8px',
  color: 'rgba(240,234,224,0.45)', fontWeight: 600, paddingTop: 1,
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:'flex', marginBottom:16, alignItems:'flex-start' }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize:13, color:'#F0EAE0', lineHeight:1.5 }}>{value}</div>
    </div>
  );
}
