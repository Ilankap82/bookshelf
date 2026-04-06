import { useState } from 'react';
import type { Book, Status, Format, SeriesType, Genre } from '../types';


const STATUSES: Status[] = ['Completed','Reading','Want to Read','DNF'];
const FORMATS: Format[] = ['eBook','Audio Book','Print','Book & Audio'];
const SERIES_TYPES: SeriesType[] = ['Standalone','Series','Trilogy','Duology','Saga'];
const RATINGS = [0.5,1,1.5,2,2.5,3,3.5,4,4.5,5];
const ALL_GENRES: Genre[] = ['Fantasy','Romance','Sci-Fi','Fiction','Non-Fiction','Biography','Mystery','Western','War','Young Adult','Thriller','Historical'];

export default function BookForm({ book, onSave, onClose }: { book: Book | null; onSave: (b: Book) => void; onClose: () => void; }) {
  const [form, setForm] = useState<Partial<Book>>(book || {
    status: 'Want to Read', genres: [], tropes: [], seriesType: 'Standalone',
  });
  const [tropeInput, setTropeInput] = useState('');

  function set(key: keyof Book, val: any) { setForm(prev => ({ ...prev, [key]: val })); }

  function toggleGenre(g: Genre) {
    set('genres', form.genres?.includes(g)
      ? form.genres.filter(x => x !== g)
      : [...(form.genres || []), g]);
  }

  function addTrope() {
    const t = tropeInput.trim(); if (!t) return;
    set('tropes', [...(form.tropes || []), t]);
    setTropeInput('');
  }

  function removeTrope(t: string) { set('tropes', (form.tropes || []).filter(x => x !== t)); }

  function handleSave() {
    if (!form.title || !form.author) return alert('Title and author are required.');
    const book: Book = {
      id: form.id || Date.now().toString(),
      title: form.title!, author: form.author!, status: form.status || 'Want to Read',
      genres: form.genres || [], tropes: form.tropes || [],
      startDate: form.startDate, finishDate: form.finishDate,
      pageCount: form.pageCount ? Number(form.pageCount) : undefined,
      rating: form.rating, format: form.format, seriesName: form.seriesName,
      seriesType: form.seriesType, seriesPosition: form.seriesPosition ? Number(form.seriesPosition) : undefined,
      notes: form.notes,
      pagesRead: form.pagesRead ? Number(form.pagesRead) : undefined,
    };
    onSave(book);
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:110, display:'flex', justifyContent:'flex-end', backdropFilter:'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:440, background:'#141218', height:'100%', overflowY:'auto', borderLeft:'1px solid rgba(255,255,255,0.10)', boxShadow:'-12px 0 60px rgba(0,0,0,0.60)', animation:'slideIn 0.25s cubic-bezier(0.16,1,0.3,1)', position:'relative' }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ padding:'24px 24px 18px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#F0EAE0' }}>
            {book ? 'Edit Book' : 'Add New Book'}
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', width:30, height:30, borderRadius:'50%', fontSize:13, cursor:'pointer', color:'rgba(240,234,224,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        {/* Form */}
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:18 }}>

          <Field label="Title *">
            <input style={inputStyle} value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Book title" />
          </Field>

          <Field label="Author *">
            <input style={inputStyle} value={form.author || ''} onChange={e => set('author', e.target.value)} placeholder="Author name" />
          </Field>

          <Field label="Status">
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {STATUSES.map(s => (
                <ToggleBtn key={s} label={s} active={form.status === s} onClick={() => set('status', s)} />
              ))}
            </div>
          </Field>

          <Field label="Genres">
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {ALL_GENRES.map(g => (
                <ToggleBtn key={g} label={g} active={(form.genres || []).includes(g)} onClick={() => toggleGenre(g)} />
              ))}
            </div>
          </Field>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Start Date">
              <input style={inputStyle} type="date" value={form.startDate || ''} onChange={e => set('startDate', e.target.value)} />
            </Field>
            <Field label="Finish Date">
              <input style={inputStyle} type="date" value={form.finishDate || ''} onChange={e => set('finishDate', e.target.value)} />
            </Field>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Page Count">
              <input style={inputStyle} type="number" value={form.pageCount || ''} onChange={e => set('pageCount', e.target.value)} placeholder="e.g. 416" />
            </Field>
            <Field label="Rating">
              <select style={inputStyle} value={form.rating || ''} onChange={e => set('rating', e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">No rating</option>
                {RATINGS.map(r => <option key={r} value={r}>{r} ★</option>)}
              </select>
            </Field>
          </div>

          {form.status === 'Reading' && (
            <Field label="Pages Read">
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <input style={inputStyle} type="number" value={form.pagesRead || ''} onChange={e => set('pagesRead', e.target.value ? Number(e.target.value) : undefined)} placeholder="How far are you?" min={0} max={form.pageCount || undefined} />
                {form.pagesRead && form.pageCount ? (
                  <div>
                    <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(100, Math.round((Number(form.pagesRead)/Number(form.pageCount))*100))}%`, background:'linear-gradient(90deg,#B07820,#E8A838)', borderRadius:2, transition:'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize:10, color:'rgba(240,234,224,0.4)', marginTop:4 }}>
                      {Math.min(100, Math.round((Number(form.pagesRead)/Number(form.pageCount))*100))}% · {Number(form.pageCount) - Number(form.pagesRead)} pages left
                    </div>
                  </div>
                ) : null}
              </div>
            </Field>
          )}

          <Field label="Format">
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {FORMATS.map(f => <ToggleBtn key={f} label={f} active={form.format === f} onClick={() => set('format', f)} />)}
            </div>
          </Field>

          <Field label="Series">
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              {SERIES_TYPES.map(t => <ToggleBtn key={t} label={t} active={form.seriesType === t} onClick={() => set('seriesType', t)} />)}
            </div>
            {form.seriesType !== 'Standalone' && (
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:8, marginTop:8 }}>
                <input style={inputStyle} value={form.seriesName || ''} onChange={e => set('seriesName', e.target.value)} placeholder="Series name" />
                <input style={inputStyle} type="number" value={form.seriesPosition || ''} onChange={e => set('seriesPosition', e.target.value)} placeholder="#" min={1} />
              </div>
            )}
          </Field>

          <Field label="Tropes">
            <div style={{ display:'flex', gap:6, marginBottom:6 }}>
              <input style={{ ...inputStyle, flex:1 }} value={tropeInput} onChange={e => setTropeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTrope(); } }}
                placeholder="Type a trope and press Enter" />
              <button onClick={addTrope} style={{ padding:'7px 12px', background:'rgba(232,168,56,0.18)', border:'1px solid rgba(232,168,56,0.3)', borderRadius:7, color:'#E8A838', cursor:'pointer', fontSize:13, fontWeight:600 }}>Add</button>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {(form.tropes || []).map(t => (
                <span key={t} style={{ background:'rgba(232,168,56,0.12)', color:'#F5CC7A', fontSize:11, padding:'3px 9px', borderRadius:10, border:'1px solid rgba(232,168,56,0.20)', display:'flex', alignItems:'center', gap:5 }}>
                  {t}
                  <span onClick={() => removeTrope(t)} style={{ cursor:'pointer', opacity:0.6, fontSize:10 }}>✕</span>
                </span>
              ))}
            </div>
          </Field>

          <Field label="Notes">
            <textarea style={{ ...inputStyle, height:80, resize:'vertical' as const }}
              value={form.notes || ''} onChange={e => set('notes', e.target.value)}
              placeholder="Personal notes, thoughts, quotes..." />
          </Field>

        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px 28px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:10, position:'sticky', bottom:0, background:'#141218' }}>
          <button onClick={handleSave} style={{ flex:1, padding:'11px 0', borderRadius:8, fontSize:14, fontFamily:"'DM Sans',sans-serif", cursor:'pointer', border:'1px solid rgba(255,200,80,0.5)', fontWeight:600, background:'linear-gradient(160deg,#F2BC45 0%,#CC8E1E 100%)', color:'#0D0C0F' }}>
            {book ? 'Save Changes' : 'Add Book'}
          </button>
          <button onClick={onClose} style={{ padding:'11px 18px', borderRadius:8, fontSize:13, cursor:'pointer', border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.07)', color:'rgba(240,234,224,0.7)' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.8px', color:'rgba(240,234,224,0.45)', fontWeight:600, marginBottom:7 }}>{label}</div>
      {children}
    </div>
  );
}

function ToggleBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight: active ? 600 : 500,
      cursor:'pointer', userSelect:'none',
      border: active ? '1px solid rgba(232,168,56,0.45)' : '1px solid rgba(255,255,255,0.12)',
      background: active ? 'rgba(232,168,56,0.18)' : 'rgba(255,255,255,0.05)',
      color: active ? '#F5CC7A' : 'rgba(240,234,224,0.55)',
      transition:'all 0.12s',
    }}>{label}</div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)',
  borderRadius:8, padding:'8px 12px', fontSize:13, fontFamily:"'DM Sans',sans-serif",
  color:'#F0EAE0', outline:'none', boxSizing:'border-box',
};
