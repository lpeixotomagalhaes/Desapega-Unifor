"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const inputClass =
  "w-full rounded-xl border border-fog bg-white px-4 py-3 text-sm outline-none transition-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

export function AuthForm({ mode }: { mode: "login" | "registro" }) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const auth = isLogin
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      signIn(auth);
      router.push("/app");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro de conexão com a API.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="hero-glow flex min-h-screen flex-col items-center justify-center px-4">
      <Link
        href="/"
        className="mb-8 flex animate-fade-up flex-col items-center gap-3"
      >
        <BrandLogo variant="horizontal" height={44} priority />
        <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
          Desapega UNIFOR
        </span>
      </Link>

      <form
        onSubmit={handleSubmit}
        className="animate-fade-up delay-2 flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/15 bg-white p-6 shadow-2xl"
      >
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-navy">
          {isLogin ? "Entrar" : "Criar conta"}
        </h1>

        {!isLogin && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
            Nome
            <input
              required
              minLength={2}
              maxLength={80}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome"
              className={inputClass}
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
          E-mail
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="voce@edu.unifor.br"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
          Senha
          <input
            required
            type="password"
            minLength={isLogin ? 1 : 6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={isLogin ? "Sua senha" : "Mínimo 6 caracteres"}
            className={inputClass}
          />
        </label>

        {error && (
          <p className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-navy py-3 font-semibold text-white shadow-sm transition-soft hover:-translate-y-0.5 hover:bg-brand disabled:opacity-60"
        >
          {submitting
            ? "Aguarde..."
            : isLogin
              ? "Entrar"
              : "Criar conta"}
        </button>

        <p className="text-center text-sm text-muted">
          {isLogin ? (
            <>
              Ainda não tem conta?{" "}
              <Link
                href="/registro"
                className="font-semibold text-brand hover:underline"
              >
                Cadastre-se
              </Link>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <Link
                href="/login"
                className="font-semibold text-brand hover:underline"
              >
                Entrar
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
