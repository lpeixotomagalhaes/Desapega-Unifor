"use client";

import { FormEvent, useEffect, useState } from "react";
import { CourseSelect } from "@/components/CourseSelect";
import { api, ApiError, type SessionUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatBrazilianPhoneInput, isValidBrazilianPhone } from "@/lib/phone";
import { getCourseAreaLabel, isUniforCourse } from "@/lib/unifor-courses";

const inputClass =
  "w-full rounded-xl border border-fog bg-white px-4 py-3 text-sm outline-none transition-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

export function isProfileIncomplete(user: SessionUser | null | undefined): boolean {
  if (!user) return false;
  const nameOk = (user.name?.trim().length ?? 0) >= 2;
  const phoneOk = Boolean(user.phone && isValidBrazilianPhone(user.phone));
  const courseOk = Boolean(user.course && isUniforCourse(user.course));
  const enrollmentOk = (user.enrollment?.trim().length ?? 0) >= 3;
  return !(nameOk && phoneOk && courseOk && enrollmentOk);
}

type CompleteProfileModalProps = {
  open: boolean;
};

export function CompleteProfileModal({ open }: CompleteProfileModalProps) {
  const { user, token, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [course, setCourse] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name ?? "");
    setEnrollment(user.enrollment ?? "");
    setCourse(user.course && isUniforCourse(user.course) ? user.course : "");
    setPhone(user.phone ?? "");
    setError(null);
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !user || !token) return null;

  const courseArea = course ? getCourseAreaLabel(course) : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }
    if (enrollment.trim().length < 3) {
      setError("Informe uma matrícula válida.");
      return;
    }
    if (!course || !isUniforCourse(course)) {
      setError("Selecione seu curso da UNIFOR.");
      return;
    }
    if (!isValidBrazilianPhone(phone)) {
      setError("Informe um WhatsApp válido, com DDD.");
      return;
    }

    setSaving(true);
    try {
      await api.updateMe(token, {
        name: name.trim(),
        enrollment: enrollment.trim(),
        course: course.trim(),
        phone,
      });
      await refreshUser();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível salvar seu perfil.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-navy/55 p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-profile-title"
        className="max-h-[min(92dvh,720px)] w-full max-w-md overflow-y-auto rounded-2xl border border-fog bg-white p-6 shadow-2xl animate-fade-in"
      >
        <h2
          id="complete-profile-title"
          className="font-display text-xl font-bold text-navy"
        >
          Complete seu perfil
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          Para usar o Desapega UNIFOR com segurança, precisamos desses dados
          acadêmicos e de contato.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
            Nome
            <input
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Seu nome completo"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
            Matrícula
            <input
              required
              minLength={3}
              maxLength={40}
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value)}
              className={inputClass}
              placeholder="Ex.: 2212345"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
            Curso
            <CourseSelect
              required
              value={course}
              onChange={setCourse}
              className={inputClass}
            />
            {courseArea && (
              <span className="text-xs font-normal text-muted">
                Área: {courseArea}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
            WhatsApp
            <input
              required
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) =>
                setPhone(formatBrazilianPhoneInput(e.target.value))
              }
              className={inputClass}
              placeholder="(85) 91234-5678"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
            E-mail
            <input
              disabled
              value={user.email}
              className={`${inputClass} cursor-not-allowed bg-mist text-muted`}
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-1 rounded-xl bg-navy py-3 text-sm font-semibold text-white transition-soft hover:bg-brand disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar e continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Exibe o modal sempre que a sessão existir com dados incompletos. */
export function CompleteProfileGate() {
  const { user, token, loading, refreshUser } = useAuth();

  useEffect(() => {
    if (loading || !token) return;
    void refreshUser();
  }, [loading, token, refreshUser]);

  const incomplete = !loading && Boolean(token && isProfileIncomplete(user));
  return <CompleteProfileModal open={incomplete} />;
}
