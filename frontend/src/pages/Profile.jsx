import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Phone, Calendar,
  Ticket, LogOut, Camera, Pencil, Save, X, Star,
} from "lucide-react";
import { getMyProfile, updateMyProfile } from "../services/booking";
import "./Profile.css";

export default function Profile() {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ full_name: "", email: "", phone: "" });
  const [photo, setPhoto]       = useState(null);
  const [mounted, setMounted]   = useState(false);

  const photoKey = (p) => `profileImage:${p?.username || p?.email || "unknown"}`;

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = () => {
    setLoading(true);
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setForm({ full_name: data.full_name || "", email: data.email || "", phone: data.phone || "" });
        setPhoto(localStorage.getItem(photoKey(data)));
        setTimeout(() => setMounted(true), 80);
      })
      .catch(console.log)
      .finally(() => setLoading(false));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      setEditing(false);
      localStorage.setItem("passengerInfo", JSON.stringify({
        passengerName: updated.full_name,
        email: updated.email,
        phone: updated.phone,
      }));
    } catch (err) {
      alert("Failed to save: " + (err.response?.data ? JSON.stringify(err.response.data) : "Unknown error"));
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
  const joinedYear  = profile?.date_joined ? new Date(profile.date_joined).getFullYear() : "—";

  return (
    <div className="pf-page">
      <div className={`pf-card ${mounted ? "mounted" : ""}`}>

        {/* Animated stripe */}
        <div className="pf-card-stripe">
          <div className="pf-stripe-glow" />
        </div>

        {/* ── Header row ── */}
        <div className="pf-card-head">

          {/* Avatar with glow ring */}
          <div className={`pf-avatar-wrap ${mounted ? "anim" : ""}`}>
            <div className="pf-avatar-ring" />
            {photo
              ? <img src={photo} alt="Profile" className="pf-avatar-img" />
              : <div className="pf-avatar-placeholder"><User size={36} /></div>}
            <label className="pf-cam-btn" title="Change photo">
              <Camera size={13} />
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </label>
          </div>

          {/* Name + pills */}
          <div className={`pf-head-info ${mounted ? "anim" : ""}`}>
            <h2>{displayName}</h2>
            <p>{profile?.email || "No email saved"}</p>
            <div className="pf-pills">
              <span className="pf-pill">
                <Star size={11} />Member {joinedYear}
              </span>
              <span className="pf-pill">
                <Ticket size={11} />{profile?.username?.toUpperCase() || "PASSENGER"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className={`pf-head-actions ${mounted ? "anim" : ""}`}>
            <button className="pf-btn primary" onClick={() => setEditing(true)}>
              <Pencil size={14} />Edit Profile
            </button>
            <Link to="/history" className="pf-btn secondary">
              <Ticket size={14} />My Tickets
            </Link>
            <button className="pf-btn danger" onClick={logout}>
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="pf-info-grid">
          {[
            { icon: <User size={20} />,     label: "Username",     value: profile?.username || "—",          delay: 0   },
            { icon: <Mail size={20} />,     label: "Email",        value: profile?.email || "Not set",       delay: 80  },
            { icon: <Phone size={20} />,    label: "Phone",        value: profile?.phone || "Not set",       delay: 160 },
            { icon: <Calendar size={20} />, label: "Member Since", value: String(joinedYear),                delay: 240 },
          ].map(({ icon, label, value, delay }) => (
            <div
              key={label}
              className={`pf-info-card ${mounted ? "anim" : ""}`}
              style={{ transitionDelay: `${delay}ms` }}
            >
              <div className="pf-info-icon">{icon}</div>
              <div>
                <span>{label}</span>
                <b>{value}</b>
              </div>
              <div className="pf-info-card-shine" />
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className={`pf-cta ${mounted ? "anim" : ""}`}>
          <div>
            <h3>Recent Booking Activity</h3>
            <p>Check your bus tickets and travel history anytime.</p>
          </div>
          <Link to="/history" className="pf-cta-btn">
            View Ticket History →
          </Link>
        </div>

      </div>

      {/* ── Edit modal ── */}
      {editing && (
        <div className="pf-overlay" onClick={() => setEditing(false)}>
          <form className="pf-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <div className="pf-modal-stripe" />
            <div className="pf-modal-head">
              <h2>Edit Profile</h2>
              <button type="button" className="pf-modal-close" onClick={() => setEditing(false)}>
                <X size={16} />
              </button>
            </div>

            <label>Full Name</label>
            <div className="pf-modal-input">
              <User size={15} />
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" />
            </div>

            <label>Email Address</label>
            <div className="pf-modal-input">
              <Mail size={15} />
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@gmail.com" />
            </div>

            <label>Phone Number</label>
            <div className="pf-modal-input">
              <Phone size={15} />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="012 345 678" />
            </div>

            <p className="pf-modal-hint">
              This info auto-fills your passenger details when booking a ticket.
            </p>

            <button className="pf-modal-save" type="submit" disabled={saving}>
              <Save size={15} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}