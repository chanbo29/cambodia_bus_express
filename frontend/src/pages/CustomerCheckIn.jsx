import { useEffect, useRef, useState } from "react";
import {
  QrCode, Keyboard, CheckCircle2, AlertTriangle,
  MapPin, Clock, Ticket, User, Phone,
  ArrowRight, RotateCcw, Bus, ChevronLeft,
} from "lucide-react";
import jsQR from "jsqr";
import "./CustomerCheckIn.css";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function publicGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.detail || "Request failed");
  return data;
}

async function publicPatch(path, body = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.detail || "Request failed");
  return data;
}

function getCambodiaTime() {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "Asia/Phnom_Penh", hour12: false,
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}
function getCambodiaDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
}
function paxCount(b) {
  return b?.seat_numbers
    ? b.seat_numbers.split(",").map(s => s.trim()).filter(Boolean).length
    : 1;
}

const DETAILS = [
  { key: "passenger_name", label: "Passenger" },
  { key: "phone",          label: "Phone" },
  { key: "departure_time", label: "Departs" },
  { key: "travel_date",    label: "Date" },
  { key: "seat_numbers",   label: "Seats" },
  { key: "total_price",    label: "Amount", fmt: v => `$${v}` },
];

export default function CustomerCheckIn() {
  const [step, setStep]       = useState("home");   // home | type | scan | result | success | error
  const [code, setCode]       = useState("");
  const [booking, setBooking] = useState(null);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [clock, setClock]     = useState(getCambodiaTime());

  const inputRef  = useRef(null);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef    = useRef(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(getCambodiaTime()), 1000);
    return () => clearInterval(t);
  }, []);

  // Focus input on type step
  useEffect(() => {
    if (step === "type") setTimeout(() => inputRef.current?.focus(), 150);
  }, [step]);

  // Physical QR scanner (fast keystrokes + Enter)
  useEffect(() => {
    let buf = "", timer = null;
    const onKey = (e) => {
      if (e.target === inputRef.current) return;
      if (["home", "type", "scan"].indexOf(step) === -1) return;
      if (e.key === "Enter") {
        if (buf.length > 3) lookup(buf);
        buf = ""; clearTimeout(timer);
      } else if (e.key.length === 1) {
        buf += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { buf = ""; }, 200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  // Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      // Wait for video to be ready before scanning
      video.onloadedmetadata = () => {
        video.play().then(() => {
          rafRef.current = requestAnimationFrame(scanFrame);
        });
      };
    } catch (err) {
      console.error("Camera error:", err);
      // Fall back to manual code entry
      setStep("type");
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const scanFrame = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Keep trying until video has actual size
    if (video.readyState < 4 || video.videoWidth === 0) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (code?.data) {
      stopCamera();
      lookup(code.data);
    } else {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
  };

  useEffect(() => {
    if (step === "scan") startCamera();
    return stopCamera;
  }, [step]);

  const lookup = async (raw) => {
    const cleaned = raw.trim().toUpperCase();
    setLoading(true); setError("");
    try {
      // Public endpoint — no auth required
      const found = await publicGet(`/public/booking/?code=${encodeURIComponent(cleaned)}`);
      setBooking(found);
      setStep("result");
    } catch (err) {
      const msg = err.message?.includes("not found")
        ? `"${cleaned}" not found. Check your code and try again.`
        : err.message || "Something went wrong. Please try again.";
      setError(msg);
      setStep("error");
    } finally { setLoading(false); }
  };

  const confirmCheckIn = async () => {
    if (!booking) return;
    setLoading(true);
    try {
      // Public check-in endpoint — no auth required
      await publicPatch(`/public/booking/${booking.id}/checkin/`);
      setBooking(b => ({ ...b, checked_in: true }));
      setStep("success");
    } catch (err) {
      setError(err.message || "Check-in failed. Please ask staff.");
    } finally { setLoading(false); }
  };

  const reset = () => {
    stopCamera();
    setStep("home"); setCode(""); setBooking(null);
    setError(""); setLoading(false);
  };

  const goBack = () => {
    stopCamera();
    setStep("home"); setCode("");
  };

  return (
    <div className="cci2-page">

      {/* ── Top bar ────────────────────────── */}
      <header className="cci2-header">
        <div className="cci2-brand">
          <div className="cci2-brand-icon"><Bus size={18}/></div>
          <div>
            <h1>Cambodia Bus Express</h1>
            <p>Passenger Check-In</p>
          </div>
        </div>
        <div className="cci2-clock">{clock}</div>
      </header>

      {/* ── Step indicator ─────────────────── */}
      {step !== "home" && (
        <div className="cci2-breadcrumb">
          <button className="cci2-back" onClick={goBack}>
            <ChevronLeft size={15}/> Home
          </button>
          <div className="cci2-step-pills">
            {["Scan / Enter","Confirm","Done"].map((s, i) => {
              const active =
                (i === 0 && ["type","scan"].includes(step)) ||
                (i === 1 && step === "result") ||
                (i === 2 && step === "success");
              const done =
                (i === 0 && ["result","success"].includes(step)) ||
                (i === 1 && step === "success");
              return (
                <div key={s} className={`cci2-pill ${active?"active":""} ${done?"done":""}`}>
                  {done ? <CheckCircle2 size={11}/> : i + 1} {s}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="cci2-body">

        {/* ══ HOME ════════════════════════════ */}
        {step === "home" && (
          <div className="cci2-home">
            <div className="cci2-home-hero">
              <div className="cci2-bus-icon"><Bus size={48}/></div>
              <h2>Welcome!</h2>
              <p>Check in for your journey using your QR code or booking code</p>
            </div>

            <div className="cci2-home-cards">
              <button className="cci2-mode-card primary" onClick={() => setStep("scan")}>
                <div className="cci2-mode-icon"><QrCode size={32}/></div>
                <div className="cci2-mode-info">
                  <h3>Scan QR Code</h3>
                  <p>Use your phone camera to scan the QR code on your ticket</p>
                </div>
                <div className="cci2-mode-arrow"><ArrowRight size={18}/></div>
              </button>

              <div className="cci2-or">or</div>

              <button className="cci2-mode-card secondary" onClick={() => setStep("type")}>
                <div className="cci2-mode-icon secondary"><Keyboard size={32}/></div>
                <div className="cci2-mode-info">
                  <h3>Enter Booking Code</h3>
                  <p>Type the code from your confirmation email or ticket</p>
                </div>
                <div className="cci2-mode-arrow secondary"><ArrowRight size={18}/></div>
              </button>
            </div>

            <p className="cci2-hint">
              Your booking code looks like: <code>CBE-A1B2C3D4</code>
            </p>
          </div>
        )}

        {/* ══ SCAN ════════════════════════════ */}
        {step === "scan" && (
          <div className="cci2-scan-wrap">
            <div className="cci2-scan-label">
              <QrCode size={20}/>
              <span>Point your camera at the QR code on your ticket</span>
            </div>

            <div className="cci2-camera-box">
              <video ref={videoRef} className="cci2-video" playsInline muted/>
              <canvas ref={canvasRef} style={{ display:"none" }}/>
              <div className="cci2-scan-frame-wrap">
                <div className="cci2-scan-frame">
                  <span className="cci2-corner tl"/><span className="cci2-corner tr"/>
                  <span className="cci2-corner bl"/><span className="cci2-corner br"/>
                  <div className="cci2-scan-line"/>
                </div>
              </div>
              {loading && (
                <div className="cci2-cam-loading">
                  <div className="cci2-spinner"/><span>Reading…</span>
                </div>
              )}
            </div>

            <button className="cci2-switch-link" onClick={() => { stopCamera(); setStep("type"); }}>
              <Keyboard size={14}/> Type code instead
            </button>
          </div>
        )}

        {/* ══ TYPE ════════════════════════════ */}
        {step === "type" && (
          <div className="cci2-type-wrap">
            <div className="cci2-type-icon"><Ticket size={36}/></div>
            <h2>Enter Booking Code</h2>
            <p>Type the booking code from your ticket or confirmation email</p>

            <div className="cci2-type-card">
              <label className="cci2-type-label">Booking code</label>
              <input
                ref={inputRef}
                className="cci2-code-input"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && code.trim().length >= 4 && lookup(code)}
                placeholder="CBE-A1B2C3D4"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                className="cci2-find-btn"
                onClick={() => lookup(code)}
                disabled={loading || code.trim().length < 4}
              >
                {loading
                  ? <><div className="cci2-spinner small"/> Looking up…</>
                  : <>Find Booking <ArrowRight size={16}/></>}
              </button>
            </div>

            <button className="cci2-switch-link" onClick={() => setStep("scan")}>
              <QrCode size={14}/> Scan QR code instead
            </button>
          </div>
        )}

        {/* ══ RESULT ══════════════════════════ */}
        {step === "result" && booking && (
          <div className="cci2-result-wrap">
            <div className="cci2-result-card">

              {/* Status pill + code */}
              <div className="cci2-result-top">
                <div className="cci2-result-code">
                  <span>Booking code</span>
                  <strong>{booking.booking_code}</strong>
                </div>
                <div className={`cci2-status-pill ${booking.checked_in ? "in" : "pending"}`}>
                  {booking.checked_in
                    ? <><CheckCircle2 size={13}/> Checked In</>
                    : <><Ticket size={13}/> Ready to Board</>}
                </div>
              </div>

              {/* Route */}
              <div className="cci2-route-bar">
                <div className="cci2-route-city">
                  <span>From</span>
                  <strong>{booking.from_city}</strong>
                </div>
                <div className="cci2-route-mid">
                  <Bus size={16}/>
                  <div className="cci2-route-dots"/>
                </div>
                <div className="cci2-route-city right">
                  <span>To</span>
                  <strong>{booking.to_city}</strong>
                </div>
              </div>

              {/* Details grid */}
              <div className="cci2-detail-grid">
                {DETAILS.map(({ key, label, fmt }) => (
                  booking[key] && (
                    <div key={key} className="cci2-detail-cell">
                      <span>{label}</span>
                      <strong>{fmt ? fmt(booking[key]) : booking[key]}</strong>
                    </div>
                  )
                ))}
                <div className="cci2-detail-cell">
                  <span>Passengers</span>
                  <strong>{paxCount(booking)} pax</strong>
                </div>
              </div>

              {/* Action */}
              {booking.checked_in ? (
                <div className="cci2-already-done">
                  <CheckCircle2 size={18}/>
                  Already checked in — please proceed to the bus.
                </div>
              ) : (
                <button className="cci2-board-btn" onClick={confirmCheckIn} disabled={loading}>
                  {loading
                    ? <div className="cci2-spinner small white"/>
                    : <><CheckCircle2 size={18}/> Confirm Check-In</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══ SUCCESS ═════════════════════════ */}
        {step === "success" && booking && (
          <div className="cci2-success-wrap">
            <div className="cci2-success-card">
              <div className="cci2-success-ring">
                <CheckCircle2 size={52}/>
              </div>
              <h2>You're Checked In!</h2>
              <p>{booking.passenger_name} · {paxCount(booking)} passenger{paxCount(booking) > 1 ? "s" : ""}</p>

              <div className="cci2-success-route">
                <strong>{booking.from_city}</strong>
                <Bus size={16}/>
                <strong>{booking.to_city}</strong>
              </div>

              <div className="cci2-success-pills">
                <div className="cci2-spill">
                  <Clock size={13}/> {booking.departure_time}
                </div>
                <div className="cci2-spill">
                  <Ticket size={13}/> {booking.seat_numbers}
                </div>
                <div className="cci2-spill">
                  <MapPin size={13}/> {booking.travel_date}
                </div>
              </div>

              <div className="cci2-success-msg">
                Have a safe and comfortable journey! 🚌
              </div>

              <button className="cci2-next-btn" onClick={reset}>
                <RotateCcw size={15}/> Next Passenger
              </button>
            </div>
          </div>
        )}

        {/* ══ ERROR ═══════════════════════════ */}
        {step === "error" && (
          <div className="cci2-error-wrap">
            <div className="cci2-error-card">
              <div className="cci2-error-icon">
                <AlertTriangle size={40}/>
              </div>
              <h2>Booking Not Found</h2>
              <p>{error}</p>
              <p className="cci2-error-hint">
                Double-check your booking code and try again.<br/>
                Contact staff if the problem continues.
              </p>
              <button className="cci2-board-btn" onClick={() => { setStep("type"); setError(""); }}>
                Try Again
              </button>
              <button className="cci2-switch-link" style={{marginTop:10}} onClick={reset}>
                ← Back to home
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}