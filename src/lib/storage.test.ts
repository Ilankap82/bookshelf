import { describe, expect, it } from 'vitest';
import {
  migrateAppData,
  parseImportedData,
  serializeAppData,
} from './storage';

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

  it('rejects JSON without a books array', () => {
    expect(() => parseImportedData('{"items":[]}')).toThrow(
      'Import file must contain a books array.',
    );
  });
});
