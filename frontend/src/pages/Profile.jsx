import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Ticket,
  LogOut,
  Camera,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { getMyProfile, updateMyProfile } from "../services/booking";
import "./Profile.css";

/* ============================================================
   DESIGN NOTE — "Boarding Pass" profile
   This is a bus-ticketing product, so the profile card is built
   like a boarding pass / ticket stub: a perforated tear line,
   route-style data labels, and a stamp that lands when a new
   photo is uploaded. Departure-board flicker on the activity
   panel echoes a terminal display. One signature move per
   surface — everything else stays quiet.
   ============================================================ */

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stamped, setStamped] = useState(false);

  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [photo, setPhoto] = useState(null);

  // Key the stored photo to the logged-in user, so switching accounts
  // doesn't show the previous user's photo.
  const photoKey = (p) => `profileImage:${p?.username || p?.email || "unknown"}`;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    setLoading(true);
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
        setPhoto(localStorage.getItem(photoKey(data)));
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

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
          email: updated.email,
          phone: updated.phone,
        })
      );
    } catch (err) {
      alert(
        "Failed to save: " +
          (err.response?.data ? JSON.stringify(err.response.data) : "Unknown error")
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
      setStamped(false);
      requestAnimationFrame(() => setStamped(true));
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
      <div className="bp-page bp-loading">
        <div className="bp-loading-ticket">
          <Ticket size={26} />
          <span>Loading your pass…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bp-page">
      <div className="bp-cover">
        <div className="bp-cover-route">
          <span className="bp-eyebrow">My Account</span>
          <h1 className="bp-anim bp-d1">{profile?.full_name || profile?.username}</h1>
          <p className="bp-anim bp-d2">{profile?.email || "No email saved"}</p>
        </div>
        <div className="bp-cover-line" aria-hidden="true" />
      </div>

      <div className="bp-layout">
        {/* ---------- Boarding pass card ---------- */}
        <aside className="bp-pass bp-anim bp-pass-anim">
          <div className="bp-pass-top">
            <div className="bp-photo-wrap">
              {photo ? (
                <img src={photo} alt="Profile" className="bp-photo" />
              ) : (
                <div className="bp-photo-placeholder">
                  <User size={42} />
                </div>
              )}

              {stamped && (
                <span
                  className="bp-stamp"
                  onAnimationEnd={() => setStamped(false)}
                >
                  UPDATED
                </span>
              )}

              <label className="bp-photo-btn" title="Change photo">
                <Camera size={15} />
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
              </label>
            </div>

            <h2>{profile?.full_name || profile?.username}</h2>
            <p className="bp-pass-email">{profile?.email || "No email saved"}</p>

            <button className="bp-edit-btn" onClick={() => setEditing(true)}>
              <Pencil size={14} />
              Edit Profile
            </button>
          </div>

          <div className="bp-perforation" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>

          <div className="bp-pass-bottom">
            <span className="bp-stub-label">Passenger</span>
            <span className="bp-stub-code">
              {(profile?.username || "GUEST").slice(0, 10).toUpperCase()}
            </span>

            <div className="bp-action-list">
              <Link to="/history" className="bp-action-row">
                <Ticket size={17} />
                Booking History
              </Link>
              <button className="bp-action-row bp-logout" onClick={logout}>
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* ---------- Account info ---------- */}
        <main className="bp-content">
          <div className="bp-anim bp-d2">
            <h2 className="bp-section-title">Account Information</h2>
            <p className="bp-section-sub">
              Your personal information and travel account overview.
            </p>
          </div>

          <div className="bp-info-grid">
            <InfoCard icon={<User size={19} />} label="Username" value={profile?.username} delay="bp-d2" />
            <InfoCard icon={<Mail size={19} />} label="Email" value={profile?.email || "Not set"} delay="bp-d3" />
            <InfoCard icon={<Phone size={19} />} label="Phone" value={profile?.phone || "Not set"} delay="bp-d4" />
            <InfoCard
              icon={<Calendar size={19} />}
              label="Member Since"
              value={profile?.date_joined ? new Date(profile.date_joined).getFullYear() : "—"}
              delay="bp-d5"
            />
          </div>

          <div className="bp-board bp-anim bp-d5">
            <div className="bp-board-flicker" aria-hidden="true" />
            <div>
              <h3>Recent Booking Activity</h3>
              <p>Check your bus tickets and travel history.</p>
            </div>
            <Link to="/history" className="bp-board-btn">
              View Ticket History
            </Link>
          </div>
        </main>
      </div>

      {editing && (
        <div className="bp-overlay" onClick={() => setEditing(false)}>
          <form
            className="bp-edit-card"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <div className="bp-edit-head">
              <h2>Edit Profile</h2>
              <button type="button" onClick={() => setEditing(false)}>
                <X size={18} />
              </button>
            </div>

            <label>Full Name</label>
            <div className="bp-edit-input">
              <User size={16} />
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            <label>Email Address</label>
            <div className="bp-edit-input">
              <Mail size={16} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@gmail.com"
              />
            </div>

            <label>Phone Number</label>
            <div className="bp-edit-input">
              <Phone size={16} />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="012 345 678"
              />
            </div>

            <p className="bp-edit-hint">
              This info will be used to auto-fill your passenger details when
              booking a ticket.
            </p>

            <button className="bp-edit-save" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon, label, value, delay }) {
  return (
    <div className={`bp-info-card bp-anim ${delay}`}>
      <div className="bp-info-icon">{icon}</div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}