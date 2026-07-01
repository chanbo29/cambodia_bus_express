import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Phone,
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

      {/* Logo */}
      <NavLink to="/" className="site-logo">
        <div className="site-logo-icon">
          <Bus size={20} />
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
        <NavLink to="/branch">{t("nav_branch")}</NavLink>
        <NavLink to="/about">{t("nav_about")}</NavLink>
        <NavLink to="/faq">{t("nav_faq")}</NavLink>
      </nav>

      {/* Right side */}
      <div className="site-right">

        {/* Phone */}
        <div className="site-help">
          <small>Need Help?</small>
          <b>023 888 999</b>
        </div>

        <div className="site-divider" />

        {/* Language toggle */}
        <button
          className="lang-toggle"
          onClick={toggleLang}
          title={lang === "en" ? "Switch to Khmer" : "Switch to English"}
        >
          <img
            src={lang === "en" ? "https://flagcdn.com/w40/kh.png" : "https://flagcdn.com/w40/gb.png"}
            alt={lang === "en" ? "Khmer" : "English"}
            className="lang-flag-img"
          />
          <span className="lang-label">{lang === "en" ? "KH" : "EN"}</span>
        </button>

        {/* User area */}
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
                  <User size={16} />
                )}
              </div>
              <div className="profile-text">
                <small>Welcome</small>
                <b>{user?.username || "User"}</b>
              </div>
              <ChevronDown size={15} />
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
                  Profile
                </Link>
                <Link to="/history" onClick={() => setShowDropdown(false)}>
                  <Ticket size={15} />
                  Booking History
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

        {/* Book Now CTA */}
        <NavLink to="/booking" className="site-book-btn">
          {t("nav_booking")}
        </NavLink>

      </div>
    </header>
  );
}