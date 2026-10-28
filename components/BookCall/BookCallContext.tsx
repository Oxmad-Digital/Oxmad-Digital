"use client";

import { createContext, lazy, Suspense, useContext, useState, useCallback, useMemo } from "react";

const loadBookCallModal = () => import("./BookCallModal");
const BookCallModal = lazy(loadBookCallModal);

type BookCallContextValue = {
  open: () => void;
  close: () => void;
  preload: () => void;
};

const BookCallContext = createContext<BookCallContextValue | null>(null);

export function BookCallProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const preload = useCallback(() => { void loadBookCallModal(); }, []);

  const value = useMemo(() => ({ open, close, preload }), [open, close, preload]);

  return (
    <BookCallContext.Provider value={value}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <BookCallModal isOpen onClose={close} />
        </Suspense>
      )}
    </BookCallContext.Provider>
  );
}

export function useBookCall() {
  const ctx = useContext(BookCallContext);
  if (!ctx) {
    throw new Error("useBookCall must be used within a BookCallProvider");
  }
  return ctx;
}
