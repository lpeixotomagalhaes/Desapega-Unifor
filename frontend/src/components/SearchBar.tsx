"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  buildSearchSuggestions,
  PLACEHOLDER_PREFIX,
  PLACEHOLDER_SUFFIX,
  PLACEHOLDER_TERMS,
  pushSearchHistory,
  readSearchHistory,
  type SearchSuggestion,
} from "@/lib/searchSuggestions";

/** Delay between typed/deleted characters (ms). */
const TYPE_MS = 70;
const DELETE_MS = 40;
/** Pause after a term is fully typed before deleting. */
const HOLD_MS = 1400;
/** Brief pause after a term is cleared before typing the next. */
const GAP_MS = 320;

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmitSearch: (value: string) => void;
  inputId?: string;
};

export function SearchBar({
  value,
  onChange,
  onSubmitSearch,
  inputId = "global-header-search",
}: SearchBarProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(-1);

  const suggestions = buildSearchSuggestions(value, history);
  const showList = open && suggestions.length > 0;

  useEffect(() => {
    setHistory(readSearchHistory());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setHighlight(-1);
  }, [value, open]);

  const commitSearch = useCallback(
    (raw: string) => {
      const q = raw.trim();
      if (q) {
        setHistory(pushSearchHistory(q));
      }
      setOpen(false);
      setHighlight(-1);
      onSubmitSearch(q);
    },
    [onSubmitSearch],
  );

  const clearSearch = useCallback(() => {
    onChange("");
    commitSearch("");
  }, [commitSearch, onChange]);

  const pickSuggestion = (item: SearchSuggestion) => {
    onChange(item.query);
    commitSearch(item.query);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    // Enter vazio = todos os produtos (ignora sugestão destacada)
    if (!trimmed) {
      commitSearch("");
      return;
    }
    if (highlight >= 0 && suggestions[highlight]) {
      pickSuggestion(suggestions[highlight]);
      return;
    }
    commitSearch(value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showList) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        e.preventDefault();
        setOpen(true);
        setHighlight(0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) =>
        i <= 0 ? suggestions.length - 1 : i - 1,
      );
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setHighlight(-1);
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative min-w-0 flex-1"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false);
          setHighlight(-1);
          setFocused(false);
          // Ao sair do campo, limpa o texto (sem forçar navegação)
          if (value.trim()) {
            onChange("");
          }
        }
      }}
    >
      <form role="search" onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="sr-only">
          Buscar anúncios
        </label>
        <div className="relative">
          <input
            id={inputId}
            type="search"
            value={value}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={showList}
            aria-activedescendant={
              highlight >= 0 && suggestions[highlight]
                ? `${listboxId}-${highlight}`
                : undefined
            }
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setFocused(true);
              setHistory(readSearchHistory());
              setOpen(true);
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={
              focused || value.trim()
                ? "Buscar livros, calculadoras, jalecos..."
                : undefined
            }
            className="w-full rounded-full border border-fog bg-mist/70 py-2.5 pl-4 pr-20 text-base outline-none transition-soft focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 sm:py-3 sm:pr-24"
          />
          {!focused && !value.trim() && <AnimatedPlaceholder />}
          {value.trim() ? (
            <button
              type="button"
              aria-label="Limpar busca"
              onMouseDown={(e) => e.preventDefault()}
              onClick={clearSearch}
              className="absolute right-11 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-soft hover:bg-fog hover:text-navy sm:right-12 sm:h-9 sm:w-9"
            >
              <ClearIcon className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-navy text-white transition-soft hover:bg-brand sm:h-10 sm:w-10"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>
      </form>

      {showList && (
        <SearchSuggestions
          id={listboxId}
          items={suggestions}
          highlight={highlight}
          onHighlight={setHighlight}
          onSelect={pickSuggestion}
        />
      )}
    </div>
  );
}

function AnimatedPlaceholder() {
  const reducedMotion = usePrefersReducedMotion();
  const [termIndex, setTermIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting" | "gap">(
    "typing",
  );

  useEffect(() => {
    if (reducedMotion) {
      setTyped(PLACEHOLDER_TERMS[0] ?? "");
      return;
    }

    const term = PLACEHOLDER_TERMS[termIndex] ?? PLACEHOLDER_TERMS[0];
    let timer: number;

    if (phase === "typing") {
      if (typed.length < term.length) {
        timer = window.setTimeout(() => {
          setTyped(term.slice(0, typed.length + 1));
        }, TYPE_MS);
      } else {
        timer = window.setTimeout(() => setPhase("holding"), 0);
      }
    } else if (phase === "holding") {
      timer = window.setTimeout(() => setPhase("deleting"), HOLD_MS);
    } else if (phase === "deleting") {
      if (typed.length > 0) {
        timer = window.setTimeout(() => {
          setTyped((t) => t.slice(0, -1));
        }, DELETE_MS);
      } else {
        timer = window.setTimeout(() => setPhase("gap"), 0);
      }
    } else {
      // gap — advance to next term, then type
      timer = window.setTimeout(() => {
        setTermIndex((i) => (i + 1) % PLACEHOLDER_TERMS.length);
        setPhase("typing");
      }, GAP_MS);
    }

    return () => window.clearTimeout(timer);
  }, [reducedMotion, phase, termIndex, typed]);

  if (reducedMotion) {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-4 right-12 flex items-center sm:left-4 sm:right-14"
      >
        <span className="truncate text-base text-muted/80">
          {PLACEHOLDER_PREFIX}
          {PLACEHOLDER_TERMS[0] ?? ""}
          {PLACEHOLDER_SUFFIX}
        </span>
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-4 right-12 flex items-center sm:left-4 sm:right-14"
    >
      <span className="truncate text-base text-muted/80">
        {PLACEHOLDER_PREFIX}
        {typed}
        <span className="placeholder-caret" />
        {PLACEHOLDER_SUFFIX}
      </span>
    </span>
  );
}

function SearchSuggestions({
  id,
  items,
  highlight,
  onHighlight,
  onSelect,
}: {
  id: string;
  items: SearchSuggestion[];
  highlight: number;
  onHighlight: (index: number) => void;
  onSelect: (item: SearchSuggestion) => void;
}) {
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Sugestões de busca"
      className="absolute inset-x-0 top-full z-40 mt-1.5 max-h-72 overflow-auto rounded-xl border border-fog bg-white py-1.5 shadow-lg animate-fade-in"
    >
      {items.map((item, index) => {
        const active = index === highlight;
        return (
          <li key={item.id} role="presentation">
            <button
              id={`${id}-${index}`}
              type="button"
              role="option"
              aria-selected={active}
              onMouseEnter={() => onHighlight(index)}
              onMouseDown={(e) => {
                // Prevent input blur before click commits
                e.preventDefault();
              }}
              onClick={() => onSelect(item)}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-soft ${
                active ? "bg-mist text-navy" : "text-ink hover:bg-mist/80"
              }`}
            >
              <SuggestionIcon kind={item.kind} />
              <span className="min-w-0 flex-1 truncate font-medium">
                {item.label}
              </span>
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted">
                {kindLabel(item.kind)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function kindLabel(kind: SearchSuggestion["kind"]): string {
  if (kind === "history") return "Recente";
  if (kind === "category") return "Categoria";
  return "Popular";
}

function SuggestionIcon({ kind }: { kind: SearchSuggestion["kind"] }) {
  const className = "h-4 w-4 shrink-0 text-navy/45";
  if (kind === "history") return <HistoryIcon className={className} />;
  if (kind === "category") return <TagIcon className={className} />;
  return <TrendIcon className={className} />;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 8v5l3 2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 12a8.5 8.5 0 1 0 2.2-5.7L3.5 8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 17l5.5-5.5 3.5 3.5L20 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 8h5v5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 13.5 12.5 21a1.5 1.5 0 0 1-2.1 0L3 13.6V4.5A1.5 1.5 0 0 1 4.5 3H13.6L20 9.4a1.5 1.5 0 0 1 0 2.1z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" />
    </svg>
  );
}
