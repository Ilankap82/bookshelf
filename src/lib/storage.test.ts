import { describe, expect, it } from 'vitest';
import {
  loadBooksFromStorageResult,
  loadBooksFromStorage,
  migrateAppData,
  parseImportedData,
  serializeAppData,
} from './storage';
import { SEED_BOOKS } from '../data/seedBooks';

function storageWithItem(value: string | null): Storage {
  return {
    getItem: () => value,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: value === null ? 0 : 1,
  };
}

describe('storage', () => {
  it('migrates legacy exports that only contain books', () => {
    const legacyData = {
      books: [
        {
          id: 'book-1',
          title: 'Book Title',
          author: 'Author Name',
          status: 'Completed',
          genres: ['Fantasy'],
          tropes: ['Found Family'],
          coverUrl: 'https://example.com/cover.jpg',
        },
      ],
    };

    const migrated = migrateAppData(legacyData);

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.books[0]).toMatchObject({
      title: 'Book Title',
      author: 'Author Name',
      status: 'Completed',
      genres: ['Fantasy'],
      tropes: ['Found Family'],
      coverUrl: 'https://example.com/cover.jpg',
      metadataStatus: 'manual',
      coverCandidates: ['https://example.com/cover.jpg'],
    });
  });

  it('serializes app data with schema version and provided export timestamp', () => {
    const exportedAt = '2026-05-26T12:00:00.000Z';
    const data = migrateAppData({
      books: [
        {
          id: 'book-1',
          title: 'Book Title',
          author: 'Author Name',
          status: 'Reading',
          genres: [],
          tropes: [],
        },
      ],
    });

    const serialized = serializeAppData(data.books, exportedAt);

    expect(JSON.parse(serialized)).toMatchObject({
      schemaVersion: 2,
      lastExported: exportedAt,
      books: [
        {
          id: 'book-1',
          title: 'Book Title',
        },
      ],
    });
  });

  it('preserves discovered metadata through migration and serialization', () => {
    const imported = parseImportedData(JSON.stringify({
      books: [
        {
          id: 'book-1',
          title: 'Dune',
          subtitle: 'Deluxe Edition',
          author: 'Frank Herbert',
          description: 'A desert planet changes everything.',
          publishedYear: 1965,
          publisher: 'Chilton Books',
          language: 'en',
          status: 'Completed',
          genres: ['Sci-Fi'],
          tropes: [],
        },
      ],
    }));
    const serialized = serializeAppData(imported.books, '2026-05-26T12:00:00.000Z');
    const reparsed = parseImportedData(serialized);

    expect(reparsed.books[0]).toMatchObject({
      subtitle: 'Deluxe Edition',
      description: 'A desert planet changes everything.',
      publishedYear: 1965,
      publisher: 'Chilton Books',
      language: 'en',
    });
  });

  it('returns an empty array for valid empty stored data', () => {
    const books = loadBooksFromStorage(
      storageWithItem(JSON.stringify({ schemaVersion: 2, books: [] })),
    );

    expect(books).toEqual([]);
    expect(books).not.toEqual(SEED_BOOKS);
  });

  it('returns null when no stored data exists', () => {
    expect(loadBooksFromStorage(storageWithItem(null))).toBeNull();
  });

  it('distinguishes missing, valid, and invalid stored data', () => {
    expect(loadBooksFromStorageResult(storageWithItem(null))).toEqual({ status: 'missing' });
    expect(loadBooksFromStorageResult(storageWithItem('{"schemaVersion":2,"books":[]}'))).toEqual({
      status: 'valid',
      books: [],
    });
    expect(loadBooksFromStorageResult(storageWithItem('{"items":[]}'))).toMatchObject({
      status: 'invalid',
    });
  });

  it('preserves corrected metadata source and id shapes', () => {
    const migrated = migrateAppData({
      books: [
        {
          id: 'book-1',
          title: 'Book Title',
          author: 'Author Name',
          status: 'Want to Read',
          genres: [],
          tropes: [],
          metadataStatus: 'candidate',
          metadataSources: ['open-library'],
          sourceIds: {
            openLibraryKey: 'OL123W',
            isbn10: ['0441478123'],
            isbn13: ['9780441478125'],
          },
        },
      ],
    });

    expect(migrated.books[0]).toMatchObject({
      metadataStatus: 'candidate',
      metadataSources: ['open-library'],
      sourceIds: {
        openLibraryKey: 'OL123W',
        isbn10: ['0441478123'],
        isbn13: ['9780441478125'],
      },
    });
  });

  it('migrates temporary metadata source names to current source names', () => {
    const migrated = migrateAppData({
      books: [
        {
          title: 'Open Library Book',
          metadataSources: ['openLibrary', 'manual'],
        },
        {
          title: 'Google Books Book',
          metadataSources: ['googleBooks'],
        },
      ],
    });

    expect(migrated.books[0].metadataSources).toEqual(['open-library', 'manual']);
    expect(migrated.books[1].metadataSources).toEqual(['google-books']);
  });

  it('migrates temporary metadata statuses conservatively', () => {
    const migrated = migrateAppData({
      books: [
        { title: 'Found', metadataStatus: 'found' },
        { title: 'Pending', metadataStatus: 'pending' },
        { title: 'Not Found', metadataStatus: 'not-found' },
        { title: 'Error', metadataStatus: 'error' },
        { title: 'Candidate', metadataStatus: 'candidate' },
        { title: 'Reviewed', metadataStatus: 'reviewed' },
        { title: 'Unknown', metadataStatus: 'unexpected' },
        { title: 'Missing' },
      ],
    });

    expect(migrated.books.map((book) => book.metadataStatus)).toEqual([
      'reviewed',
      'manual',
      'manual',
      'manual',
      'candidate',
      'reviewed',
      'manual',
      'manual',
    ]);
  });

  it('rejects JSON without a books array', () => {
    expect(() => parseImportedData('{"items":[]}')).toThrow(
      'Import file must contain a books array.',
    );
  });
});
