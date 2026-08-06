"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CampusDeliveryTip } from "@/components/CampusDeliveryTip";
import { ImageDropzone, type ImageDraft } from "@/components/ImageDropzone";
import {
  api,
  ApiError,
  CATEGORIES,
  isMarketplaceRestricted,
  NetworkError,
  type Category,
  type CreateItemInput,
} from "@/lib/api";
import { useAuthRedirect } from "@/lib/auth";
import { markOfflineItemJustSaved } from "@/lib/offlineCache";
import { useOfflineQueue } from "@/lib/offlineQueue";

type FlowPhase =
  | "form"
  | "progress"
  | "waiting_connection"
  | "success"
  | "error";

type StepId =
  | "dados"
  | "fotos"
  | "salvar_local"
  | "aguardar"
  | "publicar"
  | "concluido";

type StepState = "pending" | "active" | "done" | "waiting" | "error";

type StepDef = {
  id: StepId;
  label: string;
  detail: string;
};

const ONLINE_STEPS: StepDef[] = [
  {
    id: "dados",
    label: "Anúncio criado",
    detail: "Dados e fotos conferidos",
  },
  {
    id: "fotos",
    label: "Enviando fotos",
    detail: "Upload das imagens para o servidor",
  },
  {
    id: "publicar",
    label: "Publicando",
    detail: "Disponibilizando no marketplace",
  },
  {
    id: "concluido",
    label: "Publicado com sucesso",
    detail: "Seu anúncio já está no ar",
  },
];

const OFFLINE_STEPS: StepDef[] = [
  {
    id: "dados",
    label: "Anúncio criado",
    detail: "Dados e fotos conferidos",
  },
  {
    id: "salvar_local",
    label: "Salvando no aparelho",
    detail: "Guardando rascunho com as fotos",
  },
  {
    id: "aguardar",
    label: "Aguardando conexão",
    detail: "Publicação automática quando a internet voltar",
  },
  {
    id: "concluido",
    label: "Pronto para publicar",
    detail: "Na fila — sai assim que reconectar",
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
        ✓
      </span>
    );
  }
  if (state === "waiting") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-white">
        …
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
        !
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-navy">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" />
        <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-fog bg-white text-xs font-semibold text-muted">
      ·
    </span>
  );
}

function PublishProgress({
  steps,
  states,
  title,
  subtitle,
  accent,
}: {
  steps: StepDef[];
  states: Record<StepId, StepState>;
  title: string;
  subtitle: string;
  accent: "navy" | "amber" | "emerald";
}) {
  const accentBox =
    accent === "emerald"
      ? "border-emerald-200 bg-emerald-50/70"
      : accent === "amber"
        ? "border-amber-200 bg-amber-50/70"
        : "border-fog bg-white";

  return (
    <div className={`mx-auto max-w-lg rounded-2xl border ${accentBox} p-6 sm:p-8`}>
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          Andamento do anúncio
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-navy">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
      </div>

      <ol className="relative space-y-0">
        {steps.map((step, index) => {
          const state = states[step.id] ?? "pending";
          const isLast = index === steps.length - 1;
          const lineDone =
            state === "done" ||
            (states[steps[index + 1]?.id] &&
              states[steps[index + 1].id] !== "pending");

          return (
            <li key={step.id} className="relative flex gap-3 pb-6 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden
                  className={`absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-0.5 ${
                    lineDone ? "bg-emerald-400" : "bg-fog"
                  }`}
                />
              )}
              <div className="relative z-[1] shrink-0">
                <StepIcon state={state} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-sm font-semibold ${
                    state === "pending" ? "text-muted" : "text-navy"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-muted">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function CreateItemFlow({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const { user, token, ready } = useAuthRedirect();
  const { addPendingItem, isOnline, pendingItems } = useOfflineQueue();

  const [form, setForm] = useState({
    title: "",
    description: "",
    categories: [] as Category[],
    price: "",
    isDonation: false,
  });
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [phase, setPhase] = useState<FlowPhase>("form");
  const [path, setPath] = useState<"online" | "offline">("online");
  const [stepStates, setStepStates] = useState<Partial<Record<StepId, StepState>>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState("");
  const [queuedId, setQueuedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const failWith = (message: string, failedStep?: StepId) => {
    if (failedStep) {
      setStepStates((prev) => ({
        ...prev,
        [failedStep]: "error",
      }));
    }
    setPhase("error");
    setError(message);
    setSubmitting(false);
  };

  const errorMessage = (err: unknown): string => {
    if (err instanceof ApiError || err instanceof NetworkError) {
      return err.message;
    }
    if (err instanceof Error && err.message.trim()) {
      return err.message;
    }
    return "Não foi possível publicar o anúncio. Tente novamente.";
  };

  // Enquanto a tela "aguardando conexão" está aberta, observa a fila: assim
  // que este rascunho for publicado (some da fila) ou falhar, atualiza a tela
  // em vez de deixar o usuário preso em "aguardando conexão" para sempre.
  useEffect(() => {
    if (!queuedId || phase !== "waiting_connection") return;
    const match = pendingItems.find((p) => p.id === queuedId);
    if (!match) {
      setPhase("success");
      setStepStates((prev) => ({
        ...prev,
        dados: "done",
        salvar_local: "done",
        aguardar: "done",
        concluido: "done",
      }));
      return;
    }
    if (match.status === "error") {
      setPhase("error");
      setError(
        match.error ?? "Não foi possível publicar o anúncio salvo offline.",
      );
    }
  }, [pendingItems, queuedId, phase]);

  useEffect(() => {
    if (
      ready &&
      user &&
      (!user.phone || !user.course || !user.enrollment)
    ) {
      router.push(
        `/completar-perfil?returnUrl=${encodeURIComponent("/app?tab=anunciar")}`,
      );
    }
  }, [ready, user, router]);

  if (!ready || !token || !user?.phone || !user.course || !user.enrollment) {
    return null;
  }

  if (isMarketplaceRestricted(user)) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        Sua conta está restrita e não pode publicar anúncios. Você ainda pode
        navegar e ver o site normalmente.
      </div>
    );
  }

  const setStep = (id: StepId, state: StepState) => {
    setStepStates((prev) => ({ ...prev, [id]: state }));
  };

  const markDoneUpTo = (ids: StepId[]) => {
    setStepStates((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = "done";
      return next;
    });
  };

  const runOfflineQueue = async () => {
    setPath("offline");
    setPhase("progress");
    setStepStates({
      dados: "done",
      salvar_local: "active",
      aguardar: "pending",
      concluido: "pending",
    });
    await sleep(350);
    const id = await addPendingItem(
      {
        title: form.title,
        description: form.description,
        categories: form.categories,
        price: form.price,
        isDonation: form.isDonation,
      },
      images.map((d) => d.file),
      token,
    );
    setQueuedId(id);
    const title = form.title.trim();
    setSavedTitle(title);
    markOfflineItemJustSaved(title);
    setStep("salvar_local", "done");
    setStep("aguardar", "waiting");
    setStep("concluido", "waiting");
    setPhase("waiting_connection");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const title = form.title.trim();
    const description = form.description.trim();

    if (title.length < 3) {
      setError("O título deve ter pelo menos 3 caracteres.");
      return;
    }
    if (description.length < 10) {
      setError(
        `A descrição deve ter pelo menos 10 caracteres (faltam ${10 - description.length}).`,
      );
      return;
    }
    if (form.categories.length === 0) {
      setError("Escolha pelo menos uma categoria.");
      return;
    }
    if (!form.isDonation && !form.price) {
      setError("Informe um preço ou marque como doação.");
      return;
    }
    if (images.length === 0) {
      setError("Adicione pelo menos uma foto do item.");
      return;
    }

    setSubmitting(true);
    try {
      // Só enfileira offline quando realmente sem rede — falhas online
      // precisam mostrar erro (antes caíam silenciosamente na fila).
      if (!navigator.onLine || !isOnline) {
        await runOfflineQueue();
        setSubmitting(false);
        return;
      }

      setPath("online");
      setPhase("progress");
      setStepStates({
        dados: "done",
        fotos: "active",
        publicar: "pending",
        concluido: "pending",
      });
      await sleep(280);

      const urls: string[] = [];
      try {
        for (let i = 0; i < images.length; i++) {
          const draft = images[i];
          setStep("fotos", "active");
          const { url } = await api.uploadImage(token, draft.file);
          urls.push(url);
        }
      } catch (err) {
        failWith(
          `Falha ao enviar a foto ${urls.length + 1}: ${errorMessage(err)}`,
          "fotos",
        );
        return;
      }

      setStep("fotos", "done");
      setStep("publicar", "active");
      await sleep(220);

      const payload: CreateItemInput = {
        title,
        description,
        categories: form.categories,
        isDonation: form.isDonation,
        imageUrl: urls[0],
        imageUrls: urls,
        ...(form.isDonation ? {} : { price: Number(form.price) }),
      };

      try {
        await api.createItem(token, payload);
      } catch (err) {
        failWith(
          `As fotos foram enviadas, mas a publicação falhou: ${errorMessage(err)}`,
          "publicar",
        );
        return;
      }

      setSavedTitle(title);
      markDoneUpTo(["dados", "fotos", "publicar", "concluido"]);
      setPhase("success");
      setSubmitting(false);
    } catch (err) {
      // Offline real no meio do processo → salva na fila
      if (!navigator.onLine || !isOnline) {
        try {
          await runOfflineQueue();
          setSubmitting(false);
          return;
        } catch (queueErr) {
          failWith(errorMessage(queueErr), "salvar_local");
          return;
        }
      }
      failWith(errorMessage(err), "publicar");
    }
  };

  const steps = path === "offline" ? OFFLINE_STEPS : ONLINE_STEPS;
  const filledStates = Object.fromEntries(
    steps.map((s) => [s.id, stepStates[s.id] ?? "pending"]),
  ) as Record<StepId, StepState>;

  if (phase === "progress" || phase === "waiting_connection" || phase === "success") {
    const isWaiting = phase === "waiting_connection";
    const isSuccess = phase === "success";

    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 animate-fade-up">
        <PublishProgress
          steps={steps}
          states={filledStates}
          title={
            isSuccess
              ? "Publicado com sucesso"
              : isWaiting
                ? "Aguardando conexão"
                : path === "offline"
                  ? "Preparando anúncio offline"
                  : "Enviando anúncio"
          }
          subtitle={
            isSuccess
              ? `"${savedTitle}" já está disponível no campus.`
              : isWaiting
                ? `"${savedTitle}" foi carregado neste aparelho e será publicado automaticamente.`
                : path === "offline"
                  ? "Sem internet — salvando localmente para publicar depois."
                  : "Estamos enviando suas fotos e publicando no marketplace."
          }
          accent={isSuccess ? "emerald" : isWaiting ? "amber" : "navy"}
        />

        {(isWaiting || isSuccess) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onCreated}
              className="rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition-soft hover:bg-brand"
            >
              Ver Meus anúncios
            </button>
            {isWaiting && (
              <button
                type="button"
                onClick={() => {
                  setPhase("form");
                  setStepStates({});
                  setError(null);
                  setQueuedId(null);
                }}
                className="rounded-xl border border-fog bg-white px-6 py-3 text-sm font-semibold text-navy transition-soft hover:border-brand"
              >
                Criar outro anúncio
              </button>
            )}
            {isSuccess && (
              <button
                type="button"
                onClick={() => {
                  setForm({
                    title: "",
                    description: "",
                    categories: [],
                    price: "",
                    isDonation: false,
                  });
                  setImages([]);
                  setPhase("form");
                  setStepStates({});
                  setError(null);
                  setQueuedId(null);
                }}
                className="rounded-xl border border-fog bg-white px-6 py-3 text-sm font-semibold text-navy transition-soft hover:border-brand"
              >
                Anunciar outro item
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-lg animate-fade-up rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="text-xl font-bold text-navy">Não foi possível concluir</h1>
        <p className="mt-2 text-sm text-red-700">
          {error ?? "Tente novamente em instantes."}
        </p>
        <button
          type="button"
          onClick={() => {
            setPhase("form");
            setStepStates({});
            setError(null);
            setQueuedId(null);
          }}
          className="mt-5 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-brand"
        >
          Voltar ao formulário
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-fog bg-white px-4 py-3 text-sm outline-none transition-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-2xl flex-col gap-5 animate-fade-up"
    >
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          Novo anúncio
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy">
          Anunciar item
        </h1>
        <p className="text-sm text-muted">
          Preencha os dados abaixo. Online publicamos na hora; offline salvamos
          no aparelho e publicamos ao reconectar.
        </p>
      </header>

      {/* Mini trilha enquanto preenche */}
      <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-fog bg-white px-3 py-2.5 text-xs">
        {(isOnline ? ONLINE_STEPS : OFFLINE_STEPS).map((step, i) => (
          <div key={step.id} className="flex shrink-0 items-center gap-2">
            {i > 0 && <span className="h-px w-4 bg-fog" aria-hidden />}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                i === 0
                  ? "bg-navy text-white"
                  : "bg-mist text-muted"
              }`}
            >
              <span className="tabular-nums opacity-70">{i + 1}</span>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {!isOnline && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong className="font-semibold">Modo offline.</strong> Ao enviar, o
          anúncio fica carregado neste aparelho e entra na fila até haver
          conexão.
        </p>
      )}

      <section className="space-y-4 rounded-2xl border border-fog bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-navy">Informações</h2>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
          Título
          <input
            required
            maxLength={100}
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              setError(null);
            }}
            placeholder="Ex: Livro de Cálculo Vol. 1"
            className={inputClass}
          />
          <span className="text-xs font-normal text-muted">
            Mínimo 3 caracteres
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
          Descrição
          <textarea
            required
            maxLength={1000}
            rows={4}
            value={form.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value });
              setError(null);
            }}
            placeholder="Estado do item, detalhes e ponto de retirada no campus"
            className={inputClass}
          />
          <span className="text-xs font-normal text-muted">
            {form.description.trim().length}/10 caracteres mínimos
            {form.description.trim().length > 0 &&
            form.description.trim().length < 10
              ? ` · faltam ${10 - form.description.trim().length}`
              : ""}
          </span>
        </label>

        <CampusDeliveryTip variant="form" />
      </section>

      <section className="space-y-4 rounded-2xl border border-fog bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-navy">Categoria e valor</h2>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-navy/80">
            Categorias{" "}
            <span className="font-normal text-muted">(pode marcar mais de uma)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORIES) as Category[]).map((key) => {
              const selected = form.categories.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      categories: selected
                        ? prev.categories.filter((c) => c !== key)
                        : [...prev.categories, key],
                    }));
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-soft ${
                    selected
                      ? "bg-navy text-white"
                      : "border border-fog bg-mist/60 text-muted hover:border-brand hover:text-navy"
                  }`}
                  aria-pressed={selected}
                >
                  {CATEGORIES[key]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex items-center gap-3 rounded-xl border border-brand/20 bg-mist px-4 py-3 text-sm font-medium text-navy">
          <input
            type="checkbox"
            checked={form.isDonation}
            onChange={(e) => setForm({ ...form, isDonation: e.target.checked })}
            className="h-4 w-4 accent-brand"
          />
          É doação (sem preço)
        </label>

        {!form.isDonation && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
            Preço (R$)
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Ex: 50.00"
              className={inputClass}
            />
          </label>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-fog bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-navy">Fotos</h2>
        <ImageDropzone images={images} onChange={setImages} onError={setError} />
      </section>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-navy py-3.5 font-semibold text-white shadow-sm transition-soft hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? "Publicando…"
          : isOnline
            ? "Publicar anúncio"
            : "Salvar e aguardar conexão"}
      </button>
    </form>
  );
}
