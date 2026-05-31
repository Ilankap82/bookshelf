export const SCHEMA_VERSION = 2 as const;

export type Status = 'Completed' | 'Reading' | 'Want to Read' | 'DNF';
export type Format = 'eBook' | 'Audio Book' | 'Print' | 'Book & Audio';
export type SeriesType = 'Standalone' | 'Series' | 'Trilogy' | 'Duology' | 'Saga';
export type MetadataStatus = 'manual' | 'candidate' | 'reviewed';
export type MetadataSourceName = 'open-library' | 'google-books' | 'manual';
export interface SourceIds {
  openLibraryKey?: string;
  googleBooksId?: string;
  isbn10?: string[];
  isbn13?: string[];
}

export type Genre =
  | 'Fantasy' | 'Romance' | 'Sci-Fi' | 'Fiction' | 'Non-Fiction'
  | 'Biography' | 'Mystery' | 'Western' | 'War' | 'Young Adult'
  | 'Thriller' | 'Crime' | 'Historical';

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  description?: string;
  publishedYear?: number;
  publisher?: string;
  language?: string;
  status: Status;
  startDate?: string;
  finishDate?: string;
  pageCount?: number;
  genres: Genre[];
  tropes: string[];
  rating?: number; // 0-5 in 0.5 steps
  format?: Format;
  seriesName?: string;
  seriesType?: SeriesType;
  seriesPosition?: number;
  notes?: string;
  coverUrl?: string; // cached Open Library cover
  coverCandidates?: string[];
  metadataStatus?: MetadataStatus;
  metadataSources?: MetadataSourceName[];
  sourceIds?: SourceIds;
  pagesRead?: number; // for in-progress reading tracking
}

export interface AppData {
  schemaVersion?: typeof SCHEMA_VERSION;
  books: Book[];
  lastExported?: string;
}
