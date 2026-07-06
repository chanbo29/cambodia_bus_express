import { useEffect, useState } from "react";
import {
  Bus, MapPin, Ticket, Users, Tag, FileBarChart,
  DollarSign, CalendarCheck, UserPlus, ClipboardCheck,
  TrendingUp, Award, Megaphone, Download, FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import API from "../services/api";
import "./Dashboard.css";
import "./Reports.css";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Export helpers ─────────────────────────────────────────────

function exportCSV(rows, filename) {
  if (!rows.length) { alert("No data to export."); return; }
  const keys = Object.keys(rows[0]);
  const csv  = [
    keys.join(","),
    ...rows.map((r) =>
      keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(sheetsData, filename) {
  const wb = XLSX.utils.book_new();

  sheetsData.forEach(({ name, rows, colWidths }) => {
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    if (colWidths) ws["!cols"] = colWidths.map((w) => ({ wch: w }));

    // Header styling
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[addr]) continue;
      ws[addr].s = {
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

    // Alternating rows
    for (let row = 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const addr = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[addr]) continue;
        ws[addr].s = {
          fill:      { fgColor: { rgb: row % 2 === 0 ? "F4FAF7" : "FFFFFF" } },
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top:    { style: "hair", color: { rgb: "E0ECE6" } },
            bottom: { style: "hair", color: { rgb: "E0ECE6" } },
            left:   { style: "hair", color: { rgb: "E0ECE6" } },
            right:  { style: "hair", color: { rgb: "E0ECE6" } },
          },
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, filename, { bookType: "xlsx", cellStyles: true });
}

// ── Component ──────────────────────────────────────────────────

export default function Reports() {
  const navigate = useNavigate();
  const [bookings, setBookings]                 = useState([]);
  const [newUsersCount, setNewUsersCount]       = useState(null);
  const [activePromoCount, setActivePromoCount] = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [exporting, setExporting]               = useState(false);

  useEffect(() => {
    setLoading(true);
    API.get("/bookings/").then((res) => setBookings(Array.isArray(res.data) ? res.data : [])).catch(console.log).finally(() => setLoading(false));
    API.get("/users/").then((res) => {
      const users = Array.isArray(res.data) ? res.data : [];
      setNewUsersCount(users.filter((u) => new Date(u.date_joined).getFullYear() === new Date().getFullYear()).length);
    }).catch(() => setNewUsersCount(null));
    API.get("/promotions/").then((res) => {
      setActivePromoCount((Array.isArray(res.data) ? res.data : []).filter((p) => p.active).length);
    }).catch(() => setActivePromoCount(null));
  }, []);

  const passengerCount = (item) => {
    if (!item?.seat_numbers) return 1;
    return item.seat_numbers.split(",").map((s) => s.trim()).filter(Boolean).length;
  };

  const today    = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const totalSales      = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const totalBookings   = bookings.length;
  const ticketsSold     = bookings.reduce((sum, b) => sum + passengerCount(b), 0);
  const avgBookingValue = totalBookings > 0 ? totalSales / totalBookings : 0;
  const todaysRevenue   = bookings.filter((b) => b.travel_date === todayStr).reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  const monthlyData = MONTH_NAMES.map((name, index) => {
    const mb = bookings.filter((b) => {
      if (!b.travel_date) return false;
      const d = new Date(b.travel_date);
      return d.getMonth() === index && d.getFullYear() === today.getFullYear();
    });
    return { month: name, bookings: mb.length, revenue: mb.reduce((sum, b) => sum + Number(b.total_price || 0), 0) };
  }).filter((m) => m.bookings > 0 || m.revenue > 0);
  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);

  const routeMap = {};
  bookings.forEach((b) => {
    const key = `${b.from_city} → ${b.to_city}`;
    if (!routeMap[key]) routeMap[key] = { route: key, bookings: 0, revenue: 0 };
    routeMap[key].bookings += 1;
    routeMap[key].revenue  += Number(b.total_price || 0);
  });
  const topRoutes          = Object.values(routeMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const topRouteMaxRevenue = Math.max(...topRoutes.map((r) => r.revenue), 1);
  const mostPopularRoute   = topRoutes[0]?.route || "—";

  const vehicleMap = {};
  bookings.forEach((b) => {
    const key = b.vehicle_type || "Unknown";
    if (!vehicleMap[key]) vehicleMap[key] = { type: key, bookings: 0, revenue: 0 };
    vehicleMap[key].bookings += 1;
    vehicleMap[key].revenue  += Number(b.total_price || 0);
  });
  const vehicleBreakdown  = Object.values(vehicleMap).sort((a, b) => b.revenue - a.revenue);
  const vehicleMaxRevenue = Math.max(...vehicleBreakdown.map((v) => v.revenue), 1);

  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  bookings.forEach((b) => {
    if (!b.travel_date) return;
    const [y, m, d] = b.travel_date.split("-").map(Number);
    dowCounts[new Date(y, m - 1, d).getDay()] += 1;
  });
  const maxDowCount = Math.max(...dowCounts, 1);

  // ── Export data builders ───────────────────────────────────

  const summaryRows = [
    { "Metric": "Total Sales",          "Value": `$${totalSales.toFixed(2)}` },
    { "Metric": "Total Bookings",       "Value": totalBookings },
    { "Metric": "Tickets Sold",         "Value": ticketsSold },
    { "Metric": "Avg Booking Value",    "Value": `$${avgBookingValue.toFixed(2)}` },
    { "Metric": "Today's Revenue",      "Value": `$${todaysRevenue.toFixed(2)}` },
    { "Metric": "Most Popular Route",   "Value": mostPopularRoute },
    { "Metric": "Active Promotions",    "Value": activePromoCount ?? "—" },
    { "Metric": "New Users (this year)","Value": newUsersCount ?? "—" },
    { "Metric": "Export Date",          "Value": new Date().toLocaleString() },
  ];

  const monthlyRows = monthlyData.map((m) => ({
    "Month":    m.month,
    "Bookings": m.bookings,
    "Revenue":  `$${m.revenue.toFixed(2)}`,
  }));

  const routeRows = topRoutes.map((r) => ({
    "Route":    r.route,
    "Bookings": r.bookings,
    "Revenue":  `$${r.revenue.toFixed(2)}`,
  }));

  const vehicleRows = vehicleBreakdown.map((v) => ({
    "Vehicle Type": v.type,
    "Bookings":     v.bookings,
    "Revenue":      `$${v.revenue.toFixed(2)}`,
  }));

  const dowRows = DAY_NAMES.map((name, i) => ({
    "Day":      name,
    "Bookings": dowCounts[i],
  }));

  const handleExcelExport = () => {
    setExporting(true);
    setTimeout(() => {
      exportExcel([
        { name: "Summary",        rows: summaryRows,  colWidths: [26, 20] },
        { name: "Monthly Revenue",rows: monthlyRows,  colWidths: [16, 12, 16] },
        { name: "Top Routes",     rows: routeRows,    colWidths: [28, 12, 16] },
        { name: "By Vehicle",     rows: vehicleRows,  colWidths: [18, 12, 16] },
        { name: "By Day of Week", rows: dowRows,      colWidths: [12, 12] },
      ], `Cambodia_Bus_Reports_${todayStr}.xlsx`);
      setExporting(false);
    }, 100);
  };

  const handleCSVExport = () => {
    // Export monthly summary as CSV
    const allRows = [
      { "Sheet": "Summary",         ...summaryRows[0] },
      ...summaryRows.slice(1).map((r) => ({ "Sheet": "", ...r })),
      {},
      { "Sheet": "Monthly Revenue", "Metric": "Month", "Value": "Bookings / Revenue" },
      ...monthlyRows.map((r) => ({ "Sheet": "", "Metric": r["Month"], "Value": `${r["Bookings"]} bookings / ${r["Revenue"]}` })),
      {},
      { "Sheet": "Top Routes", "Metric": "Route", "Value": "Bookings / Revenue" },
      ...routeRows.map((r) => ({ "Sheet": "", "Metric": r["Route"], "Value": `${r["Bookings"]} bookings / ${r["Revenue"]}` })),
    ];
    exportCSV(summaryRows, `Cambodia_Bus_Summary_${todayStr}.csv`);
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
          <a onClick={() => navigate("/admin-dashboard/bookings")}><Ticket size={20} /> Bookings</a>
          <a onClick={() => navigate("/admin-dashboard/checkin")}><ClipboardCheck size={20} /> Check-In</a>
          <a onClick={() => navigate("/admin-dashboard/promotions")}><Tag size={20} /> Promotions</a>
          <a className="active"><FileBarChart size={20} /> Reports</a>
          <a onClick={() => navigate("/admin-dashboard/announcements")}><Megaphone size={20} /> Announcements</a>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div><h1>Reports</h1><p>Sales, bookings, and revenue overview.</p></div>

          {/* Export buttons */}
          <div className="mb-export-row">
            <button
              className="mb-export-btn excel"
              onClick={handleExcelExport}
              disabled={exporting || loading || bookings.length === 0}
              title="Export full report to Excel (5 sheets)"
            >
              <FileSpreadsheet size={16} />
              {exporting ? "Exporting…" : "Export Excel"}
            </button>
            <button
              className="mb-export-btn csv"
              onClick={handleCSVExport}
              disabled={loading || bookings.length === 0}
              title="Export summary to CSV"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </header>

        <section className="admin-stats">
          <div><DollarSign /><span>Total Sales</span><h3>{loading ? "—" : `$${totalSales.toFixed(2)}`}</h3></div>
          <div><CalendarCheck /><span>Total Bookings</span><h3>{loading ? "—" : totalBookings}</h3></div>
          <div><Ticket /><span>Tickets Sold</span><h3>{loading ? "—" : ticketsSold}</h3></div>
          <div><UserPlus /><span>New Users (this year)</span><h3>{newUsersCount === null ? "—" : newUsersCount}</h3></div>
        </section>

        <section className="admin-stats">
          <div><TrendingUp /><span>Avg. Booking Value</span><h3>{loading ? "—" : `$${avgBookingValue.toFixed(2)}`}</h3></div>
          <div><DollarSign /><span>Today's Revenue</span><h3>{loading ? "—" : `$${todaysRevenue.toFixed(2)}`}</h3></div>
          <div><Award /><span>Most Popular Route</span><h3 className="reports-route-stat">{loading ? "—" : mostPopularRoute}</h3></div>
          <div><Tag /><span>Active Promotions</span><h3>{activePromoCount === null ? "—" : activePromoCount}</h3></div>
        </section>

        <section className="admin-card">
          <div className="card-title">
            <h2>Monthly Revenue</h2>
            <p>{loading ? "Loading..." : `${monthlyData.length} month(s) with activity`}</p>
          </div>
          {monthlyData.length === 0 && !loading && <p className="reports-empty">No booking data yet.</p>}
          {monthlyData.length > 0 && (
            <>
              <div className="reports-chart">
                {monthlyData.map((m) => (
                  <div className="reports-bar-col" key={m.month}>
                    <div className="reports-bar-track">
                      <div className="reports-bar-fill" style={{ height: `${(m.revenue / maxRevenue) * 100}%` }} title={`$${m.revenue.toFixed(2)}`} />
                    </div>
                    <span>{m.month.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
              <div className="route-table">
                <table>
                  <thead><tr><th>Month</th><th>Bookings</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {monthlyData.map((m) => (
                      <tr key={m.month}><td>{m.month}</td><td>{m.bookings}</td><td>${m.revenue.toFixed(2)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <div className="dashboard-grid-2col">
          <section className="admin-card">
            <div className="card-title"><h2>Top Routes by Revenue</h2><p>{loading ? "Loading..." : `Top ${topRoutes.length}`}</p></div>
            {topRoutes.length === 0 && !loading && <p className="reports-empty">No route data yet.</p>}
            <div className="reports-route-list">
              {topRoutes.map((r) => (
                <div className="reports-route-row" key={r.route}>
                  <div className="reports-route-row-top"><span className="reports-route-name">{r.route}</span><span className="reports-route-revenue">${r.revenue.toFixed(2)}</span></div>
                  <div className="reports-route-bar-track"><div className="reports-route-bar-fill" style={{ width: `${(r.revenue / topRouteMaxRevenue) * 100}%` }} /></div>
                  <span className="reports-route-bookings">{r.bookings} booking(s)</span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card">
            <div className="card-title"><h2>Revenue by Vehicle Type</h2><p>{loading ? "Loading..." : `${vehicleBreakdown.length} type(s)`}</p></div>
            {vehicleBreakdown.length === 0 && !loading && <p className="reports-empty">No vehicle data yet.</p>}
            <div className="reports-route-list">
              {vehicleBreakdown.map((v) => (
                <div className="reports-route-row" key={v.type}>
                  <div className="reports-route-row-top"><span className="reports-route-name">{v.type}</span><span className="reports-route-revenue">${v.revenue.toFixed(2)}</span></div>
                  <div className="reports-route-bar-track"><div className="reports-route-bar-fill alt" style={{ width: `${(v.revenue / vehicleMaxRevenue) * 100}%` }} /></div>
                  <span className="reports-route-bookings">{v.bookings} booking(s)</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-card">
          <div className="card-title"><h2>Bookings by Day of Week</h2><p>Reveals weekly demand patterns</p></div>
          <div className="reports-dow-chart">
            {DAY_NAMES.map((name, i) => (
              <div className="reports-bar-col" key={name}>
                <div className="reports-bar-track"><div className="reports-bar-fill dow" style={{ height: `${(dowCounts[i] / maxDowCount) * 100}%` }} title={`${dowCounts[i]} booking(s)`} /></div>
                <span>{name}</span><small>{dowCounts[i]}</small>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}s