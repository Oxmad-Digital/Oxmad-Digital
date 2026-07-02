"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import BookCallModal from "./BookCallModal";

type BookCallContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const BookCallContext = createContext<BookCallContextValue | null>(null);

export function BookCallProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <BookCallContext.Provider value={value}>
      {children}
      <BookCallModal isOpen={isOpen} onClose={close} />
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
