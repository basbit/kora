import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

import i18n from "@shared/config/i18n";

export type ThemeMode = "light" | "dark" | "system";
export type LanguageMode = "ru" | "en" | "system";

type SettingsState = {
  theme: ThemeMode;
  language: LanguageMode;
};

type Ctx = {
  settings: SettingsState;
  setTheme: (mode: ThemeMode) => void;
  setLanguage: (lang: LanguageMode) => void;
  currentTheme: "light" | "dark";
  currentLanguage: "ru" | "en";
};

const KEY = "gentree:settings";

const SettingsCtx = createContext<Ctx>({
  settings: { theme: "system", language: "system" },
  setTheme: () => {},
  setLanguage: () => {},
  currentTheme: "light",
  currentLanguage: "en",
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<SettingsState>({
    theme: "system",
    language: "system",
  });
  const colorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw)
          setSettings({
            theme: "system",
            language: "system",
            ...JSON.parse(raw),
          });
      } catch {
        void 0;
      }
    })();
  }, []);

  const currentTheme: "light" | "dark" =
    settings.theme === "system"
      ? colorScheme === "dark"
        ? "dark"
        : "light"
      : settings.theme;
  const currentLanguage: "ru" | "en" =
    settings.language === "system"
      ? i18n.language.startsWith("ru")
        ? "ru"
        : "en"
      : settings.language;

  useEffect(() => {
    if (i18n.language !== currentLanguage)
      i18n.changeLanguage(currentLanguage).catch(() => undefined);
  }, [currentLanguage]);

  const api = useMemo(
    () => ({
      setTheme: (mode: ThemeMode) => {
        const next = { ...settings, theme: mode };
        setSettings(next);
        AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
      },
      setLanguage: (lang: LanguageMode) => {
        const next = { ...settings, language: lang };
        setSettings(next);
        AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
      },
    }),
    [settings],
  );

  return (
    <SettingsCtx.Provider
      value={{ settings, currentTheme, currentLanguage, ...api }}
    >
      {children}
    </SettingsCtx.Provider>
  );
};

export function useSettings() {
  return useContext(SettingsCtx);
}
