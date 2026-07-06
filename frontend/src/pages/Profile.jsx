import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, Calendar, Ticket, LogOut,
  Camera, Pencil, Save, X, Star, Settings,
  DollarSign, UserCircle, ArrowRight
} from "lucide-react";
import { getMyProfile, updateMyProfile } from "../services/booking";
import API from "../services/api";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ full_name: "", email: "", phone: "" });
  const [photo, setPhoto]     = useState(null);
  const [mounted, setMounted] = useState(false);
  const [totalTrips, setTotalTrips]   = useState(null);
  const [totalSpent, setTotalSpent]   = useState(null);
  const navigate = useNavigate();

  const photoKey = (p) =>
    `profileImage:${p?.username || p?.email || "unknown"}`;

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = () => {
    setLoading(true);
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          email:     data.email     || "",
          phone:     data.phone     || "",
        });
        setPhoto(localStorage.getItem(photoKey(data)));
        setTimeout(() => setMounted(true), 60);
      })
      .catch(console.log)
      .finally(() => setLoading(false));
  };

  // Fetch user's own bookings to compute real stats
  useEffect(() => {
    API.get("/my-bookings/")
      .then((res) => {
        const bookings = Array.isArray(res.data) ? res.data : [];
        setTotalTrips(bookings.length);
        const spent = bookings.reduce(
          (sum, b) => sum + Number(b.total_price || 0), 0
        );
        setTotalSpent(spent.toFixed(2));
      })
      .catch(() => {
        // fallback: try /bookings/ filtered by current user
        API.get("/bookings/")
          .then((res) => {
            const user = JSON.parse(localStorage.getItem("user") || "null");
            const all  = Array.isArray(res.data) ? res.data : [];
            const mine = user
              ? all.filter(
                  (b) =>
                    b.user === user.id ||
                    b.username === user.username ||
                    b.email === user.email
                )
              : all;
            setTotalTrips(mine.length);
            const spent = mine.reduce(
              (sum, b) => sum + Number(b.total_price || 0), 0
            );
            setTotalSpent(spent.toFixed(2));
          })
          .catch(() => {
            setTotalTrips(0);
            setTotalSpent("0.00");
          });
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      setEditing(false);
      localStorage.setItem(
        "passengerInfo",
        JSON.stringify({
          passengerName: updated.full_name,
          email:         updated.email,
          phone:         updated.phone,
        })
      );
    } catch (err) {
      alert(
        "Failed to save: " +
          (err.response?.data
            ? JSON.stringify(err.response.data)
            : "Unknown error")
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(photoKey(profile), reader.result);
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="pf-page pf-loading">
        <div className="pf-loading-box">
          <div className="pf-loading-spinner" />
          <span>Loading your profile…</span>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.username || "User";
  const joinedYear  = profile?.date_joined
    ? new Date(profile.date_joined).getFullYear()
    : "—";

  return (
    <div className="pf-page">
      <div className={`pf-layout ${mounted ? "mounted" : ""}`}>

        {/* ══ LEFT PANEL ══════════════════════════ */}
        <aside className="pf-left">
          {/* Animated gradient stripe */}
          <div className="pf-left-stripe">
            <div className="pf-stripe-sweep" />
          </div>

          <div className="pf-left-inner">

            {/* Avatar */}
            <div className="pf-av-section">
              <div className="pf-av-wrap">
                <div className="pf-av-ring1" />
                <div className="pf-av-ring2" />
                {photo ? (
                  <img src={photo} alt="Profile" className="pf-av-img" />
                ) : (
                  <div className="pf-av-placeholder">
                    <User size={38} />
                  </div>
                )}
                <label className="pf-cam-btn" title="Change photo">
                  <Camera size={13} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>

              <h2 className="pf-av-name">{displayName}</h2>
              <p className="pf-av-email">
                {profile?.email || "No email"}
              </p>
              <span className="pf-av-badge">
                <Star size={11} />
                Member {joinedYear}
              </span>
            </div>

            <div className="pf-divider" />

            {/* Info list */}
            <div className="pf-info-list">
              {[
                { icon: <User size={15} />,     label: "Username", value: profile?.username || "—" },
                { icon: <Mail size={15} />,     label: "Email",    value: profile?.email    || "Not set" },
                { icon: <Phone size={15} />,    label: "Phone",    value: profile?.phone    || "Not set" },
                { icon: <Calendar size={15} />, label: "Joined",   value: String(joinedYear) },
              ].map(({ icon, label, value }) => (
                <div key={label} className="pf-info-row">
                  <div className="pf-info-row-icon">{icon}</div>
                  <div className="pf-info-row-text">
                    <span>{label}</span>
                    <b>{value}</b>
                  </div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="pf-left-btns">
              <button
                className="pf-left-btn primary"
                onClick={() => setEditing(true)}
              >
                <Pencil size={15} />
                Edit Profile
              </button>
              <Link to="/history" className="pf-left-btn ghost">
                <Ticket size={15} />
                My Tickets
              </Link>
              <button className="pf-left-btn danger" onClick={logout}>
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* ══ RIGHT PANEL ═════════════════════════ */}
        <main className="pf-right">

          {/* Cover banner */}
          <div className="pf-cover">
            <div className="pf-cover-texture" />
            <div className="pf-cover-circles" />
            <div className="pf-cover-text">
              <h1>My Account</h1>
              <p>Manage your profile, view trips and settings.</p>
            </div>
            <div className="pf-cover-bus" aria-hidden="true">🚌</div>
          </div>

          {/* Content */}
          <div className="pf-content">

            {/* Stat cards */}
            <div className="pf-stats-row">
              {[
                {
                  icon:  <Ticket size={22} />,
                  label: "Total Trips",
                  value: totalTrips === null ? "…" : String(totalTrips),
                },
                {
                  icon:  <Calendar size={22} />,
                  label: "Member Since",
                  value: String(joinedYear),
                },
                {
                  icon:  <DollarSign size={22} />,
                  label: "Total Spent",
                  value: totalSpent === null ? "…" : `$${totalSpent}`,
                },
              ].map(({ icon, label, value }, i) => (
                <div
                  key={label}
                  className="pf-stat-card"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="pf-stat-icon">{icon}</div>
                  <strong>{value}</strong>
                  <span>{label}</span>
                  <div className="pf-stat-bar" />
                </div>
              ))}
            </div>

            {/* Account info section */}
            <div className="pf-section">
              <div className="pf-section-head">
                <h3>
                  <UserCircle size={18} />
                  Account Information
                </h3>
                <button
                  className="pf-section-edit"
                  onClick={() => setEditing(true)}
                >
                  <Pencil size={13} />
                  Edit
                </button>
              </div>

              <div className="pf-section-body">
                {[
                  { label: "Full Name",  value: profile?.full_name || profile?.username || "—" },
                  { label: "Username",   value: profile?.username   || "—" },
                  { label: "Email",      value: profile?.email      || "Not set" },
                  { label: "Phone",      value: profile?.phone      || "Not set" },
                ].map(({ label, value }) => (
                  <div key={label} className="pf-field-cell">
                    <div className="pf-field-label">{label}</div>
                    <div className="pf-field-val">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="pf-right-cta">
              <div>
                <h3>Recent Booking Activity</h3>
                <p>Check your bus tickets and travel history anytime.</p>
              </div>
              <Link to="/history" className="pf-cta-btn">
                View Tickets <ArrowRight size={15} />
              </Link>
            </div>

          </div>
        </main>
      </div>

      {/* ══ EDIT MODAL ══════════════════════════ */}
      {editing && (
        <div className="pf-overlay" onClick={() => setEditing(false)}>
          <form
            className="pf-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <div className="pf-modal-stripe" />

            <div className="pf-modal-head">
              <h2>Edit Profile</h2>
              <button
                type="button"
                className="pf-modal-close"
                onClick={() => setEditing(false)}
              >
                <X size={16} />
              </button>
            </div>

            {[
              { label: "Full Name",     icon: <User size={15} />,  key: "full_name", type: "text",  placeholder: "Your full name"  },
              { label: "Email Address", icon: <Mail size={15} />,  key: "email",     type: "email", placeholder: "you@gmail.com"    },
              { label: "Phone Number",  icon: <Phone size={15} />, key: "phone",     type: "text",  placeholder: "012 345 678"      },
            ].map(({ label, icon, key, type, placeholder }) => (
              <div key={key} className="pf-modal-field">
                <label>{label}</label>
                <div className="pf-modal-input">
                  {icon}
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                  />
                </div>
              </div>
            ))}

            <p className="pf-modal-hint">
              This info auto-fills your passenger details when booking.
            </p>

            <button
              className="pf-modal-save"
              type="submit"
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}