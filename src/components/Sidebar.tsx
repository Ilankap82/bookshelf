import { useState } from 'react';
import type { Book } from '../types';

type View = 'library' | 'recs' | 'stats';
type FilterStatus = 'All' | 'Completed' | 'Reading' | 'Want to Read' | 'DNF';

interface Props {
  view: View;
  onViewChange: (v: View) => void;
  counts: { all: number; completed: number; reading: number; wantToRead: number; dnf: number };
  currentlyReading?: Book;
  filterStatus: FilterStatus;
  onFilterStatus: (s: FilterStatus) => void;
}

export default function Sidebar({ view, onViewChange, counts, currentlyReading, filterStatus, onFilterStatus }: Props) {
  return (
    <aside style={{
      width: 236, minHeight: '100vh',
      background: 'linear-gradient(180deg,#17141E 0%,#131119 60%,#0F0D14 100%)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'relative', boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
    }}>
      {/* Amber glow on inner edge */}
      <div style={{ position:'absolute', top:0, right:0, width:1, height:'100%', background:'linear-gradient(180deg,transparent 0%,rgba(232,168,56,0.22) 25%,rgba(232,168,56,0.18) 60%,transparent 100%)', pointerEvents:'none' }} />

      {/* Logo */}
      <div style={{ padding:'28px 22px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'linear-gradient(180deg,rgba(232,168,56,0.05) 0%,transparent 100%)' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:'#F0EAE0', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:'linear-gradient(145deg,rgba(232,168,56,0.22),rgba(232,168,56,0.08))', border:'1px solid rgba(232,168,56,0.35)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, boxShadow:'0 2px 12px rgba(232,168,56,0.15)' }}>
            📖
          </div>
          Book<span style={{ color:'#E8A838' }}>shelf</span>
        </div>
        <div style={{ fontSize:'9.5px', color:'rgba(240,234,224,0.28)', letterSpacing:2, textTransform:'uppercase', marginTop:6, fontWeight:500, paddingLeft:42 }}>
          Reading Tracker
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding:'14px 10px', flex:1 }}>
        <div style={navLabel}>Views</div>
        <NavItem icon="☰" label="Library" badge={counts.all} active={view === 'library'} onClick={() => onViewChange('library')} />
        <NavItem icon="✨" label="Recommendations" active={view === 'recs'} onClick={() => onViewChange('recs')} />
        <NavItem icon="▲" label="Stats" active={view === 'stats'} onClick={() => onViewChange('stats')} />

        <div style={navLabel}>Status</div>
        <NavItem dot={{ color:'#6BBFB0', glow:'rgba(107,191,176,0.6)' }} label="Completed" count={counts.completed}
          active={view==='library' && filterStatus==='Completed'} onClick={() => onFilterStatus('Completed')} />
        <NavItem dot={{ color:'#E8A838', glow:'rgba(232,168,56,0.6)' }} label="Reading" count={counts.reading}
          active={view==='library' && filterStatus==='Reading'} onClick={() => onFilterStatus('Reading')} />
        <NavItem dot={{ color:'rgba(240,234,224,0.22)', glow:'none' }} label="Want to Read" count={counts.wantToRead}
          active={view==='library' && filterStatus==='Want to Read'} onClick={() => onFilterStatus('Want to Read')} />
        <NavItem dot={{ color:'#E07878', glow:'rgba(224,120,120,0.5)' }} label="DNF" count={counts.dnf}
          active={view==='library' && filterStatus==='DNF'} onClick={() => onFilterStatus('DNF')} />
      </nav>

      {/* Currently reading footer */}
      {currentlyReading && (
        <div style={{ padding:'16px 18px 22px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:9, letterSpacing:'1.8px', textTransform:'uppercase', color:'rgba(240,234,224,0.28)', fontWeight:600, marginBottom:12 }}>Now Reading</div>
          <div style={{ display:'flex', gap:11, alignItems:'flex-start' }}>
            <div style={{ width:34, flexShrink:0, aspectRatio:'2/3', borderRadius:4, background:'linear-gradient(145deg,#3E384F,#252130)', border:'1px solid rgba(255,255,255,0.10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>📖</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#F0EAE0', lineHeight:1.3, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{currentlyReading.title}</div>
              <div style={{ fontSize:11, color:'rgba(240,234,224,0.5)', marginBottom:7 }}>{currentlyReading.author}</div>
              <div style={{ height:3, background:'rgba(255,255,255,0.10)', borderRadius:2, overflow:'hidden' }}>
                {(() => {
                  const pct = (currentlyReading.pagesRead && currentlyReading.pageCount) ? Math.min(100, Math.round((currentlyReading.pagesRead / currentlyReading.pageCount) * 100)) : null;
                  return <div style={{ height:'100%', width: pct !== null ? `${pct}%` : '0%', background:'linear-gradient(90deg,#B07820,#E8A838)', borderRadius:2 }} />;
                })()}
              </div>
              {(currentlyReading.pagesRead && currentlyReading.pageCount) && (
                <div style={{ fontSize:9, color:'rgba(240,234,224,0.3)', marginTop:4 }}>
                  {Math.min(100, Math.round((currentlyReading.pagesRead / currentlyReading.pageCount) * 100))}% · pg {currentlyReading.pagesRead}/{currentlyReading.pageCount}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

const navLabel: React.CSSProperties = {
  fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: 2,
  color: 'rgba(240,234,224,0.28)', padding: '0 14px',
  marginTop: 24, marginBottom: 4, fontWeight: 700,
};

function NavItem({ icon, dot, label, badge, count, active, onClick }: {
  icon?: string; dot?: { color: string; glow: string };
  label: string; badge?: number; count?: number; active: boolean; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
        fontSize: '13.5px', fontWeight: active ? 600 : 500,
        color: active ? '#F0EAE0' : hover ? 'rgba(240,234,224,0.85)' : 'rgba(240,234,224,0.5)',
        background: active
          ? 'linear-gradient(135deg,rgba(232,168,56,0.16) 0%,rgba(232,168,56,0.07) 100%)'
          : hover ? 'rgba(240,234,224,0.06)' : 'transparent',
        border: active ? '1px solid rgba(232,168,56,0.25)' : hover ? '1px solid rgba(240,234,224,0.08)' : '1px solid transparent',
        position: 'relative', transition: 'all 0.15s', marginBottom: 2,
      }}
    >
      {active && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:20, background:'linear-gradient(180deg,#F5CC7A,#E8A838)', borderRadius:'0 3px 3px 0', boxShadow:'0 0 10px rgba(232,168,56,0.6)' }} />}
      {icon && <span style={{ fontSize:15, width:18, textAlign:'center', opacity: active ? 1 : 0.7, color: active ? '#E8A838' : 'inherit' }}>{icon}</span>}
      {dot && <span style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:dot.color, boxShadow: dot.glow !== 'none' ? `0 0 6px ${dot.glow}` : 'none' }} />}
      <span style={{ flex:1 }}>{label}</span>
      {badge !== undefined && <span style={{ background:'linear-gradient(135deg,#F2BC45,#C88820)', color:'#0D0C0F', fontSize:10.5, fontWeight:700, padding:'2px 9px', borderRadius:10, boxShadow:'0 2px 8px rgba(232,168,56,0.35)' }}>{badge}</span>}
      {count !== undefined && <span style={{ fontSize:11.5, color:'rgba(240,234,224,0.3)', background:'rgba(255,255,255,0.06)', padding:'1px 7px', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)' }}>{count}</span>}
    </div>
  );
}
