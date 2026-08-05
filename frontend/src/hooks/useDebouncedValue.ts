import { useEffect, useState } from "react";

/** Atrasa a propagação de um valor — usado para não disparar uma chamada de
 * API a cada tecla digitada em campos de busca. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
