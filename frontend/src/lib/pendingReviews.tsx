"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { RatingModal } from "@/components/RatingModal";
import { api, type PendingReviewOrder } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type PendingReviewsContextValue = {
  pending: PendingReviewOrder[];
  refresh: () => Promise<void>;
  openForOrder: (order: PendingReviewOrder) => void;
};

const PendingReviewsContext =
  createContext<PendingReviewsContextValue | null>(null);

const SKIPPED_KEY = "desapega.reviews.skipped";

function loadSkipped(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SKIPPED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSkipped(ids: Set<string>) {
  sessionStorage.setItem(SKIPPED_KEY, JSON.stringify([...ids]));
}

export function PendingReviewsProvider({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  const [pending, setPending] = useState<PendingReviewOrder[]>([]);
  const [active, setActive] = useState<PendingReviewOrder | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setSkipped(loadSkipped());
  }, []);

  const refresh = useCallback(async () => {
    if (!token) {
      setPending([]);
      setActive(null);
      return;
    }
    try {
      const list = await api.getPendingReviews(token);
      setPending(list);
    } catch {
      // silencioso
    }
  }, [token]);

  useEffect(() => {
    if (loading) return;
    void refresh();
  }, [loading, refresh]);

  useEffect(() => {
    if (!pending.length || active) return;
    const next = pending.find((p) => !skipped.has(p.id));
    if (next) setActive(next);
  }, [pending, skipped, active]);

  const openForOrder = useCallback((order: PendingReviewOrder) => {
    setActive(order);
  }, []);

  const handleClose = () => {
    if (active) {
      setSkipped((prev) => {
        const next = new Set(prev);
        next.add(active.id);
        saveSkipped(next);
        return next;
      });
    }
    setActive(null);
  };

  const handleSubmitted = async () => {
    const id = active?.id;
    setActive(null);
    if (id) {
      setPending((prev) => prev.filter((p) => p.id !== id));
    }
    await refresh();
  };

  const value = useMemo(
    () => ({ pending, refresh, openForOrder }),
    [pending, refresh, openForOrder],
  );

  return (
    <PendingReviewsContext.Provider value={value}>
      {children}
      {active && (
        <RatingModal
          order={active}
          onClose={handleClose}
          onSubmitted={() => void handleSubmitted()}
        />
      )}
    </PendingReviewsContext.Provider>
  );
}

export function usePendingReviews(): PendingReviewsContextValue {
  const ctx = useContext(PendingReviewsContext);
  if (!ctx) {
    throw new Error(
      "usePendingReviews deve ser usado dentro de PendingReviewsProvider",
    );
  }
  return ctx;
}
