"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applySettings,
  DEFAULT_SETTINGS,
  readSettings,
  writeSettings,
  type Settings,
} from "@/lib/settings";

type SettingsContextValue = {
  settings: Settings;
  /** localStorage okunana kadar false — sunucu HTML'iyle uyuşmayan alanları bu bayrakla gizle. */
  isLoaded: boolean;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // localStorage yalnızca tarayıcıda okunabildiği için ilk render'dan sonra
    // state'e alınıyor; sunucu HTML'i varsayılanlarla üretilir.
    const stored = readSettings();
    applySettings(stored);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(stored);
    setIsLoaded(true);
  }, []);

  const commit = useCallback((next: Settings) => {
    setSettings(next);
    writeSettings(next);
    applySettings(next);
  }, []);

  const update = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        writeSettings(next);
        applySettings(next);
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => commit(DEFAULT_SETTINGS), [commit]);

  const value = useMemo(
    () => ({ settings, isLoaded, update, reset }),
    [settings, isLoaded, update, reset]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings, SettingsProvider içinde kullanılmalı.");
  return ctx;
}
