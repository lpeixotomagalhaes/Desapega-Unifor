"use client";

import { useEffect, useState } from "react";

function formatParts(date: Date) {
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("pt-BR", { month: "long" });
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    day,
    month,
    time,
  };
}

export function AdminClock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const { weekday, day, month, time } = formatParts(now);

  return (
    <div
      className={`text-right text-[11px] leading-snug text-muted sm:text-xs ${className}`}
      aria-live="polite"
    >
      <p className="hidden font-semibold capitalize text-navy sm:block">
        {weekday}, {day} de {month}
      </p>
      <p className="font-semibold capitalize text-navy sm:hidden">
        {day} {month.slice(0, 3)} · {time}
      </p>
      <p className="hidden tabular-nums sm:block">{time}</p>
    </div>
  );
}
