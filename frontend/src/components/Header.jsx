import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Phone,
  User,
  LogOut,
  Settings,
  Ticket,
  ChevronDown,
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
      <NavLink to="/" className="site-logo">
        <img src="/logo-bus.png" alt="Cambodia Bus Express" className="site-logo-img" />
        <div>
          <h2>Cambodia Bus</h2>
          <p>EXPRESS</p>
        </div>
      </NavLink>

      <nav className="site-nav">
        <NavLink to="/">{t("nav_home")}</NavLink>
        <NavLink to="/booking">{t("nav_booking")}</NavLink>
        <NavLink to="/branch">{t("nav_branch")}</NavLink>
        <NavLink to="/about">{t("nav_about")}</NavLink>
        <NavLink to="/faq">{t("nav_faq")}</NavLink>
      </nav>

      <div className="site-right">
        <div className="site-phone-icon">
          <Phone size={20} />
        </div>

        <div className="site-help">
          <small>Need Help?</small>
          <b>023 888 999</b>
        </div>

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
                  <User size={18} />
                )}
              </div>

              <div className="profile-text">
                <small>Welcome</small>
                <b>{user?.username || "User"}</b>
              </div>

              <ChevronDown size={16} />
            </button>

            {showDropdown && (
              <div className="dropdown-menu">
                {(user?.is_staff === true || user?.is_superuser === true) && (
                  <Link
                    to="/admin-dashboard"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings size={16} />
                    Admin Dashboard
                  </Link>
                )}

                <Link to="/profile" onClick={() => setShowDropdown(false)}>
                  <User size={16} />
                  Profile
                </Link>

                <Link
                  to="/profile/settings"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings size={16} />
                  Settings
                </Link>

                <Link to="/history" onClick={() => setShowDropdown(false)}>
                  <Ticket size={16} />
                  Booking History
                </Link>

                <button onClick={logout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <NavLink to="/login" className="site-login">
            <User size={16} />
            {t("nav_login")} / {t("nav_register")}
          </NavLink>
        )}

        {/* Language toggle — always visible */}
        <button className="lang-toggle" onClick={toggleLang} title={lang === "en" ? "Switch to Khmer" : "Switch to English"}>
          {lang === "en" ? (
            <>
              <img src="https://flagcdn.com/w40/kh.png" alt="Khmer" className="lang-flag-img" />
              <span className="lang-label">KH</span>
            </>
          ) : (
            <>
              <img src="https://flagcdn.com/w40/gb.png" alt="English" className="lang-flag-img" />
              <span className="lang-label">EN</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}