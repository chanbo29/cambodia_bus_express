import { useEffect, useRef, useState } from "react";
import {
  Bus, MapPin, Ticket, Tag, FileBarChart,
  CheckCircle2, Circle, Search, ClipboardCheck,
  Users, Megaphone, QrCode, UserCheck,
  AlertTriangle, X, ChevronRight, Clock,
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
  if (days >= 1) return { label: `${days}d ${hours}h`, urgency: "normal" };
  if (hours >= 1) return { label: `${hours}h ${minutes}m`, urgency: "normal" };
  return { label: `${minutes}m`, urgency: "normal" };
}

const TABS = [
  { id: "gate",  label: "Gate Scan",     icon: QrCode },
  { id: "list",  label: "Passenger List", icon: Users  },
];

export default function ManageCheckIn() {
  const navigate = useNavigate();
  const scanRef  = useRef(null);
  const [activeTab, setActiveTab]   = useState("gate");
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [dateFilter, setDateFilter] = useState(getCambodiaTodayStr());

  // Gate scan state
  const [scanInput, setScanInput]   = useState("");
  const [scanResult, setScanResult] = useState(null); // booking found
  const [scanError, setScanError]   = useState("");
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(() => fetchBookings({ silent: true }), 15000);
    return () => clearInterval(interval);
  }, []);

  // Auto-focus scan input when on gate tab
  useEffect(() => {
    if (activeTab === "gate") {
      setTimeout(() => scanRef.current?.focus(), 100);
    }
  }, [activeTab]);

  // Global keyboard capture for barcode scanners (fast typing + Enter)
  useEffect(() => {
    if (activeTab !== "gate") return;
    let buf = "", timer = null;
    const onKey = (e) => {
      if (e.target === scanRef.current) return; // don't double-capture
      if (e.key === "Enter") {
        if (buf.length > 3) handleScan(buf);
        buf = ""; clearTimeout(timer);
      } else if (e.key.length === 1) {
        buf += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { buf = ""; }, 200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTab, bookings]);

  const fetchBookings = ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    API.get("/bookings/")
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch(console.log)
      .finally(() => { if (!silent) setLoading(false); });
  };

  // ── Gate scan logic ───────────────────────────────────────────
  const handleScan = (code) => {
    const cleaned = code.trim().toUpperCase();
    setScanInput("");
    setScanError("");
    setScanResult(null);
    setScanSuccess(false);

    const found = bookings.find(
      (b) => b.booking_code?.toUpperCase() === cleaned
    );

    if (!found) {
      setScanError(`Booking code "${cleaned}" not found.`);
      return;
    }

    setScanResult(found);
  };

  const handleManualScan = () => {
    if (scanInput.trim()) handleScan(scanInput);
  };

  const handleCheckIn = async (booking) => {
    try {
      await API.patch(`/bookings/${booking.id}/`, { checked_in: true });
      setScanSuccess(true);
      fetchBookings({ silent: true });
      // Refresh the scan result with updated data
      setScanResult((prev) => ({ ...prev, checked_in: true }));
    } catch {
      alert("Failed to check in passenger.");
    }
  };

  const handleUndoCheckIn = async (booking) => {
    try {
      await API.patch(`/bookings/${booking.id}/`, { checked_in: false });
      setScanResult((prev) => ({ ...prev, checked_in: false }));
      setScanSuccess(false);
      fetchBookings({ silent: true });
    } catch {
      alert("Failed to undo check-in.");
    }
  };

  const clearScan = () => {
    setScanResult(null);
    setScanError("");
    setScanSuccess(false);
    setScanInput("");
    setTimeout(() => scanRef.current?.focus(), 100);
  };

  const passengerCount = (item) => {
    if (!item?.seat_numbers) return 1;
    return item.seat_numbers.split(",").map((s) => s.trim()).filter(Boolean).length;
  };

  // ── List tab ──────────────────────────────────────────────────
  const filtered = bookings
    .filter((b) => !dateFilter || b.travel_date === dateFilter)
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
        {/* Tab bar */}
        <div className="sci-tab-bar" style={{ marginBottom: 20 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`sci-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* ══ GATE SCAN TAB ════════════════════════════════════ */}
        {activeTab === "gate" && (
          <>
            <header className="admin-header" style={{ marginTop: 0 }}>
              <div>
                <h1>Customer Gate Check-In</h1>
                <p>Scan the passenger's QR code or enter booking code to board.</p>
              </div>
            </header>

            {/* Quick stats */}
            <section className="admin-stats" style={{ marginBottom: 20 }}>
              <div><UserCheck /><span>Today's Bookings</span>
                <h3>{bookings.filter(b => b.travel_date === getCambodiaTodayStr()).length}</h3>
              </div>
              <div><CheckCircle2 /><span>Checked In</span>
                <h3>{bookings.filter(b => b.travel_date === getCambodiaTodayStr() && b.checked_in).length}</h3>
              </div>
              <div><Circle /><span>Pending</span>
                <h3>{bookings.filter(b => b.travel_date === getCambodiaTodayStr() && !b.checked_in).length}</h3>
              </div>
              <div><AlertTriangle /><span>All Bookings</span>
                <h3>{bookings.length}</h3>
              </div>
            </section>

            {/* Scan area */}
            <div className="gci-scan-card">
              <div className="gci-scan-top">
                <div className="gci-scan-icon"><QrCode size={40} /></div>
                <div>
                  <h2>Scan or Enter Booking Code</h2>
                  <p>Point QR scanner at ticket — or type the booking code manually</p>
                </div>
              </div>
              <div className="gci-scan-row">
                <input
                  ref={scanRef}
                  className="gci-scan-input"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleManualScan()}
                  placeholder="e.g. CBE-A1B2C3D4"
                  autoFocus
                />
                <button className="gci-scan-btn" onClick={handleManualScan}>
                  Check In
                </button>
                {(scanResult || scanError) && (
                  <button className="gci-clear-btn" onClick={clearScan}>
                    <X size={16} /> Clear
                  </button>
                )}
              </div>
              <p className="gci-hint">Scanner auto-submits · Press Enter to submit manually</p>
            </div>

            {/* Error */}
            {scanError && (
              <div className="gci-error-card">
                <AlertTriangle size={20} />
                <div>
                  <strong>Booking Not Found</strong>
                  <p>{scanError}</p>
                </div>
              </div>
            )}

            {/* Result card */}
            {scanResult && (
              <div className={`gci-result-card ${scanResult.checked_in ? "checked" : ""}`}>
                {/* Header */}
                <div className="gci-result-header">
                  <div className="gci-result-code">
                    <span>Booking Code</span>
                    <strong>{scanResult.booking_code}</strong>
                  </div>
                  <div className={`gci-result-status ${scanResult.checked_in ? "in" : "pending"}`}>
                    {scanResult.checked_in ? <><CheckCircle2 size={16} /> Checked In</> : <><Circle size={16} /> Pending</>}
                  </div>
                </div>

                {/* Passenger details */}
                <div className="gci-result-grid">
                  <div className="gci-result-item">
                    <span>Passenger</span>
                    <strong>{scanResult.passenger_name || "—"}</strong>
                  </div>
                  <div className="gci-result-item">
                    <span>Phone</span>
                    <strong>{scanResult.phone || "—"}</strong>
                  </div>
                  <div className="gci-result-item">
                    <span>Route</span>
                    <strong>{scanResult.from_city} → {scanResult.to_city}</strong>
                  </div>
                  <div className="gci-result-item">
                    <span>Travel Date</span>
                    <strong>{scanResult.travel_date}</strong>
                  </div>
                  <div className="gci-result-item">
                    <span>Departure</span>
                    <strong>{scanResult.departure_time}</strong>
                  </div>
                  <div className="gci-result-item">
                    <span>Seats</span>
                    <strong>{scanResult.seat_numbers}</strong>
                  </div>
                  <div className="gci-result-item">
                    <span>Passengers</span>
                    <strong>{passengerCount(scanResult)} pax</strong>
                  </div>
                  <div className="gci-result-item">
                    <span>Amount Paid</span>
                    <strong>${scanResult.total_price}</strong>
                  </div>
                </div>

                {/* Success message */}
                {scanSuccess && (
                  <div className="gci-success-banner">
                    <CheckCircle2 size={18} />
                    <span>Passenger successfully boarded! Have a safe trip.</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="gci-result-actions">
                  {!scanResult.checked_in ? (
                    <button
                      className="gci-board-btn"
                      onClick={() => handleCheckIn(scanResult)}
                    >
                      <UserCheck size={18} /> Board Passenger
                    </button>
                  ) : (
                    <button
                      className="gci-undo-btn"
                      onClick={() => handleUndoCheckIn(scanResult)}
                    >
                      <X size={16} /> Undo Check-In
                    </button>
                  )}
                  <button className="gci-next-btn" onClick={clearScan}>
                    <ChevronRight size={16} /> Next Passenger
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ PASSENGER LIST TAB ═══════════════════════════════ */}
        {activeTab === "list" && (
          <>
            <header className="admin-header" style={{ marginTop: 0 }}>
              <div>
                <h1>Passenger List</h1>
                <p>All bookings for the selected date — toggle check-in status.</p>
              </div>
            </header>

            <section className="admin-stats">
              <div><Ticket /><span>Bookings for date</span><h3>{loading ? "—" : filtered.length}</h3></div>
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
                  <input
                    placeholder="Search by code, passenger, or route..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="ci-date-filter">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                  {dateFilter && (
                    <button onClick={() => setDateFilter("")}>Clear</button>
                  )}
                </div>
              </div>

              <div className="route-table">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th><th>Passenger</th><th>Route</th>
                      <th>Seats</th><th>Departs</th><th>Time</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => {
                      const { label, urgency } = getTimeStatus(b);
                      return (
                        <tr key={b.id} className={b.checked_in ? "ci-row-done" : ""}>
                          <td><strong>{b.booking_code}</strong></td>
                          <td>
                            {b.passenger_name}
                            <span className="ci-pax-count">{passengerCount(b)} pax</span>
                          </td>
                          <td><strong>{b.from_city}</strong><span>→ {b.to_city}</span></td>
                          <td>{b.seat_numbers}</td>
                          <td>{b.departure_time}</td>
                          <td><span className={`mb-checkin-badge ${urgency}`}>{label}</span></td>
                          <td>
                            <button
                              className={`ci-toggle-btn ${b.checked_in ? "done" : ""}`}
                              onClick={async () => {
                                try {
                                  await API.patch(`/bookings/${b.id}/`, { checked_in: !b.checked_in });
                                  fetchBookings({ silent: true });
                                } catch { alert("Failed to update."); }
                              }}
                            >
                              {b.checked_in
                                ? <><CheckCircle2 size={15} /> Checked In</>
                                : <><Circle size={15} /> Check In</>}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && filtered.length === 0 && (
                      <tr><td colSpan="7" className="empty-table">
                        No bookings found for this date
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}