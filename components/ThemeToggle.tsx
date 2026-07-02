"use client";
import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "./useDarkMode";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { dark, toggle } = useDarkMode();

  return (
    <button
      type="button"
      className={`ox-nav-theme-toggle ${className}`}
      onClick={toggle}
      aria-label={dark ? "Activer le mode clair" : "Activer le mode sombre"}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
