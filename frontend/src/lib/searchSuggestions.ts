import { CATEGORIES, type Category } from "@/lib/api";

export const SEARCH_HISTORY_KEY = "desapega.searchHistory.v1";
export const SEARCH_HISTORY_MAX = 8;

/** Fixed prefix for the typewriter placeholder (OLX-style). */
export const PLACEHOLDER_PREFIX = 'Buscar "';

/** Terms typed/deleted after the prefix in the empty, unfocused search field. */
export const PLACEHOLDER_TERMS = [
  "Jaleco",
  "Calculadora",
  "Livro de Cálculo",
  "Notebook",
  "Mochila",
  "Monitor",
] as const;

/** Closing quote shown after the typed term (typewriter types into: Buscar "Term"). */
export const PLACEHOLDER_SUFFIX = '"';

/** Full phrases (prefix + term + suffix). */
export const PLACEHOLDER_PHRASES = PLACEHOLDER_TERMS.map(
  (term) => `${PLACEHOLDER_PREFIX}${term}${PLACEHOLDER_SUFFIX}`,
);

/** Popular campus terms for suggestions (no autocomplete API). */
export const POPULAR_SEARCH_TERMS = [
  "Jaleco",
  "Calculadora",
  "Livro de Cálculo",
  "Notebook",
  "Mochila",
  "Monitor",
  "Fone de ouvido",
  "Caderno",
] as const;

export type SuggestionKind = "history" | "popular" | "category";

export interface SearchSuggestion {
  id: string;
  label: string;
  kind: SuggestionKind;
  /** Value applied to the search query (text search). */
  query: string;
  /** When set, selection should apply a category filter instead of text search. */
  category?: Category;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function readSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim())
      .slice(0, SEARCH_HISTORY_MAX);
  } catch {
    return [];
  }
}

export function pushSearchHistory(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed || typeof window === "undefined") return readSearchHistory();

  const next = [
    trimmed,
    ...readSearchHistory().filter(
      (t) => normalize(t) !== normalize(trimmed),
    ),
  ].slice(0, SEARCH_HISTORY_MAX);

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // quota / private mode — ignore
  }
  return next;
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

function matchesPrefix(candidate: string, prefix: string): boolean {
  if (!prefix) return true;
  return normalize(candidate).includes(normalize(prefix));
}

/**
 * Client-side suggestions: recent history, popular terms, and categories
 * filtered by the current query prefix.
 */
export function buildSearchSuggestions(
  query: string,
  history: string[] = readSearchHistory(),
  limit = 8,
): SearchSuggestion[] {
  const prefix = query.trim();
  const seen = new Set<string>();
  const results: SearchSuggestion[] = [];

  const add = (item: SearchSuggestion) => {
    const key = normalize(item.query);
    if (!key || seen.has(key) || results.length >= limit) return;
    if (!matchesPrefix(item.query, prefix) && !matchesPrefix(item.label, prefix)) {
      return;
    }
    seen.add(key);
    results.push(item);
  };

  for (const term of history) {
    add({
      id: `history:${normalize(term)}`,
      label: term,
      kind: "history",
      query: term,
    });
  }

  for (const term of POPULAR_SEARCH_TERMS) {
    add({
      id: `popular:${normalize(term)}`,
      label: term,
      kind: "popular",
      query: term,
    });
  }

  for (const key of Object.keys(CATEGORIES) as Category[]) {
    const label = CATEGORIES[key];
    add({
      id: `category:${key}`,
      label,
      kind: "category",
      query: label,
      category: key,
    });
  }

  return results;
}
