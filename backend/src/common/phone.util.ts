/**
 * Normaliza um telefone/WhatsApp brasileiro para o formato E.164 sem o "+"
 * (ex: "5585912345678"), aceitando entradas com parênteses, espaços,
 * traços e com ou sem o código do país.
 */
export function normalizeBrazilianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');

  let national = digits;
  if (national.startsWith('55') && national.length > 11) {
    national = national.slice(2);
  }

  // DDD (2 dígitos) + número (8 ou 9 dígitos)
  if (national.length < 10 || national.length > 11) {
    return null;
  }

  return `55${national}`;
}

export function isValidBrazilianPhone(raw: string): boolean {
  return normalizeBrazilianPhone(raw) !== null;
}

/** Monta o link do WhatsApp com mensagem pré-preenchida sobre um anúncio. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${phone}?${params.toString()}`;
}
