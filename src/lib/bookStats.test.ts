import { describe, expect, it } from 'vitest';
import type { Book } from '../types';
import {
  getArchiveStats,
  getDiscoveryStats,
  getIndexStats,
  getReadingStats,
} from './bookStats';

const books: Book[] = [
  {
    id: 'completed-2026-a',
    title: 'Completed This Year A',
    author: 'Author One',
    status: 'Completed',
    finishDate: '2026-02-15',
    pageCount: 320,
    genres: ['Fantasy'],
    tropes: ['Found Family', 'Cozy'],
    coverUrl: 'https://example.com/cover-a.jpg',
    metadataStatus: 'reviewed',
  },
  {
    id: 'completed-2026-b',
    title: 'Completed This Year B',
    author: 'Author Two',
    status: 'Completed',
    finishDate: '2026-04-21',
    pageCount: 280,
    genres: ['Fiction'],
    tropes: ['Found Family'],
    coverCandidates: ['https://example.com/cover-b.jpg'],
    metadataStatus: 'manual',
  },
  {
    id: 'completed-2025',
    title: 'Completed Last Year',
    author: 'Author Three',
    status: 'Completed',
    finishDate: '2025-12-30',
    pageCount: 240,
    genres: ['Mystery'],
    tropes: ['Cold Case'],
    metadataStatus: 'candidate',
  },
  {
    id: 'reading-active',
    title: 'Active Reading',
    author: 'Author Four',
    status: 'Reading',
    startDate: '2026-03-01',
    pageCount: 400,
    pagesRead: 100,
    genres: ['Sci-Fi'],
    tropes: [],
  },
  {
    id: 'reading-stalled',
    title: 'Stalled Reading',
    author: 'Author Five',
    status: 'Reading',
    startDate: '2026-01-01',
    pageCount: 200,
    genres: ['Romance'],
    tropes: [],
  },
  {
    id: 'want-to-read',
    title: 'Future Read',
    author: 'Author Six',
    status: 'Want to Read',
    genres: ['Historical'],
    tropes: ['Epic'],
  },
  {
    id: 'dnf',
    title: 'Did Not Finish',
    author: 'Author Seven',
    status: 'DNF',
    genres: ['War'],
    tropes: [],
    coverUrl: 'https://covers.openlibrary.org/b/id/8743161-M.jpg',
  },
];

describe('bookStats', () => {
  it('summarizes index stats for a target year', () => {
    expect(getIndexStats(books, 2026)).toEqual({
      completedThisYear: 2,
      currentlyReading: 2,
      archiveSize: 7,
      strongestPattern: {
        label: 'Found Family',
        count: 2,
      },
    });
  });

  it('counts completed books by the year prefix in finishDate', () => {
    const contextualBooks: Book[] = [
      {
        id: 'completed-date-only',
        title: 'Date Only',
        author: 'Author Eight',
        status: 'Completed',
        finishDate: '2026-01-01',
        genres: [],
        tropes: [],
      },
      {
        id: 'completed-other-year',
        title: 'Other Year',
        author: 'Author Nine',
        status: 'Completed',
        finishDate: '2025-12-31',
        genres: [],
        tropes: [],
      },
    ];

    expect(getIndexStats(contextualBooks, 2026).completedThisYear).toBe(1);
  });

  it('summarizes active reading progress', () => {
    expect(getReadingStats(books)).toEqual({
      activeCount: 2,
      pagesLeft: 500,
      averageProgress: 13,
      stalledCount: 1,
    });
  });

  it('averages progress only for reading books with a positive page count', () => {
    const contextualBooks: Book[] = [
      {
        id: 'reading-with-pages',
        title: 'Reading With Pages',
        author: 'Author Eight',
        status: 'Reading',
        pageCount: 200,
        pagesRead: 100,
        genres: [],
        tropes: [],
      },
      {
        id: 'reading-without-page-count',
        title: 'Reading Without Page Count',
        author: 'Author Nine',
        status: 'Reading',
        pagesRead: 100,
        genres: [],
        tropes: [],
      },
    ];

    expect(getReadingStats(contextualBooks)).toEqual({
      activeCount: 2,
      pagesLeft: 100,
      averageProgress: 50,
      stalledCount: 0,
    });
  });

  it('summarizes archive health and status counts', () => {
    expect(getArchiveStats(books)).toEqual({
      totalBooks: 7,
      missingCovers: 5,
      metadataReview: 1,
      statusCounts: {
        Completed: 3,
        Reading: 2,
        'Want to Read': 1,
        DNF: 1,
      },
    });
  });

  it('summarizes discovery shelf gaps', () => {
    expect(getDiscoveryStats(books)).toEqual({
      wantToReadCount: 1,
      underReadGenres: [
        'Romance',
        'Sci-Fi',
        'Non-Fiction',
        'Biography',
        'Western',
        'War',
        'Young Adult',
        'Thriller',
        'Crime',
        'Historical',
      ],
    });
  });
});
