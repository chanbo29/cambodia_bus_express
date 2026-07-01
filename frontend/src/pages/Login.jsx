import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import "./Login.css";


const ROUTE_STOPS = ["Phnom Penh", "Battambang", "Siem Reap", "Sihanoukville"];

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [form, setForm] = useState({ username: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
const response = await fetch(
  `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"}/auth/login/`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  }
);

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: data.username || form.username,
            is_staff: data.is_staff,
            is_superuser: data.is_superuser,
          })
        );

        if (data.is_staff || data.is_superuser) {
          navigate("/admin-dashboard");
        } else {
          navigate("/");
        }
        window.location.reload();
      } else {
        alert("Invalid username or password");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-route-pane">
          <img
            src="/logo-bus.png"
            alt="Cambodia Bus Express"
            className="auth-route-logo"
          />

          <h1>{t("login_hero_title").split("\n").map((l,i)=><span key={i}>{l}{i===0&&<br/>}</span>)}</h1>
          <p>{t("login_hero_sub")}</p>

          <ol className="route-line">
            {ROUTE_STOPS.map((stop, i) => (
              <li key={stop} className={i === 0 ? "current" : ""}>
                <span className="route-dot" />
                <span className="route-label">{stop}</span>
              </li>
            ))}
          </ol>
        </div>

        <form className="auth-form-pane" onSubmit={loginUser}>
          <span className="auth-eyebrow">{t("login_eyebrow")}</span>
          <h2>{t("login_title")}</h2>

          <label htmlFor="login-username">{t("login_username")}</label>
          <div className="auth-field">
            <Mail size={17} />
            <input
              id="login-username"
              placeholder={t("login_username_placeholder")}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <label htmlFor="login-password">{t("login_password")}</label>
          <div className="auth-field">
            <Lock size={17} />
            <input
              id="login-password"
              type="password"
              placeholder={t("login_password_placeholder")}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? t("login_loading") : t("login_btn")}
            <ArrowRight size={17} />
          </button>

          <p className="auth-switch">
            {t("login_no_account")} <Link to="/register">{t("login_register")}</Link>
          </p>
        </form>
      </section>
    </main>
  );
}