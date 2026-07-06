import { useEffect, useState } from "react";
import {
  Bus, MapPin, Ticket, ClipboardCheck, Tag,
  FileBarChart, Megaphone, Calendar, Search,
  Download, FileSpreadsheet, CheckCircle2,
  LogOut, Clock, AlertTriangle, X, Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import API from "../services/api";
import "./Dashboard.css";
import "./StaffReport.css";

const WORK_START = { hour: 8, minute: 0 };

function getStatus(rec) {
  if (!rec) return { level:"absent", label:"Absent", color:"#9FB8AE" };
  const t    = rec.check_in_time?.slice(0,5);
  if (!t)    return { level:"absent", label:"Absent", color:"#9FB8AE" };
  const [h,m]= t.split(":").map(Number);
  const diff = h*60+m - (WORK_START.hour*60+WORK_START.minute);
  if (diff <= 0)   return { level:"great",    label:"On Time",          color:"#1D9E75" };
  if (diff <= 5)   return { level:"careful",  label:`Late ${diff}m`,    color:"#d97706" };
  if (diff <= 30)  return { level:"warning",  label:`Late ${diff}m`,    color:"#ea580c" };
  if (diff <= 120) return { level:"boss",     label:`Late ${diff}m`,    color:"#dc2626" };
  return               { level:"critical", label:`Late ${Math.floor(diff/60)}h${diff%60}m`, color:"#7f1d1d" };
}

function calcHours(rec) {
  if (!rec?.check_in_time || !rec?.check_out_time) return null;
  const [ih,im] = rec.check_in_time.slice(0,5).split(":").map(Number);
  const [oh,om] = rec.check_out_time.slice(0,5).split(":").map(Number);
  const mins = (oh*60+om) - (ih*60+im);
  if (mins <= 0) return null;
  return `${Math.floor(mins/60)}h ${String(mins%60).padStart(2,"0")}m`;
}

function getCambodiaDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
}

export default function StaffReport() {
  const navigate = useNavigate();
  const [staffList, setStaffList]   = useState([]);
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [dateFilter, setDateFilter] = useState(getCambodiaDate());
  const [statusFilter, setStatusFilter] = useState("all");
  const [exporting, setExporting]   = useState(false);

  useEffect(() => { fetchAll(); }, [dateFilter]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        API.get("/staff/"),
        API.get(`/staff-records/?date=${dateFilter}`),
      ]);
      setStaffList(Array.isArray(s.data) ? s.data : []);
      setRecords(Array.isArray(r.data) ? r.data : []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const getRecordForStaff = (staff) =>
    records.find((r) => r.staff === staff.id);

  // Build display rows
  const rows = staffList.map((staff) => {
    const rec    = getRecordForStaff(staff);
    const status = getStatus(rec);
    return {
      staff,
      rec,
      status,
      hours: calcHours(rec),
    };
  });

  // Filter
  const filtered = rows.filter((row) => {
    const matchSearch =
      row.staff.name.toLowerCase().includes(search.toLowerCase()) ||
      row.staff.role.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "present" && row.rec?.check_in_time) ||
      (statusFilter === "absent"  && !row.rec?.check_in_time) ||
      (statusFilter === "late"    && ["careful","warning","boss","critical"].includes(row.status.level)) ||
      (statusFilter === "checkout"&& row.rec?.check_out_time);
    return matchSearch && matchStatus;
  });

  // Summary counts
  const total    = rows.length;
  const present  = rows.filter((r) => r.rec?.check_in_time).length;
  const absent   = total - present;
  const onTime   = rows.filter((r) => r.status.level === "great").length;
  const late     = rows.filter((r) => ["careful","warning","boss","critical"].includes(r.status.level)).length;
  const checkedOut = rows.filter((r) => r.rec?.check_out_time).length;

  // Excel export
  const handleExcelExport = () => {
    setExporting(true);
    setTimeout(() => {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryRows = [
        { "Metric": "Date",        "Value": dateFilter },
        { "Metric": "Total Staff", "Value": total },
        { "Metric": "Present",     "Value": present },
        { "Metric": "Absent",      "Value": absent },
        { "Metric": "On Time",     "Value": onTime },
        { "Metric": "Late",        "Value": late },
        { "Metric": "Checked Out", "Value": checkedOut },
        { "Metric": "Export Time", "Value": new Date().toLocaleString() },
      ];
      const ws1 = XLSX.utils.json_to_sheet(summaryRows);
      ws1["!cols"] = [{ wch: 20 }, { wch: 16 }];
      styleSheet(ws1, "#04342C");
      XLSX.utils.book_append_sheet(wb, ws1, "Summary");

      // Attendance sheet
      const attRows = rows.map((row) => ({
        "Name":          row.staff.name,
        "Role":          row.staff.role,
        "Check In":      row.rec?.check_in_time?.slice(0,5) || "—",
        "Check Out":     row.rec?.check_out_time?.slice(0,5) || "—",
        "Hours Worked":  row.hours || "—",
        "Status":        row.status.label,
        "Date":          dateFilter,
      }));
      const ws2 = XLSX.utils.json_to_sheet(attRows);
      ws2["!cols"] = [{ wch:22 },{ wch:14 },{ wch:12 },{ wch:12 },{ wch:14 },{ wch:18 },{ wch:12 }];
      styleSheet(ws2, "#04342C");
      XLSX.utils.book_append_sheet(wb, ws2, "Attendance");

      XLSX.writeFile(wb, `Staff_Attendance_${dateFilter}.xlsx`, { bookType:"xlsx", cellStyles:true });
      setExporting(false);
    }, 100);
  };

  function styleSheet(ws, headerColor) {
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r:0, c });
      if (!ws[addr]) continue;
      ws[addr].s = { font:{ bold:true, color:{ rgb:"FFFFFF" }, sz:11 }, fill:{ fgColor:{ rgb: headerColor.replace("#","") } }, alignment:{ horizontal:"center" } };
    }
    for (let r = 1; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) continue;
        ws[addr].s = { fill:{ fgColor:{ rgb: r%2===0?"F4FAF7":"FFFFFF" } }, alignment:{ horizontal:"left" } };
      }
    }
  }

  const handleCSVExport = () => {
    const csvRows = rows.map((row) => ({
      Name:         row.staff.name,
      Role:         row.staff.role,
      Date:         dateFilter,
      "Check In":   row.rec?.check_in_time?.slice(0,5) || "",
      "Check Out":  row.rec?.check_out_time?.slice(0,5) || "",
      "Hours":      row.hours || "",
      Status:       row.status.label,
    }));
    const keys = Object.keys(csvRows[0]);
    const csv  = [keys.join(","), ...csvRows.map((r) =>
      keys.map((k) => `"${String(r[k]).replace(/"/g,'""')}"`).join(",")
    )].join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `Staff_Attendance_${dateFilter}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-logo"><div><Bus size={32}/></div><section><h2>Cambodia Bus</h2><p>Admin Panel</p></section></div>
        <nav>
          <a onClick={()=>navigate("/admin-dashboard")}><Bus size={20}/> Dashboard</a>
          <a onClick={()=>navigate("/admin-dashboard/routes")}><MapPin size={20}/> Routes</a>
          <a onClick={()=>navigate("/admin-dashboard/bookings")}><Ticket size={20}/> Bookings</a>
          <a onClick={()=>navigate("/admin-dashboard/checkin")}><ClipboardCheck size={20}/> Check-In</a>
          <a onClick={()=>navigate("/admin-dashboard/promotions")}><Tag size={20}/> Promotions</a>
          <a className="active"><FileBarChart size={20}/> Reports</a>
          <a onClick={()=>navigate("/admin-dashboard/announcements")}><Megaphone size={20}/> Announcements</a>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Staff Attendance Report</h1>
            <p>View and export daily staff check-in / check-out records.</p>
          </div>
          <div className="sr-export-row">
            <button className="mb-export-btn excel" onClick={handleExcelExport} disabled={exporting||loading}>
              <FileSpreadsheet size={15}/> {exporting?"Exporting…":"Excel"}
            </button>
            <button className="mb-export-btn csv" onClick={handleCSVExport} disabled={loading}>
              <Download size={15}/> CSV
            </button>
          </div>
        </header>

        {/* Stats */}
        <section className="admin-stats">
          <div><Users/><span>Total Staff</span><h3>{total}</h3></div>
          <div><CheckCircle2/><span>Present</span><h3>{present}</h3></div>
          <div><AlertTriangle/><span>Absent</span><h3>{absent}</h3></div>
          <div><Clock/><span>Late</span><h3>{late}</h3></div>
          <div><LogOut/><span>Checked Out</span><h3>{checkedOut}</h3></div>
          <div><CheckCircle2 style={{color:"#1D9E75"}}/><span>On Time</span><h3>{onTime}</h3></div>
        </section>

        {/* Filters */}
        <section className="admin-card" style={{marginTop:20}}>
          <div className="card-title">
            <h2>Daily Attendance</h2>
            <p>{loading?"Loading...":`${filtered.length} staff`}</p>
          </div>

          <div className="sr-filters">
            {/* Date picker */}
            <div className="sr-date-row">
              <Calendar size={15}/>
              <input type="date" value={dateFilter} onChange={(e)=>setDateFilter(e.target.value)} className="sr-date-input"/>
              <button className="sr-today-btn" onClick={()=>setDateFilter(getCambodiaDate())}>Today</button>
            </div>

            {/* Search */}
            <div className="sr-search">
              <Search size={15}/>
              <input
                placeholder="Search name or role…"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                className="sr-search-input"
              />
              {search && <button className="sr-clear" onClick={()=>setSearch("")}><X size={13}/></button>}
            </div>

            {/* Status filter */}
            <div className="sr-status-tabs">
              {["all","present","absent","late","checkout"].map((f) => (
                <button key={f} className={statusFilter===f?"active":""} onClick={()=>setStatusFilter(f)}>
                  {f==="all"?"All":f==="present"?"Present":f==="absent"?"Absent":f==="late"?"Late":"Checked Out"}
                </button>
              ))}
            </div>
          </div>

          <div className="route-table">
            <table>
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Role</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ staff, rec, status, hours }) => (
                  <tr key={staff.id}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div className="sr-av">{staff.name[0].toUpperCase()}</div>
                        <strong>{staff.name}</strong>
                      </div>
                    </td>
                    <td>{staff.role}</td>
                    <td>
                      {rec?.check_in_time
                        ? <span className="sr-time in">{rec.check_in_time.slice(0,5)}</span>
                        : <span className="sr-dash">—</span>}
                    </td>
                    <td>
                      {rec?.check_out_time
                        ? <span className="sr-time out">{rec.check_out_time.slice(0,5)}</span>
                        : rec?.check_in_time
                          ? <span className="sr-working">Working…</span>
                          : <span className="sr-dash">—</span>}
                    </td>
                    <td>{hours || <span className="sr-dash">—</span>}</td>
                    <td>
                      <span className={`sr-status-badge ${status.level}`}>
                        {status.level==="great"    && "✅ "}
                        {status.level==="careful"  && "⚠️ "}
                        {status.level==="warning"  && "😬 "}
                        {status.level==="boss"     && "👀 "}
                        {status.level==="critical" && "🆘 "}
                        {status.level==="absent"   && "❌ "}
                        {status.label}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan="6" className="empty-table">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}