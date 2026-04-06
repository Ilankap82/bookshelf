export type Status = 'Completed' | 'Reading' | 'Want to Read' | 'DNF';
export type Format = 'eBook' | 'Audio Book' | 'Print' | 'Book & Audio';
export type SeriesType = 'Standalone' | 'Series' | 'Trilogy' | 'Duology' | 'Saga';
export type Genre =
  | 'Fantasy' | 'Romance' | 'Sci-Fi' | 'Fiction' | 'Non-Fiction'
  | 'Biography' | 'Mystery' | 'Western' | 'War' | 'Young Adult'
  | 'Thriller' | 'Crime' | 'Historical';

export interface Book {
  id: string;
  title: string;
  author: string;
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
  pagesRead?: number; // for in-progress reading tracking
}

export interface AppData {
  books: Book[];
  lastExported?: string;
}
