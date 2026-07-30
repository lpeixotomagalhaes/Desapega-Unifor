import {
  CAMPUS_DELIVERY_CHECKLIST,
  CAMPUS_DELIVERY_SUMMARY,
  CAMPUS_DELIVERY_TITLE,
} from "@/lib/campusDelivery";

type CampusDeliveryTipProps = {
  /** Compact tip under a form field vs. a fuller empty-state callout. */
  variant?: "form" | "empty";
};

export function CampusDeliveryTip({ variant = "form" }: CampusDeliveryTipProps) {
  if (variant === "empty") {
    return (
      <aside className="rounded-xl border border-brand/20 bg-mist px-4 py-3 text-left">
        <p className="text-sm font-semibold text-navy">{CAMPUS_DELIVERY_TITLE}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {CAMPUS_DELIVERY_SUMMARY}
        </p>
        <ul className="mt-2 space-y-1 text-sm text-navy/75">
          {CAMPUS_DELIVERY_CHECKLIST.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-brand" aria-hidden>
                ·
              </span>
              {item}
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  return (
    <aside className="rounded-xl border border-fog bg-mist/80 px-3.5 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        Dica · {CAMPUS_DELIVERY_TITLE}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {CAMPUS_DELIVERY_SUMMARY}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-navy/75">
        {CAMPUS_DELIVERY_CHECKLIST.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 text-brand" aria-hidden>
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}
