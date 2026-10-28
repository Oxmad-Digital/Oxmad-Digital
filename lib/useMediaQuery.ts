"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Live `matchMedia(query).matches`; always false during server rendering. */
export function useMediaQuery(query: string) {
  const subscribe = useCallback((onChange: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
