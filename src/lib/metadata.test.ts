import { describe, expect, it } from 'vitest';
import {
  createDraftBookFromResult,
  createManualDraftBook,
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
