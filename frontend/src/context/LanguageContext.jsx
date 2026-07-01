import { createContext, useContext, useState } from "react";
import en from "../locales/En";
import km from "../locales/Km";

const translations = { en, km };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Persist language choice across page reloads
  const [lang, setLang] = useState(
    () => localStorage.getItem("lang") || "en"
  );

  const toggleLang = () => {
    const next = lang === "en" ? "km" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  // t("key") returns the translated string; falls back to English if
  // the Khmer translation is missing for that key
  const t = (key) =>
    translations[lang][key] ?? translations["en"][key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook - just call useLanguage() in any component
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}