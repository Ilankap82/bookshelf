/**
 * Fetch a cover URL from Open Library.
 * Uses cover_i (OL internal cover ID) which is guaranteed to have an image,
 * unlike ISBNs which often have no cover registered.
 */
export async function fetchCoverUrl(title: string, author: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(title);
    const a = encodeURIComponent(author);
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${q}&author=${a}&limit=3&fields=cover_i,isbn,title`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const docs: Array<{ cover_i?: number; isbn?: string[]; title?: string }> = data.docs ?? [];

    // cover_i is most reliable — these IDs only exist when a cover is registered
    for (const doc of docs) {
      if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
      }
    }

    // Fallback to ISBN — prefer ISBN-13
    for (const doc of docs) {
      const isbns = doc.isbn ?? [];
      const isbn = isbns.find(i => i.length === 13) || isbns.find(i => i.length === 10);
      if (isbn) {
        return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
      }
    }
  } catch {
    // ignore network errors
  }
  return null;
}
