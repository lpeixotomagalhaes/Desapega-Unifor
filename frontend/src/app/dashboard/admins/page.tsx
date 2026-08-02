"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  api,
  ApiError,
  isSuperAdmin,
  type UserRole,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export default function DashboardAdminsPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!isSuperAdmin(user)) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getAdminAdmins(token);
      setAdmins(data);
      setError(null);
    } catch {
      setError("Não foi possível carregar os admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin(user)) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  if (!isSuperAdmin(user)) {
    return null;
  }

  const handlePromote = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await api.promoteAdmin(token, email.trim().toLowerCase());
      setEmail("");
      setMessage("Usuário promovido a ADMIN.");
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao promover usuário.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!token) return;
    if (!confirm("Revogar permissão de ADMIN deste usuário?")) return;
    setError(null);
    try {
      await api.revokeAdmin(token, id);
      setMessage("Permissão revogada.");
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao revogar admin.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Admins</h1>
        <p className="mt-1 text-sm text-muted">
          Promova ou revogue administradores (somente SUPER_ADMIN).
        </p>
      </div>

      <form
        onSubmit={handlePromote}
        className="flex flex-col gap-3 rounded-xl border border-fog bg-white p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label
            htmlFor="promote-email"
            className="mb-1 block text-sm font-medium text-navy"
          >
            E-mail do usuário
          </label>
          <input
            id="promote-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="aluno@edu.unifor.br"
            className="w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
        >
          {submitting ? "Promovendo…" : "Promover a ADMIN"}
        </button>
      </form>

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-fog bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            ) : (
              admins.map((a) => (
                <tr key={a.id} className="border-b border-fog last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{a.name}</td>
                  <td className="px-4 py-3 text-muted">{a.email}</td>
                  <td className="px-4 py-3">{a.role}</td>
                  <td className="px-4 py-3">
                    {a.role === "ADMIN" ? (
                      <button
                        type="button"
                        onClick={() => void handleRevoke(a.id)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Revogar
                      </button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
