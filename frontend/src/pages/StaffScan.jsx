import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, Clock } from "lucide-react";
import "./StaffScan.css";

const WORK_START = { hour: 8, minute: 0 };
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getCambodiaDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
}
function getCambodiaTime() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "Asia/Phnom_Penh", hour12: false,
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}
function getArrivalStatus(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const diff = h * 60 + m - (WORK_START.hour * 60 + WORK_START.minute);
  if (diff <= 0)   return { level:"great",    emoji:"🎉", title:"Good Job!",         msg:"You arrived on time! Keep it up!",           color:"#1D9E75" };
  if (diff <= 5)   return { level:"careful",  emoji:"⚠️",  title:"Be Careful!",       msg:`${diff} min late. Try to be on time.`,       color:"#d97706" };
  if (diff <= 30)  return { level:"warning",  emoji:"😬", title:"Warning!",           msg:`${diff} mins late. Being noted.`,            color:"#ea580c" };
  if (diff <= 120) return { level:"boss",     emoji:"👀", title:"Boss is Watching!",  msg:`${diff} mins late! See your supervisor.`,    color:"#dc2626" };
  return             { level:"critical", emoji:"🆘", title:"Very Late!",          msg:`${Math.floor(diff/60)}h ${diff%60}m late!`, color:"#7f1d1d" };
}

// Plain fetch — no JWT, no redirect to login
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function StaffScan() {
  const [staffList, setStaffList] = useState([]);
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [clock, setClock]         = useState(getCambodiaTime());

  const [step, setStep]                   = useState("select");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionType, setActionType]       = useState(null);
  const [result, setResult]               = useState(null);
  const [processing, setProcessing]       = useState(false);

  useEffect(() => {
    const t = setInterval(() => setClock(getCambodiaTime()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const today = getCambodiaDate();
      const [s, r] = await Promise.all([
        apiFetch("/public/staff/"),
        apiFetch(`/public/staff-records/?date=${today}`),
      ]);
      setStaffList(Array.isArray(s) ? s : []);
      setRecords(Array.isArray(r) ? r : []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const handleSelectStaff = (staff) => {
    const todayRec = records.find(
      (r) => r.staff === staff.id && r.date === getCambodiaDate()
    );
    setSelectedStaff(staff);
    if (todayRec && !todayRec.check_out_time) {
      setActionType("checkout");
    } else if (todayRec?.check_out_time) {
      setResult({ type: "already", record: todayRec });
      setStep("result"); return;
    } else {
      setActionType("checkin");
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const now = getCambodiaTime().slice(0, 5);
      if (actionType === "checkin") {
        const data = await apiFetch("/public/staff-checkin/", {
          method: "POST",
          body: JSON.stringify({ staff: selectedStaff.id, date: getCambodiaDate(), check_in_time: now }),
        });
        setResult({ type: "checkin", record: data, status: getArrivalStatus(now) });
      } else {
        const todayRec = records.find(
          (r) => r.staff === selectedStaff.id && r.date === getCambodiaDate()
        );
        const data = await apiFetch(`/public/staff-checkout/${todayRec.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ check_out_time: now }),
        });
        setResult({ type: "checkout", record: data });
      }
      setStep("result");
      fetchAll();
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setStep("select"); setSelectedStaff(null);
    setActionType(null); setResult(null); setProcessing(false);
  };

  const getStaffStatus = (staff) => {
    const rec = records.find((r) => r.staff === staff.id && r.date === getCambodiaDate());
    if (!rec) return "absent";
    if (!rec.check_out_time) return "in";
    return "out";
  };

  const todayRec = (staff) =>
    records.find((r) => r.staff === staff.id && r.date === getCambodiaDate());

  return (
    <div className="ss-page">
      <header className="ss-header">
        <div className="ss-header-logo">
          <div className="ss-header-bus">🚌</div>
          <div>
            <h1>Cambodia Bus Express</h1>
            <p>Staff Attendance System</p>
          </div>
        </div>
        <div className="ss-clock">{clock}</div>
      </header>

      {/* SELECT NAME */}
      {step === "select" && (
        <div className="ss-body">
          <div className="ss-title-row">
            <h2>Tap Your Name</h2>
            <p>Select your name to check in or check out</p>
          </div>
          {loading ? (
            <div className="ss-loading"><div className="ss-spinner"/><span>Loading…</span></div>
          ) : staffList.length === 0 ? (
            <div className="ss-empty">No staff registered. Contact your admin.</div>
          ) : (
            <div className="ss-staff-grid">
              {staffList.map((staff) => {
                const status = getStaffStatus(staff);
                const rec    = todayRec(staff);
                return (
                  <button key={staff.id} className={`ss-staff-btn ${status}`} onClick={() => handleSelectStaff(staff)}>
                    <div className="ss-staff-av">{staff.name[0].toUpperCase()}</div>
                    <div className="ss-staff-info">
                      <span className="ss-staff-name">{staff.name}</span>
                      <span className="ss-staff-role">{staff.role}</span>
                    </div>
                    <div className="ss-staff-badge">
                      {status === "in"     && <span className="ss-badge in"><CheckCircle2 size={13}/> In · {rec?.check_in_time?.slice(0,5)}</span>}
                      {status === "out"    && <span className="ss-badge out"><LogOut size={13}/> Done today</span>}
                      {status === "absent" && <span className="ss-badge absent"><Clock size={13}/> Tap to Check In</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <p className="ss-footer-note">{getCambodiaDate()} · Work starts {String(WORK_START.hour).padStart(2,"0")}:{String(WORK_START.minute).padStart(2,"0")} AM</p>
        </div>
      )}

      {/* CONFIRM */}
      {step === "confirm" && selectedStaff && (
        <div className="ss-body ss-center">
          <div className="ss-confirm-card">
            <div className="ss-confirm-av">{selectedStaff.name[0].toUpperCase()}</div>
            <h2>{selectedStaff.name}</h2>
            <p className="ss-confirm-role">{selectedStaff.role}</p>
            <div className="ss-confirm-time">{clock}</div>
            <div className={`ss-confirm-action-label ${actionType}`}>
              {actionType === "checkin" ? "✅ Check In" : "👋 Check Out"}
            </div>
            <div className="ss-confirm-btns">
              <button className="ss-back-btn" onClick={reset}>← Back</button>
              <button className={`ss-confirm-btn ${actionType}`} onClick={handleConfirm} disabled={processing}>
                {processing ? "Please wait…" : actionType === "checkin" ? "Confirm Check-In" : "Confirm Check-Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT */}
      {step === "result" && result && selectedStaff && (
        <div className="ss-body ss-center">
          <div className="ss-result-card">
            {result.type === "checkin" && (<>
              <div className={`ss-result-emoji ${result.status.level}`}>{result.status.emoji}</div>
              <h2 style={{color:result.status.color}}>{result.status.title}</h2>
              <p className="ss-result-name">{selectedStaff.name} · {selectedStaff.role}</p>
              <div className="ss-result-times">
                <div><span>Checked In</span><strong>{result.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Work Starts</span><strong>{String(WORK_START.hour).padStart(2,"0")}:{String(WORK_START.minute).padStart(2,"0")}</strong></div>
              </div>
              <p className="ss-result-msg" style={{color:result.status.color}}>{result.status.msg}</p>
            </>)}
            {result.type === "checkout" && (<>
              <div className="ss-result-emoji great">👋</div>
              <h2>See You Tomorrow!</h2>
              <p className="ss-result-name">{selectedStaff.name} · {selectedStaff.role}</p>
              <div className="ss-result-times">
                <div><span>Checked In</span><strong>{result.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Checked Out</span><strong>{result.record.check_out_time?.slice(0,5)}</strong></div>
              </div>
            </>)}
            {result.type === "already" && (<>
              <div className="ss-result-emoji great">✅</div>
              <h2>Already Done Today</h2>
              <p className="ss-result-name">{selectedStaff.name} already completed today.</p>
              <div className="ss-result-times">
                <div><span>In</span><strong>{result.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Out</span><strong>{result.record.check_out_time?.slice(0,5)}</strong></div>
              </div>
            </>)}
            <button className="ss-done-btn" onClick={reset}>← Back to Staff List</button>
          </div>
        </div>
      )}
    </div>
  );
}