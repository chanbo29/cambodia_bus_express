import { useEffect, useRef, useState } from "react";
import { Bell, X, Megaphone, Clock } from "lucide-react";
import axios from "axios";
import "./Notification.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Key is unique per user — user1's reads never affect user2
function getReadKey() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const uid = user?.id || user?.username || "guest";
  return `read_announcements_${uid}`;
}

function getReadIds() {
  try {
    return JSON.parse(localStorage.getItem(getReadKey()) || "[]");
  } catch {
    return [];
  }
}

function markRead(id) {
  const ids = getReadIds();
  if (!ids.includes(id)) {
    localStorage.setItem(getReadKey(), JSON.stringify([...ids, id]));
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [readIds, setReadIds] = useState(getReadIds());
  const ref = useRef(null);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem("access");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/announcements/`, { headers });
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // Refresh every 2 minutes
    const interval = setInterval(fetchAnnouncements, 120000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = announcements.filter(
    (a) => !readIds.includes(a.id)
  ).length;

  const handleOpen = () => {
    setOpen((o) => !o);
  };

  const handleRead = (id) => {
    markRead(id);
    setReadIds(getReadIds());
  };

  const markAllRead = () => {
    announcements.forEach((a) => markRead(a.id));
    setReadIds(getReadIds());
  };

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="notif-bell"
        onClick={handleOpen}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <div className="notif-panel-title">
              <Megaphone size={16} />
              Announcements
              {unreadCount > 0 && (
                <span className="notif-unread-count">{unreadCount} new</span>
              )}
            </div>
            <div className="notif-panel-actions">
              {unreadCount > 0 && (
                <button className="notif-mark-all" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
              <button className="notif-close" onClick={() => setOpen(false)}>
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="notif-list">
            {announcements.length === 0 ? (
              <div className="notif-empty">
                <Bell size={32} />
                <p>No announcements yet</p>
              </div>
            ) : (
              announcements.map((a) => {
                const isRead = readIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={`notif-item ${isRead ? "read" : "unread"}`}
                    onClick={() => handleRead(a.id)}
                  >
                    {!isRead && <div className="notif-dot" />}
                    <div className="notif-icon-wrap">
                      <Megaphone size={16} />
                    </div>
                    <div className="notif-body">
                      <p className="notif-title">{a.title}</p>
                      <p className="notif-msg">{a.message}</p>
                      <span className="notif-time">
                        <Clock size={11} />
                        {timeAgo(a.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}