import { useMemo } from 'react';
import type { Book } from '../types';
import { S } from '../App';

// Milestone definitions
const MILESTONES = [
  { id: 'first',      label: 'First Page',    icon: '📖', desc: 'Complete your first book',       check: (b: Book[]) => b.filter(x => x.status === 'Completed').length >= 1 },
  { id: 'five',       label: 'Avid Reader',   icon: '📚', desc: 'Complete 5 books',               check: (b: Book[]) => b.filter(x => x.status === 'Completed').length >= 5 },
  { id: 'ten',        label: 'Bibliophile',   icon: '🏛',  desc: 'Complete 10 books',              check: (b: Book[]) => b.filter(x => x.status === 'Completed').length >= 10 },
  { id: 'polymath',   label: 'The Polymath',  icon: '🧠', desc: 'Read across 5 different genres', check: (b: Book[]) => new Set(b.filter(x => x.status === 'Completed').flatMap(x => x.genres)).size >= 5 },
  { id: 'pages',      label: 'Page Turner',   icon: '⚡', desc: 'Read over 5,000 pages',          check: (b: Book[]) => b.filter(x => x.status === 'Completed').reduce((s, x) => s + (x.pageCount || 0), 0) >= 5000 },
  { id: 'nightowl',   label: 'Night Owl',     icon: '🦉', desc: 'Add 3 books to your archive',    check: (b: Book[]) => b.length >= 3 },
  { id: 'curator',    label: 'Lead Curator',  icon: '🎖',  desc: 'Track 20+ books',               check: (b: Book[]) => b.length >= 20 },
  { id: 'critic',     label: 'The Critic',    icon: '⭐', desc: 'Rate 5 books',                   check: (b: Book[]) => b.filter(x => x.rating).length >= 5 },
];

export default function StatsDashboard({ books }: { books: Book[] }) {
  const stats = useMemo(() => {
    const completed = books.filter(b => b.status === 'Completed');
    const totalPages = completed.reduce((s, b) => s + (b.pageCount || 0), 0);
    const rated = completed.filter(b => b.rating);
    const avgRating = rated.length ? rated.reduce((s, b) => s + (b.rating || 0), 0) / rated.length : 0;

    const withDates = completed.filter(b => b.startDate && b.finishDate);
    const avgDays = withDates.length
      ? Math.round(withDates.reduce((s, b) => {
          const d = (new Date(b.finishDate!).getTime() - new Date(b.startDate!).getTime()) / (1000*60*60*24);
          return s + d;
        }, 0) / withDates.length)
      : 0;

    const tropeCounts: Record<string, number> = {};
    completed.forEach(b => b.tropes.forEach(t => { tropeCounts[t] = (tropeCounts[t] || 0) + 1; }));
    const tropes = Object.entries(tropeCounts).sort((a,b) => b[1]-a[1]).slice(0,10);
    const maxTrope = tropes[0]?.[1] || 1;

    const genreCounts: Record<string, number> = {};
    completed.forEach(b => b.genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; }));
    const genres = Object.entries(genreCounts).sort((a,b) => b[1]-a[1]);
    const topGenre = genres[0]?.[0] || '—';
    const topGenreCount = genreCounts[topGenre] || 0;
    const total = genres.reduce((s,[,c]) => s+c, 0) || 1;

    const formatCounts: Record<string, number> = {};
    completed.forEach(b => { if (b.format) formatCounts[b.format] = (formatCounts[b.format] || 0) + 1; });
    const formats = Object.entries(formatCounts).sort((a,b) => b[1]-a[1]);
    const totalFormats = formats.reduce((s,[,c]) => s+c, 0) || 1;

    const ratingDist: Record<string, number> = { '5': 0, '4.5': 0, '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1': 0 };
    rated.forEach(b => {
      const key = String(b.rating);
      if (key in ratingDist) ratingDist[key]++;
    });

    return { completed, totalPages, avgRating, avgDays, tropes, maxTrope, genres, genreCounts, topGenre, topGenreCount, total, formats, totalFormats, ratingDist, rated };
  }, [books]);

  const formatColors: Record<string, string> = {
    'eBook':        'linear-gradient(90deg,#067D55,#006241)',
    'Audio Book':   'linear-gradient(90deg,#0E7490,#0369A1)',
    'Print':        'linear-gradient(90deg,#7C3AED,#6D28D9)',
    'Book & Audio': 'linear-gradient(90deg,#B45309,#92400E)',
  };

  // Genre donut segments (simple % bars styled as a visual breakdown)
  const donutColors: Record<string, string> = {
    Fantasy: '#7C3AED', Romance: '#DB2777', 'Sci-Fi': '#2563EB', Fiction: '#006241',
    'Non-Fiction': '#4B4B4B', Biography: '#B45309', Mystery: '#059669',
    Western: '#92400E', War: '#B91C1C', 'Young Adult': '#0E7490', Thriller: '#4F46E5', Historical: '#92400E',
  };

  return (
    <>
      <div style={S.topbar}>
        <span style={S.pageTitle}>Reading Insights</span>
      </div>

      <div style={S.content}>
        {/* KPI Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
          <StatCard label="Books Completed"  value={stats.completed.length}               sub={`of ${books.length} tracked`} />
          <StatCard label="Pages Read"       value={stats.totalPages.toLocaleString()}    sub={`avg ${stats.completed.length ? Math.round(stats.totalPages/stats.completed.length) : 0} per book`} />
          <StatCard label="Avg Days / Book"  value={stats.avgDays || '—'}                 sub="days to finish" />
          <StatCard label="Top Genre"        value={stats.topGenre}                        sub={`${Math.round(stats.topGenreCount / stats.total * 100) || 0}% of reads`} isText />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

          {/* Reading Momentum — bar chart */}
          <Panel title="Reading Momentum">
            {stats.tropes.length === 0 && <div style={{ color: '#6B6B6B', fontSize: 13 }}>No trope data yet</div>}
            {stats.tropes.map(([name, count]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 120, flexShrink: 0, fontSize: 12, color: '#6B6B6B', textAlign: 'right' as const }}>{name}</div>
                <div style={{ flex: 1, height: 6, background: '#F1F1ED', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count/stats.maxTrope)*100}%`, background: 'linear-gradient(90deg,#067D55,#006241)', borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
                <div style={{ width: 24, fontSize: 11, color: '#6B6B6B', textAlign: 'right' as const }}>{count}</div>
              </div>
            ))}
          </Panel>

          {/* Curation Focus — donut-style genre breakdown */}
          <Panel title="Curation Focus">
            {stats.genres.length === 0 && <div style={{ color: '#6B6B6B', fontSize: 13 }}>No genre data yet</div>}
            {/* Visual donut bars */}
            <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16, gap: 2 }}>
              {stats.genres.slice(0, 8).map(([g, c]) => {
                const pct = Math.round(c / stats.total * 100);
                const color = donutColors[g] || '#006241';
                return <div key={g} title={`${g}: ${pct}%`} style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? 4 : 0 }} />;
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
              {stats.genres.slice(0, 8).map(([g, c]) => {
                const pct = Math.round(c / stats.total * 100);
                const color = donutColors[g] || '#006241';
                return (
                  <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ color: '#2D2D2D', fontWeight: 500 }}>{g}</span>
                    <span style={{ color: '#6B6B6B' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

          {/* Format Breakdown */}
          <Panel title="Format Breakdown">
            {stats.formats.map(([name, count]) => (
              <div key={name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: '#2D2D2D', fontWeight: 500 }}>{name}</span>
                  <span style={{ color: '#6B6B6B' }}>{Math.round(count/stats.totalFormats*100)}%</span>
                </div>
                <div style={{ height: 6, background: '#F1F1ED', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(count/stats.totalFormats*100)}%`, background: formatColors[name] || 'linear-gradient(90deg,#067D55,#006241)', borderRadius: 3 }} />
                </div>
              </div>
            ))}
            {stats.formats.length === 0 && <div style={{ color: '#6B6B6B', fontSize: 13 }}>No format data yet</div>}
          </Panel>

          {/* Rating Distribution */}
          <Panel title="Rating Distribution">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
              {Object.entries(stats.ratingDist).reverse().map(([r, c]) => {
                const maxC = Math.max(...Object.values(stats.ratingDist), 1);
                return (
                  <div key={r} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 10, color: '#6B6B6B' }}>{c || ''}</div>
                    <div style={{ width: '100%', background: 'linear-gradient(180deg,#067D55,#006241)', borderRadius: '3px 3px 0 0', height: `${(c/maxC)*60}px`, minHeight: c > 0 ? 4 : 0, transition: 'height 0.5s' }} />
                    <div style={{ fontSize: 10, color: '#6B6B6B' }}>{r}★</div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Archival Milestones */}
        <Panel title="Archival Milestones">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {MILESTONES.map(m => {
              const unlocked = m.check(books);
              return (
                <div key={m.id} style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 10, background: unlocked ? 'rgba(0,98,65,0.07)' : '#F1F1ED', border: `1px solid ${unlocked ? 'rgba(0,98,65,0.20)' : 'transparent'}`, transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 26, marginBottom: 7, filter: unlocked ? 'none' : 'grayscale(1)', opacity: unlocked ? 1 : 0.4 }}>{m.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: unlocked ? '#006241' : '#6B6B6B', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: '#6B6B6B', lineHeight: 1.4 }}>{m.desc}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </>
  );
}

function StatCard({ label, value, sub, isText }: { label: string; value: any; sub?: string; isText?: boolean }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 10, padding: '20px 20px 18px', position: 'relative', overflow: 'hidden', boxShadow: '0px 8px 24px rgba(27,28,25,0.06)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#067D55,#006241)' }} />
      <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '1.4px', color: '#6B6B6B', fontWeight: 700, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "'Newsreader', serif", fontSize: isText ? 18 : 28, fontWeight: 600, color: '#2D2D2D', lineHeight: 1, paddingTop: isText ? 6 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#6B6B6B', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Panel({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 22, boxShadow: '0px 8px 24px rgba(27,28,25,0.06)', ...style }}>
      <div style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic' as const, fontSize: 16, fontWeight: 600, color: '#2D2D2D', marginBottom: 18 }}>{title}</div>
      {children}
    </div>
  );
}
