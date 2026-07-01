import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function AppPromoModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem("access");
    const alreadyShown = sessionStorage.getItem("appPromoShown");

    if (isLoggedIn && !alreadyShown) {
      setVisible(true);
      sessionStorage.setItem("appPromoShown", "1");
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="app-promo-overlay" onClick={() => setVisible(false)}>
      <div className="app-promo-card" onClick={(e) => e.stopPropagation()}>
        <button className="app-promo-close" onClick={() => setVisible(false)}>
          <X size={18} />
        </button>

        <div className="app-promo-content">
          <div className="app-promo-text">
            <h2>Download</h2>
            <p>Our mobile app</p>

            <div className="app-promo-buttons">
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noreferrer"
                className="app-promo-store-btn"
              >
                <span>GET IT ON</span>
                <strong>Google Play</strong>
              </a>

              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noreferrer"
                className="app-promo-store-btn"
              >
                <span>Download on the</span>
                <strong>App Store</strong>
              </a>
            </div>
          </div>

          <div className="app-promo-qr">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://cambodiabusexpress.com/app"
              alt="Scan to download app"
            />
            <small>Scan To Download</small>
          </div>
        </div>
      </div>
    </div>
  );
}