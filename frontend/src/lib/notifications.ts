"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type AppNotification } from "./api";
import { useAuth } from "./auth";

/** Sem WebSocket: contamos não lidas periodicamente e buscamos a lista quando o painel abre. */
const POLL_MS = 30000;

export function useNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const refreshCount = useCallback(async () => {
    if (!token) return;
    try {
      const { count } = await api.getUnreadNotificationsCount(token);
      setUnreadCount(count);
    } catch {
      // próximo poll tenta de novo
    }
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [list, { count }] = await Promise.all([
        api.getNotifications(token),
        api.getUnreadNotificationsCount(token),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // silencioso — próximo poll tenta de novo
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoaded(false);
      return;
    }
    void refreshCount();
    const interval = setInterval(() => void refreshCount(), POLL_MS);
    return () => clearInterval(interval);
  }, [token, refreshCount]);

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await api.markNotificationRead(token, id);
      } catch {
        // o próximo refresh corrige o estado se a chamada falhar
      }
    },
    [token],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    setUnreadCount(0);
    try {
      await api.markAllNotificationsRead(token);
    } catch {
      // ignore
    }
  }, [token]);

  return { notifications, unreadCount, loaded, refresh, markRead, markAllRead };
}
