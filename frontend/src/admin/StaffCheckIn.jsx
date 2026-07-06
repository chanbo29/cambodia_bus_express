import { useEffect, useRef, useState } from "react";
import {
  Bus, MapPin, Ticket, ClipboardCheck, Tag,
  FileBarChart, Megaphone, QrCode, UserCheck,
  Clock, CheckCircle2, LogOut, AlertTriangle,
  Smile, ShieldAlert, Eye, EyeOff, UserPlus,
  Trash2, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";
import "./StaffCheckIn.css";

// ── Status logic ───────────────────────────────────────────────
const WORK_START = { hour: 7, minute: 0 };

function getCambodiaDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
}

function getCambodiaTime() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "Asia/Phnom_Penh",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getCambodiaNow() {
  const str = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Phnom_Penh", hour12: false,
  });
  return new Date(str);
}

function getArrivalStatus(checkInTimeStr) {
  if (!checkInTimeStr) return null;
  const [h, m] = checkInTimeStr.split(":").map(Number);
  const workStart = WORK_START.hour * 60 + WORK_START.minute;
  const arrivalMinutes = h * 60 + m;
  const diff = arrivalMinutes - workStart; // positive = late

  if (diff <= 0)  return { level: "great",    emoji: "🎉", title: "Good Job!", msg: "You arrived on time. Keep it up!", color: "#1D9E75" };
  if (diff <= 5)  return { level: "careful",  emoji: "⚠️", title: "Be Careful!", msg: `You're ${diff} minute${diff>1?"s":""} late. Please try to be on time.`, color: "#d97706" };
  if (diff <= 30) return { level: "warning",  emoji: "😬", title: "Warning!", msg: `You're ${diff} minutes late. This is being noted.`, color: "#ea580c" };
  if (diff <= 120)return { level: "boss",     emoji: "👀", title: "Boss is Watching!", msg: `You're ${diff} minutes late. Please see your supervisor.`, color: "#dc2626" };
  return             { level: "critical",   emoji: "🆘", title: "Very Late!", msg: `You're ${Math.floor(diff/60)}h ${diff%60}m late. Report to management immediately.`, color: "#7f1d1d" };
}

export default function StaffCheckIn() {
  const navigate = useNavigate();

  // Barcode input
  const barcodeRef      = useRef(null);
  const [barcode, setBarcode]       = useState("");
  const [barcodeBuffer, setBarcodeBuffer] = useState("");

  // Staff list & check-in records
  const [staffList, setStaffList]   = useState([]);
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);

  // Modal state
  const [modal, setModal]           = useState(null); // null | "checkin" | "checkout" | "status" | "addstaff"
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [statusResult, setStatusResult]   = useState(null);
  const [clock, setClock]           = useState(getCambodiaTime());

  // Add staff form
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffBarcode, setNewStaffBarcode] = useState("");
  const [newStaffRole, setNewStaffRole]   = useState("Staff");

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(getCambodiaTime()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-focus barcode input
  useEffect(() => {
    barcodeRef.current?.focus();
  }, [modal]);

  // Load staff + records
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [staffRes, recordsRes] = await Promise.all([
        API.get("/staff/"),
        API.get("/staff-records/"),
      ]);
      setStaffList(Array.isArray(staffRes.data) ? staffRes.data : []);
      setRecords(Array.isArray(recordsRes.data) ? recordsRes.data : []);
    } catch (err) {
      console.log("Staff API not ready:", err);
    } finally {
      setLoading(false);
    }
  };

  // Barcode scanner — most scanners send keys fast then Enter
  useEffect(() => {
    let buffer = "";
    let timer  = null;

    const handleKey = (e) => {
      if (modal) return; // don't intercept when modal is open
      if (e.key === "Enter") {
        if (buffer.length > 2) handleBarcodeScanned(buffer);
        buffer = "";
        clearTimeout(timer);
      } else if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { buffer = ""; }, 200);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modal, staffList]);

  const handleBarcodeScanned = (code) => {
    const staff = staffList.find(
      (s) => s.barcode === code || s.barcode === code.trim()
    );
    if (staff) {
      setSelectedStaff(staff);
      const todayRecord = records.find(
        (r) => r.staff === staff.id && r.date === getCambodiaDate()
      );
      if (todayRecord && !todayRecord.check_out_time) {
        setModal("checkout");
      } else if (todayRecord && todayRecord.check_out_time) {
        setModal("status");
        setStatusResult({ type: "already", record: todayRecord });
      } else {
        setModal("checkin");
      }
    } else {
      setModal("notfound");
    }
    setBarcode("");
  };

  const handleManualScan = () => {
    if (barcode.trim()) handleBarcodeScanned(barcode.trim());
  };

  const doCheckIn = async () => {
    if (!selectedStaff) return;
    try {
      const now = getCambodiaTime().slice(0, 5); // HH:MM
      const res = await API.post("/staff-records/", {
        staff: selectedStaff.id,
        date:  getCambodiaDate(),
        check_in_time: now,
      });
      const status = getArrivalStatus(now);
      setStatusResult({ type: "checkin", record: res.data, status });
      setModal("status");
      fetchAll();
    } catch (err) {
      alert("Check-in failed: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  const doCheckOut = async () => {
    if (!selectedStaff) return;
    try {
      const todayRecord = records.find(
        (r) => r.staff === selectedStaff.id && r.date === getCambodiaDate()
      );
      if (!todayRecord) return;
      const now = getCambodiaTime().slice(0, 5);
      const res = await API.patch(`/staff-records/${todayRecord.id}/`, {
        check_out_time: now,
      });
      setStatusResult({ type: "checkout", record: res.data });
      setModal("status");
      fetchAll();
    } catch (err) {
      alert("Check-out failed: " + err.message);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffBarcode.trim()) {
      alert("Name and barcode are required."); return;
    }
    try {
      await API.post("/staff/", {
        name: newStaffName.trim(),
        barcode: newStaffBarcode.trim(),
        role: newStaffRole,
      });
      setNewStaffName(""); setNewStaffBarcode(""); setNewStaffRole("Staff");
      setModal(null);
      fetchAll();
    } catch (err) {
      alert("Failed to add staff: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!confirm("Delete this staff member?")) return;
    try { await API.delete(`/staff/${id}/`); fetchAll(); }
    catch { alert("Failed to delete."); }
  };

  const todayRecords = records.filter((r) => r.date === getCambodiaDate());

  const closeModal = () => {
    setModal(null);
    setSelectedStaff(null);
    setStatusResult(null);
    setTimeout(() => barcodeRef.current?.focus(), 100);
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
          <a className="active"><ClipboardCheck size={20} /> Check-In</a>
          <a onClick={() => navigate("/admin-dashboard/promotions")}><Tag size={20} /> Promotions</a>
          <a onClick={() => navigate("/admin-dashboard/reports")}><FileBarChart size={20} /> Reports</a>
          <a onClick={() => navigate("/admin-dashboard/announcements")}><Megaphone size={20} /> Announcements</a>
        </nav>
      </aside>

      <main className="admin-main sci-main">
        {/* ── Header ── */}
        <header className="admin-header">
          <div>
            <h1>Staff Check-In / Check-Out</h1>
            <p>Scan barcode to record attendance. Work starts at {WORK_START.hour}:{String(WORK_START.minute).padStart(2,"0")} AM.</p>
          </div>
          <div className="sci-header-right">
            <div className="sci-clock">{clock}</div>
            <button className="sci-add-btn" onClick={() => setModal("addstaff")}>
              <UserPlus size={16} /> Add Staff
            </button>
          </div>
        </header>

        {/* ── Scan area ── */}
        <div className="sci-scan-card">
          <div className="sci-scan-icon"><QrCode size={48} /></div>
          <h2>Scan Staff Barcode</h2>
          <p>Point barcode scanner at the staff ID card, or type manually below</p>
          <div className="sci-scan-input-row">
            <input
              ref={barcodeRef}
              className="sci-scan-input"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualScan()}
              placeholder="Scan or type barcode..."
              autoFocus
            />
            <button className="sci-scan-btn" onClick={handleManualScan}>
              Check In / Out
            </button>
          </div>
          <p className="sci-scan-hint">
            Scanner auto-detected · Press Enter to submit manually
          </p>
        </div>

        {/* ── Stats ── */}
        <section className="admin-stats" style={{ marginTop: 20 }}>
          <div><UserCheck /><span>Total Staff</span><h3>{staffList.length}</h3></div>
          <div><CheckCircle2 /><span>Checked In Today</span><h3>{todayRecords.filter((r) => r.check_in_time && !r.check_out_time).length}</h3></div>
          <div><LogOut /><span>Checked Out Today</span><h3>{todayRecords.filter((r) => r.check_out_time).length}</h3></div>
          <div><AlertTriangle /><span>Late Today</span><h3>{todayRecords.filter((r) => { const s = getArrivalStatus(r.check_in_time?.slice(0,5)); return s && s.level !== "great"; }).length}</h3></div>
        </section>

        {/* ── Today's attendance ── */}
        <section className="admin-card" style={{ marginTop: 20 }}>
          <div className="card-title">
            <h2>Today's Attendance — {getCambodiaDate()}</h2>
            <p>{loading ? "Loading..." : `${todayRecords.length} record(s)`}</p>
          </div>
          <div className="route-table">
            <table>
              <thead>
                <tr>
                  <th>Staff</th><th>Role</th><th>Check In</th>
                  <th>Check Out</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => {
                  const rec    = todayRecords.find((r) => r.staff === staff.id);
                  const status = rec ? getArrivalStatus(rec.check_in_time?.slice(0,5)) : null;
                  return (
                    <tr key={staff.id}>
                      <td><strong>{staff.name}</strong></td>
                      <td>{staff.role}</td>
                      <td>{rec?.check_in_time?.slice(0,5) || <span className="sci-absent">—</span>}</td>
                      <td>{rec?.check_out_time?.slice(0,5) || (rec ? <span className="sci-working">Working…</span> : <span className="sci-absent">—</span>)}</td>
                      <td>
                        {status ? (
                          <span className={`sci-status-badge ${status.level}`}>
                            {status.emoji} {status.title}
                          </span>
                        ) : (
                          <span className="sci-status-badge absent">Not arrived</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {staffList.length === 0 && !loading && (
                  <tr><td colSpan="5" className="empty-table">No staff registered yet. Click "Add Staff" to begin.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Staff management ── */}
        <section className="admin-card" style={{ marginTop: 20 }}>
          <div className="card-title">
            <h2>Staff List</h2>
            <button className="sci-add-btn small" onClick={() => setModal("addstaff")}>
              <UserPlus size={14} /> Add
            </button>
          </div>
          <div className="sci-staff-grid">
            {staffList.map((staff) => (
              <div key={staff.id} className="sci-staff-card">
                <div className="sci-staff-avatar">{staff.name[0].toUpperCase()}</div>
                <div className="sci-staff-info">
                  <h4>{staff.name}</h4>
                  <p>{staff.role}</p>
                  <code>{staff.barcode}</code>
                </div>
                <button className="sci-delete-btn" onClick={() => handleDeleteStaff(staff.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {staffList.length === 0 && !loading && (
              <p className="sci-empty">No staff added yet.</p>
            )}
          </div>
        </section>
      </main>

      {/* ══ MODALS ══════════════════════════════════════════════ */}

      {/* Check-In modal */}
      {modal === "checkin" && selectedStaff && (
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18} /></button>
            <div className="sci-modal-avatar">{selectedStaff.name[0].toUpperCase()}</div>
            <h2>{selectedStaff.name}</h2>
            <p className="sci-modal-role">{selectedStaff.role}</p>
            <div className="sci-modal-time">{clock}</div>
            <p className="sci-modal-label">Confirm Check-In?</p>
            <div className="sci-modal-actions">
              <button className="sci-cancel" onClick={closeModal}>Cancel</button>
              <button className="sci-confirm checkin" onClick={doCheckIn}>
                <CheckCircle2 size={18} /> Check In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-Out modal */}
      {modal === "checkout" && selectedStaff && (
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18} /></button>
            <div className="sci-modal-avatar checkout">{selectedStaff.name[0].toUpperCase()}</div>
            <h2>{selectedStaff.name}</h2>
            <p className="sci-modal-role">{selectedStaff.role}</p>
            <div className="sci-modal-time">{clock}</div>
            <p className="sci-modal-label">Already checked in. Confirm Check-Out?</p>
            <div className="sci-modal-actions">
              <button className="sci-cancel" onClick={closeModal}>Cancel</button>
              <button className="sci-confirm checkout" onClick={doCheckOut}>
                <LogOut size={18} /> Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status result modal */}
      {modal === "status" && statusResult && selectedStaff && (
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal status-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18} /></button>

            {statusResult.type === "checkin" && (
              <>
                <div className={`sci-status-emoji ${statusResult.status.level}`}>
                  {statusResult.status.emoji}
                </div>
                <h2 style={{ color: statusResult.status.color }}>
                  {statusResult.status.title}
                </h2>
                <p className="sci-modal-role">{selectedStaff.name} · {selectedStaff.role}</p>
                <div className="sci-status-time-box">
                  <div>
                    <span>Checked In</span>
                    <strong>{statusResult.record.check_in_time?.slice(0,5)}</strong>
                  </div>
                  <div>
                    <span>Work Starts</span>
                    <strong>{String(WORK_START.hour).padStart(2,"0")}:{String(WORK_START.minute).padStart(2,"0")}</strong>
                  </div>
                </div>
                <p className="sci-status-msg" style={{ color: statusResult.status.color }}>
                  {statusResult.status.msg}
                </p>
                <button className="sci-confirm checkin" onClick={closeModal} style={{ marginTop: 16 }}>
                  Done
                </button>
              </>
            )}

            {statusResult.type === "checkout" && (
              <>
                <div className="sci-status-emoji great">👋</div>
                <h2>See You Tomorrow!</h2>
                <p className="sci-modal-role">{selectedStaff.name} · {selectedStaff.role}</p>
                <div className="sci-status-time-box">
                  <div>
                    <span>Checked In</span>
                    <strong>{statusResult.record.check_in_time?.slice(0,5)}</strong>
                  </div>
                  <div>
                    <span>Checked Out</span>
                    <strong>{statusResult.record.check_out_time?.slice(0,5)}</strong>
                  </div>
                </div>
                <button className="sci-confirm checkout" onClick={closeModal} style={{ marginTop: 16 }}>
                  Done
                </button>
              </>
            )}

            {statusResult.type === "already" && (
              <>
                <div className="sci-status-emoji great">✅</div>
                <h2>Already Completed</h2>
                <p className="sci-modal-role">{selectedStaff.name} has already checked in and out today.</p>
                <div className="sci-status-time-box">
                  <div><span>In</span><strong>{statusResult.record.check_in_time?.slice(0,5)}</strong></div>
                  <div><span>Out</span><strong>{statusResult.record.check_out_time?.slice(0,5)}</strong></div>
                </div>
                <button className="sci-confirm checkin" onClick={closeModal} style={{ marginTop: 16 }}>OK</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Not found modal */}
      {modal === "notfound" && (
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18} /></button>
            <div className="sci-status-emoji" style={{ fontSize: 48 }}>❓</div>
            <h2>Staff Not Found</h2>
            <p className="sci-modal-role">This barcode is not registered. Please add the staff member first.</p>
            <div className="sci-modal-actions">
              <button className="sci-cancel" onClick={closeModal}>Cancel</button>
              <button className="sci-confirm checkin" onClick={() => setModal("addstaff")}>
                <UserPlus size={16} /> Add Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add staff modal */}
      {modal === "addstaff" && (
        <div className="sci-overlay" onClick={closeModal}>
          <div className="sci-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sci-modal-close" onClick={closeModal}><X size={18} /></button>
            <h2>Add Staff Member</h2>
            <form className="sci-add-form" onSubmit={handleAddStaff}>
              <label>Full Name *</label>
              <input value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="e.g. Sokha Chan" />
              <label>Barcode / ID *</label>
              <input value={newStaffBarcode} onChange={(e) => setNewStaffBarcode(e.target.value)} placeholder="e.g. STAFF001" />
              <label>Role</label>
              <select value={newStaffRole} onChange={(e) => setNewStaffRole(e.target.value)}>
                <option>Staff</option>
                <option>Driver</option>
                <option>Cashier</option>
                <option>Manager</option>
                <option>Security</option>
                <option>Cleaner</option>
              </select>
              <div className="sci-modal-actions" style={{ marginTop: 16 }}>
                <button type="button" className="sci-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="sci-confirm checkin">
                  <UserPlus size={16} /> Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}