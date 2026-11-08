"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import ContactDialog, { type ContactDialogHandle } from "./ContactDialog";

type ContactContextValue = { open: () => void };

const ContactContext = createContext<ContactContextValue | null>(null);

/** One contact dialog for the whole site, opened by every "Discutons de votre projet" button. Needs the BookCallProvider above it. */
export function ContactProvider({ children }: { children: React.ReactNode }) {
  const dialogRef = useRef<ContactDialogHandle>(null);
  const open = useCallback(() => dialogRef.current?.open(), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <ContactContext.Provider value={value}>
      {children}
      <ContactDialog ref={dialogRef} />
    </ContactContext.Provider>
  );
}

export function useContact() {
  const ctx = useContext(ContactContext);
  if (!ctx) throw new Error("useContact must be used within a ContactProvider");
  return ctx;
}
