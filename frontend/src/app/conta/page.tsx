"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ProfileAvatar } from "@/components/ProfileDrawer";
import { api, ApiError } from "@/lib/api";
import { useAuth, useAuthRedirect } from "@/lib/auth";
import { formatBrazilianPhoneInput, isValidBrazilianPhone } from "@/lib/phone";

const inputClass =
  "w-full rounded-xl border border-fog bg-white px-4 py-3 text-sm outline-none transition-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

function ContaInner() {
  const router = useRouter();
  const { user, token, ready } = useAuthRedirect();
  const { refreshUser, signOut } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? "");
  }, [user]);

  if (!ready || !user || !token) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (name.trim().length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
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
        ...(phone ? { phone } : {}),
      });
      await refreshUser();
      setMessage("Dados atualizados.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível salvar.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <Link
        href="/app"
        className="mb-4 inline-flex text-sm font-medium text-muted transition-soft hover:text-navy"
      >
        ← Voltar
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <ProfileAvatar user={user} size={64} />
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy">
            Minha conta
          </h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="flex flex-col gap-4 rounded-2xl border border-fog bg-white p-5 shadow-sm"
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
          Nome
          <input
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
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

        <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
          WhatsApp
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(formatBrazilianPhoneInput(e.target.value))}
            placeholder="(85) 91234-5678"
            className={inputClass}
          />
        </label>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-navy py-3 font-semibold text-white transition-soft hover:bg-brand disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          signOut();
          router.push("/");
        }}
        className="mt-6 w-full rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 transition-soft hover:bg-red-50"
      >
        Sair da conta
      </button>
    </div>
  );
}

export default function ContaPage() {
  return (
    <Suspense>
      <ContaInner />
    </Suspense>
  );
}
