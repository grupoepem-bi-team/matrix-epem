import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTreeStore } from '../../store/useTreeStore';

/** Debounce delay in milliseconds before updating the store query */
const DEBOUNCE_MS = 300;

export const SearchBar: React.FC = () => {
  const searchQuery = useTreeStore((s) => s.searchQuery);
  const searchResults = useTreeStore((s) => s.searchResults);
  const setSearchQuery = useTreeStore((s) => s.setSearchQuery);
  const clearSearch = useTreeStore((s) => s.clearSearch);

  /** Local input value – updates immediately on keystroke for responsiveness */
  const [localValue, setLocalValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Sync local value when store query changes externally ── */
  useEffect(() => {
    if (searchQuery !== localValue) {
      setLocalValue(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only react to store changes
  }, [searchQuery]);

  /* ── Cleanup pending debounce on unmount ── */
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalValue(value);

      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        setSearchQuery(value);
      }, DEBOUNCE_MS);
    },
    [setSearchQuery],
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    clearSearch();
  }, [clearSearch]);

  const hasQuery = localValue.length > 0;
  const resultCount = searchResults.length;

  /* Dynamic right padding:
   *  - No query:  minimal padding (search icon only on left)
   *  - Query, no results:    space for X button
   *  - Query, with results: space for badge + X button
   */
  const rightPadClass = hasQuery
    ? resultCount > 0
      ? 'pr-14'
      : 'pr-9'
    : 'pr-3';

  return (
    <div className="relative">
      {/* Search icon – left side */}
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-n8n-text-inverse-secondary"
        size={16}
      />

      {/* Text input */}
      <input
        type="text"
        className={`n8n-input bg-transparent border-n8n-sidebar-border text-n8n-text-inverse placeholder:text-n8n-text-inverse-secondary pl-9 ${rightPadClass}`}
        placeholder="Buscar documentos..."
        value={localValue}
        onChange={handleChange}
        aria-label="Buscar documentos"
      />

      {/* Result count badge – appears when query has results */}
      {hasQuery && resultCount > 0 && (
        <span className="absolute right-9 top-1/2 -translate-y-1/2 n8n-badge bg-n8n-accent-light text-n8n-accent text-[10px] leading-none px-1.5 py-0.5 pointer-events-none">
          {resultCount}
        </span>
      )}

      {/* Clear button – appears when query is non-empty */}
      {hasQuery && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-n8n-text-inverse-secondary hover:text-n8n-text-inverse hover:bg-n8n-sidebar-active transition-colors"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
