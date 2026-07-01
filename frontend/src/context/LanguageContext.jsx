import { useState, useEffect } from "react";
import en from "../locales/en";
import km from "../locales/km";

const translations = { en, km };

// Get current language from localStorage
export function getLang() {
  return localStorage.getItem("lang") || "en";
}

// Set language and notify all components
export function setLang(lang) {
  localStorage.setItem("lang", lang);
  document.body.classList.remove("lang-en", "lang-km");
  document.body.classList.add(`lang-${lang}`);
  // Broadcast change to all components listening
  window.dispatchEvent(new CustomEvent("langChange", { detail: lang }));
}

// Translate a key
export function translate(key) {
  const lang = getLang();
  return translations[lang]?.[key] ?? translations["en"]?.[key] ?? key;
}

// Hook — no Context needed, just listens to window events
export function useLanguage() {
  const [lang, setLangState] = useState(getLang());

  useEffect(() => {
    // Apply font class on mount
    document.body.classList.remove("lang-en", "lang-km");
    document.body.classList.add(`lang-${lang}`);

    // Listen for language changes from other components
    const handler = (e) => setLangState(e.detail);
    window.addEventListener("langChange", handler);
    return () => window.removeEventListener("langChange", handler);
  }, [lang]);

  const toggleLang = () => {
    const next = lang === "en" ? "km" : "en";
    setLang(next);
  };

  const t = (key) =>
    translations[lang]?.[key] ?? translations["en"]?.[key] ?? key;

  return { lang, toggleLang, t };
}

// LanguageProvider is now just a passthrough — kept for compatibility
// so you don't need to change main.jsx
export function LanguageProvider({ children }) {
  return children;
}