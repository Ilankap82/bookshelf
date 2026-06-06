import type { Book, MetadataSourceName, SourceIds } from '../types';

export interface MetadataSearchQuery {
  title: string;
  author?: string;
  isbn?: string;
}

export type MetadataSearchSourceName = 'open-library' | 'google-books';

export interface MetadataSearchResult {
  sourceName: MetadataSearchSourceName;
  sourceId: string;
  title: string;
  author: string;
  publishedYear?: number;
  publisher?: string;
  pageCount?: number;
  language?: string;
  isbn10: string[];
  isbn13: string[];
  coverCandidates: string[];
}

export interface MetadataSearchResponse {
  results: MetadataSearchResult[];
  errors: string[];
}

interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  publisher?: string[];
  isbn?: string[];
  language?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
}

interface OpenLibrarySearchResponse {
  docs?: OpenLibraryDoc[];
}

interface GoogleBooksIndustryIdentifier {
  type?: string;
  identifier?: string;
}

interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  language?: string;
  industryIdentifiers?: GoogleBooksIndustryIdentifier[];
  imageLinks?: Record<string, string | undefined>;
}

interface GoogleBooksItem {
  id?: string;
  volumeInfo?: GoogleBooksVolumeInfo;
}

interface GoogleBooksSearchResponse {
  items?: GoogleBooksItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
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

function firstString(value: unknown): string | undefined {
  return stringArray(value)[0];
}

function parseOpenLibraryResponse(value: unknown): OpenLibrarySearchResponse {
  if (!isRecord(value) || !Array.isArray(value.docs)) return {};

  return { docs: value.docs.filter(isRecord) as OpenLibraryDoc[] };
}

function parseGoogleBooksResponse(value: unknown): GoogleBooksSearchResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) return {};

  return { items: value.items.filter(isRecord) as GoogleBooksItem[] };
}

function isbnBuckets(isbns: unknown): Pick<MetadataSearchResult, 'isbn10' | 'isbn13'> {
  const values = stringArray(isbns);

  return {
    isbn10: values.filter((isbn) => isbn.length === 10),
    isbn13: values.filter((isbn) => isbn.length === 13),
  };
}

function parseYear(value: string | undefined): number | undefined {
  const match = value?.match(/^\d{4}/);
  return match ? Number(match[0]) : undefined;
}

function toHttps(url: string): string {
  return url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url;
}

function metadataSourceName(sourceName: MetadataSearchSourceName): MetadataSourceName {
  return sourceName;
}

function sourceIdsFromResult(result: MetadataSearchResult): SourceIds {
  const ids: SourceIds = {};

  if (result.sourceName === 'open-library') ids.openLibraryKey = result.sourceId;
  if (result.sourceName === 'google-books') ids.googleBooksId = result.sourceId;
  if (result.isbn10.length > 0) ids.isbn10 = result.isbn10;
  if (result.isbn13.length > 0) ids.isbn13 = result.isbn13;

  return ids;
}

function openLibrarySourceId(key: unknown): string {
  return optionalString(key)?.split('/').filter(Boolean).at(-1) ?? '';
}

function openLibraryCoverCandidates(
  coverId: number | undefined,
  isbn10: readonly string[],
  isbn13: readonly string[],
): string[] {
  const candidates: string[] = [];

  if (coverId !== undefined) {
    candidates.push(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`);
  }

  for (const isbn of [...isbn13, ...isbn10]) {
    candidates.push(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`);
  }

  return Array.from(new Set(candidates));
}

function googleCoverCandidates(imageLinks: unknown): string[] {
  if (!isRecord(imageLinks)) return [];

  return Array.from(
    new Set(
      Object.values(imageLinks)
        .filter(isString)
        .map(toHttps),
    ),
  );
}

function googleIndustryIdentifiers(value: unknown): GoogleBooksIndustryIdentifier[] {
  return Array.isArray(value)
    ? value.filter(isRecord) as GoogleBooksIndustryIdentifier[]
    : [];
}

function openLibraryUrl(query: MetadataSearchQuery): string {
  const params = new URLSearchParams({
    limit: '10',
    fields: [
      'key',
      'title',
      'author_name',
      'first_publish_year',
      'publisher',
      'isbn',
      'language',
      'cover_i',
      'number_of_pages_median',
    ].join(','),
  });

  if (query.isbn !== undefined) params.set('isbn', query.isbn);
  if (query.title !== '') params.set('title', query.title);
  if (query.author !== undefined && query.author !== '') params.set('author', query.author);

  return `https://openlibrary.org/search.json?${params.toString()}`;
}

function googleBooksUrl(query: MetadataSearchQuery): string {
  const terms: string[] = [];

  if (query.isbn !== undefined && query.isbn !== '') terms.push(`isbn:${query.isbn}`);
  if (query.title !== '') terms.push(`intitle:${query.title}`);
  if (query.author !== undefined && query.author !== '') terms.push(`inauthor:${query.author}`);

  const params = new URLSearchParams({
    maxResults: '10',
    q: terms.join(' '),
  });

  return `https://www.googleapis.com/books/v1/volumes?${params.toString()}`;
}

export function normalizeOpenLibraryDocs(docs: readonly OpenLibraryDoc[]): MetadataSearchResult[] {
  return docs
    .filter((doc) => optionalString(doc.title) !== undefined || optionalString(doc.key) !== undefined)
    .map((doc) => {
      const { isbn10, isbn13 } = isbnBuckets(doc.isbn);

      return {
        sourceName: 'open-library',
        sourceId: openLibrarySourceId(doc.key),
        title: optionalString(doc.title) ?? '',
        author: firstString(doc.author_name) ?? '',
        publishedYear: optionalNumber(doc.first_publish_year),
        publisher: firstString(doc.publisher),
        pageCount: optionalNumber(doc.number_of_pages_median),
        language: firstString(doc.language),
        isbn10,
        isbn13,
        coverCandidates: openLibraryCoverCandidates(optionalNumber(doc.cover_i), isbn10, isbn13),
      };
    });
}

export function normalizeGoogleBooksItems(items: readonly GoogleBooksItem[]): MetadataSearchResult[] {
  return items
    .filter((item) => item.id !== undefined || item.volumeInfo?.title !== undefined)
    .map((item) => {
      const volumeInfo = isRecord(item.volumeInfo) ? item.volumeInfo : undefined;
      const identifiers = googleIndustryIdentifiers(volumeInfo?.industryIdentifiers);
      const isbn10 = identifiers
        ?.filter((identifier) => identifier.type === 'ISBN_10' && isString(identifier.identifier))
        .map((identifier) => identifier.identifier as string) ?? [];
      const isbn13 = identifiers
        ?.filter((identifier) => identifier.type === 'ISBN_13' && isString(identifier.identifier))
        .map((identifier) => identifier.identifier as string) ?? [];

      return {
        sourceName: 'google-books',
        sourceId: item.id ?? '',
        title: optionalString(volumeInfo?.title) ?? '',
        author: firstString(volumeInfo?.authors) ?? '',
        publishedYear: parseYear(optionalString(volumeInfo?.publishedDate)),
        publisher: optionalString(volumeInfo?.publisher),
        pageCount: optionalNumber(volumeInfo?.pageCount),
        language: optionalString(volumeInfo?.language),
        isbn10,
        isbn13,
        coverCandidates: googleCoverCandidates(volumeInfo?.imageLinks),
      };
    });
}

export async function searchBookMetadata(
  query: MetadataSearchQuery,
  fetcher: typeof fetch = fetch,
): Promise<MetadataSearchResponse> {
  const errors: string[] = [];
  const results: MetadataSearchResult[] = [];

  try {
    const response = await fetcher(openLibraryUrl(query));
    if (!response.ok) throw new Error('Open Library search failed.');

    const data = parseOpenLibraryResponse(await response.json());
    results.push(...normalizeOpenLibraryDocs(data.docs ?? []));
  } catch {
    errors.push('Open Library search failed.');
  }

  try {
    const response = await fetcher(googleBooksUrl(query));
    if (!response.ok) throw new Error('Google Books search failed.');

    const data = parseGoogleBooksResponse(await response.json());
    results.push(...normalizeGoogleBooksItems(data.items ?? []));
  } catch {
    errors.push('Google Books search failed.');
  }

  return { results, errors };
}

export function createDraftBookFromResult(
  result: MetadataSearchResult,
  id: string = crypto.randomUUID(),
): Book {
  const coverUrl = result.coverCandidates[0];
  const draft: Book = {
    id,
    title: result.title,
    author: result.author,
    status: 'Want to Read',
    genres: [],
    tropes: [],
    metadataStatus: 'candidate',
    metadataSources: [metadataSourceName(result.sourceName)],
    sourceIds: sourceIdsFromResult(result),
  };

  if (result.pageCount !== undefined) draft.pageCount = result.pageCount;
  if (coverUrl !== undefined) draft.coverUrl = coverUrl;
  if (result.coverCandidates.length > 0) draft.coverCandidates = result.coverCandidates;

  return draft;
}

export function mergeBookWithMetadataResult(book: Book, result: MetadataSearchResult): Book {
  const coverCandidates = Array.from(new Set([
    book.coverUrl,
    ...(book.coverCandidates ?? []),
    ...result.coverCandidates,
  ].filter((candidate): candidate is string => Boolean(candidate))));

  return {
    ...book,
    subtitle: book.subtitle,
    description: book.description,
    publishedYear: book.publishedYear ?? result.publishedYear,
    publisher: book.publisher ?? result.publisher,
    pageCount: book.pageCount ?? result.pageCount,
    language: book.language ?? result.language,
    coverUrl: book.coverUrl ?? result.coverCandidates[0],
    coverCandidates,
    metadataStatus: 'candidate',
    metadataSources: Array.from(new Set([...(book.metadataSources ?? []), metadataSourceName(result.sourceName)])),
    sourceIds: {
      ...book.sourceIds,
      ...sourceIdsFromResult(result),
    },
  };
}

export function createManualDraftBook(
  title: string,
  author: string,
  id: string = crypto.randomUUID(),
): Book {
  return {
    id,
    title,
    author,
    status: 'Want to Read',
    genres: [],
    tropes: [],
    metadataStatus: 'manual',
    metadataSources: ['manual'],
    coverCandidates: [],
  };
}
