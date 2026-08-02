"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { BrandLogo, DesapegaWordmark } from "@/components/BrandLogo";
import { api, ApiError, isAdmin } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AdminLoginPage() {
  const { user, token, loading, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (user && token && isAdmin(user)) {
      router.replace("/dashboard");
    }
  }, [loading, user, token, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const auth = await api.login({
        email: email.trim().toLowerCase(),
        password,
      });
      if (!isAdmin(auth.user)) {
        setError("Esta conta não tem permissão de administrador.");
        return;
      }
      signIn(auth);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível entrar.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || (user && token && isAdmin(user))) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-navy-deep text-sm text-white/70">
        Carregando…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-navy-deep px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 20%, #1a4fd6 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 90% 80%, #0d2a6a 0%, transparent 50%)",
        }}
      />
      <div className="relative w-full max-w-md animate-fade-in rounded-2xl border border-white/10 bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo mark="blue" height={44} />
          <DesapegaWordmark className="mt-3 text-xl" />
          <p className="mt-2 text-sm text-muted">Painel administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1.5 block text-sm font-medium text-navy"
            >
              E-mail
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-fog bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm font-medium text-navy"
            >
              Senha
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-fog bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition-soft hover:bg-brand disabled:opacity-60"
          >
            {submitting ? "Entrando…" : "Entrar no painel"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="font-medium text-brand hover:underline">
            Voltar ao marketplace
          </Link>
        </p>
      </div>
    </div>
  );
}
