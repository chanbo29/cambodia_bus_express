import { useNavigate, useLocation } from "react-router-dom";
import {
  Bus, MapPin, Ticket, ClipboardCheck,
  Tag, FileBarChart, Megaphone, LogOut,
  LayoutDashboard,
} from "lucide-react";
import "./AdminSidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard",     icon: LayoutDashboard, path: "/admin-dashboard",              exact: true },
  { label: "Routes",        icon: MapPin,           path: "/admin-dashboard/routes" },
  { label: "Bookings",      icon: Ticket,           path: "/admin-dashboard/bookings" },
  { label: "Check-In",      icon: ClipboardCheck,   path: "/admin-dashboard/checkin" },
  { label: "Promotions",    icon: Tag,              path: "/admin-dashboard/promotions" },
  { label: "Reports",       icon: FileBarChart,     path: "/admin-dashboard/reports" },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname === item.path;

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <aside className="asb-wrap">
      {/* Animated gradient stripe */}
      <div className="asb-stripe" />

      {/* Logo */}
      <div className="asb-logo">
        <div className="asb-logo-icon"><Bus size={18} /></div>
        <div>
          <h3>Cambodia Bus</h3>
          <p>ADMIN PANEL</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="asb-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            className={`asb-item ${isActive(item) ? "on" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <item.icon size={18} className="asb-icon" />
            <span>{item.label}</span>
            {isActive(item) && <div className="asb-active-dot" />}
          </button>
        ))}

        {/* Divider before Announcements */}
        <div className="asb-divider" />

        <button
          className={`asb-item ${location.pathname === "/admin-dashboard/announcements" ? "on" : ""}`}
          onClick={() => navigate("/admin-dashboard/announcements")}
        >
          <Megaphone size={18} className="asb-icon" />
          <span>Announcements</span>
          {location.pathname === "/admin-dashboard/announcements" && <div className="asb-active-dot" />}
        </button>
      </nav>

      {/* User card at bottom */}
      <div className="asb-bottom">
        <div className="asb-user">
          <div className="asb-user-av">
            {localStorage.getItem("profileImage")
              ? <img src={localStorage.getItem("profileImage")} alt="avatar" />
              : <span>{(user?.username || "A")[0].toUpperCase()}</span>}
          </div>
          <div className="asb-user-info">
            <div className="asb-user-name">{user?.username || "Admin"}</div>
            <div className="asb-user-role">Super Admin</div>
          </div>
          <button className="asb-logout" onClick={logout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}