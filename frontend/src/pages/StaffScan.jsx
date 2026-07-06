import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, Clock, X, Delete } from "lucide-react";
import API from "../services/api";
import "./StaffScan.css";

const WORK_START = { hour: 21, minute: 0 };
const SCAN_URL   = "https://cambodia-bus-express.vercel.app/staff-scan";

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
  const diff   = h * 60 + m - (WORK_START.hour * 60 + WORK_START.minute);
  if (diff <= 0)   return { level:"great",    emoji:"🎉", title:"Good Job!",        msg:"You arrived on time!",                          color:"#1D9E75" };
  if (diff <= 5)   return { level:"careful",  emoji:"⚠️",  title:"Be Careful!",      msg:`${diff} minute${diff>1?"s":""} late.`,          color:"#d97706" };
  if (diff <= 30)  return { level:"warning",  emoji:"😬", title:"Warning!",          msg:`${diff} minutes late. Being noted.`,            color:"#ea580c" };
  if (diff <= 120) return { level:"boss",     emoji:"👀", title:"Boss is Watching!", msg:`${diff} minutes late! See your supervisor.`,    color:"#dc2626" };
  return             { level:"critical", emoji:"🆘", title:"Very Late!",        msg:`${Math.floor(diff/60)}h ${diff%60}m late!`,     color:"#7f1d1d" };
}

const PIN_KEYS = ["1","2","3","4","5","6","7","8","9","clear","0","del"];

export default function StaffScan() {
  const [staffList, setStaffList]   = useState([]);
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [clock, setClock]           = useState(getCambodiaTime());

  // Step: "select" | "pin" | "result"
  const [step, setStep]               = useState("select");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionType, setActionType]       = useState(null); // "checkin" | "checkout"
  const [result, setResult]               = useState(null);

  // PIN
  const [pin, setPin]         = useState("");
  const [pinError, setPinError] = useState("");
  const [pinShake, setPinShake] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setClock(getCambodiaTime()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        API.get("/staff/"),
        API.get("/staff-records/"),
      ]);
      setStaffList(Array.isArray(s.data) ? s.data : []);
      setRecords(Array.isArray(r.data) ? r.data : []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const handleSelectStaff = (staff) => {
    setSelectedStaff(staff);
    setPin(""); setPinError("");
    const todayRec = records.find(
      (r) => r.staff === staff.id && r.date === getCambodiaDate()
    );
    if (todayRec && !todayRec.check_out_time) {
      setActionType("checkout");
    } else if (todayRec?.check_out_time) {
      setResult({ type: "already", record: todayRec });
      setStep("result"); return;
    } else {
      setActionType("checkin");
    }
    setStep("pin");
  };

  const handlePinKey = (key) => {
    setPinError("");
    if (key === "clear") { setPin(""); return; }
    if (key === "del")   { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    setPin((p) => p + key);
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) { setPinError("Please enter all 4 digits."); return; }
    if (pin !== selectedStaff.pin) {
      setPinError("❌ Wrong PIN. Try again.");
      setPinShake(true);
      setTimeout(() => setPinShake(false), 500);
      setPin(""); return;
    }
    if (actionType === "checkin") await doCheckIn();
    else await doCheckOut();
  };

  const doCheckIn = async () => {
    try {
      const now = getCambodiaTime().slice(0, 5);
      const res = await API.post("/staff-records/", {
        staff: selectedStaff.id, date: getCambodiaDate(), check_in_time: now,
      });
      setResult({ type: "checkin", record: res.data, status: getArrivalStatus(now) });
      setStep("result"); fetchAll();
    } catch (err) {
      alert("Check-in failed: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const doCheckOut = async () => {
    try {
      const todayRec = records.find(
        (r) => r.staff === selectedStaff.id && r.date === getCambodiaDate()
      );
      if (!todayRec) return;
      const now = getCambodiaTime().slice(0, 5);
      const res = await API.patch(`/staff-records/${todayRec.id}/`, { check_out_time: now });
      setResult({ type: "checkout", record: res.data });
      setStep("result"); fetchAll();
    } catch (err) { alert("Check-out failed: " + err.message); }
  };

  const reset = () => {
    setStep("select"); setSelectedStaff(null);
    setActionType(null); setResult(null);
    setPin(""); setPinError("");
  };

  const todayRec = (staff) =>
    records.find((r) => r.staff === staff.id && r.date === getCambodiaDate());

  const getStaffStatus = (staff) => {
    const rec = todayRec(staff);
    if (!rec) return "absent";
    if (rec.check_in_time && !rec.check_out_time) return "in";
    if (rec.check_out_time) return "out";
    return "absent";
  };

  /* ── Render ── */
  return (
    <div className="ss-page">

      {/* Header */}
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

      {/* ══ STEP: SELECT NAME ══ */}
      {step === "select" && (
        <div className="ss-body">
          <div className="ss-title-row">
            <h2>Select Your Name</h2>
            <p>Tap your name to check in or check out</p>
          </div>

          {loading ? (
            <div className="ss-loading">
              <div className="ss-spinner" />
              <span>Loading staff list…</span>
            </div>
          ) : staffList.length === 0 ? (
            <div className="ss-empty">No staff registered yet. Contact your admin.</div>
          ) : (
            <div className="ss-staff-grid">
              {staffList.map((staff) => {
                const status = getStaffStatus(staff);
                const rec    = todayRec(staff);
                return (
                  <button
                    key={staff.id}
                    className={`ss-staff-btn ${status}`}
                    onClick={() => handleSelectStaff(staff)}
                  >
                    <div className="ss-staff-av">{staff.name[0].toUpperCase()}</div>
                    <div className="ss-staff-info">
                      <span className="ss-staff-name">{staff.name}</span>
                      <span className="ss-staff-role">{staff.role}</span>
                    </div>
                    <div className="ss-staff-badge">
                      {status === "in" && (
                        <span className="ss-badge in">
                          <CheckCircle2 size={13}/> In · {rec?.check_in_time?.slice(0,5)}
                        </span>
                      )}
                      {status === "out" && (
                        <span className="ss-badge out">
                          <LogOut size={13}/> Out · {rec?.check_out_time?.slice(0,5)}
                        </span>
                      )}
                      {status === "absent" && (
                        <span className="ss-badge absent">
                          <Clock size={13}/> Tap to Check In
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <p className="ss-footer-note">
            {getCambodiaDate()} · Work starts {String(WORK_START.hour).padStart(2,"0")}:{String(WORK_START.minute).padStart(2,"0")} AM
          </p>
        </div>
      )}

      {/* ══ STEP: PIN ══ */}
      {step === "pin" && selectedStaff && (
        <div className="ss-body ss-center">
          <div className={`ss-pin-card ${pinShake ? "shake" : ""}`}>
            <button className="ss-back" onClick={reset}><X size={18}/></button>

            <div className="ss-pin-av">{selectedStaff.name[0].toUpperCase()}</div>
            <h2>{selectedStaff.name}</h2>
            <p className="ss-pin-role">{selectedStaff.role}</p>
            <div className="ss-pin-time">{clock}</div>

            <p className="ss-pin-label">
              {actionType === "checkin" ? "🔐 Enter PIN to Check In" : "🔐 Enter PIN to Check Out"}
            </p>

            <div className="ss-pin-dots">
              {[0,1,2,3].map((i) => (
                <div key={i} className={`ss-pin-dot ${i < pin.length ? "filled" : ""}`}/>
              ))}
            </div>

            {pinError && <p className="ss-pin-error">{pinError}</p>}

            <div className="ss-pin-pad">
              {PIN_KEYS.map((key) => (
                <button
                  key={key}
                  className={`ss-pin-btn ${key==="clear"||key==="del" ? "action" : ""} ${key==="0" ? "zero" : ""}`}
                  onClick={() => handlePinKey(key)}
                >
                  {key === "clear" ? "Clear" : key === "del" ? <Delete size={18}/> : key}
                </button>
              ))}
            </div>

            <button
              className={`ss-confirm-btn ${actionType}`}
              onClick={handlePinSubmit}
              disabled={pin.length < 4}
            >
              {actionType === "checkin"
                ? <><CheckCircle2 size={18}/> Confirm Check-In</>
                : <><LogOut size={18}/> Confirm Check-Out</>}
            </button>
          </div>
        </div>
      )}

      {/* ══ STEP: RESULT ══ */}
      {step === "result" && result && selectedStaff && (
        <div className="ss-body ss-center">
          <div className="ss-result-card">

            {result.type === "checkin" && (
              <>
                <div className={`ss-result-emoji ${result.status.level}`}>
                  {result.status.emoji}
                </div>
                <h2 style={{ color: result.status.color }}>{result.status.title}</h2>
                <p className="ss-result-name">{selectedStaff.name} · {selectedStaff.role}</p>
                <div className="ss-result-times">
                  <div>
                    <span>Checked In</span>
                    <strong>{result.record.check_in_time?.slice(0,5)}</strong>
                  </div>
                  <div>
                    <span>Work Starts</span>
                    <strong>{String(WORK_START.hour).padStart(2,"0")}:{String(WORK_START.minute).padStart(2,"0")}</strong>
                  </div>
                </div>
                <p className="ss-result-msg" style={{ color: result.status.color }}>
                  {result.status.msg}
                </p>
              </>
            )}

            {result.type === "checkout" && (
              <>
                <div className="ss-result-emoji great">👋</div>
                <h2>See You Tomorrow!</h2>
                <p className="ss-result-name">{selectedStaff.name} · {selectedStaff.role}</p>
                <div className="ss-result-times">
                  <div><span>Checked In</span><strong>{result.record.check_in_time?.slice(0,5)}</strong></div>
                  <div><span>Checked Out</span><strong>{result.record.check_out_time?.slice(0,5)}</strong></div>
                </div>
              </>
            )}

            {result.type === "already" && (
              <>
                <div className="ss-result-emoji great">✅</div>
                <h2>Already Done Today</h2>
                <p className="ss-result-name">{selectedStaff.name} checked in and out.</p>
                <div className="ss-result-times">
                  <div><span>In</span><strong>{result.record.check_in_time?.slice(0,5)}</strong></div>
                  <div><span>Out</span><strong>{result.record.check_out_time?.slice(0,5)}</strong></div>
                </div>
              </>
            )}

            <button className="ss-done-btn" onClick={reset}>
              ← Back to Staff List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}