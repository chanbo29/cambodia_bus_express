import { useEffect, useState } from "react";
import {
  Bus, MapPin, Ticket, Tag, FileBarChart,
  CheckCircle2, Circle, Search, ClipboardCheck, Users, Megaphone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";
import "./ManageCheckIn.css";

function getCambodiaNow() {
  const str = new Date().toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh", hour12: false });
  return new Date(str);
}
function getCambodiaTodayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
}
function parseDepartureTime(value) {
  if (!value) return null;
  const ampmMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = Number(ampmMatch[1]);
    const minutes = Number(ampmMatch[2]);
    const isPM = ampmMatch[3].toUpperCase() === "PM";
    if (hours === 12) hours = 0;
    if (isPM) hours += 12;
    return { hours, minutes };
  }
  const hmMatch = value.match(/^(\d{1,2}):(\d{2})$/);
  if (hmMatch) return { hours: Number(hmMatch[1]), minutes: Number(hmMatch[2]) };
  return null;
}
function getDepartureDateTime(item) {
  if (!item.travel_date) return null;
  const depTime = parseDepartureTime(item.departure_time);
  if (!depTime) return null;
  const [y, m, d] = item.travel_date.split("-").map(Number);
  return new Date(y, m - 1, d, depTime.hours, depTime.minutes, 0, 0);
}
function getTimeStatus(item) {
  const depDateTime = getDepartureDateTime(item);
  if (!depDateTime) return { label: "—", urgency: "normal" };
  const now = getCambodiaNow();
  const diffMinutes = Math.round((depDateTime.getTime() - now.getTime()) / 60000);
  if (diffMinutes < 0) return { label: "Departed", urgency: "departed" };
  if (diffMinutes <= 10) return { label: `${diffMinutes}m to go`, urgency: "urgent" };
  if (diffMinutes <= 20) return { label: `${diffMinutes}m to go`, urgency: "reminder" };
  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;
  let label;
  if (days >= 1) label = `${days}d ${hours}h`;
  else if (hours >= 1) label = `${hours}h ${minutes}m`;
  else label = `${minutes}m`;
  return { label, urgency: "normal" };
}

export default function ManageCheckIn() {
  const navigate = useNavigate();
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [dateFilter, setDateFilter] = useState(getCambodiaTodayStr());

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(() => fetchBookings({ silent: true }), 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    API.get("/bookings/")
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(console.log)
      .finally(() => { if (!silent) setLoading(false); });
  };

  const toggleCheckedIn = async (booking) => {
    try {
      await API.patch(`/bookings/${booking.id}/`, { checked_in: !booking.checked_in });
      fetchBookings({ silent: true });
    } catch { alert("Failed to update check-in status"); }
  };

  const passengerCount = (item) => {
    if (!item?.seat_numbers) return 1;
    return item.seat_numbers.split(",").map((s) => s.trim()).filter(Boolean).length;
  };

  const filtered = bookings
    .filter((b) => !dateFilter || b.travel_date === dateFilter)
    .filter((b) => getTimeStatus(b).urgency !== "departed")
    .filter((b) => {
      const text = search.toLowerCase();
      return !text ||
        b.booking_code?.toLowerCase().includes(text) ||
        b.passenger_name?.toLowerCase().includes(text) ||
        b.from_city?.toLowerCase().includes(text) ||
        b.to_city?.toLowerCase().includes(text);
    })
    .sort((a, b) => (a.departure_time > b.departure_time ? 1 : -1));

  const checkedInCount = filtered.filter((b) => b.checked_in).length;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div><Bus size={32} /></div>
          <section><h2>Cambodia Bus</h2><p>Admin Panel</p></section>
        </div>
        <nav>
          <a onClick={() => navigate("/admin-dashboard")}><Bus size={20} /> Dashboard</a>
          <a onClick={() => navigate("/admin-dashboard/routes")}><MapPin size={20} /> Routes</a>
          <a onClick={() => navigate("/admin-dashboard/bookings")}><Ticket size={20} /> Bookings</a>
          <a className="active"><ClipboardCheck size={20} /> Check-In</a>
          <a onClick={() => navigate("/admin-dashboard/promotions")}><Tag size={20} /> Promotions</a>
          <a onClick={() => navigate("/admin-dashboard/reports")}><FileBarChart size={20} /> Reports</a>
          <a onClick={() => navigate("/admin-dashboard/announcements")}><Megaphone size={20} /> Announcements</a>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1><ClipboardCheck size={22} style={{ verticalAlign: "-4px", marginRight: "8px" }} />Manage Check-In</h1>
            <p>Board passengers onto their bus and track who's checked in.</p>
          </div>
        </header>

        <section className="admin-stats">
          <div><Ticket /><span>Bookings for this date</span><h3>{loading ? "—" : filtered.length}</h3></div>
          <div><CheckCircle2 /><span>Checked In</span><h3>{loading ? "—" : checkedInCount}</h3></div>
          <div><Circle /><span>Not Checked In</span><h3>{loading ? "—" : filtered.length - checkedInCount}</h3></div>
        </section>

        <section className="admin-card">
          <div className="card-title">
            <h2>Passenger List</h2>
            <p>{loading ? "Loading..." : `${filtered.length} booking(s)`}</p>
          </div>

          <div className="ci-filters-row">
            <div className="ci-search">
              <Search size={18} />
              <input placeholder="Search by code, passenger, or route..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="ci-date-filter">
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
              {dateFilter && <button onClick={() => setDateFilter("")}>Clear</button>}
            </div>
          </div>

          <div className="route-table">
            <table>
              <thead>
                <tr><th>Code</th><th>Passenger</th><th>Route</th><th>Seats</th><th>Departs</th><th>Time</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const { label, urgency } = getTimeStatus(b);
                  return (
                    <tr key={b.id} className={b.checked_in ? "ci-row-done" : ""}>
                      <td><strong>{b.booking_code}</strong></td>
                      <td>{b.passenger_name}<span className="ci-pax-count">{passengerCount(b)} pax</span></td>
                      <td><strong>{b.from_city}</strong><span>→ {b.to_city}</span></td>
                      <td>{b.seat_numbers}</td>
                      <td>{b.departure_time}</td>
                      <td><span className={`mb-checkin-badge ${urgency}`}>{label}</span></td>
                      <td>
                        <button className={`ci-toggle-btn ${b.checked_in ? "done" : ""}`} onClick={() => toggleCheckedIn(b)}>
                          {b.checked_in ? <><CheckCircle2 size={15} />Checked In</> : <><Circle size={15} />Check In</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan="7" className="empty-table">No upcoming departures for this date</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}