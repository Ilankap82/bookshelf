import type { CSSProperties } from 'react';
import type { QualityTone } from './archiveQuality';

export const archiveTone = {
  page: '#f7f4ec',
  surface: '#fffdfa',
  shell: '#efebe1',
  sidebar: '#f0eee8',
  border: '#d8d3c8',
  ink: '#171715',
  muted: '#5e5a52',
  faint: '#777269',
  green: '#0c553d',
  care: '#8c3d32',
  brass: '#b9a36f',
};

export const archiveFont = {
  serif: "'Newsreader', Georgia, serif",
  sans: "'Manrope', 'Avenir Next', 'Segoe UI', sans-serif",
};

export const qualityToneStyle: Record<QualityTone, CSSProperties> = {
  reviewed: { color: archiveTone.green, borderColor: 'rgba(12,85,61,0.26)', background: 'rgba(12,85,61,0.07)' },
  candidate: { color: '#8a641f', borderColor: 'rgba(185,163,111,0.38)', background: 'rgba(185,163,111,0.12)' },
  manual: { color: archiveTone.muted, borderColor: archiveTone.border, background: 'rgba(255,253,250,0.72)' },
  care: { color: archiveTone.care, borderColor: 'rgba(140,61,50,0.28)', background: 'rgba(140,61,50,0.07)' },
};

export const archiveStyles = {
  room: {
    flex: 1,
    overflowY: 'auto',
    background: `radial-gradient(circle at 78% 12%, rgba(185,163,111,0.18), transparent 28%), linear-gradient(135deg, ${archiveTone.page}, ${archiveTone.shell})`,
    color: archiveTone.ink,
    padding: '36px 42px 46px',
  } satisfies CSSProperties,
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    color: archiveTone.faint,
    fontWeight: 700,
  } satisfies CSSProperties,
  title: {
    fontFamily: archiveFont.serif,
    fontWeight: 400,
    fontSize: 64,
    lineHeight: 0.88,
    margin: 0,
    letterSpacing: -1.8,
  } satisfies CSSProperties,
  surface: {
    background: 'rgba(255,253,250,0.86)',
    border: `1px solid ${archiveTone.border}`,
    borderRadius: 24,
    boxShadow: '0 18px 44px rgba(44,36,24,0.06)',
  } satisfies CSSProperties,
  pillButton: {
    height: 44,
    borderRadius: 999,
    fontSize: 13,
    fontFamily: archiveFont.sans,
    cursor: 'pointer',
  } satisfies CSSProperties,
};
