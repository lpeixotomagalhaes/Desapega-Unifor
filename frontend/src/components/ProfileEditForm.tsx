"use client";

import { FormEvent, useEffect, useState } from "react";
import { CourseSelect } from "@/components/CourseSelect";
import { api, ApiError, type SessionUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatBrazilianPhoneInput, isValidBrazilianPhone } from "@/lib/phone";
import { getCourseAreaLabel, isUniforCourse } from "@/lib/unifor-courses";

const inputClass =
  "w-full rounded-xl border border-fog bg-white px-3.5 py-2.5 text-sm outline-none transition-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

type ProfileEditFormProps = {
  user: SessionUser;
  onCancel: () => void;
  onSaved: () => void;
};

export function ProfileEditForm({
  user,
  onCancel,
  onSaved,
}: ProfileEditFormProps) {
  const { token, refreshUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [enrollment, setEnrollment] = useState(user.enrollment ?? "");
  const [course, setCourse] = useState(
    user.course && isUniforCourse(user.course) ? user.course : "",
  );
  const [phone, setPhone] = useState(user.phone ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(user.name);
    setEnrollment(user.enrollment ?? "");
    setCourse(user.course && isUniforCourse(user.course) ? user.course : "");
    setPhone(user.phone ?? "");
    setBio(user.bio ?? "");
  }, [user]);

  const courseArea = course ? getCourseAreaLabel(course) : null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);

    if (name.trim().length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    if (!course || !isUniforCourse(course)) {
      setError("Selecione seu curso da UNIFOR.");
      return;
    }
    if (enrollment.trim().length < 3) {
      setError("Informe uma matrícula válida.");
      return;
    }
    if (phone && !isValidBrazilianPhone(phone)) {
      setError("Informe um WhatsApp válido, com DDD.");
      return;
    }

    setSaving(true);
    try {
      await api.updateMe(token, {
        name: name.trim(),
        course: course.trim(),
        enrollment: enrollment.trim(),
        bio: bio.trim(),
        ...(phone ? { phone } : {}),
      });
      await refreshUser();
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível salvar.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mt-5 space-y-3 border-t border-fog pt-5 text-left">
      <label className="block text-sm font-medium text-navy/80">
        Nome
        <input
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </label>

      <label className="block text-sm font-medium text-navy/80">
        Matrícula
        <input
          required
          minLength={3}
          maxLength={40}
          value={enrollment}
          onChange={(e) => setEnrollment(e.target.value)}
          placeholder="Ex.: 2212345"
          className={`mt-1 ${inputClass}`}
        />
      </label>

      <label className="block text-sm font-medium text-navy/80">
        Curso
        <CourseSelect
          required
          value={course}
          onChange={setCourse}
          className={`mt-1 ${inputClass}`}
        />
        {courseArea && (
          <span className="mt-1 block text-xs font-normal text-muted">
            Área: {courseArea}
          </span>
        )}
      </label>

      <label className="block text-sm font-medium text-navy/80">
        WhatsApp
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(formatBrazilianPhoneInput(e.target.value))}
          placeholder="(85) 91234-5678"
          className={`mt-1 ${inputClass}`}
        />
      </label>

      <label className="block text-sm font-medium text-navy/80">
        E-mail
        <input
          disabled
          value={user.email}
          className={`mt-1 ${inputClass} cursor-not-allowed bg-mist text-muted`}
        />
      </label>

      <label className="block text-sm font-medium text-navy/80">
        Bio pública
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Conte um pouco sobre você…"
          className={`mt-1 ${inputClass}`}
        />
        <span className="mt-1 block text-xs font-normal text-muted">
          {bio.length}/280
        </span>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-fog py-2.5 text-sm font-semibold text-navy hover:bg-mist"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
