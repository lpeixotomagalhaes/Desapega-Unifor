"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api";
import { useAuth } from "./auth";

interface SavedItemsContextValue {
  savedIds: Set<string>;
  loaded: boolean;
  isSaved: (itemId: string) => boolean;
  toggleSave: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const SavedItemsContext = createContext<SavedItemsContextValue | null>(null);

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setSavedIds(new Set());
      setLoaded(false);
      return;
    }
    try {
      const { ids } = await api.getSavedItemIds(token);
      setSavedIds(new Set(ids));
    } catch {
      // silencioso
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isSaved = useCallback(
    (itemId: string) => savedIds.has(itemId),
    [savedIds],
  );

  const toggleSave = useCallback(
    async (itemId: string) => {
      if (!token) {
        window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      const currentlySaved = savedIds.has(itemId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
      try {
        if (currentlySaved) await api.unsaveItem(token, itemId);
        else await api.saveItem(token, itemId);
      } catch {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (currentlySaved) next.add(itemId);
          else next.delete(itemId);
          return next;
        });
      }
    },
    [savedIds, token],
  );

  const value = useMemo(
    () => ({ savedIds, loaded, isSaved, toggleSave, refresh }),
    [savedIds, loaded, isSaved, toggleSave, refresh],
  );

  return (
    <SavedItemsContext.Provider value={value}>
      {children}
    </SavedItemsContext.Provider>
  );
}

export function useSavedItems(): SavedItemsContextValue {
  const ctx = useContext(SavedItemsContext);
  if (!ctx) {
    throw new Error("useSavedItems must be used within SavedItemsProvider");
  }
  return ctx;
}
