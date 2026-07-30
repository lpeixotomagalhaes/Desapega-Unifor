"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { PasswordChecklist } from "@/components/PasswordChecklist";
import { api, ApiError, type AuthResponse } from "@/lib/api";
import { postAuthDestination, useAuth } from "@/lib/auth";
import { formatBrazilianPhoneInput, isValidBrazilianPhone } from "@/lib/phone";
import { isPasswordValid } from "@/lib/passwordRules";

const inputClass =
  "w-full rounded-xl border border-fog bg-white px-4 py-3 text-sm outline-none transition-soft focus:border-brand focus:ring-2 focus:ring-brand/20";
const inputErrorClass = "border-red-300 focus:border-red-400 focus:ring-red-100";

type FieldErrors = Partial<Record<"name" | "email" | "password" | "phone", string>>;

function WaitingLabel() {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => {
      setDots((d) => (d % 3) + 1);
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span aria-live="polite">
      Aguarde
      <span className="inline-block w-[1.25em] text-left">
        {".".repeat(dots)}
      </span>
    </span>
  );
}

export function AuthForm({ mode }: { mode: "login" | "registro" }) {
  const searchParams = useSearchParams();
  const { user, token, loading, signIn } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isLogin = mode === "login";
  const returnUrlParam = searchParams.get("returnUrl");
  const destination = postAuthDestination(returnUrlParam);
  const authLinkQs = returnUrlParam
    ? `?returnUrl=${encodeURIComponent(postAuthDestination(returnUrlParam))}`
    : "";

  // Já autenticado (ex.: sessão ficou presa na tela de login) → sai daqui
  useEffect(() => {
    if (loading || !user || !token) return;
    window.location.assign(destination);
  }, [loading, user, token, destination]);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleEmailBlur = async () => {
    if (isLogin || !form.email.trim() || !form.email.includes("@")) return;
    setCheckingEmail(true);
    try {
      const { exists } = await api.checkEmail(form.email.trim());
      if (exists) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Já existe uma conta com esse e-mail.",
        }));
      } else {
        clearFieldError("email");
      }
    } catch {
      // Checagem best-effort — não bloqueia o preenchimento se a API falhar.
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleAuthSuccess = (auth: AuthResponse) => {
    signIn(auth);
    // Navegação completa evita o soft-nav do App Router ficar preso em /login
    // com o botão "Aguarde..." enquanto o header já mostra o usuário logado.
    window.location.assign(destination);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!isLogin) {
      const errs: FieldErrors = {};
      if (form.name.trim().length < 2) {
        errs.name = "Informe seu nome completo.";
      }
      if (!isPasswordValid(form.password)) {
        errs.password =
          "A senha precisa ter 8+ caracteres, com letra, número e caractere especial.";
      }
      if (!isValidBrazilianPhone(form.phone)) {
        errs.phone = "Informe um WhatsApp válido, com DDD.";
      }
      if (Object.keys(errs).length > 0 || fieldErrors.email) {
        setFieldErrors((prev) => ({ ...prev, ...errs }));
        return;
      }
    }

    setSubmitting(true);
    try {
      const auth = isLogin
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      handleAuthSuccess(auth);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFieldErrors((prev) => ({ ...prev, email: err.message }));
      } else {
        setGeneralError(
          err instanceof ApiError ? err.message : "Erro de conexão com a API.",
        );
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="hero-glow flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
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

        <GoogleSignInButton
          onSuccess={handleAuthSuccess}
          onError={setGeneralError}
        />

        <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted">
          <span className="h-px flex-1 bg-fog" />
          ou {isLogin ? "entre" : "cadastre-se"} com e-mail
          <span className="h-px flex-1 bg-fog" />
        </div>

        {!isLogin && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
            Nome
            <input
              required
              minLength={2}
              maxLength={80}
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                clearFieldError("name");
              }}
              placeholder="Seu nome"
              className={`${inputClass} ${fieldErrors.name ? inputErrorClass : ""}`}
            />
            {fieldErrors.name && (
              <span className="text-xs text-red-600">{fieldErrors.name}</span>
            )}
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
          E-mail
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              clearFieldError("email");
            }}
            onBlur={handleEmailBlur}
            placeholder="voce@edu.unifor.br"
            className={`${inputClass} ${fieldErrors.email ? inputErrorClass : ""}`}
          />
          {checkingEmail && (
            <span className="text-xs text-muted">Verificando e-mail...</span>
          )}
          {fieldErrors.email && (
            <span className="text-xs text-red-600">
              {fieldErrors.email}{" "}
              {!isLogin && (
                <Link href={`/login${authLinkQs}`} className="font-semibold underline">
                  Entrar
                </Link>
              )}
            </span>
          )}
        </label>

        {!isLogin && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
            WhatsApp
            <input
              required
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => {
                setForm({ ...form, phone: formatBrazilianPhoneInput(e.target.value) });
                clearFieldError("phone");
              }}
              placeholder="(85) 91234-5678"
              className={`${inputClass} ${fieldErrors.phone ? inputErrorClass : ""}`}
            />
            <span className="text-xs text-muted">
              Usado só para quem tem interesse falar com você — obrigatório para anunciar.
            </span>
            {fieldErrors.phone && (
              <span className="text-xs text-red-600">{fieldErrors.phone}</span>
            )}
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
          Senha
          <input
            required
            type="password"
            minLength={isLogin ? 1 : 8}
            value={form.password}
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              clearFieldError("password");
            }}
            onFocus={() => setPasswordFocused(true)}
            placeholder={isLogin ? "Sua senha" : "Mínimo 8 caracteres"}
            className={`${inputClass} ${fieldErrors.password ? inputErrorClass : ""}`}
          />
          {!isLogin && (passwordFocused || form.password) && (
            <PasswordChecklist password={form.password} />
          )}
          {fieldErrors.password && (
            <span className="text-xs text-red-600">{fieldErrors.password}</span>
          )}
        </label>

        {generalError && (
          <p className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {generalError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-navy py-3 font-semibold text-white shadow-sm transition-soft hover:-translate-y-0.5 hover:bg-brand disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? (
            <WaitingLabel />
          ) : isLogin ? (
            "Entrar"
          ) : (
            "Criar conta"
          )}
        </button>

        <p className="text-center text-sm text-muted">
          {isLogin ? (
            <>
              Ainda não tem conta?{" "}
              <Link
                href={`/registro${authLinkQs}`}
                className="font-semibold text-brand hover:underline"
              >
                Cadastre-se
              </Link>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <Link
                href={`/login${authLinkQs}`}
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
