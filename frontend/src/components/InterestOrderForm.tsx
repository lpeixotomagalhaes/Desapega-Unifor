"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CourseSelect } from "@/components/CourseSelect";
import {
  api,
  ApiError,
  formatPrice,
  type Item,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isUniforCourse } from "@/lib/unifor-courses";

const CAMPUS_BLOCKS = [
  "Bloco A",
  "Bloco B",
  "Bloco C",
  "Bloco D",
  "Bloco E",
  "Bloco J",
  "Biblioteca",
  "Cantina Central",
  "Estacionamento",
  "Outro",
] as const;

type FormData = {
  course: string;
  enrollment: string;
  acceptListedPrice: boolean;
  offeredPrice: string;
  meetupDay: string;
  meetupTime: string;
  campusBlock: string;
  customBlock: string;
};

const inputClass =
  "w-full rounded-lg border border-fog bg-mist/40 px-3.5 py-2.5 text-sm text-navy outline-none transition-soft placeholder:text-muted/70 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15";

export function InterestOrderForm({ item }: { item: Item }) {
  const router = useRouter();
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  const isOwner = user?.id === item.user.id;
  const isConcluded = item.status === "CONCLUIDO";
  const isDonation = item.isDonation;

  const totalSteps = isDonation ? 2 : 3;
  const [step, setStep] = useState(1);
  const [enviado, setEnviado] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState<FormData>({
    course: "",
    enrollment: "",
    acceptListedPrice: true,
    offeredPrice: "",
    meetupDay: "",
    meetupTime: "",
    campusBlock: CAMPUS_BLOCKS[0],
    customBlock: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      course:
        prev.course ||
        (user.course && isUniforCourse(user.course) ? user.course : ""),
      enrollment: prev.enrollment || user.enrollment || "",
    }));
  }, [user]);

  const visualStep = useMemo(() => {
    if (isDonation) return step === 1 ? 1 : 2;
    return step;
  }, [isDonation, step]);

  const ensureAuth = () => {
    const returnUrl = `/itens/${item.id}`;
    if (!user || !token) {
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return false;
    }
    if (!user.phone || !user.course || !user.enrollment) {
      router.push(
        `/completar-perfil?returnUrl=${encodeURIComponent(returnUrl)}`,
      );
      return false;
    }
    return true;
  };

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const avancarEtapa1 = () => {
    if (!ensureAuth()) return;
    if (!form.course.trim() || !isUniforCourse(form.course)) {
      setErro("Selecione seu curso da UNIFOR.");
      return;
    }
    if (form.enrollment.trim().length < 3) {
      setErro("Informe uma matrícula válida.");
      return;
    }
    setErro("");
    setStep(2);
  };

  const avancarEtapa2 = () => {
    if (!form.acceptListedPrice) {
      const n = Number(form.offeredPrice.replace(",", "."));
      if (!Number.isFinite(n) || n < 0) {
        setErro("Informe um valor válido ou aceite o valor anunciado.");
        return;
      }
    }
    setErro("");
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!ensureAuth() || !token) return;

    if (!form.meetupDay.trim()) {
      setErro("Informe o dia do encontro.");
      return;
    }
    if (!form.meetupTime.trim()) {
      setErro("Informe o horário do encontro.");
      return;
    }
    if (
      form.campusBlock === "Outro" &&
      form.customBlock.trim().length < 2
    ) {
      setErro("Descreva o local/bloco do encontro.");
      return;
    }

    setErro("");
    setEnviando(true);
    try {
      const payload = {
        course: form.course.trim(),
        enrollment: form.enrollment.trim(),
        acceptListedPrice: isDonation ? true : form.acceptListedPrice,
        offeredPrice:
          !isDonation && !form.acceptListedPrice
            ? Number(form.offeredPrice.replace(",", "."))
            : undefined,
        meetupDay: form.meetupDay.trim(),
        meetupTime: form.meetupTime.trim(),
        campusBlock: form.campusBlock,
        customBlock:
          form.campusBlock === "Outro" ? form.customBlock.trim() : undefined,
      };
      const { whatsappUrl: url } = await api.createOrder(
        token,
        item.id,
        payload,
      );
      if (
        user &&
        (user.course !== payload.course ||
          user.enrollment !== payload.enrollment)
      ) {
        try {
          await api.updateMe(token, {
            course: payload.course,
            enrollment: payload.enrollment,
          });
          await refreshUser();
        } catch {
          // pedido já foi criado; sync do perfil é best-effort
        }
      }
      setWhatsappUrl(url);
      setEnviado(true);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setErro(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar o pedido. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  };

  if (isOwner) {
    return (
      <div className="rounded-2xl border border-fog bg-white p-5 text-sm text-muted">
        Este é o seu anúncio. Os interessados aparecem em{" "}
        <span className="font-medium text-navy">Meus anúncios → Interessados</span>.
      </div>
    );
  }

  if (isConcluded) {
    return (
      <div className="rounded-2xl border border-fog bg-mist/60 p-6 text-center">
        <p className="font-display text-lg font-bold text-navy">
          Anúncio indisponível
        </p>
        <p className="mt-1 text-sm text-muted">
          Este item já foi {item.isDonation ? "doado" : "vendido"}.
        </p>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center animate-fade-in">
        <p className="font-display text-xl font-bold text-green-700">Enviado!</p>
        <p className="mt-2 text-sm text-green-800">
          Seu pedido para <strong>{item.title}</strong> está pendente. O
          vendedor vai confirmar a negociação pelo painel.
        </p>
        {whatsappUrl && (
          <button
            type="button"
            onClick={() =>
              window.open(whatsappUrl, "_blank", "noopener,noreferrer")
            }
            className="mt-4 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-soft hover:bg-brand"
          >
            Abrir WhatsApp novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-fog bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold text-navy">
          Fazer pedido
        </h3>
        <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-muted">
          Passo {visualStep} de {totalSteps}
        </span>
      </div>

      <div className="mb-5 flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const n = i + 1;
          return (
            <div key={n} className="contents">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full transition-soft ${
                  visualStep >= n ? "bg-brand shadow-[0_0_0_3px_rgba(26,79,214,0.15)]" : "bg-fog"
                }`}
              />
              {n < totalSteps && (
                <span
                  className={`h-0.5 flex-1 rounded transition-soft ${
                    visualStep > n ? "bg-brand" : "bg-fog"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {erro && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </p>
      )}

      {step === 1 && (
        <div className="animate-fade-in space-y-3.5">
          <p className="text-xs font-bold uppercase tracking-wide text-brand">
            Dados acadêmicos
          </p>
          <input
            className={inputClass}
            placeholder="Matrícula"
            value={form.enrollment}
            onChange={(e) => setField("enrollment", e.target.value)}
            disabled={authLoading}
          />
          <CourseSelect
            value={form.course}
            onChange={(course) => setField("course", course)}
            disabled={authLoading}
            className={inputClass}
          />
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={avancarEtapa1}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-soft hover:bg-brand-bright"
              aria-label="Avançar"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && !isDonation && (
        <div className="animate-fade-in space-y-3.5">
          <p className="text-xs font-bold uppercase tracking-wide text-brand">
            Valor
          </p>
          <p className="text-sm text-muted">
            Preço anunciado:{" "}
            <span className="font-semibold text-navy">{formatPrice(item)}</span>
          </p>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-fog bg-mist/30 px-3 py-3 text-sm text-navy">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]"
              checked={form.acceptListedPrice}
              onChange={(e) => setField("acceptListedPrice", e.target.checked)}
            />
            <span>Estou disposto a pagar o valor anunciado</span>
          </label>
          {!form.acceptListedPrice && (
            <input
              className={inputClass}
              type="text"
              inputMode="decimal"
              placeholder="Valor que está disposto a pagar (R$)"
              value={form.offeredPrice}
              onChange={(e) => setField("offeredPrice", e.target.value)}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setErro("");
                setStep(1);
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fog bg-mist text-navy transition-soft hover:bg-fog"
              aria-label="Voltar"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={avancarEtapa2}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-sm transition-soft hover:bg-brand-bright"
              aria-label="Avançar"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {((step === 2 && isDonation) || (step === 3 && !isDonation)) && (
        <div className="animate-fade-in space-y-3.5">
          <p className="text-xs font-bold uppercase tracking-wide text-brand">
            Encontro no campus
          </p>
          <input
            className={inputClass}
            type="date"
            value={form.meetupDay}
            onChange={(e) => setField("meetupDay", e.target.value)}
          />
          <input
            className={inputClass}
            type="time"
            value={form.meetupTime}
            onChange={(e) => setField("meetupTime", e.target.value)}
          />
          <select
            className={inputClass}
            value={form.campusBlock}
            onChange={(e) => setField("campusBlock", e.target.value)}
          >
            {CAMPUS_BLOCKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {form.campusBlock === "Outro" && (
            <input
              className={inputClass}
              placeholder="Descreva o local (ex.: em frente ao Bloco M)"
              value={form.customBlock}
              onChange={(e) => setField("customBlock", e.target.value)}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setErro("");
                setStep(isDonation ? 1 : 2);
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fog bg-mist text-navy transition-soft hover:bg-fog"
              aria-label="Voltar"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => void handleSubmit()}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-soft hover:bg-green-700 disabled:opacity-60"
            >
              {enviando ? (
                "Enviando…"
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Enviar pedido
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Ao enviar, o pedido fica pendente e abrimos o WhatsApp do vendedor com
        seus dados. Pague somente após conferir o item pessoalmente.
      </p>
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M19 12H5M11 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12l5 5L20 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 8v5M12 16h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
