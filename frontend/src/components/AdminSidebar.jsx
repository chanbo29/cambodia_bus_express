import { useNavigate, useLocation } from "react-router-dom";
import {
  Bus, MapPin, Ticket, ClipboardCheck,
  Tag, FileBarChart, Megaphone,
} from "lucide-react";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path, exact = false) =>
    exact
      ? location.pathname === path
      : location.pathname === path;

  return (
    <aside className="admin-sidebar">
      <div className="admin-logo">
        <div><Bus size={32} /></div>
        <section>
          <h2>Cambodia Bus</h2>
          <p>Admin Panel</p>
        </section>
      </div>

      <nav>
        <a
          className={isActive("/admin-dashboard", true) ? "active" : ""}
          onClick={() => navigate("/admin-dashboard")}
        >
          <Bus size={20} /> Dashboard
        </a>
        <a
          className={isActive("/admin-dashboard/routes") ? "active" : ""}
          onClick={() => navigate("/admin-dashboard/routes")}
        >
          <MapPin size={20} /> Routes
        </a>
        <a
          className={isActive("/admin-dashboard/bookings") ? "active" : ""}
          onClick={() => navigate("/admin-dashboard/bookings")}
        >
          <Ticket size={20} /> Bookings
        </a>
        <a
          className={isActive("/admin-dashboard/checkin") ? "active" : ""}
          onClick={() => navigate("/admin-dashboard/checkin")}
        >
          <ClipboardCheck size={20} /> Check-In
        </a>
        <a
          className={isActive("/admin-dashboard/promotions") ? "active" : ""}
          onClick={() => navigate("/admin-dashboard/promotions")}
        >
          <Tag size={20} /> Promotions
        </a>
        <a
          className={isActive("/admin-dashboard/reports") ? "active" : ""}
          onClick={() => navigate("/admin-dashboard/reports")}
        >
          <FileBarChart size={20} /> Reports
        </a>
        <a
          className={isActive("/admin-dashboard/announcements") ? "active" : ""}
          onClick={() => navigate("/admin-dashboard/announcements")}
        >
          <Megaphone size={20} /> Announcements
        </a>
      </nav>
    </aside>
  );
}