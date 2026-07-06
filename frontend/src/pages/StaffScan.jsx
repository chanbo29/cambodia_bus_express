import { useEffect, useState } from "react";
import { CheckCircle2, LogOut, Clock, MapPin, Lock, AlertTriangle } from "lucide-react";
import "./StaffScan.css";

// ── CONFIG — change these to your office location ─────────────
const OFFICE = {
  lat:    11.5831,   // ← your office latitude
  lng:    104.8808,  // ← your office longitude
  radius: 50,       // ← metres allowed from office
};
// ── Time windows ───────────────────────────────────────────────
const WINDOWS = {
  checkin:  { start: { h: 6,  m: 0  }, end: { h: 9,  m: 30 } }, // 6:00–9:30 AM
  checkout: { start: { h: 15, m: 0  }, end: { h: 21, m: 0  } }, // 3:00–9:00 PM
};

const WORK_START = { hour: 8, minute: 0 };
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ── Helpers ────────────────────────────────────────────────────
function getCambodiaDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
}
function getCambodiaTime() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "Asia/Phnom_Penh", hour12: false,
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}
function getCambodiaHM() {
  const t = getCambodiaTime();
  const [h, m] = t.split(":").map(Number);
  return { h, m, total: h * 60 + m };
}

function inWindow(window) {
  const { total } = getCambodiaHM();
  const start = window.start.h * 60 + window.start.m;
  const end   = window.end.h   * 60 + window.end.m;
  return total >= start && total <= end;
}

function fmtWindow(w) {
  const fmt = ({ h, m }) =>
    `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  return `${fmt(w.start)} – ${fmt(w.end)}`;
}

// Haversine distance in metres between two GPS coords
function distanceMetres(lat1, lng1, lat2, lng2) {
  const R  = 6371000;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dl  = (lng2 - lng1) * Math.PI / 180;
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// GPS states: "checking" | "allowed" | "denied" | "far" | "error"
export default function StaffScan() {
  const [staffList, setStaffList] = useState([]);
  const [records, setRecords]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [clock, setClock]         = useState(getCambodiaTime());

  // GPS
  const [gpsState, setGpsState]     = useState("checking"); // checking|allowed|denied|far|error
  const [gpsDistance, setGpsDistance] = useState(null);

  // Time window
  const [timeState, setTimeState]   = useState(null); // null|"checkin_ok"|"checkout_ok"|"locked"

  // Steps
  const [step, setStep]                   = useState("select");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionType, setActionType]       = useState(null);
  const [result, setResult]               = useState(null);
  const [processing, setProcessing]       = useState(false);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => {
      setClock(getCambodiaTime());
      checkTimeWindow();
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // GPS check on mount
  useEffect(() => {
    checkGPS();
    checkTimeWindow();
    fetchAll();
  }, []);

  const checkTimeWindow = () => {
    if (inWindow(WINDOWS.checkin))       setTimeState("checkin_ok");
    else if (inWindow(WINDOWS.checkout)) setTimeState("checkout_ok");
    else                                 setTimeState("locked");
  };

  const checkGPS = () => {
    setGpsState("checking");
    if (!navigator.geolocation) {
      setGpsState("error"); return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = Math.round(
          distanceMetres(pos.coords.latitude, pos.coords.longitude, OFFICE.lat, OFFICE.lng)
        );
        setGpsDistance(dist);
        setGpsState(dist <= OFFICE.radius ? "allowed" : "far");
      },
      (err) => {
        if (err.code === 1) setGpsState("denied");
        else                setGpsState("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const today  = getCambodiaDate();
      const [s, r] = await Promise.all([
        apiFetch("/public/staff/"),
        apiFetch(`/public/staff-records/?date=${today}`),
      ]);
      setStaffList(Array.isArray(s) ? s : []);
      setRecords(Array.isArray(r) ? r : []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const getStaffStatus = (staff) => {
    const rec = records.find((r) => r.staff === staff.id && r.date === getCambodiaDate());
    if (!rec)               return "absent";
    if (!rec.check_out_time) return "in";
    return "out";
  };
  const todayRec = (staff) =>
    records.find((r) => r.staff === staff.id && r.date === getCambodiaDate());

  const handleSelectStaff = (staff) => {
    const rec = todayRec(staff);
    setSelectedStaff(staff);
    if (rec && !rec.check_out_time)  setActionType("checkout");
    else if (rec?.check_out_time)   { setResult({ type:"already", record:rec }); setStep("result"); return; }
    else                             setActionType("checkin");
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
        setResult({ type:"checkin", record:data, status:getArrivalStatus(now) });
      } else {
        const rec  = todayRec(selectedStaff);
        const data = await apiFetch(`/public/staff-checkout/${rec.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ check_out_time: now }),
        });
        setResult({ type:"checkout", record:data });
      }
      setStep("result");
      fetchAll();
    } catch (err) { alert("Failed: " + err.message); }
    finally { setProcessing(false); }
  };

  const reset = () => {
    setStep("select"); setSelectedStaff(null);
    setActionType(null); setResult(null); setProcessing(false);
  };

  // ── Render blocked states ─────────────────────────────────────

  // GPS checking spinner
  if (gpsState === "checking") {
    return (
      <div className="ss-page">
        <SsHeader clock={clock}/>
        <div className="ss-gate">
          <div className="ss-gate-icon checking">
            <MapPin size={32}/>
          </div>
          <h2>Checking your location…</h2>
          <p>Please allow location access when your browser asks.</p>
          <div className="ss-spinner" style={{margin:"16px auto 0"}}/>
        </div>
      </div>
    );
  }

  // GPS denied
  if (gpsState === "denied") {
    return (
      <div className="ss-page">
        <SsHeader clock={clock}/>
        <div className="ss-gate">
          <div className="ss-gate-icon blocked"><Lock size={32}/></div>
          <h2>Location access denied</h2>
          <p>You must allow location access to check in.<br/>Open your browser settings and enable location for this page.</p>
          <button className="ss-retry-btn" onClick={checkGPS}>Try again</button>
        </div>
      </div>
    );
  }

  // Too far from office
  if (gpsState === "far") {
    return (
      <div className="ss-page">
        <SsHeader clock={clock}/>
        <div className="ss-gate">
          <div className="ss-gate-icon blocked"><MapPin size={32}/></div>
          <h2>You're not at the office</h2>
          <p>
            You are <strong>{gpsDistance}m</strong> from the office.<br/>
            Check-in is only allowed within <strong>{OFFICE.radius}m</strong> of the workplace.
          </p>
          <div className="ss-distance-bar">
            <div
              className="ss-distance-fill"
              style={{ width: `${Math.min((OFFICE.radius / gpsDistance) * 100, 100)}%` }}
            />
          </div>
          <p className="ss-distance-label">
            {OFFICE.radius}m allowed · {gpsDistance}m away
          </p>
          <button className="ss-retry-btn" onClick={checkGPS}>Check again</button>
        </div>
      </div>
    );
  }

  // GPS error
  if (gpsState === "error") {
    return (
      <div className="ss-page">
        <SsHeader clock={clock}/>
        <div className="ss-gate">
          <div className="ss-gate-icon blocked"><AlertTriangle size={32}/></div>
          <h2>Location unavailable</h2>
          <p>Could not get your location. Please make sure GPS is enabled on your device.</p>
          <button className="ss-retry-btn" onClick={checkGPS}>Try again</button>
        </div>
      </div>
    );
  }

  // Time window locked
  if (timeState === "locked") {
    const now = getCambodiaHM();
    return (
      <div className="ss-page">
        <SsHeader clock={clock}/>
        <div className="ss-gate">
          <div className="ss-gate-icon locked"><Clock size={32}/></div>
          <h2>Check-in is closed</h2>
          <p>The attendance system is only available during:</p>
          <div className="ss-window-list">
            <div className="ss-window-item">
              <CheckCircle2 size={16}/> Check-in: <strong>{fmtWindow(WINDOWS.checkin)}</strong>
            </div>
            <div className="ss-window-item">
              <LogOut size={16}/> Check-out: <strong>{fmtWindow(WINDOWS.checkout)}</strong>
            </div>
          </div>
          <div className="ss-time-now">Current time: {getCambodiaTime().slice(0,5)}</div>
        </div>
      </div>
    );
  }

  // ── Main scan UI (GPS ok + time window ok) ────────────────────
  return (
    <div className="ss-page">
      <SsHeader clock={clock} gpsDistance={gpsDistance} timeState={timeState}/>

      {/* SELECT NAME */}
      {step === "select" && (
        <div className="ss-body">
          <div className="ss-title-row">
            <h2>Tap Your Name</h2>
            <p>
              {timeState === "checkin_ok"  ? "Select your name to check in" : "Select your name to check out"}
            </p>
          </div>

          {/* GPS + time indicators */}
          <div className="ss-indicators">
            <div className="ss-indicator ok">
              <MapPin size={13}/> {gpsDistance}m from office
            </div>
            <div className={`ss-indicator ${timeState === "checkin_ok" ? "ok" : "checkout"}`}>
              <Clock size={13}/>
              {timeState === "checkin_ok"
                ? `Check-in open until ${fmtWindow(WINDOWS.checkin).split("–")[1].trim()}`
                : `Check-out open until ${fmtWindow(WINDOWS.checkout).split("–")[1].trim()}`}
            </div>
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
                // In checkout window, dim already-done and absent staff
                const disabled =
                  (timeState === "checkout_ok" && status !== "in") ||
                  (timeState === "checkin_ok"  && status === "out");
                return (
                  <button
                    key={staff.id}
                    className={`ss-staff-btn ${status} ${disabled ? "disabled" : ""}`}
                    onClick={() => !disabled && handleSelectStaff(staff)}
                    disabled={disabled}
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
                          <LogOut size={13}/> Done
                        </span>
                      )}
                      {status === "absent" && !disabled && (
                        <span className="ss-badge absent">
                          <Clock size={13}/> Tap to check in
                        </span>
                      )}
                      {status === "absent" && disabled && (
                        <span className="ss-badge out">Not checked in</span>
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
              <button
                className={`ss-confirm-btn ${actionType}`}
                onClick={handleConfirm}
                disabled={processing}
              >
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
                <div><span>Checked in</span><strong>{result.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Work starts</span><strong>{String(WORK_START.hour).padStart(2,"0")}:{String(WORK_START.minute).padStart(2,"0")}</strong></div>
              </div>
              <p className="ss-result-msg" style={{color:result.status.color}}>{result.status.msg}</p>
            </>)}
            {result.type === "checkout" && (<>
              <div className="ss-result-emoji great">👋</div>
              <h2>See You Tomorrow!</h2>
              <p className="ss-result-name">{selectedStaff.name} · {selectedStaff.role}</p>
              <div className="ss-result-times">
                <div><span>Checked in</span><strong>{result.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Checked out</span><strong>{result.record.check_out_time?.slice(0,5)}</strong></div>
              </div>
            </>)}
            {result.type === "already" && (<>
              <div className="ss-result-emoji great">✅</div>
              <h2>Already done today</h2>
              <p className="ss-result-name">{selectedStaff.name} already completed today.</p>
              <div className="ss-result-times">
                <div><span>In</span><strong>{result.record.check_in_time?.slice(0,5)}</strong></div>
                <div><span>Out</span><strong>{result.record.check_out_time?.slice(0,5)}</strong></div>
              </div>
            </>)}
            <button className="ss-done-btn" onClick={reset}>← Back to staff list</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function SsHeader({ clock, gpsDistance, timeState }) {
  return (
    <header className="ss-header">
      <div className="ss-header-logo">
        <div className="ss-header-bus">🚌</div>
        <div>
          <h1>Cambodia Bus Express</h1>
          <p>Staff attendance system</p>
        </div>
      </div>
      <div className="ss-header-right">
        {gpsDistance != null && (
          <div className="ss-header-gps">
            <MapPin size={13}/> {gpsDistance}m
          </div>
        )}
        <div className="ss-clock">{clock}</div>
      </div>
    </header>
  );
}