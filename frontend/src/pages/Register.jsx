import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import "./Register.css";


const ROUTE_STOPS = ["Phnom Penh", "Battambang", "Siem Reap", "Sihanoukville"];

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const registerUser = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username || !form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
  `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"}/auth/register/`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: form.username,
      email: form.email,
      password: form.password,
    }),
  }
);

      const data = await response.json();

      if (response.ok) {
        alert("Account created successfully. Please log in.");
        navigate("/login");
      } else {
        setError(
          data.username?.[0] ||
            data.email?.[0] ||
            data.password?.[0] ||
            data.detail ||
            "Registration failed. Please try again."
        );
      }
    } catch {
      setError("Cannot connect to server");
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

          <h1>{t("register_hero_title").split("\n").map((l,i)=><span key={i}>{l}{i===0&&<br/>}</span>)}</h1>
          <p>{t("register_hero_sub")}</p>

          <ol className="route-line">
            {ROUTE_STOPS.map((stop, i) => (
              <li key={stop} className={i === ROUTE_STOPS.length - 1 ? "current" : ""}>
                <span className="route-dot" />
                <span className="route-label">{stop}</span>
              </li>
            ))}
          </ol>
        </div>

        <form className="auth-form-pane" onSubmit={registerUser}>
          <span className="auth-eyebrow">{t("register_eyebrow")}</span>
          <h2>{t("register_title")}</h2>

          <label htmlFor="reg-username">{t("register_username")}</label>
          <div className="auth-field">
            <User size={17} />
            <input
              id="reg-username"
              placeholder={t("register_username_placeholder")}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>

          <label htmlFor="reg-email">{t("register_email")}</label>
          <div className="auth-field">
            <Mail size={17} />
            <input
              id="reg-email"
              type="email"
              placeholder={t("register_email_placeholder")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <label htmlFor="reg-password">{t("register_password")}</label>
          <div className="auth-field">
            <Lock size={17} />
            <input
              id="reg-password"
              type="password"
              placeholder={t("register_password_placeholder")}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <label htmlFor="reg-confirm">{t("register_confirm")}</label>
          <div className="auth-field">
            <Lock size={17} />
            <input
              id="reg-confirm"
              type="password"
              placeholder={t("register_confirm_placeholder")}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? t("register_loading") : t("register_btn")}
            <ArrowRight size={17} />
          </button>

          <p className="auth-switch">
            {t("register_have_account")} <Link to="/login">{t("register_login")}</Link>
          </p>
        </form>
      </section>
    </main>
  );
}