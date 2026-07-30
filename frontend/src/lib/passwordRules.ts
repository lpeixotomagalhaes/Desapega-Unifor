export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

/** Mirrors the backend regex in backend/src/auth/dto/register.dto.ts (PASSWORD_REGEX). */
export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "Pelo menos 8 caracteres", test: (p) => p.length >= 8 },
  { id: "letter", label: "Uma letra", test: (p) => /[A-Za-zÀ-ÿ]/.test(p) },
  { id: "number", label: "Um número", test: (p) => /\d/.test(p) },
  {
    id: "special",
    label: "Um caractere especial",
    test: (p) => /[^A-Za-zÀ-ÿ0-9\s]/.test(p),
  },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
