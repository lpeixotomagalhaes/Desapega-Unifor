"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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

  useEffect(() => {
    if (!open) return;
    setSubject("");
    setMessage("");
    setError(null);
    setSuccess(false);
  }, [open]);

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
              Abrir reclamação
            </h2>
            <p className="mt-1 text-sm text-muted">
              Conte o que aconteceu. Nossa equipe responde pelo painel.
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

        {success ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              Reclamação enviada. Obrigado pelo contato!
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white hover:bg-brand"
            >
              Fechar
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
