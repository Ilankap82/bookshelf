import { describe, expect, it } from 'vitest';
import {
  cleanCoverCandidates,
  getCoverCandidates,
  getPrimaryCoverUrl,
  resolveStoredCover,
} from './cover';

describe('cover utilities', () => {
  it('dedupes candidates and removes known bad Open Library covers, undefined, and empty strings', () => {
    expect(cleanCoverCandidates([
      undefined,
      null,
      '',
      'https://covers.openlibrary.org/b/id/8743161-M.jpg',
      'https://example.com/cover.jpg',
      'https://example.com/cover.jpg',
      'https://covers.openlibrary.org/b/id/12468631-M.jpg',
      'https://covers.openlibrary.org/b/isbn/9780441478125-M.jpg',
    ])).toEqual([
      'https://example.com/cover.jpg',
      'https://covers.openlibrary.org/b/isbn/9780441478125-M.jpg',
    ]);
  });

  it('prefers manual book.coverUrl over coverCandidates', () => {
    expect(getPrimaryCoverUrl({
      coverUrl: 'https://example.com/manual-cover.jpg',
      coverCandidates: ['https://example.com/candidate-cover.jpg'],
    })).toBe('https://example.com/manual-cover.jpg');
  });

  it('returns remaining cover candidates after failed urls', () => {
    expect(getCoverCandidates(
      {
        coverUrl: 'https://example.com/bad-cover.jpg',
        coverCandidates: [
          'https://example.com/bad-cover.jpg',
          'https://example.com/good-cover.jpg',
        ],
      },
      ['https://example.com/bad-cover.jpg'],
    )).toEqual(['https://example.com/good-cover.jpg']);
  });
});

describe('shared cover resolution', () => {
  it('prefers a clean stored cover before candidates', () => {
    expect(resolveStoredCover({
      coverUrl: 'https://example.com/main.jpg',
      coverCandidates: ['https://example.com/other.jpg'],
    })).toEqual({
      url: 'https://example.com/main.jpg',
      source: 'stored',
    });
  });

  it('falls back to the first clean candidate when stored cover is bad', () => {
    expect(resolveStoredCover({
      coverUrl: 'https://covers.openlibrary.org/b/id/12468631-L.jpg',
      coverCandidates: ['https://example.com/candidate.jpg'],
    })).toEqual({
      url: 'https://example.com/candidate.jpg',
      source: 'candidate',
    });
  });

  it('returns null when every known cover is bad or empty', () => {
    expect(resolveStoredCover({
      coverUrl: 'https://covers.openlibrary.org/b/id/8743161-L.jpg',
      coverCandidates: ['', 'https://covers.openlibrary.org/b/id/12468631-L.jpg'],
    })).toEqual({
      url: null,
      source: 'missing',
    });
  });

  it('removes failed URLs from candidates', () => {
    expect(resolveStoredCover(
      {
        coverUrl: 'https://example.com/a.jpg',
        coverCandidates: ['https://example.com/b.jpg'],
      },
      ['https://example.com/a.jpg'],
    )).toEqual({
      url: 'https://example.com/b.jpg',
      source: 'candidate',
    });
  });
});
