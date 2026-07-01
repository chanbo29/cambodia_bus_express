import { useState } from "react";
import {
  ChevronDown,
  HelpCircle,
  Ticket,
  XCircle,
  CreditCard,
  Clock,
  Tag,
} from "lucide-react";
import { FaTelegramPlane } from "react-icons/fa";
import "./FAQ.css";
import { useLanguage } from "../context/LanguageContext";



export default function FAQ() {
  const { t } = useLanguage();
  const FAQ_ICONS = [Ticket, XCircle, CreditCard, Clock, Tag];
  const FAQ_ITEMS = [
    { icon: FAQ_ICONS[0], question: t("faq_q1"), answer: t("faq_a1") },
    { icon: FAQ_ICONS[1], question: t("faq_q2"), answer: t("faq_a2") },
    { icon: FAQ_ICONS[2], question: t("faq_q3"), answer: t("faq_a3") },
    { icon: FAQ_ICONS[3], question: t("faq_q4"), answer: t("faq_a4") },
    { icon: FAQ_ICONS[4], question: t("faq_q5"), answer: t("faq_a5") },
  ];
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <div className="faq-page">
      <header className="faq-header">
        <div className="faq-header-dots" aria-hidden="true" />
        <span className="faq-tag">
          <HelpCircle size={15} />
          {t("faq_tag")}
        </span>
        <h1>{t("faq_title")}</h1>
        <p>{t("faq_subtitle")}</p>
      </header>

      <div className="faq-list">
        {FAQ_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isOpen = openIndex === index;

          return (
            <div className={`faq-item ${isOpen ? "open" : ""}`} key={index}>
              <button className="faq-question" onClick={() => toggle(index)}>
                <span className="faq-icon-badge">
                  <Icon size={17} />
                </span>
                <span className="faq-question-text">{item.question}</span>
                <ChevronDown size={18} className="faq-chevron" />
              </button>

              <div className="faq-answer-wrap">
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="faq-contact-cta">
        <div className="faq-cta-text">
          <h3>{t("faq_still")}</h3>
          <p>{t("faq_still_sub")}</p>
        </div>

        <a
          href="https://t.me/Hao_chhorng"
          target="_blank"
          rel="noreferrer"
          className="faq-telegram-btn"
        >
          <FaTelegramPlane size={16} />
          {t("faq_telegram")}
        </a>
      </div>
    </div>
  );
}