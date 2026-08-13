import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Sunucuda false, tarayıcıda true döner. Yalnızca istemcide bilinebilen şeyleri
 * (saat, medya sorgusu, localStorage) hydration uyuşmazlığı yaratmadan
 * göstermek için kullanılır.
 */
export function useIsHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

function subscribeToMediaQuery(query: string) {
  return (onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  };
}

/** Medya sorgusunu React state'ine bağlar; sunucuda daima false kabul edilir. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    subscribeToMediaQuery(query),
    () => window.matchMedia(query).matches,
    () => false
  );
}
