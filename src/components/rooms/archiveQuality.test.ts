import { describe, expect, it } from 'vitest';
import type { Book } from '../../types';
import {
  getArchiveQualitySummary,
  getBookQualityState,
  metadataQualityLabel,
} from './archiveQuality';

const baseBook: Book = {
  id: 'book-1',
  title: 'Book',
  author: 'Author',
  status: 'Want to Read',
  genres: ['Fiction'],
  tropes: [],
  metadataStatus: 'reviewed',
};

describe('archive quality helpers', () => {
  it('labels reviewed, candidate, and manual metadata states', () => {
    expect(metadataQualityLabel('reviewed')).toBe('Reviewed');
    expect(metadataQualityLabel('candidate')).toBe('Candidate');
    expect(metadataQualityLabel('manual')).toBe('Manual');
    expect(metadataQualityLabel(undefined)).toBe('Manual');
  });

  it('detects missing covers before metadata issues', () => {
    expect(getBookQualityState({ ...baseBook, coverUrl: undefined, coverCandidates: [] })).toEqual({
      tone: 'care',
      label: 'Missing cover',
    });
  });

  it('detects manual, candidate, and reviewed metadata states', () => {
    expect(getBookQualityState({ ...baseBook, coverUrl: 'cover.jpg', metadataStatus: 'manual' })).toEqual({
      tone: 'manual',
      label: 'Manual',
    });
    expect(getBookQualityState({ ...baseBook, coverUrl: 'cover.jpg', metadataStatus: 'candidate' })).toEqual({
      tone: 'candidate',
      label: 'Candidate',
    });
    expect(getBookQualityState({ ...baseBook, coverUrl: 'cover.jpg', metadataStatus: 'reviewed' })).toEqual({
      tone: 'reviewed',
      label: 'Reviewed',
    });
  });

  it('summarizes archive care counts', () => {
    const books: Book[] = [
      { ...baseBook, id: '1', coverUrl: 'cover.jpg', metadataStatus: 'reviewed' },
      { ...baseBook, id: '2', metadataStatus: 'manual' },
      { ...baseBook, id: '3', coverUrl: 'cover.jpg', metadataStatus: 'candidate' },
      { ...baseBook, id: '4', coverCandidates: ['cover-a.jpg'], metadataStatus: 'manual' },
    ];

    expect(getArchiveQualitySummary(books)).toEqual({
      reviewed: 1,
      candidate: 1,
      manual: 2,
      missingCover: 1,
      needsCare: 3,
    });
  });
});
