import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  User, LogOut, Settings, Ticket, ChevronDown,
  Menu, X, Phone, Mail
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import NotificationBell from "./Notification";
import "./Header.css";

export default function Header() {
  const profileImage = localStorage.getItem("profileImage");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { lang, toggleLang, t } = useLanguage();

  const token = localStorage.getItem("access");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  const closeAll = () => {
    setMobileOpen(false);
    setShowDropdown(false);
  };

  return (
    <>
      <header className="site-header">
        {/* ── Top bar ── */}
        <div className="site-topbar">
          <div className="site-topbar-left">
            <span className="topbar-item"><Phone size={12} />023 888 999</span>
            <span className="topbar-divider" />
            <span className="topbar-item"><Mail size={12} />cambodiabus168@booking.com</span>
          </div>
          <div className="site-topbar-right">
            <button className="lang-toggle" onClick={toggleLang}>
              <img
                src={lang === "en" ? "https://flagcdn.com/w40/kh.png" : "https://flagcdn.com/w40/gb.png"}
                alt={lang === "en" ? "KH" : "EN"}
                className="lang-flag-img"
              />
              <span className="lang-label">{lang === "en" ? "KH" : "EN"}</span>
            </button>
          </div>
        </div>

        {/* ── Nav bar ── */}
        <div className="site-navbar">
          <NavLink to="/" className="site-logo" onClick={closeAll}>
            <div className="site-logo-icon">
              <img src="/logo-bus.png" alt="Cambodia Bus Express" className="site-logo-img" />
            </div>
            <div className="site-logo-text">
              <h2>Cambodia Bus</h2>
              <p>EXPRESS</p>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="site-nav desktop-nav">
            <NavLink to="/">{t("nav_home")}</NavLink>
            <NavLink to="/booking">{t("nav_booking")}</NavLink>
            {/* <NavLink to="/schedule">{t("nav_schedule")}</NavLink> */}
            <NavLink to="/branch">{t("nav_branch")}</NavLink>
            <NavLink to="/about">{t("nav_about")}</NavLink>
            <NavLink to="/faq">{t("nav_faq")}</NavLink>
          </nav>

          {/* Right */}
          <div className="site-right">

            {/* 🔔 Notification Bell — always visible when logged in */}
            {token && <NotificationBell />}

            {/* Language toggle */}
            {/* <button className="lang-toggle desktop-lang" onClick={toggleLang}>
              <img
                src={lang === "en" ? "https://flagcdn.com/w40/kh.png" : "https://flagcdn.com/w40/gb.png"}
                alt={lang === "en" ? "KH" : "EN"}
                className="lang-flag-img"
              />
              <span className="lang-label">{lang === "en" ? "KH" : "EN"}</span>
            </button> */}

            {/* Profile / Login */}
            {token ? (
              <div className="profile-dropdown">
                <button className="profile-btn" onClick={() => setShowDropdown(!showDropdown)}>
                  <div className="profile-avatar">
                    {profileImage
                      ? <img src={profileImage} alt="Profile" className="profile-avatar-img" />
                      : <User size={15} />}
                  </div>
                  <div className="profile-text">
                    <small>Welcome</small>
                    <b>{user?.username || "User"}</b>
                  </div>
                  <ChevronDown size={14} />
                </button>
                {showDropdown && (
                  <div className="dropdown-menu">
                    {(user?.is_staff || user?.is_superuser) && (
                      <Link to="/admin-dashboard" onClick={closeAll}>
                        <Settings size={15} />Admin Dashboard
                      </Link>
                    )}
                    <Link to="/profile" onClick={closeAll}>
                      <User size={15} />{t("profile_account")}
                    </Link>
                    <Link to="/history" onClick={closeAll}>
                      <Ticket size={15} />{t("nav_history")}
                    </Link>
                    <button onClick={logout}>
                      <LogOut size={15} />{t("nav_logout")}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink to="/login" className="site-login">
                <User size={15} />{t("nav_login")}
              </NavLink>
            )}

            {/* <NavLink to="/booking" className="site-book-btn desktop-only">
              <Ticket size={15} />{t("nav_booking")}
            </NavLink> */}

            {/* Hamburger */}
            <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={closeAll}>
          <nav className="mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-head">
              <div className="site-logo">
                <div className="site-logo-icon">
                  <img src="/logo-bus.png" alt="logo" className="site-logo-img" />
                </div>
                <div className="site-logo-text">
                  <h2>Cambodia Bus</h2><p>EXPRESS</p>
                </div>
              </div>
              <button onClick={closeAll} className="mobile-close"><X size={20} /></button>
            </div>

            <div className="mobile-nav-links">
              <NavLink to="/" onClick={closeAll}>{t("nav_home")}</NavLink>
              <NavLink to="/booking" onClick={closeAll}>{t("nav_booking")}</NavLink>
              {/* <NavLink to="/schedule" onClick={closeAll}>{t("nav_schedule")}</NavLink> */}
              <NavLink to="/branch" onClick={closeAll}>{t("nav_branch")}</NavLink>
              <NavLink to="/about" onClick={closeAll}>{t("nav_about")}</NavLink>
              <NavLink to="/faq" onClick={closeAll}>{t("nav_faq")}</NavLink>
              {token && (
                <>
                  <NavLink to="/history" onClick={closeAll}>{t("nav_history")}</NavLink>
                  <NavLink to="/profile" onClick={closeAll}>{t("profile_account")}</NavLink>
                  {(user?.is_staff || user?.is_superuser) && (
                    <NavLink to="/admin-dashboard" onClick={closeAll}>Admin Dashboard</NavLink>
                  )}
                </>
              )}
            </div>

            <div className="mobile-drawer-foot">
              <button className="lang-toggle" onClick={toggleLang}>
                <img
                  src={lang === "en" ? "https://flagcdn.com/w40/kh.png" : "https://flagcdn.com/w40/gb.png"}
                  alt={lang === "en" ? "KH" : "EN"}
                  className="lang-flag-img"
                />
                <span className="lang-label">{lang === "en" ? "ភាសាខ្មែរ" : "English"}</span>
              </button>
              {token ? (
                <button className="mobile-logout" onClick={logout}>
                  <LogOut size={16} />{t("nav_logout")}
                </button>
              ) : (
                <Link to="/login" className="mobile-login-btn" onClick={closeAll}>
                  <User size={16} />{t("nav_login")}
                </Link>
              )}
              {/* <NavLink to="/booking" className="site-book-btn mobile-book-btn" onClick={closeAll}>
                <Ticket size={16} />{t("nav_booking")}
              </NavLink> */}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}