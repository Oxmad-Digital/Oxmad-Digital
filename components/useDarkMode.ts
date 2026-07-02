"use client";
import { useCallback, useSyncExternalStore } from "react";

const THEME_KEY = "ox-theme";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("ox-dark");
}

function getServerSnapshot() {
  return false;
}

export function useDarkMode() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = !root.classList.contains("ox-dark");
    root.classList.toggle("ox-dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  }, []);

  return { dark, toggle };
}
