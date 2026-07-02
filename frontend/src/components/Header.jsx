import { NavLink, Link, useNavigate } from "react-router-dom";
import {
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

      {/* ── Main nav ── */}
      <div className="site-navbar">

        {/* Logo */}
        <NavLink to="/" className="site-logo">
          <div className="site-logo-icon">
            <img
              src="/logo-bus.png"
              alt="Cambodia Bus Express"
              className="site-logo-img"
            />
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
          {/* <NavLink to="/schedule">{t("nav_schedule")}</NavLink> */}
          <NavLink to="/branch">{t("nav_branch")}</NavLink>
          <NavLink to="/about">{t("nav_about")}</NavLink>
          <NavLink to="/faq">{t("nav_faq")}</NavLink>
        </nav>

        {/* Right */}
        <div className="site-right">

          {/* Language */}
          <button className="lang-toggle" onClick={toggleLang}>
            <img
              src={lang === "en"
                ? "https://flagcdn.com/w40/kh.png"
                : "https://flagcdn.com/w40/gb.png"}
              alt={lang === "en" ? "KH" : "EN"}
              className="lang-flag-img"
            />
            <span className="lang-label">{lang === "en" ? "KH" : "EN"}</span>
          </button>

          {/* Profile / Login */}
          {token ? (
            <div className="profile-dropdown">
              <button
                className="profile-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="profile-avatar">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="profile-avatar-img"
                    />
                  ) : (
                    <User size={15} />
                  )}
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
                    <Link
                      to="/admin-dashboard"
                      onClick={() => setShowDropdown(false)}
                    >
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

          {/* Book Now */}
          {/* <NavLink to="/booking" className="site-book-btn">
            <Ticket size={15} />
            {t("nav_booking")}
          </NavLink> */}

        </div>
      </div>

      {/* ── Animated bus road ── */}
      <div className="site-road">
        <div className="road-dashes" />
        <div className="road-bus">
          <Bus size={18} />
        </div>
        <div className="road-dest" style={{ left: "15%" }}>
          <span className="dest-pin" />
          <span className="dest-name">Phnom Penh</span>
        </div>
        <div className="road-dest" style={{ left: "38%" }}>
          <span className="dest-pin" style={{ animationDelay: "0.6s" }} />
          <span className="dest-name">Battambang</span>
        </div>
        <div className="road-dest" style={{ left: "60%" }}>
          <span className="dest-pin" style={{ animationDelay: "1.2s" }} />
          <span className="dest-name">Siem Reap</span>
        </div>
        <div className="road-dest" style={{ left: "82%" }}>
          <span className="dest-pin" style={{ animationDelay: "1.8s" }} />
          <span className="dest-name">Sihanoukville</span>
        </div>
      </div>

    </header>
  );
}