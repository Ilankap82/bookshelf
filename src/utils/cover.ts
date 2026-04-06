/**
 * Fetch a cover URL from Open Library.
 * Uses a scored matching approach to find the best result for a given title+author.
 */

// Known cover IDs that return placeholder/wrong images on OpenLibrary
const KNOWN_BAD_IDS = new Set([
  '8743161',   // Returns "My Dog, Bob" — wrong book
  '12468631',  // Returns "Cover to be Revealed" placeholder
]);

export function isBadCoverUrl(url: string): boolean {
  const match = url.match(/\/b\/id\/(\d+)-/);
  if (match) return KNOWN_BAD_IDS.has(match[1]);
  return false;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function titleScore(query: string, candidate: string): number {
  const q = normalize(query);
  const c = normalize(candidate);
  if (c === q) return 100;
  if (c.startsWith(q) || q.startsWith(c)) return 80;
  // Count how many words of the query appear in the candidate
  const qWords = q.split(' ').filter(Boolean);
  const cWords = new Set(c.split(' ').filter(Boolean));
  const matches = qWords.filter(w => cWords.has(w)).length;
  return Math.round((matches / qWords.length) * 60);
}

export async function fetchCoverUrl(title: string, author: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(title);
    const a = encodeURIComponent(author);

    // Fetch more candidates so we can pick the best match
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${q}&author=${a}&limit=10&fields=cover_i,isbn,title,author_name`
    );
    if (!res.ok) return null;
    const data = await res.json();

    interface OLDoc {
      cover_i?: number;
      isbn?: string[];
      title?: string;
      author_name?: string[];
    }

    const docs: OLDoc[] = data.docs ?? [];

    // Score each doc and pick the best matching one that has a cover
    const scored = docs
      .map(doc => ({ doc, score: titleScore(title, doc.title ?? '') }))
      .sort((a, b) => b.score - a.score);

    // First pass: cover_i from best-matching docs
    for (const { doc } of scored) {
      if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
      }
    }

    // Second pass: ISBN from best-matching docs (prefer ISBN-13)
    for (const { doc } of scored) {
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
