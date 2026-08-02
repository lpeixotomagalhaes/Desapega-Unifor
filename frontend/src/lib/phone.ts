/** Display helper for stored phones (often 55 + DDD + number). */
export function formatBrazilianPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return "Não informado";
  const digits = raw.replace(/\D/g, "");
  const national =
    digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  if (national.length < 10) return raw;
  return formatBrazilianPhoneInput(national);
}

/** Formats digits as the user types into a Brazilian phone mask: (85) 91234-5678. */
export function formatBrazilianPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";

  const ddd = digits.slice(0, 2);
  if (digits.length <= 2) return `(${ddd}`;

  const rest = digits.slice(2);
  if (digits.length <= 6) return `(${ddd}) ${rest}`;
  if (digits.length <= 10) {
    // Fixo: DDD + 4 + 4
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  // Celular: DDD + 5 + 4
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

/** Mirrors backend/src/common/phone.util.ts validation (DDD + 8 or 9 dígitos). */
export function isValidBrazilianPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  const national =
    digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  return national.length === 10 || national.length === 11;
}
