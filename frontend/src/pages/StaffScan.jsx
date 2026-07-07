import { useEffect, useState } from "react";
import {
  CheckCircle2, LogOut, Clock,
  MapPin, Lock, AlertTriangle, Delete, Search,
} from "lucide-react";
import "./StaffScan.css";

const OFFICE    = { lat: 11.5827, lng: 104.8974, radius: 150 };
const WINDOWS   = {
  checkin:  { start: { h: 6,  m: 0 }, end: { h: 9,  m: 30 } },
  checkout: { start: { h: 15, m: 0 }, end: { h: 21, m: 0  } },
};
const WORK_START = { hour: 8, minute: 0 };
const BASE       = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const PIN_KEYS   = ["1","2","3","4","5","6","7","8","9","clear","0","del"];

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
  const [h, m] = getCambodiaTime().split(":").map(Number);
  return { h, m, total: h * 60 + m };
}
function inWindow(w) {
  const { total } = getCambodiaHM();
  return total >= w.start.h * 60 + w.start.m && total <= w.end.h * 60 + w.end.m;
}
function fmtW(w) {
  const f = ({ h, m }) => `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  return `${f(w.start)} – ${f(w.end)}`;
}
function distanceMetres(lat1, lng1, lat2, lng2) {
  const R = 6371000, dL = (lat2-lat1)*Math.PI/180, dl = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dL/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dl/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function getArrivalStatus(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const diff = h*60+m - (WORK_START.hour*60+WORK_START.minute);
  if (diff<=0)   return { level:"great",    emoji:"🎉", title:"Good Job!",         msg:"You arrived on time!", color:"#1D9E75" };
  if (diff<=5)   return { level:"careful",  emoji:"⚠️",  title:"Be Careful!",       msg:`${diff} min late.`,    color:"#d97706" };
  if (diff<=30)  return { level:"warning",  emoji:"😬", title:"Warning!",           msg:`${diff} mins late.`,   color:"#ea580c" };
  if (diff<=120) return { level:"boss",     emoji:"👀", title:"Boss is Watching!",  msg:`${diff} mins late!`,   color:"#dc2626" };
  return           { level:"critical", emoji:"🆘", title:"Very Late!",          msg:`${Math.floor(diff/60)}h ${diff%60}m late!`, color:"#7f1d1d" };
}
async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function StaffScan() {
  const [staffList, setStaffList]   = useState([]);
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [clock, setClock]           = useState(getCambodiaTime());
  const [gpsState, setGpsState]     = useState("checking");
  const [gpsDist, setGpsDist]       = useState(null);
  const [timeState, setTimeState]   = useState(null);
  const [search, setSearch]         = useState("");

  const [step, setStep]                   = useState("select");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [actionType, setActionType]       = useState(null);
  const [result, setResult]               = useState(null);
  const [processing, setProcessing]       = useState(false);
  const [pin, setPin]                     = useState("");
  const [pinError, setPinError]           = useState("");
  const [pinShake, setPinShake]           = useState(false);

  useEffect(() => {
    const t = setInterval(() => { setClock(getCambodiaTime()); updateTimeState(); }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { checkGPS(); updateTimeState(); fetchAll(); }, []);

  const updateTimeState = () => {
    if (inWindow(WINDOWS.checkin))       setTimeState("checkin_ok");
    else if (inWindow(WINDOWS.checkout)) setTimeState("checkout_ok");
    else                                 setTimeState("locked");
  };

  const checkGPS = () => {
    setGpsState("checking");
    if (!navigator.geolocation) { setGpsState("error"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = Math.round(distanceMetres(pos.coords.latitude, pos.coords.longitude, OFFICE.lat, OFFICE.lng));
        setGpsDist(d); setGpsState(d <= OFFICE.radius ? "allowed" : "far");
      },
      (err) => setGpsState(err.code === 1 ? "denied" : "error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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

  const getStatus = (staff) => {
    const rec = records.find((r) => r.staff === staff.id && r.date === getCambodiaDate());
    if (!rec) return "absent";
    if (!rec.check_out_time) return "in";
    return "out";
  };
  const todayRec = (staff) =>
    records.find((r) => r.staff === staff.id && r.date === getCambodiaDate());

  // Filter staff by search
  const filteredStaff = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectStaff = (staff) => {
    const rec = todayRec(staff);
    setSelectedStaff(staff); setPin(""); setPinError("");
    if (rec && !rec.check_out_time)  setActionType("checkout");
    else if (rec?.check_out_time)    { setResult({ type:"already", record:rec }); setStep("result"); return; }
    else                             setActionType("checkin");
    setStep("pin");
  };

  const handlePinKey = (key) => {
    setPinError("");
    if (key==="clear") { setPin(""); return; }
    if (key==="del")   { setPin((p) => p.slice(0,-1)); return; }
    if (pin.length >= 4) return;
    setPin((p) => p + key);
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) { setPinError("Please enter all 4 digits."); return; }

    // Verify PIN server-side — pin never exposed in public API response
    try {
      const res = await apiFetch("/public/verify-pin/", {
        method: "POST",
        body: JSON.stringify({ staff_id: selectedStaff.id, pin }),
      });
      if (!res.valid) {
        setPinError("❌ Wrong PIN. Try again.");
        setPinShake(true); setTimeout(() => setPinShake(false), 500);
        setPin(""); return;
      }
    } catch {
      setPinError("Server error. Try again.");
      return;
    }

    // PIN correct — proceed
    setProcessing(true);
    try {
      const now = getCambodiaTime().slice(0,5);
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
      setStep("result"); fetchAll();
    } catch (err) { alert("Failed: " + err.message); }
    finally { setProcessing(false); }
  };

  const reset = () => {
    setStep("select"); setSelectedStaff(null);
    setActionType(null); setResult(null);
    setPin(""); setPinError(""); setProcessing(false);
  };

  // Gate screens
  if (gpsState === "checking") return (
    <GatePage clock={clock}>
      <div className="ss-gate-icon checking"><MapPin size={32}/></div>
      <h2>Checking your location…</h2>
      <p>Please allow location access when your browser asks.</p>
      <div className="ss-spinner" style={{margin:"14px auto 0"}}/>
    </GatePage>
  );
  if (gpsState === "denied") return (
    <GatePage clock={clock}>
      <div className="ss-gate-icon blocked"><Lock size={32}/></div>
      <h2>Location access denied</h2>
      <p>Enable location in your browser settings then try again.</p>
      <button className="ss-retry-btn" onClick={checkGPS}>Try again</button>
    </GatePage>
  );
  if (gpsState === "far") return (
    <GatePage clock={clock}>
      <div className="ss-gate-icon blocked"><MapPin size={32}/></div>
      <h2>You're not at the office</h2>
      <p>You are <strong>{gpsDist}m</strong> away. Must be within <strong>{OFFICE.radius}m</strong>.</p>
      <div className="ss-distance-bar">
        <div className="ss-distance-fill" style={{width:`${Math.min((OFFICE.radius/gpsDist)*100,100)}%`}}/>
      </div>
      <p className="ss-distance-label">{OFFICE.radius}m allowed · {gpsDist}m away</p>
      <button className="ss-retry-btn" onClick={checkGPS}>Check again</button>
    </GatePage>
  );
  if (gpsState === "error") return (
    <GatePage clock={clock}>
      <div className="ss-gate-icon blocked"><AlertTriangle size={32}/></div>
      <h2>Location unavailable</h2>
      <p>Make sure GPS is enabled on your device.</p>
      <button className="ss-retry-btn" onClick={checkGPS}>Try again</button>
    </GatePage>
  );
  if (timeState === "locked") return (
    <GatePage clock={clock}>
      <div className="ss-gate-icon locked"><Clock size={32}/></div>
      <h2>Check-in is closed</h2>
      <p>Attendance is only open during:</p>
      <div className="ss-window-list">
        <div className="ss-window-item"><CheckCircle2 size={15}/> Check-in: <strong>{fmtW(WINDOWS.checkin)}</strong></div>
        <div className="ss-window-item"><LogOut size={15}/> Check-out: <strong>{fmtW(WINDOWS.checkout)}</strong></div>
      </div>
      <div className="ss-time-now">Current time: {getCambodiaTime().slice(0,5)}</div>
    </GatePage>
  );

  return (
    <div className="ss-page">
      <Header clock={clock} gpsDist={gpsDist} timeState={timeState}/>

      {/* SELECT NAME */}
      {step === "select" && (
        <div className="ss-body">
          <div className="ss-title-row">
            <h2>Tap Your Name</h2>
            <p>{timeState === "checkin_ok" ? "Select your name to check in" : "Select your name to check out"}</p>
          </div>

          <div className="ss-indicators">
            <div className="ss-indicator ok"><MapPin size={13}/> {gpsDist}m from office</div>
            <div className={`ss-indicator ${timeState==="checkin_ok"?"ok":"amber"}`}>
              <Clock size={13}/>
              {timeState === "checkin_ok"
                ? `Check-in open until ${fmtW(WINDOWS.checkin).split("–")[1].trim()}`
                : `Check-out open until ${fmtW(WINDOWS.checkout).split("–")[1].trim()}`}
            </div>
          </div>

          {/* Search box */}
          <div className="ss-search-box">
            <Search size={17} className="ss-search-icon"/>
            <input
              className="ss-search-input"
              placeholder="Search your name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button className="ss-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>

          {loading ? (
            <div className="ss-loading"><div className="ss-spinner"/><span>Loading…</span></div>
          ) : filteredStaff.length === 0 ? (
            <div className="ss-empty">
              {search ? `No staff found for "${search}"` : "No staff registered. Contact your admin."}
            </div>
          ) : (
            <div className="ss-staff-grid">
              {filteredStaff.map((staff) => {
                const status   = getStatus(staff);
                const rec      = todayRec(staff);
                const disabled =
                  (timeState === "checkout_ok" && status !== "in") ||
                  (timeState === "checkin_ok"  && status === "out");
                return (
                  <button key={staff.id}
                    className={`ss-staff-btn ${status} ${disabled?"disabled":""}`}
                    onClick={() => !disabled && handleSelectStaff(staff)} disabled={disabled}>
                    <div className="ss-staff-av">{staff.name[0].toUpperCase()}</div>
                    <div className="ss-staff-info">
                      <span className="ss-staff-name">{staff.name}</span>
                      <span className="ss-staff-role">{staff.role}</span>
                    </div>
                    <div className="ss-staff-badge">
                      {status==="in"     && <span className="ss-badge in"><CheckCircle2 size={12}/> In · {rec?.check_in_time?.slice(0,5)}</span>}
                      {status==="out"    && <span className="ss-badge out"><LogOut size={12}/> Done</span>}
                      {status==="absent" && !disabled && <span className="ss-badge absent"><Clock size={12}/> Tap to check in</span>}
                      {status==="absent" && disabled  && <span className="ss-badge out">Not checked in</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <p className="ss-footer-note">
            {getCambodiaDate()} · Work starts {String(WORK_START.hour).padStart(2,"0")}:{String(WORK_START.minute).padStart(2,"0")} AM
            {search && filteredStaff.length > 0 && ` · ${filteredStaff.length} result${filteredStaff.length>1?"s":""}`}
          </p>
        </div>
      )}

      {/* PIN STEP */}
      {step === "pin" && selectedStaff && (
        <div className="ss-body ss-center">
          <div className={`ss-pin-card ${pinShake?"shake":""}`}>
            <div className="ss-pin-av">{selectedStaff.name[0].toUpperCase()}</div>
            <h2>{selectedStaff.name}</h2>
            <p className="ss-pin-role">{selectedStaff.role}</p>
            <div className="ss-pin-time">{clock}</div>
            <div className={`ss-pin-action ${actionType}`}>
              {actionType==="checkin" ? "🔐 Enter PIN to Check In" : "🔐 Enter PIN to Check Out"}
            </div>
            <div className="ss-pin-dots">
              {[0,1,2,3].map((i) => <div key={i} className={`ss-pin-dot ${i<pin.length?"filled":""}`}/>)}
            </div>
            {pinError && <p className="ss-pin-error">{pinError}</p>}
            <div className="ss-pin-pad">
              {PIN_KEYS.map((key) => (
                <button key={key}
                  className={`ss-pin-btn ${key==="clear"||key==="del"?"action":""} ${key==="0"?"zero":""}`}
                  onClick={() => handlePinKey(key)}>
                  {key==="clear"?"Clear":key==="del"?<Delete size={18}/>:key}
                </button>
              ))}
            </div>
            <div className="ss-pin-btns">
              <button className="ss-back-btn" onClick={reset}>← Back</button>
              <button className={`ss-confirm-btn ${actionType}`} onClick={handlePinSubmit}
                disabled={pin.length<4||processing}>
                {processing ? "Please wait…"
                  : actionType==="checkin"
                    ? <><CheckCircle2 size={16}/> Confirm Check-In</>
                    : <><LogOut size={16}/> Confirm Check-Out</>}
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

function Header({ clock, gpsDist, timeState }) {
  return (
    <header className="ss-header">
      <div className="ss-header-logo">
        <span className="ss-header-bus">🚌</span>
        <div><h1>Cambodia Bus Express</h1><p>Staff attendance system</p></div>
      </div>
      <div className="ss-header-right">
        {gpsDist != null && <div className="ss-header-gps"><MapPin size={13}/> {gpsDist}m</div>}
        <div className="ss-clock">{clock}</div>
      </div>
    </header>
  );
}

function GatePage({ clock, children }) {
  return (
    <div className="ss-page">
      <header className="ss-header">
        <div className="ss-header-logo">
          <span className="ss-header-bus">🚌</span>
          <div><h1>Cambodia Bus Express</h1><p>Staff attendance system</p></div>
        </div>
        <div className="ss-clock">{clock}</div>
      </header>
      <div className="ss-gate">{children}</div>
    </div>
  );
}