import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import type { Book } from '../types';
import {
  createDraftBookFromResult,
  createManualDraftBook,
  searchBookMetadata,
} from '../lib/metadata';
import type { MetadataSearchResult } from '../lib/metadata';
import BookForm from './BookForm';

type IntakeDraft = Book & {
  publishedYear?: number;
  publisher?: string;
  language?: string;
  sourceName?: MetadataSearchResult['sourceName'];
};

interface BookIntakePanelProps {
  onSave: (book: Book) => void;
  onClose: () => void;
}

export default function BookIntakePanel({ onSave, onClose }: BookIntakePanelProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [results, setResults] = useState<MetadataSearchResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [draft, setDraft] = useState<IntakeDraft | null>(null);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    if (!cleanTitle) return;

    setIsSearching(true);
    setErrors([]);

    const response = await searchBookMetadata({
      title: cleanTitle,
      author: cleanAuthor || undefined,
    });

    setResults(response.results);
    setErrors(response.errors);
    setIsSearching(false);
  }

  function draftFromResult(result: MetadataSearchResult): IntakeDraft {
    return {
      ...createDraftBookFromResult(result),
      publishedYear: result.publishedYear,
      publisher: result.publisher,
      language: result.language,
      sourceName: result.sourceName,
    };
  }

  function handleManualDraft() {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setDraft(createManualDraftBook(cleanTitle, author.trim()) as IntakeDraft);
  }

  function handleSave(book: Book) {
    onSave(book);
    onClose();
  }

  if (draft) {
    return <BookForm book={draft} onSave={handleSave} onClose={() => setDraft(null)} isNew />;
  }

  return (
    <div
      style={overlayStyle}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div style={panelStyle}>
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>Add Book</div>
            <div style={subtitleStyle}>Search first, then review before saving.</div>
          </div>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close book intake">x</button>
        </div>

        <form onSubmit={handleSearch} style={searchStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Title *">
              <input
                style={inputStyle}
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Book title"
              />
            </Field>
            <Field label="Author">
              <input
                style={inputStyle}
                value={author}
                onChange={event => setAuthor(event.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={!title.trim() || isSearching} style={primaryButtonStyle}>
              {isSearching ? 'Searching...' : 'Search Metadata'}
            </button>
            <button type="button" disabled={!title.trim()} onClick={handleManualDraft} style={secondaryButtonStyle}>
              Add Manually
            </button>
          </div>
        </form>

        {errors.length > 0 && (
          <div style={errorBoxStyle}>
            {errors.map(error => <div key={error}>{error}</div>)}
          </div>
        )}

        <div style={resultsStyle}>
          {results.length === 0 && !isSearching && (
            <div style={emptyStyle}>Search results will appear here.</div>
          )}

          {results.map(result => (
            <button
              key={`${result.sourceName}-${result.sourceId}-${result.title}`}
              type="button"
              onClick={() => setDraft(draftFromResult(result))}
              style={resultStyle}
            >
              <Cover url={result.coverCandidates[0]} />
              <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                <div style={resultTitleStyle}>{result.title || title}</div>
                <div style={resultAuthorStyle}>{result.author || author || 'Unknown author'}</div>
                <div style={metadataStyle}>
                  {[result.publishedYear, result.publisher, result.pageCount ? `${result.pageCount} pages` : undefined]
                    .filter(Boolean)
                    .join(' / ') || 'No extra details'}
                </div>
              </div>
              <div style={sourceStyle}>{result.sourceName}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#6B6B6B', fontWeight: 700, marginBottom: 7 }}>{label}</div>
      {children}
    </label>
  );
}

function Cover({ url }: { url: string | undefined }) {
  if (url) {
    return <img src={url} alt="" style={coverStyle} />;
  }

  return (
    <div style={{ ...coverStyle, background: 'linear-gradient(160deg,#F1F1ED,#E8E8E0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A8A82', fontSize: 20 }}>
      No cover
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(27,28,25,0.45)',
  zIndex: 110,
  display: 'flex',
  justifyContent: 'flex-end',
  backdropFilter: 'blur(4px)',
};

const panelStyle: CSSProperties = {
  width: 720,
  maxWidth: '100%',
  background: '#FAF9F4',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-12px 0 60px rgba(27,28,25,0.15)',
};

const headerStyle: CSSProperties = {
  padding: '20px 28px',
  borderBottom: '1px solid rgba(45,45,45,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
};

const titleStyle: CSSProperties = {
  fontFamily: "'Newsreader', serif",
  fontStyle: 'italic',
  fontSize: 20,
  fontWeight: 600,
  color: '#2D2D2D',
};

const subtitleStyle: CSSProperties = {
  fontSize: 12,
  color: '#6B6B6B',
  marginTop: 3,
};

const closeButtonStyle: CSSProperties = {
  background: 'rgba(45,45,45,0.08)',
  border: 'none',
  width: 28,
  height: 28,
  borderRadius: '50%',
  fontSize: 18,
  lineHeight: '28px',
  cursor: 'pointer',
  color: '#4B4B4B',
};

const searchStyle: CSSProperties = {
  padding: '24px 28px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  borderBottom: '1px solid rgba(45,45,45,0.08)',
};

const inputStyle: CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1px solid rgba(45,45,45,0.14)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: "'Manrope', sans-serif",
  color: '#2D2D2D',
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryButtonStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "'Manrope', sans-serif",
  cursor: 'pointer',
  border: 'none',
  fontWeight: 600,
  background: 'linear-gradient(160deg, #067D55 0%, #006241 100%)',
  color: '#FFFFFF',
};

const secondaryButtonStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "'Manrope', sans-serif",
  cursor: 'pointer',
  border: '1px solid rgba(45,45,45,0.18)',
  background: 'transparent',
  color: '#4B4B4B',
};

const errorBoxStyle: CSSProperties = {
  margin: '16px 28px 0',
  padding: '10px 12px',
  borderRadius: 8,
  background: 'rgba(217,119,6,0.10)',
  color: '#92400E',
  fontSize: 12,
  lineHeight: 1.5,
};

const resultsStyle: CSSProperties = {
  padding: 28,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const emptyStyle: CSSProperties = {
  padding: '44px 0',
  textAlign: 'center',
  color: '#8A8A82',
  fontSize: 13,
};

const resultStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  padding: 12,
  border: '1px solid rgba(45,45,45,0.10)',
  borderRadius: 8,
  background: '#FFFFFF',
  cursor: 'pointer',
  fontFamily: "'Manrope', sans-serif",
  color: '#2D2D2D',
};

const coverStyle: CSSProperties = {
  width: 46,
  height: 68,
  borderRadius: 5,
  objectFit: 'cover',
  flexShrink: 0,
  boxShadow: '2px 4px 12px rgba(27,28,25,0.14)',
};

const resultTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const resultAuthorStyle: CSSProperties = {
  fontSize: 12,
  color: '#6B6B6B',
  marginTop: 3,
};

const metadataStyle: CSSProperties = {
  fontSize: 11,
  color: '#8A8A82',
  marginTop: 6,
};

const sourceStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  color: '#006241',
  background: 'rgba(0,98,65,0.08)',
  borderRadius: 12,
  padding: '4px 8px',
  flexShrink: 0,
};
