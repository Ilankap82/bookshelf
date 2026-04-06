import { useState } from 'react';
import type { Book } from '../types';

type View = 'home' | 'library' | 'discovery' | 'stats';
type FilterStatus = 'All' | 'Completed' | 'Reading' | 'Want to Read' | 'DNF';

interface Props {
  view: View;
  onViewChange: (v: View) => void;
  counts: { all: number; completed: number; reading: number; wantToRead: number; dnf: number };
  currentlyReading?: Book | null;
  filterStatus: FilterStatus;
  onFilterStatus: (s: FilterStatus) => void;
  onAddBook: () => void;
}

// Thin SVG icons
const Icons = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  library: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  discovery: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  ),
  stats: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

export default function Sidebar({ view, onViewChange, counts, currentlyReading, filterStatus, onFilterStatus, onAddBook }: Props) {
  return (
    <aside style={{
      width: 240, minHeight: '100vh',
      background: '#F1F1ED',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 22px 20px' }}>
        <div style={{ fontFamily: "'Newsreader', serif", fontSize: 20, fontWeight: 600, color: '#006241', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(145deg, #067D55, #006241)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          BookTrack
        </div>
        <div style={{ fontSize: 10, color: '#6B6B6B', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 5, paddingLeft: 41, fontWeight: 500 }}>
          Editorial Archivist
        </div>
      </div>

      {/* Add New Book CTA */}
      <div style={{ padding: '0 14px 18px' }}>
        <button
          onClick={onAddBook}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontFamily: "'Manrope', sans-serif",
            cursor: 'pointer', border: 'none', fontWeight: 600,
            background: 'linear-gradient(160deg, #067D55 0%, #006241 100%)',
            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 2px 8px rgba(0,98,65,0.25)',
            transition: 'box-shadow 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,98,65,0.35)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,98,65,0.25)')}
        >
          {Icons.plus}
          Add New Book
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0 10px', flex: 1 }}>
        <NavItem icon={Icons.home} label="Home" active={view === 'home'} onClick={() => onViewChange('home')} />
        <NavItem icon={Icons.library} label="Library" badge={counts.all} active={view === 'library'} onClick={() => onViewChange('library')} />
        <NavItem icon={Icons.discovery} label="Discovery" active={view === 'discovery'} onClick={() => onViewChange('discovery')} />
        <NavItem icon={Icons.stats} label="Stats" active={view === 'stats'} onClick={() => onViewChange('stats')} />

        <div style={navLabel}>By Status</div>
        <NavItem
          dot="#067D55"
          label="Completed"
          count={counts.completed}
          active={filterStatus === 'Completed'}
          onClick={() => onFilterStatus('Completed')}
        />
        <NavItem
          dot="#D97706"
          label="Reading"
          count={counts.reading}
          active={filterStatus === 'Reading'}
          onClick={() => onFilterStatus('Reading')}
        />
        <NavItem
          dot="#A8A8A0"
          label="Want to Read"
          count={counts.wantToRead}
          active={filterStatus === 'Want to Read'}
          onClick={() => onFilterStatus('Want to Read')}
        />
        <NavItem
          dot="#DC2626"
          label="DNF"
          count={counts.dnf}
          active={filterStatus === 'DNF'}
          onClick={() => onFilterStatus('DNF')}
        />
      </nav>

      {/* Currently reading footer */}
      {currentlyReading && (
        <div style={{ padding: '16px 18px 22px', borderTop: '1px solid rgba(45,45,45,0.08)' }}>
          <div style={{ fontSize: 9, letterSpacing: '1.8px', textTransform: 'uppercase' as const, color: '#6B6B6B', fontWeight: 700, marginBottom: 10 }}>Now Reading</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 34, flexShrink: 0, aspectRatio: '2/3', borderRadius: 5, background: 'linear-gradient(160deg,#E8F5F0,#C8E8DC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, overflow: 'hidden' }}>
              {currentlyReading.coverUrl
                ? <img src={currentlyReading.coverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '📖'
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#2D2D2D', lineHeight: 1.3, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{currentlyReading.title}</div>
              <div style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 7 }}>{currentlyReading.author}</div>
              <div style={{ height: 3, background: 'rgba(45,45,45,0.10)', borderRadius: 2, overflow: 'hidden' }}>
                {(() => {
                  const pct = (currentlyReading.pagesRead && currentlyReading.pageCount) ? Math.min(100, Math.round((currentlyReading.pagesRead / currentlyReading.pageCount) * 100)) : null;
                  return <div style={{ height: '100%', width: pct !== null ? `${pct}%` : '0%', background: 'linear-gradient(90deg, #067D55, #006241)', borderRadius: 2 }} />;
                })()}
              </div>
              {(currentlyReading.pagesRead && currentlyReading.pageCount) && (
                <div style={{ fontSize: 9, color: '#6B6B6B', marginTop: 4 }}>
                  {Math.min(100, Math.round((currentlyReading.pagesRead / currentlyReading.pageCount) * 100))}% · pg {currentlyReading.pagesRead}/{currentlyReading.pageCount}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings at bottom */}
      <div style={{ padding: '10px 10px 14px', borderTop: '1px solid rgba(45,45,45,0.08)' }}>
        <NavItem icon={Icons.settings} label="Settings" active={false} onClick={() => {}} />
      </div>
    </aside>
  );
}

const navLabel: React.CSSProperties = {
  fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5,
  color: '#6B6B6B', padding: '0 14px',
  marginTop: 22, marginBottom: 4, fontWeight: 700,
};

function NavItem({ icon, dot, label, badge, count, active, onClick }: {
  icon?: React.ReactNode;
  dot?: string;
  label: string;
  badge?: number;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
        fontSize: 13.5, fontWeight: active ? 600 : 500,
        color: active ? '#006241' : hover ? '#2D2D2D' : '#4B4B4B',
        background: active ? 'rgba(0,98,65,0.08)' : hover ? 'rgba(45,45,45,0.05)' : 'transparent',
        transition: 'all 0.15s ease',
        marginBottom: 1,
        userSelect: 'none' as const,
      }}
    >
      {icon && <span style={{ flexShrink: 0, display: 'flex', color: active ? '#006241' : '#6B6B6B' }}>{icon}</span>}
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: dot }} />}
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && (
        <span style={{ background: '#006241', color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>{badge}</span>
      )}
      {count !== undefined && (
        <span style={{ fontSize: 11.5, color: '#6B6B6B', background: 'rgba(45,45,45,0.08)', padding: '1px 7px', borderRadius: 10 }}>{count}</span>
      )}
    </div>
  );
}
