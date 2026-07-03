import { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./AppPromoModal.css";

export default function AppPromoModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem("access");
    const alreadyShown = sessionStorage.getItem("appPromoShown");

    if (isLoggedIn && !alreadyShown) {
      // Small delay so it doesn't pop instantly on page load
      const timer = setTimeout(() => {
        setVisible(true);
        sessionStorage.setItem("appPromoShown", "1");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="apm-overlay" onClick={() => setVisible(false)}>
      <div className="apm-card" onClick={(e) => e.stopPropagation()}>

        {/* Close button */}
        <button
          className="apm-close"
          onClick={() => setVisible(false)}
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {/* ── Top banner ── */}
        <div className="apm-banner">
          <div className="apm-circle apm-circle-1" />
          <div className="apm-circle apm-circle-2" />
          <div className="apm-bus-bg">🚌</div>

          <span className="apm-tag">
            📱 Mobile App
          </span>
          <h2 className="apm-title">
            Get the <em>Cambodia Bus</em><br />app on your phone
          </h2>
          <p className="apm-subtitle">
            Book tickets, track your bus and manage your trips — all on the go.
          </p>
        </div>

        {/* ── White body ── */}
        <div className="apm-body">

          {/* Feature pills */}
          <div className="apm-features">
            <span className="apm-feat">🎫 Book in seconds</span>
            <span className="apm-feat">📍 Live tracking</span>
            <span className="apm-feat">🔔 Trip alerts</span>
            <span className="apm-feat">📲 Digital ticket</span>
          </div>

          {/* Store buttons */}
          <div className="apm-stores">
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noreferrer"
              className="apm-store-btn"
            >
              <span className="apm-store-icon">▶</span>
              <div>
                <small>GET IT ON</small>
                <strong>Google Play</strong>
              </div>
            </a>
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noreferrer"
              className="apm-store-btn"
            >
              <span className="apm-store-icon"> </span>
              <div>
                <small>Download on the</small>
                <strong>App Store</strong>
              </div>
            </a>
          </div>

          {/* Divider */}
          <div className="apm-divider">
            <span>or scan to download</span>
          </div>

          {/* QR row */}
          <div className="apm-qr-row">
            <div className="apm-qr-box">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://cambodiabusexpress.com/app"
                alt="Scan to download app"
              />
            </div>
            <div className="apm-qr-text">
              <h4>
                Scan with your camera
                <span className="apm-qr-badge">⟳ Auto-detect</span>
              </h4>
              <p>
                Point your phone camera at the QR code — no app needed.
                Opens the store automatically on your device.
              </p>
            </div>
          </div>

          {/* Bottom */}
          <div className="apm-bottom">
            <p>Free to download. No account required to browse.</p>
            <button
              className="apm-remind"
              onClick={() => setVisible(false)}
            >
              Remind me later
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}