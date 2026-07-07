import { useEffect, useRef, useState } from "react";
import {
  QrCode, Keyboard, CheckCircle2, AlertTriangle,
  MapPin, Clock, Ticket, User, Phone,
  ArrowRight, RotateCcw, Bus,
} from "lucide-react";
import "./CustomerCheckIn.css";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" }, ...opts,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Steps: "home" → "scan" | "type" → "result" | "error" → "success"
export default function CustomerCheckIn() {
  const [step, setStep]         = useState("home");
  const [mode, setMode]         = useState(null); // "scan" | "type"
  const [code, setCode]         = useState("");
  const [booking, setBooking]   = useState(null);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [clock, setClock]       = useState(getTime());

  const inputRef   = useRef(null);
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);

  function getTime() {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Phnom_Penh", hour12: false,
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }
  function getDate() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
  }

  useEffect(() => {
    const t = setInterval(() => setClock(getTime()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-focus input on type mode
  useEffect(() => {
    if (mode === "type") setTimeout(() => inputRef.current?.focus(), 200);
  }, [mode]);

  // Physical QR scanner global listener
  useEffect(() => {
    if (step !== "home" && mode !== "scan") return;
    let buf = "", timer = null;
    const onKey = (e) => {
      if (e.target === inputRef.current) return;
      if (e.key === "Enter") {
        if (buf.length > 3) lookupBooking(buf);
        buf = ""; clearTimeout(timer);
      } else if (e.key.length === 1) {
        buf += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { buf = ""; }, 200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, mode]);

  // Camera QR scanner using jsQR (loaded from CDN)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationFrame(scanFrame);
      }
    } catch {
      setError("Camera access denied. Please use manual code entry.");
      setMode("type");
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const scanFrame = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== 4) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext("2d");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Try BarcodeDetector if available (Chrome/Edge)
    if ("BarcodeDetector" in window) {
      new BarcodeDetector({ formats: ["qr_code"] })
        .detect(canvas)
        .then((barcodes) => {
          if (barcodes.length > 0) {
            stopCamera();
            lookupBooking(barcodes[0].rawValue);
          } else {
            rafRef.current = requestAnimationFrame(scanFrame);
          }
        })
        .catch(() => { rafRef.current = requestAnimationFrame(scanFrame); });
    } else {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
  };

  useEffect(() => {
    if (mode === "scan") startCamera();
    return () => stopCamera();
  }, [mode]);

  const lookupBooking = async (rawCode) => {
    const cleaned = rawCode.trim().toUpperCase();
    setLoading(true);
    setError("");
    try {
      const bookings = await apiFetch("/bookings/");
      const found = bookings.find(
        (b) => b.booking_code?.toUpperCase() === cleaned
      );
      if (!found) throw new Error(`Booking "${cleaned}" not found.`);
      setBooking(found);
      setStep("result");
      stopCamera();
    } catch (err) {
      setError(err.message || "Booking not found.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e?.preventDefault();
    if (code.trim().length < 4) return;
    lookupBooking(code);
  };

  const handleCheckIn = async () => {
    if (!booking) return;
    setLoading(true);
    try {
      await apiFetch(`/bookings/${booking.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ checked_in: true }),
      });
      setBooking((b) => ({ ...b, checked_in: true }));
      setStep("success");
    } catch {
      setError("Check-in failed. Please ask staff for help.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("home"); setMode(null); setCode("");
    setBooking(null); setError(""); setLoading(false);
    stopCamera();
  };

  const passengerCount = (b) =>
    b?.seat_numbers
      ? b.seat_numbers.split(",").filter(Boolean).length
      : 1;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="cci-page">

      {/* Header */}
      <header className="cci-header">
        <div className="cci-header-brand">
          <div className="cci-header-icon"><Bus size={22}/></div>
          <div>
            <h1>Cambodia Bus Express</h1>
            <p>Passenger Check-In</p>
          </div>
        </div>
        <div className="cci-header-clock">{clock}</div>
      </header>

      <div className="cci-body">

        {/* ══ HOME ════════════════════════════════════════════ */}
        {step === "home" && (
          <div className="cci-home">
            <div className="cci-home-icon">
              <Bus size={52}/>
            </div>
            <h2>Welcome!</h2>
            <p>Check in for your journey by scanning your QR code<br/>or entering your booking code below.</p>

            <div className="cci-home-options">
              <button
                className="cci-option-btn scan"
                onClick={() => { setStep("scan"); setMode("scan"); }}
              >
                <div className="cci-option-icon"><QrCode size={36}/></div>
                <h3>Scan QR Code</h3>
                <p>Open your ticket and scan the QR code with your camera</p>
                <span className="cci-option-cta">Tap to open camera <ArrowRight size={14}/></span>
              </button>

              <div className="cci-option-divider">OR</div>

              <button
                className="cci-option-btn type"
                onClick={() => { setStep("type"); setMode("type"); }}
              >
                <div className="cci-option-icon"><Keyboard size={36}/></div>
                <h3>Enter Booking Code</h3>
                <p>Type your booking code from your confirmation ticket</p>
                <span className="cci-option-cta">Tap to type code <ArrowRight size={14}/></span>
              </button>
            </div>

            <p className="cci-home-hint">
              Your booking code looks like: <code>CBE-A1B2C3D4</code>
            </p>
          </div>
        )}

        {/* ══ SCAN ════════════════════════════════════════════ */}
        {step === "scan" && (
          <div className="cci-scan-wrap">
            <h2>Scan Your QR Code</h2>
            <p>Point your camera at the QR code on your ticket</p>

            <div className="cci-camera-box">
              <video ref={videoRef} className="cci-camera-video" playsInline muted/>
              <canvas ref={canvasRef} style={{ display:"none" }}/>
              <div className="cci-scan-overlay">
                <div className="cci-scan-frame"/>
              </div>
              {loading && (
                <div className="cci-camera-loading">
                  <div className="cci-spinner"/>
                  <span>Reading code…</span>
                </div>
              )}
            </div>

            <p className="cci-scan-hint">Keep QR code steady within the frame</p>

            <button className="cci-switch-btn" onClick={() => { stopCamera(); setStep("type"); setMode("type"); }}>
              <Keyboard size={16}/> Type code instead
            </button>
            <button className="cci-back-btn" onClick={reset}>← Back</button>
          </div>
        )}

        {/* ══ TYPE ════════════════════════════════════════════ */}
        {step === "type" && (
          <div className="cci-type-wrap">
            <div className="cci-type-icon"><Ticket size={40}/></div>
            <h2>Enter Booking Code</h2>
            <p>Type the booking code from your confirmation email or ticket</p>

            <form className="cci-type-form" onSubmit={handleManualSubmit}>
              <input
                ref={inputRef}
                className="cci-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. CBE-A1B2C3D4"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                className="cci-submit-btn"
                disabled={loading || code.trim().length < 4}
              >
                {loading ? <><div className="cci-spinner small"/></> : <>Check In <ArrowRight size={16}/></>}
              </button>
            </form>

            <button className="cci-switch-btn" onClick={() => { setStep("scan"); setMode("scan"); }}>
              <QrCode size={16}/> Scan QR instead
            </button>
            <button className="cci-back-btn" onClick={reset}>← Back</button>
          </div>
        )}

        {/* ══ RESULT ══════════════════════════════════════════ */}
        {step === "result" && booking && (
          <div className="cci-result-wrap">
            <div className="cci-result-card">

              {/* Status badge */}
              <div className={`cci-booking-status ${booking.checked_in ? "checked" : "pending"}`}>
                {booking.checked_in
                  ? <><CheckCircle2 size={16}/> Already Checked In</>
                  : <><Ticket size={16}/> Ready to Board</>}
              </div>

              {/* Booking code */}
              <div className="cci-booking-code">{booking.booking_code}</div>

              {/* Route hero */}
              <div className="cci-route-hero">
                <div className="cci-city">
                  <span className="cci-city-label">From</span>
                  <strong>{booking.from_city}</strong>
                </div>
                <div className="cci-route-arrow">
                  <Bus size={20}/>
                  <div className="cci-route-line"/>
                </div>
                <div className="cci-city right">
                  <span className="cci-city-label">To</span>
                  <strong>{booking.to_city}</strong>
                </div>
              </div>

              {/* Details grid */}
              <div className="cci-detail-grid">
                <div className="cci-detail-item">
                  <User size={15}/>
                  <div>
                    <span>Passenger</span>
                    <strong>{booking.passenger_name || "—"}</strong>
                  </div>
                </div>
                <div className="cci-detail-item">
                  <Phone size={15}/>
                  <div>
                    <span>Phone</span>
                    <strong>{booking.phone || "—"}</strong>
                  </div>
                </div>
                <div className="cci-detail-item">
                  <Clock size={15}/>
                  <div>
                    <span>Departure</span>
                    <strong>{booking.departure_time}</strong>
                  </div>
                </div>
                <div className="cci-detail-item">
                  <MapPin size={15}/>
                  <div>
                    <span>Travel Date</span>
                    <strong>{booking.travel_date}</strong>
                  </div>
                </div>
                <div className="cci-detail-item">
                  <Ticket size={15}/>
                  <div>
                    <span>Seats</span>
                    <strong>{booking.seat_numbers} · {passengerCount(booking)} pax</strong>
                  </div>
                </div>
                <div className="cci-detail-item">
                  <CheckCircle2 size={15}/>
                  <div>
                    <span>Amount Paid</span>
                    <strong>${booking.total_price}</strong>
                  </div>
                </div>
              </div>

              {/* Action */}
              {!booking.checked_in ? (
                <button className="cci-board-btn" onClick={handleCheckIn} disabled={loading}>
                  {loading
                    ? <div className="cci-spinner small"/>
                    : <><CheckCircle2 size={20}/> Confirm Check-In</>}
                </button>
              ) : (
                <div className="cci-already-msg">
                  <CheckCircle2 size={18}/> You are already checked in. Please proceed to the bus.
                </div>
              )}
            </div>

            <button className="cci-back-btn" onClick={reset}>← Scan another ticket</button>
          </div>
        )}

        {/* ══ SUCCESS ═════════════════════════════════════════ */}
        {step === "success" && booking && (
          <div className="cci-success-wrap">
            <div className="cci-success-card">
              <div className="cci-success-anim">
                <CheckCircle2 size={60}/>
              </div>
              <h2>Checked In!</h2>
              <p className="cci-success-name">{booking.passenger_name}</p>

              <div className="cci-success-route">
                <strong>{booking.from_city}</strong>
                <Bus size={18}/>
                <strong>{booking.to_city}</strong>
              </div>

              <div className="cci-success-details">
                <div><span>Departs</span><strong>{booking.departure_time}</strong></div>
                <div><span>Seats</span><strong>{booking.seat_numbers}</strong></div>
                <div><span>Date</span><strong>{booking.travel_date}</strong></div>
              </div>

              <div className="cci-success-msg">
                Have a safe and comfortable journey! 🚌
              </div>

              <button className="cci-done-btn" onClick={reset}>
                <RotateCcw size={15}/> Check In Another Passenger
              </button>
            </div>
          </div>
        )}

        {/* ══ ERROR ═══════════════════════════════════════════ */}
        {step === "error" && (
          <div className="cci-error-wrap">
            <div className="cci-error-card">
              <div className="cci-error-icon"><AlertTriangle size={48}/></div>
              <h2>Booking Not Found</h2>
              <p>{error}</p>
              <p className="cci-error-hint">
                Please check your booking code and try again.<br/>
                If the problem persists, contact our staff.
              </p>
              <div className="cci-error-actions">
                <button className="cci-retry-btn" onClick={() => { setStep("type"); setMode("type"); setError(""); }}>
                  Try Again
                </button>
                <button className="cci-back-btn" onClick={reset}>← Home</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}