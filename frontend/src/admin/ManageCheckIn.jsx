import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Bus,
  ScanLine,
  Keyboard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  RotateCcw,
} from "lucide-react";
import "./StaffScan.css";
import { lookupBookingByCode, checkInBookingById } from "../services/booking";

const READER_ID = "staff-scan-reader";

// result.kind: "success" | "already" | "cancelled" | "not_found" | "error"
export default function StaffScan() {
  const [mode, setMode] = useState("camera"); // "camera" | "manual"
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (mode !== "camera" || result) return;

    const scanner = new Html5Qrcode(READER_ID);
    let stopped = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (stopped) return;
          stopped = true;
          scanner.stop().catch(() => {});
          handleCode(decodedText);
        }
      )
      .catch(() => {
        setResult({
          kind: "error",
          message: "Could not access the camera. Try manual entry instead.",
        });
        setMode("manual");
      });

    return () => {
      if (!stopped) scanner.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, result]);

  const handleCode = async (rawCode) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setBusy(true);
    try {
      // Step 1: look up the booking by code
      const booking = await lookupBookingByCode(code);

      if (booking.status && booking.status.toLowerCase() === "cancelled") {
        setResult({ kind: "cancelled", message: "This booking was cancelled.", data: booking });
        return;
      }

      if (booking.checked_in) {
        setResult({
          kind: "already",
          message: "This ticket was already checked in.",
          data: booking,
        });
        return;
      }

      // Step 2: confirm the check-in
      const updated = await checkInBookingById(booking.id);
      setResult({ kind: "success", data: { ...booking, ...updated } });
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ kind: "not_found", message: "No booking found for this code." });
      } else {
        setResult({ kind: "error", message: "Something went wrong. Try again." });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCode(manualCode);
    setManualCode("");
  };

  const scanNext = () => {
    setResult(null);
    setMode("camera");
  };

  const ticket = result?.data;

  return (
    <div className="ss-page">
      <div className="ss-shell">
        <section className="ss-hero">
          <div className="ss-hero-text">
            <span className="ss-hero-tag">
              <ScanLine size={15} />
              Gate check-in
            </span>
            <h1>Scan passenger ticket</h1>
            <p>Scan the QR code on the passenger's e-ticket, or type the booking code manually.</p>
          </div>
          <div className="ss-hero-icon">
            <Bus size={28} />
          </div>
        </section>

        {!result && (
          <>
            <div className="ss-tabs">
              <button
                className={mode === "camera" ? "active" : ""}
                onClick={() => setMode("camera")}
              >
                <ScanLine size={16} />
                Camera scan
              </button>
              <button
                className={mode === "manual" ? "active" : ""}
                onClick={() => setMode("manual")}
              >
                <Keyboard size={16} />
                Manual entry
              </button>
            </div>

            {mode === "camera" && (
              <div className="ss-scan-box">
                <div id={READER_ID} />
                <p className="ss-scan-hint">Point the camera at the ticket's QR code</p>
              </div>
            )}

            {mode === "manual" && (
              <form className="ss-manual-form" onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  placeholder="e.g. CBE-8F3K2A"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={busy}>
                  {busy ? "Checking..." : "Check in"}
                </button>
              </form>
            )}
          </>
        )}

        {result && (
          <div className={`ss-result ss-result-${result.kind}`}>
            <div className="ss-result-icon">
              {result.kind === "success" && <CheckCircle2 size={36} />}
              {result.kind === "already" && <AlertTriangle size={36} />}
              {(result.kind === "not_found" ||
                result.kind === "cancelled" ||
                result.kind === "error") && <XCircle size={36} />}
            </div>

            <h2>
              {result.kind === "success" && "Checked in"}
              {result.kind === "already" && "Already checked in"}
              {result.kind === "not_found" && "Not found"}
              {result.kind === "cancelled" && "Invalid ticket"}
              {result.kind === "error" && "Error"}
            </h2>

            {result.message && !ticket && <p className="ss-result-message">{result.message}</p>}

            {ticket && (
              <div className="ss-ticket-card">
                <div className="ss-ticket-route">
                  <MapPin size={15} />
                  {ticket.from_city} <span>→</span> {ticket.to_city}
                </div>
                <div className="ss-ticket-grid">
                  <div>
                    <User size={14} />
                    <span>{ticket.passenger_name || "N/A"}</span>
                  </div>
                  <div>
                    <Phone size={14} />
                    <span>{ticket.phone || "N/A"}</span>
                  </div>
                  <div>
                    <Calendar size={14} />
                    <span>{ticket.travel_date}</span>
                  </div>
                  <div>
                    <Clock size={14} />
                    <span>{ticket.departure_time}</span>
                  </div>
                  <div>
                    <Ticket size={14} />
                    <span>Seats {ticket.seat_numbers}</span>
                  </div>
                </div>
                <div className="ss-ticket-code">{ticket.booking_code}</div>
              </div>
            )}

            <button className="ss-scan-next" onClick={scanNext}>
              <RotateCcw size={16} />
              Scan next ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}