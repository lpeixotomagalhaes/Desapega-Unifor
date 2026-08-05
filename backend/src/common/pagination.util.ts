/**
 * Normaliza parâmetros de paginação vindos de query strings (`?page=abc` etc.),
 * evitando que `Number('abc')` (NaN) se propague para o Prisma (`skip`/`take`).
 */
export function sanitizePage(value: number | undefined, fallback = 1): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.trunc(value as number));
}

export function sanitizeLimit(
  value: number | undefined,
  fallback: number,
  max = 100,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(1, Math.trunc(value as number)));
}
