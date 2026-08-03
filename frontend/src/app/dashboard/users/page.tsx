"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type AccountStatus,
  type AdminUserRow,
  type UserRole,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  USER: "Usuário",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

const STATUS_LABEL: Record<AccountStatus, string> = {
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  BANNED: "Banida",
};

const STATUS_CLASS: Record<AccountStatus, string> = {
  ACTIVE: "bg-green-50 text-green-800",
  SUSPENDED: "bg-amber-50 text-amber-800",
  BANNED: "bg-red-50 text-red-800",
};

export default function DashboardUsersPage() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [accountStatus, setAccountStatus] = useState<AccountStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [action, setAction] = useState<"BAN" | "SUSPEND" | "RESTORE">("SUSPEND");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(7);
  const [takeDownItems, setTakeDownItems] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getAdminUsers(token, {
        limit: 50,
        email: email.trim() || undefined,
        role: role || undefined,
        accountStatus: accountStatus || undefined,
      });
      setUsers(data.users);
      setError(null);
    } catch {
      setError("Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email, role, accountStatus]);

  const openModerate = (u: AdminUserRow) => {
    setSelected(u);
    setAction(u.accountStatus === "ACTIVE" ? "SUSPEND" : "RESTORE");
    setReason(u.moderationReason ?? "");
    setDays(7);
    setTakeDownItems(true);
    setError(null);
  };

  const handleModerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selected) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.moderateUser(token, selected.id, {
        action,
        reason: action === "RESTORE" ? undefined : reason.trim(),
        days: action === "SUSPEND" ? days : undefined,
        takeDownItems:
          action === "BAN" ? takeDownItems : action === "SUSPEND" ? takeDownItems : undefined,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setSelected(updated);
      setAction(updated.accountStatus === "ACTIVE" ? "SUSPEND" : "RESTORE");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao moderar usuário.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Usuários</h1>
        <p className="mt-1 text-sm text-muted">
          Gerencie contas: banir, suspender temporariamente ou reativar.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Filtrar por e-mail…"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-brand sm:max-w-xs"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole | "")}
          className="rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Todas as roles</option>
          <option value="USER">Usuário</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super admin</option>
        </select>
        <select
          value={accountStatus}
          onChange={(e) =>
            setAccountStatus(e.target.value as AccountStatus | "")
          }
          className="rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativas</option>
          <option value="SUSPENDED">Suspensas</option>
          <option value="BANNED">Banidas</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-x-auto rounded-xl border border-fog bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-fog bg-mist/50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Carregando…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className={`cursor-pointer border-b border-fog last:border-0 hover:bg-mist/40 ${
                      selected?.id === u.id ? "bg-mist/60" : ""
                    }`}
                    onClick={() => openModerate(u)}
                  >
                    <td className="px-4 py-3 font-medium text-navy">{u.name}</td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[u.accountStatus]}`}
                      >
                        {STATUS_LABEL[u.accountStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="rounded-xl border border-fog bg-white p-5">
          {!selected ? (
            <p className="text-sm text-muted">
              Selecione um usuário para banir, suspender ou reativar a conta.
            </p>
          ) : (
            <form onSubmit={handleModerate} className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-navy">
                  {selected.name}
                </h2>
                <p className="text-sm text-muted">{selected.email}</p>
                <p className="mt-2 text-xs text-muted">
                  {selected._count?.items ?? 0} anúncios ·{" "}
                  {selected._count?.supportTickets ?? 0} reclamações
                </p>
                {selected.moderationReason && (
                  <p className="mt-2 rounded-lg bg-mist px-3 py-2 text-xs text-navy">
                    Motivo atual: {selected.moderationReason}
                    {selected.suspendedUntil
                      ? ` · até ${new Date(selected.suspendedUntil).toLocaleString("pt-BR")}`
                      : ""}
                  </p>
                )}
              </div>

              {selected.id === me?.id || selected.role === "SUPER_ADMIN" ? (
                <p className="text-sm text-amber-700">
                  Esta conta não pode ser moderada por aqui.
                </p>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy">
                      Ação
                    </label>
                    <select
                      value={action}
                      onChange={(e) =>
                        setAction(
                          e.target.value as "BAN" | "SUSPEND" | "RESTORE",
                        )
                      }
                      className="w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-brand"
                    >
                      <option value="SUSPEND">Suspender temporariamente</option>
                      <option value="BAN">Banir permanentemente</option>
                      <option value="RESTORE">Reativar conta</option>
                    </select>
                  </div>

                  {action !== "RESTORE" && (
                    <>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-navy">
                          Motivo
                        </label>
                        <textarea
                          required
                          minLength={3}
                          maxLength={500}
                          rows={3}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-brand"
                          placeholder="Ex.: conduta abusiva no campus"
                        />
                      </div>
                      {action === "SUSPEND" && (
                        <div>
                          <label className="mb-1 block text-sm font-medium text-navy">
                            Dias de suspensão
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            className="w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-brand"
                          />
                        </div>
                      )}
                      <label className="flex items-start gap-2 text-sm text-navy">
                        <input
                          type="checkbox"
                          checked={takeDownItems}
                          onChange={(e) => setTakeDownItems(e.target.checked)}
                          className="mt-1"
                        />
                        <span>
                          Remover anúncios ativos do feed
                          {action === "BAN" ? " (recomendado no banimento)" : ""}
                        </span>
                      </label>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
                      action === "RESTORE"
                        ? "bg-brand hover:bg-navy"
                        : action === "BAN"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    {saving
                      ? "Salvando…"
                      : action === "RESTORE"
                        ? "Reativar conta"
                        : action === "BAN"
                          ? "Banir conta"
                          : "Suspender conta"}
                  </button>
                </>
              )}
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
