import { useMemo } from 'react';
import type { Book } from '../types';
import { S } from '../App';

export default function StatsDashboard({ books }: { books: Book[] }) {
  const stats = useMemo(() => {
    const completed = books.filter(b => b.status === 'Completed');
    const totalPages = completed.reduce((s, b) => s + (b.pageCount || 0), 0);
    const rated = completed.filter(b => b.rating);
    const avgRating = rated.length ? rated.reduce((s, b) => s + (b.rating || 0), 0) / rated.length : 0;

    // avg days per book
    const withDates = completed.filter(b => b.startDate && b.finishDate);
    const avgDays = withDates.length
      ? Math.round(withDates.reduce((s, b) => {
          const d = (new Date(b.finishDate!).getTime() - new Date(b.startDate!).getTime()) / (1000*60*60*24);
          return s + d;
        }, 0) / withDates.length)
      : 0;

    // tropes
    const tropeCounts: Record<string, number> = {};
    completed.forEach(b => b.tropes.forEach(t => { tropeCounts[t] = (tropeCounts[t] || 0) + 1; }));
    const tropes = Object.entries(tropeCounts).sort((a,b) => b[1]-a[1]).slice(0,10);
    const maxTrope = tropes[0]?.[1] || 1;

    // genres
    const genreCounts: Record<string, number> = {};
    completed.forEach(b => b.genres.forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; }));
    const genres = Object.entries(genreCounts).sort((a,b) => b[1]-a[1]);
    const topGenre = genres[0]?.[0] || '—';
    const topGenreCount = genreCounts[topGenre] || 0;
    const total = genres.reduce((s,[,c]) => s+c, 0) || 1;

    // formats
    const formatCounts: Record<string, number> = {};
    completed.forEach(b => { if (b.format) formatCounts[b.format] = (formatCounts[b.format] || 0) + 1; });
    const formats = Object.entries(formatCounts).sort((a,b) => b[1]-a[1]);
    const totalFormats = formats.reduce((s,[,c]) => s+c, 0) || 1;

    // ratings dist
    const ratingDist: Record<string, number> = { '5': 0, '4.5': 0, '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1': 0 };
    rated.forEach(b => {
      const key = String(b.rating);
      if (key in ratingDist) ratingDist[key]++;
    });

    return { completed, totalPages, avgRating, avgDays, tropes, maxTrope, genres, genreCounts, topGenre, topGenreCount, total, formats, totalFormats, ratingDist, rated };
  }, [books]);

  const formatColors: Record<string, string> = {
    'eBook': 'linear-gradient(90deg,#B07820,#E8A838)',
    'Audio Book': 'linear-gradient(90deg,#4A9E90,#6BBFB0)',
    'Print': 'linear-gradient(90deg,#5A8AC0,#7AAEE8)',
    'Book & Audio': 'linear-gradient(90deg,#8A70C0,#A98EE0)',
  };

  return (
    <>
      <div style={S.topbar}>
        <span style={S.pageTitle}>Stats &amp; Insights</span>
      </div>

      <div style={S.content}>
        {/* Top stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
          <StatCard label="Books Finished" value={stats.completed.length} sub={`of ${books.length} tracked`} />
          <StatCard label="Pages Read" value={stats.totalPages.toLocaleString()} sub={`avg ${stats.completed.length ? Math.round(stats.totalPages/stats.completed.length) : 0} per book`} />
          <StatCard label="Avg Days / Book" value={stats.avgDays || '—'} sub="days to finish" />
          <StatCard label="Top Genre" value={stats.topGenre} sub={`${Math.round(stats.topGenreCount / stats.total * 100) || 0}% of reads`} isText />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

          {/* Tropes chart */}
          <Panel title="Top Tropes &amp; Themes">
            {stats.tropes.length === 0 && <div style={{ color:'rgba(240,234,224,0.3)', fontSize:13 }}>No data yet</div>}
            {stats.tropes.map(([name, count]) => (
              <div key={name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:120, flexShrink:0, fontSize:12, color:'rgba(240,234,224,0.55)', textAlign:'right' }}>{name}</div>
                <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(count/stats.maxTrope)*100}%`, background:'linear-gradient(90deg,#B07820,#E8A838)', borderRadius:3, transition:'width 0.5s' }} />
                </div>
                <div style={{ width:28, fontSize:11, color:'rgba(240,234,224,0.4)' }}>{count}</div>
              </div>
            ))}
          </Panel>

          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

            {/* Format breakdown */}
            <Panel title="Format Breakdown">
              {stats.formats.map(([name, count]) => (
                <div key={name} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                    <span style={{ color:'#F0EAE0' }}>{name}</span>
                    <span style={{ color:'rgba(240,234,224,0.45)' }}>{Math.round(count/stats.totalFormats*100)}%</span>
                  </div>
                  <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.round(count/stats.totalFormats*100)}%`, background: formatColors[name] || 'linear-gradient(90deg,#B07820,#E8A838)', borderRadius:3 }} />
                  </div>
                </div>
              ))}
              {stats.formats.length === 0 && <div style={{ color:'rgba(240,234,224,0.3)', fontSize:13 }}>No data yet</div>}
            </Panel>

            {/* Genre mix */}
            <Panel title="Genre Mix">
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {stats.genres.map(([g, c]) => {
                  const pct = Math.round(c / stats.total * 100);
                  return (
                    <div key={g} style={{ padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:600, background:'rgba(255,255,255,0.07)', color:'rgba(240,234,224,0.7)', border:'1px solid rgba(255,255,255,0.10)' }}>
                      {g} <span style={{ color:'rgba(240,234,224,0.4)', fontWeight:400 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
              {stats.genres.length === 0 && <div style={{ color:'rgba(240,234,224,0.3)', fontSize:13 }}>No data yet</div>}
            </Panel>

          </div>
        </div>

        {/* Rating distribution */}
        <Panel title="Rating Distribution" style={{ marginTop:18 }}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:80 }}>
            {Object.entries(stats.ratingDist).reverse().map(([r, c]) => {
              const maxC = Math.max(...Object.values(stats.ratingDist), 1);
              return (
                <div key={r} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ fontSize:10, color:'rgba(240,234,224,0.4)' }}>{c || ''}</div>
                  <div style={{ width:'100%', background:'linear-gradient(180deg,#E8A838,#B07820)', borderRadius:'3px 3px 0 0', height: `${(c/maxC)*60}px`, minHeight: c > 0 ? 4 : 0, transition:'height 0.5s' }} />
                  <div style={{ fontSize:10, color:'rgba(240,234,224,0.45)' }}>{r}★</div>
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
    <div style={{ background:'#1C1921', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px 20px 18px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#B07820,#E8A838)', opacity:0.7 }} />
      <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1.4px', color:'rgba(240,234,224,0.45)', fontWeight:600, marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize: isText ? 20 : 28, fontWeight:700, color:'#F0EAE0', lineHeight:1, paddingTop: isText ? 6 : 0 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'rgba(240,234,224,0.45)', marginTop:6 }}>{sub}</div>}
    </div>
  );
}

function Panel({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background:'#1C1921', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:22, ...style }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, color:'#F0EAE0', marginBottom:18 }} dangerouslySetInnerHTML={{ __html: title }} />
      {children}
    </div>
  );
}
