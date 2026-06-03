import type { Book, MetadataStatus } from '../../types';

export type QualityTone = 'reviewed' | 'candidate' | 'manual' | 'care';

export interface BookQualityState {
  tone: QualityTone;
  label: string;
}

export interface ArchiveQualitySummary {
  reviewed: number;
  candidate: number;
  manual: number;
  missingCover: number;
  needsCare: number;
}

export function metadataQualityLabel(status?: MetadataStatus): string {
  if (status === 'reviewed') return 'Reviewed';
  if (status === 'candidate') return 'Candidate';
  return 'Manual';
}

export function hasReliableCover(book: Book): boolean {
  return Boolean(book.coverUrl || (book.coverCandidates && book.coverCandidates.length > 0));
}

export function getBookQualityState(book: Book): BookQualityState {
  if (!hasReliableCover(book)) return { tone: 'care', label: 'Missing cover' };
  if (book.metadataStatus === 'candidate') return { tone: 'candidate', label: 'Candidate' };
  if (book.metadataStatus === 'reviewed') return { tone: 'reviewed', label: 'Reviewed' };
  return { tone: 'manual', label: 'Manual' };
}

export function getArchiveQualitySummary(books: Book[]): ArchiveQualitySummary {
  return books.reduce<ArchiveQualitySummary>(
    (summary, book) => {
      if (!hasReliableCover(book)) summary.missingCover += 1;

      if (book.metadataStatus === 'reviewed') summary.reviewed += 1;
      else if (book.metadataStatus === 'candidate') summary.candidate += 1;
      else summary.manual += 1;

      if (!hasReliableCover(book) || book.metadataStatus !== 'reviewed') summary.needsCare += 1;
      return summary;
    },
    { reviewed: 0, candidate: 0, manual: 0, missingCover: 0, needsCare: 0 },
  );
}
