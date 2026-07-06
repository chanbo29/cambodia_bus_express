import { useEffect, useState } from "react";
import {
  Bus, MapPin, Ticket, Users, Tag, FileBarChart,
  Search, Eye, Trash2, X, User, Phone, Calendar,
  Clock, CreditCard, ClipboardCheck, Megaphone,
  Download, FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import API from "../services/api";
import "./Dashboard.css";
import "./ManageBookings.css";

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
function getCheckInStatus(item) {
  const depDateTime = getDepartureDateTime(item);
  if (!depDateTime) return { label: "—", urgency: "normal" };
  const now = getCambodiaNow();
  const diffMinutes = Math.round((depDateTime.getTime() - now.getTime()) / 60000);
  if (diffMinutes < 0) return { label: "Departed", urgency: "departed" };
  if (diffMinutes <= 10) return { label: `Check in (${diffMinutes}m)`, urgency: "urgent" };
  if (diffMinutes <= 20) return { label: `Reminder (${diffMinutes}m)`, urgency: "reminder" };
  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;
  if (days >= 1) return { label: `${days}d ${hours}h remaining`, urgency: "normal" };
  if (hours >= 1) return { label: `${hours}h ${minutes}m remaining`, urgency: "normal" };
  return { label: `${minutes}m remaining`, urgency: "normal" };
}

// ── Export helpers ─────────────────────────────────────────────

function buildExportRows(data) {
  return data.map((b) => ({
    "Booking Code":    b.booking_code      || "",
    "Passenger Name":  b.passenger_name    || "",
    "Phone":           b.phone             || "",
    "Email":           b.email             || "",
    "From":            b.from_city         || "",
    "To":              b.to_city           || "",
    "Travel Date":     b.travel_date       || "",
    "Departure Time":  b.departure_time    || "",
    "Seat Numbers":    b.seat_numbers      || "",
    "Vehicle Type":    b.vehicle_type      || "",
    "Total Price ($)": Number(b.total_price || 0),
    "Checked In":      b.checked_in ? "Yes" : "No",
    "Booked At":       b.created_at
      ? new Date(b.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
      : "",
  }));
}

function exportCSV(data, filename) {
  const rows  = buildExportRows(data);
  if (rows.length === 0) { alert("No data to export."); return; }
  const keys  = Object.keys(rows[0]);
  const csv   = [
    keys.join(","),
    ...rows.map((r) =>
      keys.map((k) => `"${String(r[k]).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob  = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement("a");
  a.href      = url;
  a.download  = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(data, filename) {
  const rows = buildExportRows(data);
  if (rows.length === 0) { alert("No data to export."); return; }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // ── Column widths ──────────────────────────────────────────
  ws["!cols"] = [
    { wch: 16 }, // Booking Code
    { wch: 22 }, // Passenger Name
    { wch: 14 }, // Phone
    { wch: 26 }, // Email
    { wch: 14 }, // From
    { wch: 14 }, // To
    { wch: 13 }, // Travel Date
    { wch: 15 }, // Departure Time
    { wch: 14 }, // Seat Numbers
    { wch: 14 }, // Vehicle Type
    { wch: 16 }, // Total Price
    { wch: 12 }, // Checked In
    { wch: 22 }, // Booked At
  ];

  // ── Header row styling ─────────────────────────────────────
  const headerRange = XLSX.utils.decode_range(ws["!ref"]);
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font:      { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill:      { fgColor: { rgb: "04342C" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top:    { style: "thin", color: { rgb: "1D9E75" } },
        bottom: { style: "thin", color: { rgb: "1D9E75" } },
        left:   { style: "thin", color: { rgb: "1D9E75" } },
        right:  { style: "thin", color: { rgb: "1D9E75" } },
      },
    };
  }

  // ── Data rows alternating color ────────────────────────────
  for (let row = 1; row <= headerRange.e.r; row++) {
    const isEven = row % 2 === 0;
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s = {
        fill:      { fgColor: { rgb: isEven ? "F4FAF7" : "FFFFFF" } },
        alignment: { horizontal: col === 10 ? "right" : "left", vertical: "center" },
        border: {
          top:    { style: "hair", color: { rgb: "E0ECE6" } },
          bottom: { style: "hair", color: { rgb: "E0ECE6" } },
          left:   { style: "hair", color: { rgb: "E0ECE6" } },
          right:  { style: "hair", color: { rgb: "E0ECE6" } },
        },
      };
    }
  }

  // ── Summary sheet ──────────────────────────────────────────
  const totalRevenue   = data.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const totalPassengers = data.reduce((sum, b) => {
    const count = b.seat_numbers
      ? b.seat_numbers.split(",").filter(Boolean).length : 1;
    return sum + count;
  }, 0);
  const uniqueRoutes = new Set(data.map((b) => `${b.from_city} → ${b.to_city}`)).size;
  const checkedIn    = data.filter((b) => b.checked_in).length;

  const summaryData = [
    { "Metric": "Total Bookings",    "Value": data.length },
    { "Metric": "Total Passengers",  "Value": totalPassengers },
    { "Metric": "Total Revenue",     "Value": `$${totalRevenue.toFixed(2)}` },
    { "Metric": "Avg Ticket Price",  "Value": data.length > 0 ? `$${(totalRevenue / data.length).toFixed(2)}` : "$0.00" },
    { "Metric": "Unique Routes",     "Value": uniqueRoutes },
    { "Metric": "Checked In",        "Value": checkedIn },
    { "Metric": "Not Checked In",    "Value": data.length - checkedIn },
    { "Metric": "Export Date",       "Value": new Date().toLocaleString() },
  ];

  const ws2 = XLSX.utils.json_to_sheet(summaryData);
  ws2["!cols"] = [{ wch: 22 }, { wch: 20 }];

  // Style summary headers
  ["A1", "B1"].forEach((addr) => {
    if (!ws2[addr]) return;
    ws2[addr].s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      fill: { fgColor: { rgb: "04342C" } },
      alignment: { horizontal: "center" },
    };
  });

  XLSX.utils.book_append_sheet(wb, ws2, "Summary");
  XLSX.utils.book_append_sheet(wb, ws,  "Bookings");

  XLSX.writeFile(wb, filename, { bookType: "xlsx", cellStyles: true });
}

// ── Component ──────────────────────────────────────────────────

export default function ManageBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [dateFilter, setDateFilter]     = useState("");
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 20;
  const [selected, setSelected]         = useState(null);
  const [exporting, setExporting]       = useState(false);

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

  const handleDelete = async (id) => {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    try { await API.delete(`/bookings/${id}/`); fetchBookings(); }
    catch { alert("Failed to delete booking"); }
  };

  const passengerCount = (item) => {
    if (!item?.seat_numbers) return 1;
    return item.seat_numbers.split(",").map((s) => s.trim()).filter(Boolean).length;
  };

  const filtered = bookings.filter((b) => {
    const text = search.toLowerCase();
    const matchesSearch =
      b.booking_code?.toLowerCase().includes(text) ||
      b.passenger_name?.toLowerCase().includes(text) ||
      b.from_city?.toLowerCase().includes(text) ||
      b.to_city?.toLowerCase().includes(text);
    return matchesSearch && (!dateFilter || b.travel_date === dateFilter);
  });

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search, dateFilter]);

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  const dateTag  = dateFilter || new Date().toISOString().slice(0, 10);
  const exportData = filtered; // export whatever is currently filtered

  const handleExcelExport = () => {
    setExporting(true);
    setTimeout(() => {
      exportExcel(exportData, `Cambodia_Bus_Bookings_${dateTag}.xlsx`);
      setExporting(false);
    }, 100);
  };

  const handleCSVExport = () => {
    exportCSV(exportData, `Cambodia_Bus_Bookings_${dateTag}.csv`);
  };

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
          <a className="active"><Ticket size={20} /> Bookings</a>
          <a onClick={() => navigate("/admin-dashboard/checkin")}><ClipboardCheck size={20} /> Check-In</a>
          <a onClick={() => navigate("/admin-dashboard/promotions")}><Tag size={20} /> Promotions</a>
          <a onClick={() => navigate("/admin-dashboard/reports")}><FileBarChart size={20} /> Reports</a>
          <a onClick={() => navigate("/admin-dashboard/announcements")}><Megaphone size={20} /> Announcements</a>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Manage Bookings</h1>
            <p>View, inspect, and remove customer bookings.</p>
          </div>

          {/* Export buttons */}
          <div className="mb-export-row">
            <button
              className="mb-export-btn excel"
              onClick={handleExcelExport}
              disabled={exporting || filtered.length === 0}
              title="Export to Excel with styling + summary sheet"
            >
              <FileSpreadsheet size={16} />
              {exporting ? "Exporting…" : "Export Excel"}
            </button>
            <button
              className="mb-export-btn csv"
              onClick={handleCSVExport}
              disabled={filtered.length === 0}
              title="Export to CSV"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </header>

        <section className="admin-stats">
          <div><Ticket /><span>Total Bookings</span><h3>{bookings.length}</h3></div>
          <div><Users /><span>Total Passengers</span><h3>{bookings.reduce((sum, b) => sum + passengerCount(b), 0)}</h3></div>
          <div><CreditCard /><span>Total Revenue</span><h3>${totalRevenue.toFixed(2)}</h3></div>
          <div><MapPin /><span>Unique Routes</span><h3>{new Set(bookings.map((b) => `${b.from_city}-${b.to_city}`)).size}</h3></div>
        </section>

        <section className="admin-card">
          <div className="card-title">
            <h2>All Bookings</h2>
            <p>
              {loading
                ? "Loading..."
                : `Showing ${paginated.length} of ${filtered.length} (page ${page} of ${totalPages})`}
              {filtered.length !== bookings.length && (
                <span className="mb-filter-badge"> — filtered</span>
              )}
            </p>
          </div>

          <div className="mb-filters-row">
            <div className="mb-search">
              <Search size={18} />
              <input
                placeholder="Search by code, passenger, or route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="mb-date-filter">
              <Calendar size={16} />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button className="mb-date-clear" onClick={() => setDateFilter("")} title="Clear">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="route-table">
            <table>
              <thead>
                <tr>
                  <th>Code</th><th>Passenger</th><th>Route</th><th>Seats</th>
                  <th>Date</th><th>Time Remaining</th><th>Amount</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((b) => {
                  const { label, urgency } = getCheckInStatus(b);
                  return (
                    <tr key={b.id}>
                      <td><strong>{b.booking_code}</strong></td>
                      <td>{b.passenger_name}</td>
                      <td><strong>{b.from_city}</strong><span>→ {b.to_city}</span></td>
                      <td>{b.seat_numbers}</td>
                      <td>{b.travel_date}</td>
                      <td><span className={`mb-checkin-badge ${urgency}`}>{label}</span></td>
                      <td>${b.total_price}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => setSelected(b)}><Eye size={16} /></button>
                          <button className="delete-btn" onClick={() => handleDelete(b.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan="8" className="empty-table">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="mb-pagination">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>Next</button>
            </div>
          )}
        </section>
      </main>

      {selected && (
        <div className="mb-overlay" onClick={() => setSelected(null)}>
          <div className="mb-detail-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-detail-head">
              <h2>Booking Details</h2>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="mb-detail-code">
              <span>Booking Code</span>
              <strong>{selected.booking_code}</strong>
            </div>
            <div className="mb-detail-grid">
              <div><User size={15} /><span>Passenger</span><b>{selected.passenger_name || "N/A"}</b></div>
              <div><Phone size={15} /><span>Phone</span><b>{selected.phone || "N/A"}</b></div>
              <div><MapPin size={15} /><span>Route</span><b>{selected.from_city} → {selected.to_city}</b></div>
              <div><Calendar size={15} /><span>Travel Date</span><b>{selected.travel_date}</b></div>
              <div><Clock size={15} /><span>Departure</span><b>{selected.departure_time}</b></div>
              <div><Bus size={15} /><span>Vehicle</span><b>{selected.vehicle_type}</b></div>
              <div><Ticket size={15} /><span>Seats</span><b>{selected.seat_numbers}</b></div>
              <div><CreditCard size={15} /><span>Total Paid</span><b>${selected.total_price}</b></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}