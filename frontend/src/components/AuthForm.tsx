"use client";

import Image from "next/image";
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
  "w-full rounded-lg border border-[#c5d5e8] bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition-soft placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20";
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
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";
  const returnUrlParam = searchParams.get("returnUrl");
  const destination = postAuthDestination(returnUrlParam);
  const authLinkQs = returnUrlParam
    ? `?returnUrl=${encodeURIComponent(postAuthDestination(returnUrlParam))}`
    : "";

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
      // best-effort
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleAuthSuccess = (auth: AuthResponse) => {
    signIn(auth);
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
    <div className="relative flex min-h-[calc(100dvh-4.75rem)] flex-1 overflow-hidden bg-[#d5e6f6] lg:min-h-[calc(100dvh-5.25rem)]">
      {/* Esquerda: campus + overlay azul (SSO Unifor) */}
      <div className="auth-bg-fade absolute inset-0 lg:right-[38%]">
        <Image
          src="/auth/campus-photo.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 62vw"
          className="auth-bg-motion object-cover object-center"
        />
        <div className="absolute inset-0 bg-[rgb(0_74_247_/0.3)]" />
      </div>

      {/* Direita: painel claro com formas (desktop) */}
      <div className="auth-panel absolute inset-y-0 right-0 hidden w-[38%] lg:block" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:justify-end lg:pr-[4%] xl:pr-[6%]">
        <form
          onSubmit={handleSubmit}
          className="animate-fade-up delay-1 flex w-full max-w-[26rem] flex-col gap-4 rounded-2xl border border-white/15 bg-white p-6 shadow-2xl sm:p-8"
        >
          <div className="animate-fade-up flex flex-col items-center gap-3 text-center">
            <BrandLogo mark="blue" height={40} priority />
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-navy sm:text-2xl">
                {isLogin ? "Acesse sua conta" : "Crie sua conta"}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {isLogin
                  ? "Entre e desapegue no campus em um só lugar"
                  : "Cadastre-se e comece a anunciar no Desapega UNIFOR"}
              </p>
            </div>
          </div>

          <div className="animate-fade-up delay-2">
            <GoogleSignInButton onError={setGeneralError} />
          </div>

          <div className="animate-fade-up delay-2 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <span className="h-px flex-1 bg-fog" />
            ou {isLogin ? "entre" : "cadastre-se"} com e-mail
            <span className="h-px flex-1 bg-fog" />
          </div>

          <div className="animate-fade-up delay-3 flex flex-col gap-3.5">
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
                    <Link
                      href={`/login${authLinkQs}`}
                      className="font-semibold underline"
                    >
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
                    setForm({
                      ...form,
                      phone: formatBrazilianPhoneInput(e.target.value),
                    });
                    clearFieldError("phone");
                  }}
                  placeholder="(85) 91234-5678"
                  className={`${inputClass} ${fieldErrors.phone ? inputErrorClass : ""}`}
                />
                <span className="text-xs text-muted">
                  Usado só para quem tem interesse falar com você.
                </span>
                {fieldErrors.phone && (
                  <span className="text-xs text-red-600">{fieldErrors.phone}</span>
                )}
              </label>
            )}

            <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
              Senha
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={isLogin ? 1 : 8}
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    clearFieldError("password");
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  placeholder={isLogin ? "Senha" : "Mínimo 8 caracteres"}
                  className={`${inputClass} pr-11 ${fieldErrors.password ? inputErrorClass : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition-soft hover:text-navy"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {!isLogin && (passwordFocused || form.password) && (
                <PasswordChecklist password={form.password} />
              )}
              {fieldErrors.password && (
                <span className="text-xs text-red-600">{fieldErrors.password}</span>
              )}
            </label>
          </div>

          {generalError && (
            <p className="animate-fade-in rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {generalError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="animate-fade-up delay-3 mt-1 rounded-lg bg-brand py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-soft hover:-translate-y-0.5 hover:bg-brand-bright disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? (
              <WaitingLabel />
            ) : isLogin ? (
              "Acessar"
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
    </div>
  );
}

function EyeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.5 10.6a2.75 2.75 0 0 0 3.9 3.9M7.1 7.3C4.6 8.7 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.5 0 2.9-.3 4.1-.8M16.7 15.4C19.1 14 21.5 12 21.5 12s-3.5-6.5-9.5-6.5c-.7 0-1.4.05-2 .16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
