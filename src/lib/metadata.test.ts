import { describe, expect, it } from 'vitest';
import type { Book } from '../types';
import {
  createDraftBookFromResult,
  createManualDraftBook,
  mergeBookWithMetadataResult,
  normalizeGoogleBooksItems,
  normalizeOpenLibraryDocs,
  searchBookMetadata,
  type MetadataSearchResult,
} from './metadata';

describe('metadata', () => {
  it('normalizes Open Library search docs into app-level metadata results', () => {
    const results = normalizeOpenLibraryDocs([
      {
        key: '/works/OL45804W',
        title: 'The Left Hand of Darkness',
        author_name: ['Ursula K. Le Guin'],
        first_publish_year: 1969,
        publisher: ['Ace Books', 'Walker'],
        isbn: ['0441478123', '9780441478125'],
        language: ['eng'],
        cover_i: 8739161,
        number_of_pages_median: 304,
      },
    ]);

    expect(results).toEqual([
      {
        sourceName: 'open-library',
        sourceId: 'OL45804W',
        title: 'The Left Hand of Darkness',
        author: 'Ursula K. Le Guin',
        publishedYear: 1969,
        publisher: 'Ace Books',
        pageCount: 304,
        language: 'eng',
        isbn10: ['0441478123'],
        isbn13: ['9780441478125'],
        coverCandidates: [
          'https://covers.openlibrary.org/b/id/8739161-L.jpg',
          'https://covers.openlibrary.org/b/isbn/9780441478125-L.jpg',
          'https://covers.openlibrary.org/b/isbn/0441478123-L.jpg',
        ],
      },
    ]);
  });

  it('keeps valid Open Library docs when another doc has malformed nested fields', () => {
    const results = normalizeOpenLibraryDocs([
      {
        key: '/works/OLBADW',
        title: 'Malformed Open Library Book',
        author_name: 'not-an-array' as never,
        publisher: 'not-an-array' as never,
        isbn: 'bad' as never,
        language: 'not-an-array' as never,
      },
      {
        key: '/works/OL45804W',
        title: 'The Left Hand of Darkness',
        author_name: ['Ursula K. Le Guin'],
        isbn: ['0441478123', '9780441478125'],
      },
    ]);

    expect(results).toMatchObject([
      {
        sourceName: 'open-library',
        sourceId: 'OLBADW',
        title: 'Malformed Open Library Book',
        author: '',
        isbn10: [],
        isbn13: [],
      },
      {
        sourceName: 'open-library',
        sourceId: 'OL45804W',
        title: 'The Left Hand of Darkness',
        author: 'Ursula K. Le Guin',
        isbn10: ['0441478123'],
        isbn13: ['9780441478125'],
      },
    ]);
  });

  it('normalizes Google Books items into app-level metadata results', () => {
    const results = normalizeGoogleBooksItems([
      {
        id: 'google-volume-1',
        volumeInfo: {
          title: 'A Wizard of Earthsea',
          authors: ['Ursula K. Le Guin'],
          publishedDate: '1968-11-01',
          publisher: 'Parnassus Press',
          pageCount: 205,
          language: 'en',
          industryIdentifiers: [
            { type: 'ISBN_10', identifier: '0553383043' },
            { type: 'ISBN_13', identifier: '9780553383041' },
          ],
          imageLinks: {
            thumbnail: 'http://books.google.com/books/content?id=abc&printsec=frontcover&img=1',
            extraLarge: 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=2',
          },
        },
      },
    ]);

    expect(results).toEqual([
      {
        sourceName: 'google-books',
        sourceId: 'google-volume-1',
        title: 'A Wizard of Earthsea',
        author: 'Ursula K. Le Guin',
        publishedYear: 1968,
        publisher: 'Parnassus Press',
        pageCount: 205,
        language: 'en',
        isbn10: ['0553383043'],
        isbn13: ['9780553383041'],
        coverCandidates: [
          'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1',
          'https://books.google.com/books/content?id=abc&printsec=frontcover&img=2',
        ],
      },
    ]);
  });

  it('keeps valid Google Books items when another item has malformed nested fields', () => {
    const results = normalizeGoogleBooksItems([
      {
        id: 'google-volume-bad',
        volumeInfo: {
          title: 'Malformed Google Book',
          authors: 'not-an-array' as never,
          industryIdentifiers: 'not-an-array' as never,
          imageLinks: 'not-a-record' as never,
        },
      },
      {
        id: 'google-volume-1',
        volumeInfo: {
          title: 'A Wizard of Earthsea',
          authors: ['Ursula K. Le Guin'],
          industryIdentifiers: [
            { type: 'ISBN_10', identifier: '0553383043' },
            { type: 'ISBN_13', identifier: '9780553383041' },
          ],
        },
      },
    ]);

    expect(results).toMatchObject([
      {
        sourceName: 'google-books',
        sourceId: 'google-volume-bad',
        title: 'Malformed Google Book',
        author: '',
        isbn10: [],
        isbn13: [],
        coverCandidates: [],
      },
      {
        sourceName: 'google-books',
        sourceId: 'google-volume-1',
        title: 'A Wizard of Earthsea',
        author: 'Ursula K. Le Guin',
        isbn10: ['0553383043'],
        isbn13: ['9780553383041'],
      },
    ]);
  });

  it('returns Google Books results and an Open Library error when Open Library search fails', async () => {
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = url.toString();

      if (requestUrl.startsWith('https://openlibrary.org/search.json')) {
        return new Response('Server error', { status: 500 });
      }

      return Response.json({
        items: [
          {
            id: 'google-volume-1',
            volumeInfo: {
              title: 'Kindred',
              authors: ['Octavia E. Butler'],
              publishedDate: '1979',
            },
          },
        ],
      });
    };

    const response = await searchBookMetadata(
      { title: 'Kindred', author: 'Octavia E. Butler' },
      fetcher,
    );

    expect(response.errors).toEqual(['Open Library search failed.']);
    expect(response.results).toMatchObject([
      {
        sourceName: 'google-books',
        sourceId: 'google-volume-1',
        title: 'Kindred',
        author: 'Octavia E. Butler',
        publishedYear: 1979,
      },
    ]);
  });

  it('keeps valid Open Library search results when another doc has a non-string key', async () => {
    const fetcher: typeof fetch = async (url) => {
      const requestUrl = url.toString();

      if (requestUrl.startsWith('https://openlibrary.org/search.json')) {
        return Response.json({
          docs: [
            { key: 123, title: 'Bad' },
            {
              key: '/works/OL45804W',
              title: 'The Left Hand of Darkness',
              author_name: ['Ursula K. Le Guin'],
            },
          ],
        });
      }

      return Response.json({ items: [] });
    };

    const response = await searchBookMetadata(
      { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin' },
      fetcher,
    );

    expect(response.errors).toEqual([]);
    expect(response.results).toMatchObject([
      {
        sourceName: 'open-library',
        sourceId: '',
        title: 'Bad',
      },
      {
        sourceName: 'open-library',
        sourceId: 'OL45804W',
        title: 'The Left Hand of Darkness',
        author: 'Ursula K. Le Guin',
      },
    ]);
  });

  it('creates a draft Book from a metadata result candidate', () => {
    const result: MetadataSearchResult = {
      sourceName: 'open-library',
      sourceId: 'OL45804W',
      title: 'The Left Hand of Darkness',
      author: 'Ursula K. Le Guin',
      pageCount: 304,
      isbn10: ['0441478123'],
      isbn13: ['9780441478125'],
      coverCandidates: [
        'https://covers.openlibrary.org/b/id/8739161-L.jpg',
        'https://covers.openlibrary.org/b/isbn/9780441478125-L.jpg',
      ],
    };

    const draft = createDraftBookFromResult(result, 'book-1');

    expect(draft).toEqual({
      id: 'book-1',
      title: 'The Left Hand of Darkness',
      author: 'Ursula K. Le Guin',
      status: 'Want to Read',
      genres: [],
      tropes: [],
      pageCount: 304,
      coverUrl: 'https://covers.openlibrary.org/b/id/8739161-L.jpg',
      coverCandidates: [
        'https://covers.openlibrary.org/b/id/8739161-L.jpg',
        'https://covers.openlibrary.org/b/isbn/9780441478125-L.jpg',
      ],
      metadataStatus: 'candidate',
      metadataSources: ['open-library'],
      sourceIds: {
        openLibraryKey: 'OL45804W',
        isbn10: ['0441478123'],
        isbn13: ['9780441478125'],
      },
    });
  });

  it('creates a manual draft Book without metadata sources', () => {
    expect(createManualDraftBook('Manual Title', 'Manual Author', 'book-2')).toEqual({
      id: 'book-2',
      title: 'Manual Title',
      author: 'Manual Author',
      status: 'Want to Read',
      genres: [],
      tropes: [],
      metadataStatus: 'manual',
      metadataSources: ['manual'],
      coverCandidates: [],
    });
  });
});

const existingBook: Book = {
  id: 'book-1',
  title: 'Existing Title',
  author: 'Existing Author',
  status: 'Reading',
  genres: ['Fiction'],
  tropes: ['quiet'],
  pagesRead: 42,
  notes: 'Keep my note',
};

const result: MetadataSearchResult = {
  sourceName: 'google-books',
  sourceId: 'gb-1',
  title: 'Fetched Title',
  author: 'Fetched Author',
  publishedYear: 2020,
  publisher: 'Fetched Press',
  pageCount: 320,
  language: 'en',
  isbn10: ['1234567890'],
  isbn13: ['9781234567890'],
  coverCandidates: ['https://example.com/cover.jpg'],
};

describe('mergeBookWithMetadataResult', () => {
  it('fills missing metadata without replacing user reading state', () => {
    expect(mergeBookWithMetadataResult(existingBook, result)).toMatchObject({
      id: 'book-1',
      title: 'Existing Title',
      author: 'Existing Author',
      status: 'Reading',
      genres: ['Fiction'],
      tropes: ['quiet'],
      pagesRead: 42,
      notes: 'Keep my note',
      publishedYear: 2020,
      publisher: 'Fetched Press',
      pageCount: 320,
      language: 'en',
      coverUrl: 'https://example.com/cover.jpg',
      coverCandidates: ['https://example.com/cover.jpg'],
      metadataStatus: 'candidate',
      metadataSources: ['google-books'],
    });
  });

  it('does not overwrite existing user-entered page count or cover', () => {
    const merged = mergeBookWithMetadataResult(
      { ...existingBook, pageCount: 111, coverUrl: 'https://example.com/original.jpg' },
      result,
    );

    expect(merged.pageCount).toBe(111);
    expect(merged.coverUrl).toBe('https://example.com/original.jpg');
    expect(merged.coverCandidates).toEqual([
      'https://example.com/original.jpg',
      'https://example.com/cover.jpg',
    ]);
  });

  it('merges source ISBN arrays without replacing existing source IDs with empty values', () => {
    const merged = mergeBookWithMetadataResult(
      {
        ...existingBook,
        sourceIds: {
          openLibraryKey: 'OL-existing',
          isbn10: ['1111111111', '1234567890'],
          isbn13: ['9781111111111'],
        },
      },
      {
        ...result,
        sourceName: 'open-library',
        sourceId: '',
        isbn10: ['1234567890', '2222222222'],
        isbn13: ['9781111111111', '9782222222222'],
      },
    );

    expect(merged.sourceIds).toEqual({
      openLibraryKey: 'OL-existing',
      isbn10: ['1111111111', '1234567890', '2222222222'],
      isbn13: ['9781111111111', '9782222222222'],
    });
  });
});
