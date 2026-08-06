"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  COURSE_AREAS,
  coursesByArea,
  type UniforCourse,
} from "@/lib/unifor-courses";

type CourseSelectProps = {
  id?: string;
  value: string;
  onChange: (course: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Select de cursos com campo de busca — a lista da UNIFOR é longa demais
 * para um `<select>` nativo sem filtro. */
export function CourseSelect({
  id,
  value,
  onChange,
  required,
  disabled,
  className,
}: CourseSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => coursesByArea(), []);
  const allCourses = useMemo(
    () => groups.flatMap((g) => g.courses),
    [groups],
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return groups;
    const matches = (c: UniforCourse) =>
      normalize(c.name).includes(q) ||
      normalize(COURSE_AREAS[c.area]).includes(q);
    return groups
      .map((group) => ({
        ...group,
        courses: group.courses.filter(matches),
      }))
      .filter((group) => group.courses.length > 0);
  }, [groups, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (courseName: string) => {
    onChange(courseName);
    setOpen(false);
    setQuery("");
  };

  const clear = () => {
    onChange("");
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Campo hidden para validação nativa de formulário required */}
      <input
        id={id}
        tabIndex={-1}
        aria-hidden
        required={required}
        value={value}
        onChange={() => {}}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          setQuery("");
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={`flex min-h-[2.75rem] w-full items-center justify-between gap-2 text-left outline-none disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
      >
        <span className={value ? "truncate" : "truncate text-muted/70"}>
          {value || "Selecione ou busque seu curso"}
        </span>
        <span className="shrink-0 text-muted" aria-hidden>
          ▾
        </span>
      </button>

      {open && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-72 w-full overflow-hidden rounded-xl border border-fog bg-white shadow-lg"
        >
          <div className="border-b border-fog p-2">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar curso (ex.: Engenharia, Direito…)"
              className="w-full rounded-lg border border-fog bg-mist/40 px-3 py-2 text-sm text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              autoComplete="off"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {value ? (
              <li>
                <button
                  type="button"
                  onClick={clear}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-muted hover:bg-mist"
                >
                  Limpar seleção
                </button>
              </li>
            ) : null}
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted">
                Nenhum curso encontrado para “{query}”.
              </li>
            ) : (
              filtered.map((group) => (
                <li key={group.area}>
                  <p className="sticky top-0 bg-mist/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted backdrop-blur">
                    {group.label}
                  </p>
                  <ul>
                    {group.courses.map((course) => {
                      const selected = course.name === value;
                      return (
                        <li key={course.name}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => pick(course.name)}
                            className={`w-full px-3 py-2 text-left text-sm transition-soft hover:bg-brand/5 ${
                              selected
                                ? "bg-brand/10 font-semibold text-brand"
                                : "text-navy"
                            }`}
                          >
                            {course.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))
            )}
          </ul>
          <p className="border-t border-fog px-3 py-1.5 text-[11px] text-muted">
            {query
              ? `${filtered.reduce((n, g) => n + g.courses.length, 0)} resultado(s)`
              : `${allCourses.length} cursos`}
          </p>
        </div>
      )}
    </div>
  );
}
