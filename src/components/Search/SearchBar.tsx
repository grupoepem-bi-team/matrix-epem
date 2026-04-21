import React, { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useTreeStore } from "../../store/useTreeStore";

const DEBOUNCE_MS = 300;

export const SearchBar: React.FC = () => {
  const searchQuery = useTreeStore((s) => s.searchQuery);
  const searchResults = useTreeStore((s) => s.searchResults);
  const setSearchQuery = useTreeStore((s) => s.setSearchQuery);
  const clearSearch = useTreeStore((s) => s.clearSearch);

  const [localValue, setLocalValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchQuery !== localValue) {
      setLocalValue(searchQuery);
    }
  }, [searchQuery]);

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
    setLocalValue("");
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    clearSearch();
  }, [clearSearch]);

  const hasQuery = localValue.length > 0;
  const resultCount = searchResults.length;

  const rightPadClass = hasQuery
    ? resultCount > 0
      ? "pr-14"
      : "pr-9"
    : "pr-3";

  return (
    <div className="relative px-3 py-2">
      <Search
        className="absolute left-[18px] top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary"
        size={15}
      />

      <input
        type="text"
        className={`w-full n8n-input bg-sidebar-bg/50 border-border text-text placeholder:text-text-tertiary pl-9 ${rightPadClass}`}
        placeholder="Buscar documentos..."
        value={localValue}
        onChange={handleChange}
        aria-label="Buscar documentos"
      />

      {hasQuery && resultCount > 0 && (
        <span className="absolute right-9 top-1/2 -translate-y-1/2 n8n-badge bg-accent-light text-accent text-[10px] leading-none px-1.5 py-0.5 pointer-events-none">
          {resultCount}
        </span>
      )}

      {hasQuery && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-tertiary hover:text-text hover:bg-sidebar-hover transition-colors"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
