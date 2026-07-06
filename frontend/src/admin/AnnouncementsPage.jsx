import AdminSidebar from "../components/AdminSidebar";
import AnnouncementPanel from "../components/AnnouncementPanel";
import "./Dashboard.css";

export default function AnnouncementsPage() {
  return (
    <div className="admin-page">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Announcements</h1>
            <p>Send alerts to all users. Auto-expire after 30 days.</p>
          </div>
        </header>
        <div className="admin-card" style={{ marginTop: 24 }}>
          <AnnouncementPanel />
        </div>
      </main>
    </div>
  );
}