import { describe, expect, it } from 'vitest';
import type { Book } from '../../types';
import {
  getArchiveQualitySummary,
  getBookQualityState,
  hasReliableCover,
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

  it('treats empty and known placeholder cover data as missing cover', () => {
    expect(hasReliableCover({
      ...baseBook,
      coverUrl: '',
      coverCandidates: ['https://covers.openlibrary.org/b/id/12468631-M.jpg'],
    })).toBe(false);
    expect(getBookQualityState({
      ...baseBook,
      coverUrl: 'https://covers.openlibrary.org/b/id/8743161-M.jpg',
      coverCandidates: [''],
    })).toEqual({
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
      {
        ...baseBook,
        id: '5',
        coverUrl: 'https://covers.openlibrary.org/b/id/12468631-M.jpg',
        coverCandidates: [''],
        metadataStatus: 'reviewed',
      },
    ];

    expect(getArchiveQualitySummary(books)).toEqual({
      reviewed: 2,
      candidate: 1,
      manual: 2,
      missingCover: 2,
      needsCare: 4,
    });
  });
});
