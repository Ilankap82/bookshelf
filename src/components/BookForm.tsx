import { useState } from 'react';
import type { Book, Status, Format, SeriesType, Genre } from '../types';
import { GenreTag } from '../App';

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
    const saved: Book = {
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
    onSave(saved);
  }

  const pct = (form.pagesRead && form.pageCount) ? Math.min(100, Math.round((Number(form.pagesRead) / Number(form.pageCount)) * 100)) : null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(27,28,25,0.45)', zIndex: 110, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 840, background: '#FAF9F4', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 60px rgba(27,28,25,0.15)', animation: 'slideIn 0.25s cubic-bezier(0.16,1,0.3,1)', position: 'relative', overflow: 'hidden' }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(45,45,45,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic' as const, fontSize: 20, fontWeight: 600, color: '#2D2D2D' }}>
            {book ? 'Edit Book' : 'Add to Archive'}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(45,45,45,0.08)', border: 'none', width: 28, height: 28, borderRadius: '50%', fontSize: 13, cursor: 'pointer', color: '#4B4B4B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Two-column body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: Form */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            <Field label="Title *">
              <input style={inputStyle} value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Book title" />
            </Field>

            <Field label="Author *">
              <input style={inputStyle} value={form.author || ''} onChange={e => set('author', e.target.value)} placeholder="Author name" />
            </Field>

            <Field label="Status">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {STATUSES.map(s => <ToggleBtn key={s} label={s} active={form.status === s} onClick={() => set('status', s)} />)}
              </div>
            </Field>

            <Field label="Genres">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {ALL_GENRES.map(g => <ToggleBtn key={g} label={g} active={(form.genres || []).includes(g)} onClick={() => toggleGenre(g)} />)}
              </div>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Start Date">
                <input style={inputStyle} type="date" value={form.startDate || ''} onChange={e => set('startDate', e.target.value)} />
              </Field>
              <Field label="Finish Date">
                <input style={inputStyle} type="date" value={form.finishDate || ''} onChange={e => set('finishDate', e.target.value)} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    style={inputStyle} type="number"
                    value={form.pagesRead || ''}
                    onChange={e => set('pagesRead', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="How far are you?" min={0} max={form.pageCount || undefined}
                  />
                  {pct !== null && (
                    <div>
                      <div style={{ height: 4, background: '#F1F1ED', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#067D55,#006241)', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                      <div style={{ fontSize: 10, color: '#6B6B6B', marginTop: 4 }}>
                        {pct}% · {Number(form.pageCount) - Number(form.pagesRead)} pages left
                      </div>
                    </div>
                  )}
                </div>
              </Field>
            )}

            <Field label="Format">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {FORMATS.map(f => <ToggleBtn key={f} label={f} active={form.format === f} onClick={() => set('format', f)} />)}
              </div>
            </Field>

            <Field label="Series">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                {SERIES_TYPES.map(t => <ToggleBtn key={t} label={t} active={form.seriesType === t} onClick={() => set('seriesType', t)} />)}
              </div>
              {form.seriesType !== 'Standalone' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginTop: 8 }}>
                  <input style={inputStyle} value={form.seriesName || ''} onChange={e => set('seriesName', e.target.value)} placeholder="Series name" />
                  <input style={inputStyle} type="number" value={form.seriesPosition || ''} onChange={e => set('seriesPosition', e.target.value)} placeholder="#" min={1} />
                </div>
              )}
            </Field>

            <Field label="Tropes">
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={tropeInput}
                  onChange={e => setTropeInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTrope(); } }}
                  placeholder="Type a trope and press Enter"
                />
                <button onClick={addTrope} style={{ padding: '7px 12px', background: 'rgba(0,98,65,0.10)', border: '1px solid rgba(0,98,65,0.25)', borderRadius: 7, color: '#006241', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                {(form.tropes || []).map(t => (
                  <span key={t} style={{ background: 'rgba(0,98,65,0.08)', color: '#006241', fontSize: 11, padding: '3px 9px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {t}
                    <span onClick={() => removeTrope(t)} style={{ cursor: 'pointer', opacity: 0.6, fontSize: 10 }}>✕</span>
                  </span>
                ))}
              </div>
            </Field>

            <Field label="Notes">
              <textarea
                style={{ ...inputStyle, height: 80, resize: 'vertical' as const }}
                value={form.notes || ''}
                onChange={e => set('notes', e.target.value)}
                placeholder="Personal notes, thoughts, quotes..."
              />
            </Field>
          </div>

          {/* Right: Live Preview */}
          <div style={{ width: 240, background: '#F1F1ED', borderLeft: '1px solid rgba(45,45,45,0.08)', display: 'flex', flexDirection: 'column', padding: '24px 18px', gap: 0, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: '#6B6B6B', marginBottom: 16 }}>Preview</div>

            {/* Mini book card preview */}
            <div style={{ background: '#FFFFFF', borderRadius: 10, overflow: 'hidden', boxShadow: '0px 8px 24px rgba(27,28,25,0.08)', marginBottom: 16 }}>
              {/* Cover placeholder */}
              <div style={{ width: '100%', aspectRatio: '2/3', background: form.genres?.[0]
                ? 'linear-gradient(160deg,#E8F5F0,#C8E8DC)'
                : 'linear-gradient(160deg,#F1F1ED,#E8E8E0)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '14px 10px 16px', position: 'relative' as const,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,98,65,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>📖</div>
                <div style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 4px' }}>
                  <span style={{ fontFamily: "'Newsreader', serif", fontSize: 10.5, fontWeight: 600, color: '#006241', textAlign: 'center', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                    {form.title || 'Book Title'}
                  </span>
                </div>
                <span style={{ fontSize: 9, color: 'rgba(0,98,65,0.6)', textAlign: 'center' }}>{form.author || 'Author'}</span>
              </div>
              <div style={{ padding: '10px 11px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.35, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                  {form.title || 'Book Title'}
                </div>
                <div style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 8 }}>{form.author || 'Author'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' as const }}>
                  {form.genres?.slice(0, 2).map(g => <GenreTag key={g} genre={g} />)}
                </div>
              </div>
            </div>

            {/* Status pill */}
            {form.status && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '4px 11px', borderRadius: 12, background: 'rgba(0,98,65,0.10)', color: '#006241', marginBottom: 10, alignSelf: 'flex-start' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#006241' }} />
                {form.status}
              </div>
            )}

            {/* Progress if reading */}
            {form.status === 'Reading' && pct !== null && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#6B6B6B' }}>Progress</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#006241' }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(45,45,45,0.10)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#067D55,#006241)', borderRadius: 2 }} />
                </div>
              </div>
            )}

            {form.pageCount && (
              <div style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#2D2D2D' }}>{Number(form.pageCount).toLocaleString()}</span> pages
              </div>
            )}
            {form.rating && (
              <div style={{ fontSize: 12, color: '#D97706' }}>
                {'★'.repeat(Math.floor(form.rating))}{form.rating % 1 >= 0.5 ? '½' : ''} <span style={{ fontSize: 11, color: '#6B6B6B', marginLeft: 2 }}>{form.rating}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 28px 20px', borderTop: '1px solid rgba(45,45,45,0.08)', display: 'flex', gap: 10, flexShrink: 0, background: '#FAF9F4' }}>
          <button
            onClick={handleSave}
            style={{ flex: 1, padding: '11px 0', borderRadius: 8, fontSize: 14, fontFamily: "'Manrope', sans-serif", cursor: 'pointer', border: 'none', fontWeight: 600, background: 'linear-gradient(160deg, #067D55 0%, #006241 100%)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,98,65,0.25)' }}
          >
            {book ? 'Save Changes' : 'Add to Archive'}
          </button>
          <button
            onClick={onClose}
            style={{ padding: '11px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: '1px solid rgba(45,45,45,0.18)', background: 'transparent', color: '#4B4B4B' }}
          >
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
      <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.8px', color: '#6B6B6B', fontWeight: 700, marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}

function ToggleBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 500,
        cursor: 'pointer', userSelect: 'none' as const,
        border: active ? '1px solid rgba(0,98,65,0.35)' : '1px solid rgba(45,45,45,0.14)',
        background: active ? 'rgba(0,98,65,0.10)' : 'transparent',
        color: active ? '#006241' : '#6B6B6B',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#FFFFFF', border: '1px solid rgba(45,45,45,0.14)',
  borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: "'Manrope', sans-serif",
  color: '#2D2D2D', outline: 'none', boxSizing: 'border-box' as const,
};
