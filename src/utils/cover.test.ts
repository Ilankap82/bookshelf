import { describe, expect, it } from 'vitest';
import {
  cleanCoverCandidates,
  getCoverCandidates,
  getPrimaryCoverUrl,
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
