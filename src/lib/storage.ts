import {
  SCHEMA_VERSION,
  type AppData,
  type Book,
  type Format,
  type Genre,
  type MetadataSourceName,
  type MetadataStatus,
  type SeriesType,
  type SourceIds,
  type Status,
} from '../types';

const STORAGE_KEY = 'bookshelf_data';

const STATUSES: readonly Status[] = ['Completed', 'Reading', 'Want to Read', 'DNF'];
const FORMATS: readonly Format[] = ['eBook', 'Audio Book', 'Print', 'Book & Audio'];
const SERIES_TYPES: readonly SeriesType[] = ['Standalone', 'Series', 'Trilogy', 'Duology', 'Saga'];
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
const METADATA_STATUSES: readonly MetadataStatus[] = [
  'manual',
  'candidate',
  'reviewed',
];
const METADATA_SOURCE_NAMES: readonly MetadataSourceName[] = [
  'manual',
  'open-library',
  'google-books',
];

type AppDataRecord = Record<string, unknown> & { books: unknown[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isEnumValue<T extends string>(value: unknown, values: readonly T[]): value is T {
  return isString(value) && values.includes(value as T);
}

function optionalString(value: unknown): string | undefined {
  return isString(value) ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return isNumber(value) ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isString) : [];
}

function genreArray(value: unknown): Genre[] {
  return Array.isArray(value)
    ? value.filter((item): item is Genre => isEnumValue(item, GENRES))
    : [];
}

function metadataSourceArray(value: unknown): MetadataSourceName[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item): unknown => {
      if (item === 'openLibrary') return 'open-library';
      if (item === 'googleBooks') return 'google-books';
      return item;
    })
    .filter((item): item is MetadataSourceName =>
      isEnumValue(item, METADATA_SOURCE_NAMES),
    );
}

function metadataStatus(value: unknown): MetadataStatus {
  if (value === 'found') return 'reviewed';
  if (isEnumValue(value, METADATA_STATUSES)) return value;
  return 'manual';
}

function sourceIds(value: unknown): SourceIds | undefined {
  if (!isRecord(value)) return undefined;

  const ids: SourceIds = {};
  const openLibraryKey = optionalString(value.openLibraryKey) ?? optionalString(value.openLibrary);
  const googleBooksId = optionalString(value.googleBooksId) ?? optionalString(value.googleBooks);
  const isbn10 = stringArray(value.isbn10);
  const isbn13 = stringArray(value.isbn13);
  const legacyIsbn10 = optionalString(value.isbn10);
  const legacyIsbn13 = optionalString(value.isbn13);

  if (openLibraryKey !== undefined) ids.openLibraryKey = openLibraryKey;
  if (googleBooksId !== undefined) ids.googleBooksId = googleBooksId;
  if (isbn10.length > 0) ids.isbn10 = isbn10;
  if (isbn13.length > 0) ids.isbn13 = isbn13;
  if (legacyIsbn10 !== undefined) ids.isbn10 = [legacyIsbn10];
  if (legacyIsbn13 !== undefined) ids.isbn13 = [legacyIsbn13];

  return Object.keys(ids).length > 0 ? ids : undefined;
}

function migrateBook(rawBook: unknown): Book {
  const book = isRecord(rawBook) ? rawBook : {};
  const coverUrl = optionalString(book.coverUrl);
  const existingCoverCandidates = stringArray(book.coverCandidates);
  const coverCandidates = coverUrl !== undefined
    ? Array.from(new Set([coverUrl, ...existingCoverCandidates]))
    : existingCoverCandidates;

  const migrated: Book = {
    id: optionalString(book.id) ?? crypto.randomUUID(),
    title: optionalString(book.title) ?? '',
    author: optionalString(book.author) ?? '',
    status: isEnumValue(book.status, STATUSES) ? book.status : 'Want to Read',
    genres: genreArray(book.genres),
    tropes: stringArray(book.tropes),
    metadataStatus: metadataStatus(book.metadataStatus),
  };

  if (optionalString(book.startDate) !== undefined) migrated.startDate = optionalString(book.startDate);
  if (optionalString(book.finishDate) !== undefined) migrated.finishDate = optionalString(book.finishDate);
  if (optionalNumber(book.pageCount) !== undefined) migrated.pageCount = optionalNumber(book.pageCount);
  if (optionalNumber(book.rating) !== undefined) migrated.rating = optionalNumber(book.rating);
  if (isEnumValue(book.format, FORMATS)) migrated.format = book.format;
  if (optionalString(book.seriesName) !== undefined) migrated.seriesName = optionalString(book.seriesName);
  if (isEnumValue(book.seriesType, SERIES_TYPES)) migrated.seriesType = book.seriesType;
  if (optionalNumber(book.seriesPosition) !== undefined) migrated.seriesPosition = optionalNumber(book.seriesPosition);
  if (optionalString(book.notes) !== undefined) migrated.notes = optionalString(book.notes);
  if (coverUrl !== undefined) migrated.coverUrl = coverUrl;
  if (coverCandidates.length > 0) migrated.coverCandidates = coverCandidates;
  if (optionalNumber(book.pagesRead) !== undefined) migrated.pagesRead = optionalNumber(book.pagesRead);

  const sources = metadataSourceArray(book.metadataSources);
  if (sources !== undefined) migrated.metadataSources = sources;

  const ids = sourceIds(book.sourceIds);
  if (ids !== undefined) migrated.sourceIds = ids;

  return migrated;
}

function requireBooksArray(data: unknown): AppDataRecord {
  if (!isRecord(data) || !Array.isArray(data.books)) {
    throw new Error('Import file must contain a books array.');
  }

  return data as AppDataRecord;
}

export function migrateAppData(data: unknown): AppData {
  const appData = requireBooksArray(data);
  const lastExported = optionalString(appData.lastExported);
  const migrated: AppData = {
    schemaVersion: SCHEMA_VERSION,
    books: appData.books.map(migrateBook),
  };

  if (lastExported !== undefined) migrated.lastExported = lastExported;

  return migrated;
}

export function parseImportedData(json: string): AppData {
  return migrateAppData(JSON.parse(json));
}

export function serializeAppData(books: Book[], lastExported: string = new Date().toISOString()): string {
  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    books,
    lastExported,
  });
}

export function loadBooksFromStorage(storage: Storage = localStorage): Book[] | null {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return null;

  return parseImportedData(raw).books;
}

export function saveBooksToStorage(
  books: Book[],
  storage: Storage = localStorage,
  lastExported: string = new Date().toISOString(),
): void {
  storage.setItem(STORAGE_KEY, serializeAppData(books, lastExported));
}
