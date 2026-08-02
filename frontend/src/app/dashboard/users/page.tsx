"use client";

import { useEffect, useState } from "react";
import {
  api,
  type AdminUserRow,
  type UserRole,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

const ROLE_LABEL: Record<UserRole, string> = {
  USER: "Usuário",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

export default function DashboardUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    api
      .getAdminUsers(token, {
        limit: 50,
        email: email.trim() || undefined,
        role: role || undefined,
      })
      .then((data) => {
        if (!cancelled) setUsers(data.users);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar os usuários.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, email, role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Usuários</h1>
        <p className="mt-1 text-sm text-muted">Lista de contas cadastradas.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
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
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-fog bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-fog last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
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
    </div>
  );
}
