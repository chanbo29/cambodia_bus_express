import { useEffect, useState } from "react";
import axios from "axios";
import { Megaphone, Trash2, Plus, Clock, X } from "lucide-react";
import "./AnnouncementPanel.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function authHeaders() {
  const token = localStorage.getItem("access");
  return { Authorization: `Bearer ${token}` };
}

function timeLeft(expires) {
  const diff = new Date(expires) - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

export default function AnnouncementPanel() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/announcements/all/`, {
        headers: authHeaders(),
      });
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setError("Title and message are required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await axios.post(`${API}/announcements/create/`, form, {
        headers: authHeaders(),
      });
      setForm({ title: "", message: "" });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await axios.delete(`${API}/announcements/${id}/delete/`, {
        headers: authHeaders(),
      });
      fetchAll();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  return (
    <div className="ap-wrap">
      {/* Header */}
      <div className="ap-head">
        <div>
          <h2 className="ap-title">
            <Megaphone size={20} />
            Announcements
          </h2>
          <p className="ap-sub">
            Alerts are sent to all logged-in users and auto-expire after 30 days.
          </p>
        </div>
        <button className="ap-new-btn" onClick={() => setShowForm(true)}>
          <Plus size={16} />
          New Announcement
        </button>
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="ap-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-head">
              <h3>New Announcement</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <label>Title</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Route update, Holiday notice..."
                maxLength={200}
              />
              <label>Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Write your announcement here..."
                rows={4}
              />
              {error && <p className="ap-error">{error}</p>}
              <p className="ap-expire-note">
                <Clock size={13} />
                This announcement will auto-expire in <strong>30 days</strong>.
              </p>
              <div className="ap-modal-actions">
                <button type="button" className="ap-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="ap-submit" disabled={saving}>
                  {saving ? "Sending…" : "Send Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="ap-loading">Loading announcements…</div>
      ) : announcements.length === 0 ? (
        <div className="ap-empty">
          <Megaphone size={36} />
          <p>No announcements yet. Create one to alert all users.</p>
        </div>
      ) : (
        <div className="ap-list">
          {announcements.map((a) => {
            const expired = new Date(a.expires_at) < Date.now();
            return (
              <div key={a.id} className={`ap-item ${expired ? "expired" : "active"}`}>
                <div className="ap-item-icon">
                  <Megaphone size={18} />
                </div>
                <div className="ap-item-body">
                  <div className="ap-item-head">
                    <h4>{a.title}</h4>
                    <span className={`ap-status ${expired ? "expired" : "active"}`}>
                      {expired ? "Expired" : "Live"}
                    </span>
                  </div>
                  <p>{a.message}</p>
                  <div className="ap-item-meta">
                    <span><Clock size={12} />{timeLeft(a.expires_at)}</span>
                    <span>Created: {new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  className="ap-delete"
                  onClick={() => handleDelete(a.id)}
                  title="Delete announcement"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}