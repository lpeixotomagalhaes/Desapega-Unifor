"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type SupportTicket,
  type SupportTicketStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

export function SupportComplaintModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState<"new" | "mine">("new");
  const [mine, setMine] = useState<SupportTicket[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubject("");
    setMessage("");
    setError(null);
    setSuccess(false);
    setTab("new");
  }, [open]);

  useEffect(() => {
    if (!open || !token || tab !== "mine") return;
    let cancelled = false;
    setLoadingMine(true);
    api
      .getMySupportTickets(token)
      .then((data) => {
        if (!cancelled) setMine(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar suas reclamações.");
      })
      .finally(() => {
        if (!cancelled) setLoadingMine(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, token, tab, success]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createSupportTicket(token, {
        subject: subject.trim(),
        message: message.trim(),
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar sua reclamação.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-modal-title"
        className="w-full max-w-md rounded-2xl border border-fog bg-white p-6 shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="support-modal-title"
              className="font-display text-lg font-semibold text-navy"
            >
              Suporte
            </h2>
            <p className="mt-1 text-sm text-muted">
              Abra uma reclamação ou veja respostas da equipe.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted hover:text-navy"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg bg-mist p-1">
          <button
            type="button"
            onClick={() => setTab("new")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === "new" ? "bg-white text-navy shadow-sm" : "text-muted"
            }`}
          >
            Nova
          </button>
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === "mine" ? "bg-white text-navy shadow-sm" : "text-muted"
            }`}
          >
            Minhas
          </button>
        </div>

        {tab === "mine" ? (
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {loadingMine ? (
              <p className="text-sm text-muted">Carregando…</p>
            ) : mine.length === 0 ? (
              <p className="text-sm text-muted">
                Você ainda não enviou reclamações.
              </p>
            ) : (
              mine.map((t) => (
                <article
                  key={t.id}
                  className="rounded-xl border border-fog px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-navy">
                      {t.subject}
                    </h3>
                    <span className="shrink-0 text-[11px] font-medium text-muted">
                      {STATUS_LABEL[t.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{t.message}</p>
                  {t.adminReply && (
                    <p className="mt-2 rounded-lg bg-mist px-2.5 py-2 text-sm text-navy">
                      <span className="font-semibold">Resposta: </span>
                      {t.adminReply}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted">
                    {new Date(t.createdAt).toLocaleString("pt-BR")}
                  </p>
                </article>
              ))
            )}
          </div>
        ) : success ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              Reclamação enviada. Obrigado pelo contato!
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setTab("mine");
              }}
              className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white hover:bg-brand"
            >
              Ver minhas reclamações
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="support-subject"
                className="mb-1 block text-sm font-medium text-navy"
              >
                Assunto
              </label>
              <input
                id="support-subject"
                required
                minLength={3}
                maxLength={120}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-fog px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="Ex.: Problema com anúncio"
              />
            </div>
            <div>
              <label
                htmlFor="support-message"
                className="mb-1 block text-sm font-medium text-navy"
              >
                Mensagem
              </label>
              <textarea
                id="support-message"
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-fog px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="Descreva o problema com o máximo de detalhes."
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
              className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Enviar reclamação"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
