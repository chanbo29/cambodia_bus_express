import { useState } from "react";
import {
  ChevronDown,
  Ticket,
  XCircle,
  CreditCard,
  Clock,
  Tag,
  Armchair,
  Search,
} from "lucide-react";
import { FaTelegramPlane } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";
import "./FAQ.css";

const CATEGORIES = ["All", "Booking", "Payment", "Cancellation", "Schedule", "Promotions"];

const FAQ_DATA = [
  {
    icon: Ticket,
    cat: "Booking",
    question: "faq_q1",
    answer: "faq_a1",
  },
  {
    icon: XCircle,
    cat: "Cancellation",
    question: "faq_q2",
    answer: "faq_a2",
  },
  {
    icon: CreditCard,
    cat: "Payment",
    question: "faq_q3",
    answer: "faq_a3",
  },
  {
    icon: Clock,
    cat: "Schedule",
    question: "faq_q4",
    answer: "faq_a4",
  },
  {
    icon: Tag,
    cat: "Promotions",
    question: "faq_q5",
    answer: "faq_a5",
  },
  {
    icon: Armchair,
    cat: "Booking",
    question: "faq_q6",
    answer: "faq_a6",
  },
];

export default function FAQ() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState(0);
  const [activecat, setActivecat] = useState("All");
  const [search, setSearch] = useState("");

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  const filtered = FAQ_DATA.filter((item) => {
    const matchCat = activecat === "All" || item.cat === activecat;
    const q = t(item.question).toLowerCase();
    const a = t(item.answer).toLowerCase();
    const matchSearch = !search || q.includes(search.toLowerCase()) || a.includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="faq-page">

      {/* ── Hero ── */}
      <header className="faq-hero">
        <span className="faq-hero-tag">
          ❓ {t("faq_tag")}
        </span>
        <h1>
          {t("faq_title_part1")} <em>{t("faq_title_part2")}</em>
        </h1>
        <p>{t("faq_subtitle")}</p>
      </header>

      {/* ── Search bar ── */}
      <div className="faq-search-wrap">
        <div className="faq-search-box">
          <Search size={18} className="faq-search-icon" />
          <input
            type="text"
            placeholder={t("faq_search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="faq-search-input"
          />
          {search && (
            <button className="faq-search-clear" onClick={() => setSearch("")}>
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="faq-cats">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`faq-cat ${activecat === cat ? "on" : ""}`}
            onClick={() => { setActivecat(cat); setOpenIndex(-1); }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── FAQ accordion ── */}
      <div className="faq-list">
        {filtered.length === 0 ? (
          <div className="faq-empty">
            <Search size={36} />
            <p>No questions found. Try a different search or category.</p>
          </div>
        ) : (
          filtered.map((item, index) => {
            const Icon = item.icon;
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? "open" : ""}`}
              >
                <button
                  className="faq-q"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                >
                  <div className="faq-q-icon">
                    <Icon size={17} />
                  </div>
                  <span className="faq-q-text">{t(item.question)}</span>
                  <span className="faq-cat-badge">{item.cat}</span>
                  <ChevronDown size={18} className="faq-chevron" />
                </button>

                <div className="faq-ans">
                  <div className="faq-ans-inner">
                    <p>{t(item.answer)}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── CTA ── */}
      <div className="faq-cta">
        <div className="faq-cta-left">
          <h3>{t("faq_still")}</h3>
          <p>{t("faq_still_sub")}</p>
        </div>
        <a
          href="https://t.me/Hao_chhorng"
          target="_blank"
          rel="noreferrer"
          className="faq-tg-btn"
        >
          <FaTelegramPlane size={18} />
          {t("faq_telegram")}
        </a>
      </div>

    </div>
  );
}