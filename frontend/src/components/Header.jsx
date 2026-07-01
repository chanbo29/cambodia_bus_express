import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Phone,
  Mail,
  User,
  LogOut,
  Settings,
  Ticket,
  ChevronDown,
  Bus,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import "./Header.css";

export default function Header() {
  const profileImage = localStorage.getItem("profileImage");
  const [showDropdown, setShowDropdown] = useState(false);
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

  return (
    <header className="site-header">

      {/* ── Top bar: contact info + language toggle ── */}
      <div className="site-topbar">
        <div className="site-topbar-left">
          <span className="topbar-item">
            <Phone size={12} />
            023 888 999
          </span>
          <span className="topbar-divider" />
          <span className="topbar-item">
            <Mail size={12} />
            cambodiabus168@booking.com
          </span>
        </div>

        <div className="site-topbar-right">
          <button className="lang-toggle" onClick={toggleLang}>
            <img
              src={lang === "en" ? "https://flagcdn.com/w40/kh.png" : "https://flagcdn.com/w40/gb.png"}
              alt={lang === "en" ? "Khmer" : "English"}
              className="lang-flag-img"
            />
            <span className="lang-label">{lang === "en" ? "ភាសាខ្មែរ" : "English"}</span>
          </button>
        </div>
      </div>

      {/* ── Bottom bar: logo + nav + user ── */}
      <div className="site-navbar">

        {/* Logo */}
        <NavLink to="/" className="site-logo">
          <div className="site-logo-icon">
            <Bus size={24} />
          </div>
          <div className="site-logo-text">
            <h2>Cambodia Bus</h2>
            <p>EXPRESS</p>
          </div>
        </NavLink>

        {/* Nav */}
        <nav className="site-nav">
          <NavLink to="/">{t("nav_home")}</NavLink>
          <NavLink to="/booking">{t("nav_booking")}</NavLink>
          <NavLink to="/schedule">{t("nav_schedule")}</NavLink>
          <NavLink to="/branch">{t("nav_branch")}</NavLink>
          <NavLink to="/about">{t("nav_about")}</NavLink>
          <NavLink to="/faq">{t("nav_faq")}</NavLink>
        </nav>

        {/* Right: user + book now */}
        <div className="site-right">
          {token ? (
            <div className="profile-dropdown">
              <button
                className="profile-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="profile-avatar">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="profile-avatar-img" />
                  ) : (
                    <User size={15} />
                  )}
                </div>
                <div className="profile-text">
                  <small>{t("nav_home") === "Home" ? "Welcome" : "សូមស្វាគមន៍"}</small>
                  <b>{user?.username || "User"}</b>
                </div>
                <ChevronDown size={14} />
              </button>

              {showDropdown && (
                <div className="dropdown-menu">
                  {(user?.is_staff === true || user?.is_superuser === true) && (
                    <Link to="/admin-dashboard" onClick={() => setShowDropdown(false)}>
                      <Settings size={15} />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setShowDropdown(false)}>
                    <User size={15} />
                    {t("profile_account")}
                  </Link>
                  <Link to="/history" onClick={() => setShowDropdown(false)}>
                    <Ticket size={15} />
                    {t("nav_history")}
                  </Link>
                  <button onClick={logout}>
                    <LogOut size={15} />
                    {t("nav_logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink to="/login" className="site-login">
              <User size={15} />
              {t("nav_login")}
            </NavLink>
          )}

          <NavLink to="/booking" className="site-book-btn">
            {t("nav_booking")}
          </NavLink>
        </div>
      </div>
    </header>
  );
}