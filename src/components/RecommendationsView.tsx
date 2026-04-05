import { useState } from 'react';
import type { Book } from '../types';
import type { Recommendation } from '../data/recommendations';
import { FilterChip, GenreTag } from '../App';
import { S } from '../App';

const MOODS = ['All', 'Cozy', 'Page-turner', 'Emotional', 'Epic & long', 'Light read', 'Dark & complex'];

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
        <span style={S.pageTitle}>Recommendations</span>
        <div style={{ marginLeft:'auto', fontSize:12, color:'rgba(240,234,224,0.45)' }}>
          Matched to your taste · Fantasy, Fiction, Romance
        </div>
      </div>

      <div style={S.content}>
        {/* Mood filter */}
        <div style={{ display:'flex', gap:7, alignItems:'center', marginBottom:24, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'rgba(240,234,224,0.45)', fontWeight:500, marginRight:3 }}>Mood:</span>
          {MOODS.map(m => <FilterChip key={m} label={m} active={mood === m} onClick={() => setMood(m)} />)}
        </div>

        <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:20 }}>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:'#F0EAE0' }}>Picked for you</span>
          <span style={{ fontSize:12, color:'rgba(240,234,224,0.45)' }}>{filtered.length} books</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(r => <RecCard key={r.id} rec={r} onAdd={() => onAddToList(r)} />)}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(240,234,224,0.3)' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>✨</div>
              <div>No recommendations match this mood.</div>
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
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background:'#1C1921', border: hover ? '1px solid rgba(232,168,56,0.35)' : '1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px', display:'flex', gap:16, cursor:'default', transition:'border-color 0.15s,transform 0.15s,box-shadow 0.15s', transform: hover ? 'translateY(-2px)' : 'none', boxShadow: hover ? '0 10px 30px rgba(0,0,0,0.40)' : 'none' }}>

      {/* Thumb */}
      <div style={{ width:62, flexShrink:0, aspectRatio:'2/3', borderRadius:6, overflow:'hidden', background:'linear-gradient(160deg,#302B3E,#1C1921)', border:'1px solid rgba(255,255,255,0.10)', boxShadow:'2px 4px 12px rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Playfair Display',serif", fontSize:10, color:'#F5CC7A', textAlign:'center', padding:6, lineHeight:1.4 }}>
        {cover
          ? <img src={cover} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }} />
          : rec.title
        }
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        {/* Match badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:600, background:'rgba(232,168,56,0.12)', color:'#E8A838', padding:'2px 8px', borderRadius:10, border:'1px solid rgba(232,168,56,0.22)', marginBottom:6 }}>
          ✨ Matches your taste
        </div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:'#F0EAE0', marginBottom:2 }}>{rec.title}</div>
        <div style={{ fontSize:12, color:'rgba(240,234,224,0.5)', marginBottom:8 }}>{rec.author}{rec.pages ? ` · ${rec.pages} pages` : ''}</div>
        <div style={{ fontSize:12, color:'rgba(240,234,224,0.62)', lineHeight:1.6, marginBottom:10, fontStyle:'italic' }}>{rec.reason}</div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          {rec.genres.map(g => <GenreTag key={g} genre={g} />)}
          {rec.moods.slice(0,2).map(m => (
            <span key={m} style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:10, background:'rgba(107,191,176,0.10)', color:'#6BBFB0' }}>{m}</span>
          ))}
          <button
            onClick={() => window.open(`https://openlibrary.org/search?q=${encodeURIComponent(rec.title + ' ' + rec.author)}`, '_blank')}
            style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:8, border:'1px solid rgba(122,174,232,0.25)', background:'rgba(122,174,232,0.10)', color:'#7AAEE8', cursor:'pointer', marginLeft:'auto' }}>
            🔍 Look up
          </button>
          <button onClick={handleAdd} disabled={added}
            style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:8, border: added ? '1px solid rgba(107,191,176,0.3)' : '1px solid rgba(232,168,56,0.28)', background: added ? 'rgba(107,191,176,0.12)' : 'rgba(232,168,56,0.12)', color: added ? '#6BBFB0' : '#E8A838', cursor: added ? 'default' : 'pointer' }}>
            {added ? '✓ Added' : '+ Want to Read'}
          </button>
        </div>
      </div>
    </div>
  );
}
