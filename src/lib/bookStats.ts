import type { Book, Genre, Status } from '../types';
import { getPrimaryCoverUrl } from '../utils/cover';

const STATUSES: readonly Status[] = ['Completed', 'Reading', 'Want to Read', 'DNF'];

const GENRES: readonly Genre[] = [
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Fiction',
  'Non-Fiction',
  'Biography',
  'Mystery',
  'Western',
  'War',
  'Young Adult',
  'Thriller',
  'Crime',
  'Historical',
];

export interface StrongestPattern {
  label: string;
  count: number;
}

export interface IndexStats {
  completedThisYear: number;
  currentlyReading: number;
  archiveSize: number;
  strongestPattern: StrongestPattern | null;
}

export interface ReadingStats {
  activeCount: number;
  pagesLeft: number;
  averageProgress: number;
  stalledCount: number;
}

export interface ArchiveStats {
  totalBooks: number;
  missingCovers: number;
  metadataReview: number;
  statusCounts: Record<Status, number>;
}

export interface DiscoveryStats {
  wantToReadCount: number;
  underReadGenres: Genre[];
}

export function getIndexStats(books: Book[], year: number): IndexStats {
  const completedInYear = books.filter((book) => {
    if (book.status !== 'Completed' || !book.finishDate) return false;
    return new Date(book.finishDate).getFullYear() === year;
  });

  return {
    completedThisYear: completedInYear.length,
    currentlyReading: books.filter((book) => book.status === 'Reading').length,
    archiveSize: books.length,
    strongestPattern: getStrongestPattern(completedInYear),
  };
}

export function getReadingStats(books: Book[]): ReadingStats {
  const reading = books.filter((book) => book.status === 'Reading');
  const progressValues = reading.map((book) => getProgress(book));

  return {
    activeCount: reading.length,
    pagesLeft: reading.reduce((sum, book) => sum + getPagesLeft(book), 0),
    averageProgress: progressValues.length
      ? Math.round(progressValues.reduce((sum, progress) => sum + progress, 0) / progressValues.length)
      : 0,
    stalledCount: reading.filter((book) => !book.pagesRead).length,
  };
}

export function getArchiveStats(books: Book[]): ArchiveStats {
  return {
    totalBooks: books.length,
    missingCovers: books.filter((book) => getPrimaryCoverUrl(book) === null).length,
    metadataReview: books.filter((book) => book.metadataStatus === 'candidate').length,
    statusCounts: getStatusCounts(books),
  };
}

export function getDiscoveryStats(books: Book[]): DiscoveryStats {
  const completedGenres = new Set(
    books
      .filter((book) => book.status === 'Completed')
      .flatMap((book) => book.genres),
  );

  return {
    wantToReadCount: books.filter((book) => book.status === 'Want to Read').length,
    underReadGenres: GENRES.filter((genre) => !completedGenres.has(genre)),
  };
}

function getStrongestPattern(books: Book[]): StrongestPattern | null {
  const counts = new Map<string, number>();

  for (const trope of books.flatMap((book) => book.tropes)) {
    counts.set(trope, (counts.get(trope) ?? 0) + 1);
  }

  const strongest = Array.from(counts.entries()).sort((a, b) => {
    const countDifference = b[1] - a[1];
    return countDifference || a[0].localeCompare(b[0]);
  })[0];

  if (!strongest) return null;

  return {
    label: strongest[0],
    count: strongest[1],
  };
}

function getProgress(book: Book): number {
  if (!book.pageCount) return 0;
  const pagesRead = book.pagesRead ?? 0;
  return Math.min(100, Math.round((pagesRead / book.pageCount) * 100));
}

function getPagesLeft(book: Book): number {
  if (!book.pageCount) return 0;
  return Math.max(0, book.pageCount - (book.pagesRead ?? 0));
}

function getStatusCounts(books: Book[]): Record<Status, number> {
  const counts: Record<Status, number> = {
    Completed: 0,
    Reading: 0,
    'Want to Read': 0,
    DNF: 0,
  };

  for (const status of STATUSES) {
    counts[status] = books.filter((book) => book.status === status).length;
  }

  return counts;
}
