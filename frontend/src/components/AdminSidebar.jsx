import { useNavigate, useLocation } from "react-router-dom";
import {
  Bus, MapPin, Ticket, ClipboardCheck,
  Tag, FileBarChart, Megaphone,
} from "lucide-react";
import "./AdminSidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard",     icon: Bus,           path: "/admin-dashboard",              exact: true },
  { label: "Routes",        icon: MapPin,         path: "/admin-dashboard/routes" },
  { label: "Bookings",      icon: Ticket,         path: "/admin-dashboard/bookings" },
  { label: "Check-In",      icon: ClipboardCheck, path: "/admin-dashboard/checkin" },
  { label: "Promotions",    icon: Tag,            path: "/admin-dashboard/promotions" },
  { label: "Reports",       icon: FileBarChart,   path: "/admin-dashboard/reports" },
  { label: "Announcements", icon: Megaphone,      path: "/admin-dashboard/announcements" },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname === item.path;

  return (
    <aside className="admin-sidebar">
      <div className="admin-logo">
        <div><Bus size={30} /></div>
        <section>
          <h2>Cambodia Bus</h2>
          <p>Admin Panel</p>
        </section>
      </div>

      <nav>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.path}
            className={isActive(item) ? "active" : ""}
            onClick={() => navigate(item.path)}
          >
            <item.icon size={20} />
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}