import { createContext, useContext, useState, useEffect } from "react";
import en from "../locales/en";
import km from "../locales/km";

const translations = { en, km };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem("lang") || "en"
  );

  // Apply font class to <body> whenever language changes
  useEffect(() => {
    document.body.classList.remove("lang-en", "lang-km");
    document.body.classList.add(`lang-${lang}`);
  }, [lang]);

  const toggleLang = () => {
    const next = lang === "en" ? "km" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  // t("key") returns translated string, falls back to English
  const t = (key) =>
    translations[lang][key] ?? translations["en"][key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  
  // Return safe defaults if used outside provider
  if (!ctx) {
    return {
      lang: "en",
      toggleLang: () => {},
      t: (key) => key,
    };
  }
  
  return ctx;
}