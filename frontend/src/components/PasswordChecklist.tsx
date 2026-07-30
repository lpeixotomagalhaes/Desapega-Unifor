import { PASSWORD_RULES } from "@/lib/passwordRules";

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-1 gap-1 pt-0.5 text-xs sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 transition-soft ${
              met ? "text-emerald-600" : "text-muted"
            }`}
          >
            <span aria-hidden className="text-sm leading-none">
              {met ? "✓" : "○"}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
