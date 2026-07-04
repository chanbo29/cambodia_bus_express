import { useEffect, useRef } from "react";
import "./About.css";

export default function About() {
  const canvasRef = useRef(null);

  // ── Particle canvas ────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const hero = canvas.parentElement;
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
    const ctx = canvas.getContext("2d");
    const N = 55;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.8 + 0.4,
      a: Math.random() * 0.35 + 0.08,
    }));

    let raf;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(29,158,117,${p.a})`;
        ctx.fill();
      });
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(29,158,117,${0.07 * (1 - d / 90)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    const onResize = () => {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ── Intersection observer (counters + reveals) ─────────────
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          el.classList.add("visible");

          // Counter animation
          if (el.classList.contains("about-stat")) {
            const num = el.querySelector(".about-stat-num");
            const target = +el.dataset.target;
            const suffix = el.dataset.suffix || "";
            let start = 0;
            const dur = 1600;
            const step = (ts) => {
              if (!start) start = ts;
              const p = Math.min((ts - start) / dur, 1);
              const ease = 1 - Math.pow(1 - p, 3);
              num.textContent = Math.floor(ease * target) + suffix;
              if (p < 1) requestAnimationFrame(step);
              else num.textContent = target + suffix;
            };
            requestAnimationFrame(step);
          }

          // Timeline progress bar
          if (el.id === "tl4") {
            setTimeout(() => {
              const prog = document.getElementById("tl-prog");
              if (prog) prog.style.width = "75%";
            }, 300);
          }

          io.unobserve(el);
        });
      },
      { threshold: 0.2 }
    );

    const ids = [
      "map-head", "map-wrap",
      "m-img", "m-content",
      "v-head", "tl-head", "about-cta",
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    document.querySelectorAll(".about-stat").forEach((el) => io.observe(el));

    ["vc1", "vc2", "vc3", "vc4"].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.transitionDelay = i * 0.1 + "s";
        io.observe(el);
      }
    });

    ["tl1", "tl2", "tl3", "tl4"].forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.transitionDelay = i * 0.15 + "s";
        io.observe(el);
      }
    });

    return () => io.disconnect();
  }, []);

  return (
    <div className="about-page">

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="about-hero">
        <canvas ref={canvasRef} className="about-canvas" />
        <div className="about-hero-content">
          <span className="about-hero-tag">🇰🇭 Our Story · Our Mission · Our Promise</span>
          <h1>
            Connecting Cambodia,
            <em>One Journey at a Time</em>
          </h1>
          <p>
            Since 2014, Cambodia Bus Express has carried millions of passengers
            across the country safely and comfortably. We're proud to be the
            road that connects families, students, and travelers.
          </p>
          <div className="about-hero-actions">
            <a href="/booking" className="about-btn-primary">Book a Ticket →</a>
            <a href="/schedule" className="about-btn-ghost">Our routes →</a>
          </div>
        </div>
        <div className="about-hero-badge">
          <div className="about-badge-num">2M+</div>
          <div className="about-badge-label">Passengers served</div>
          <div className="about-badge-live">
            <div className="about-live-dot" />
            <span>Live tracking</span>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="about-stats">
        {[
          { icon: "🗓️", target: 10, suffix: "+", label: "Years on the Road" },
          { icon: "🗺️", target: 45, suffix: "",  label: "Routes Nationwide" },
          { icon: "🚌", target: 120, suffix: "", label: "Buses in Fleet" },
          { icon: "😊", target: 2,  suffix: "M+", label: "Happy Passengers" },
        ].map((s, i) => (
          <div
            key={i}
            className="about-stat"
            data-target={s.target}
            data-suffix={s.suffix}
          >
            <span className="about-stat-icon">{s.icon}</span>
            <div className="about-stat-num">0</div>
            <div className="about-stat-label">{s.label}</div>
            <div className="about-stat-bar" />
          </div>
        ))}
      </section>

      {/* ── Route map ───────────────────────────────────────── */}
      <section className="about-map-section">
        <div className="section-head" id="map-head">
          <h2>Our Routes Across Cambodia</h2>
          <p>Connecting cities with safe, comfortable, and affordable bus travel</p>
        </div>

        <div className="about-map-wrap" id="map-wrap">
          <div className="about-map-grid-bg" />
          <svg
            className="about-map-svg"
            viewBox="0 0 800 300"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Cambodia route map"
          >
            {/* Route paths */}
            <path id="r1" className="about-route-path" d="M200,190 Q310,130 420,95"/>
            <path id="r2" className="about-route-path" d="M200,190 Q230,240 250,262"/>
            <path id="r3" className="about-route-path" d="M420,95 Q520,82 610,105"/>
            <path id="r4" className="about-route-path" d="M200,190 Q350,180 490,165"/>
            <path id="r5" className="about-route-path" d="M490,165 Q560,140 610,105"/>

            {/* Buses animating along paths */}
            <text fontSize="18">
              🚌
              <animateMotion dur="4s" repeatCount="indefinite" begin="0s">
                <mpath href="#r1"/>
              </animateMotion>
            </text>
            <text fontSize="18">
              🚌
              <animateMotion dur="5.5s" repeatCount="indefinite" begin="1.5s">
                <mpath href="#r4"/>
              </animateMotion>
            </text>
            <text fontSize="18">
              🚌
              <animateMotion dur="6s" repeatCount="indefinite" begin="3s">
                <mpath href="#r3"/>
              </animateMotion>
            </text>

            {/* City: Phnom Penh */}
            <g className="about-city">
              <circle cx="200" cy="190" r="20" fill="none" stroke="#9FE1CB" strokeWidth="1" opacity="0">
                <animate attributeName="r" from="8" to="22" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="200" cy="190" r="8" fill="#9FE1CB" stroke="#021f1a" strokeWidth="2"/>
              <text x="200" y="216" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(159,225,203,0.8)">Phnom Penh</text>
            </g>

            {/* City: Siem Reap */}
            <g className="about-city">
              <circle cx="420" cy="95" r="20" fill="none" stroke="#9FE1CB" strokeWidth="1" opacity="0">
                <animate attributeName="r" from="8" to="22" dur="2s" begin="0.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin="0.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="420" cy="95" r="8" fill="#9FE1CB" stroke="#021f1a" strokeWidth="2"/>
              <text x="420" y="121" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(159,225,203,0.8)">Siem Reap</text>
            </g>

            {/* City: Sihanoukville */}
            <g className="about-city">
              <circle cx="250" cy="262" r="20" fill="none" stroke="#9FE1CB" strokeWidth="1" opacity="0">
                <animate attributeName="r" from="8" to="22" dur="2s" begin="1s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin="1s" repeatCount="indefinite"/>
              </circle>
              <circle cx="250" cy="262" r="8" fill="#9FE1CB" stroke="#021f1a" strokeWidth="2"/>
              <text x="250" y="252" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(159,225,203,0.8)">Sihanoukville</text>
            </g>

            {/* City: Battambang */}
            <g className="about-city">
              <circle cx="610" cy="105" r="20" fill="none" stroke="#9FE1CB" strokeWidth="1" opacity="0">
                <animate attributeName="r" from="8" to="22" dur="2s" begin="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin="1.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="610" cy="105" r="8" fill="#9FE1CB" stroke="#021f1a" strokeWidth="2"/>
              <text x="610" y="131" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(159,225,203,0.8)">Battambang</text>
            </g>

            {/* City: Kampot */}
            <g className="about-city">
              <circle cx="490" cy="165" r="20" fill="none" stroke="#9FE1CB" strokeWidth="1" opacity="0">
                <animate attributeName="r" from="8" to="22" dur="2s" begin="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="490" cy="165" r="8" fill="#9FE1CB" stroke="#021f1a" strokeWidth="2"/>
              <text x="490" y="191" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(159,225,203,0.8)">Kampot</text>
            </g>

            {/* Legend */}
            <rect x="20" y="20" width="170" height="54" rx="8" fill="rgba(4,52,44,0.6)" stroke="rgba(29,158,117,0.2)" strokeWidth="1"/>
            <circle cx="38" cy="40" r="5" fill="#9FE1CB"/>
            <text x="52" y="44" fontSize="11" fill="rgba(159,225,203,0.7)">City stop</text>
            <text x="30" y="66" fontSize="11" fill="rgba(159,225,203,0.5)">🚌 = Live bus on route</text>
          </svg>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────── */}
      <section className="about-mission">
        <div className="about-mission-img" id="m-img">
          <img
            src="https://res.cloudinary.com/jvwlddbl/image/upload/v1782921732/701123181_122169944774930524_7382350094244258584_n_dfaapw.jpg"
            alt="Passengers boarding a Cambodia Bus Express coach"
          />
          <div className="about-mission-overlay" />
        </div>
        <div className="about-mission-content" id="m-content">
          <div className="about-eyebrow">Why We Travel</div>
          <h2>Safety and comfort, every single trip</h2>
          <p>
            Every bus in our fleet is maintained on a strict schedule and driven
            by licensed, experienced drivers. From the moment you book your seat
            to the moment you arrive, our team works to make sure your journey
            is smooth, on time, and worry-free.
          </p>
          <ul className="about-checklist">
            <li><div className="about-check-box">✓</div>Daily vehicle safety inspections</li>
            <li><div className="about-check-box">✓</div>Trained, background-checked drivers</li>
            <li><div className="about-check-box">✓</div>Real-time trip tracking for every route</li>
          </ul>
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────── */}
      <section className="about-values">
        <div className="about-values-head" id="v-head">
          <h2>What We Stand For</h2>
          <p>Four pillars that guide every trip we operate</p>
        </div>
        <div className="about-values-grid">
          {[
            { id: "vc1", icon: "🛡️", title: "Safe & Secure", desc: "Your safety is our top priority on every route, every day." },
            { id: "vc2", icon: "🛋️", title: "Comfortable Seats", desc: "Spacious, reclining seats designed for long-distance comfort." },
            { id: "vc3", icon: "⚡", title: "Easy Booking", desc: "Book your ticket online in just a few clicks, anytime." },
            { id: "vc4", icon: "🎧", title: "24/7 Support", desc: "Our support team is here to help you anytime, anywhere." },
          ].map((v) => (
            <div key={v.id} id={v.id} className="about-val-card">
              <span className="about-val-icon">{v.icon}</span>
              <h4>{v.title}</h4>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Timeline ────────────────────────────────────────── */}
      <section className="about-timeline">
        <div className="about-tl-head" id="tl-head">
          <h2>Our Journey</h2>
          <p>From a small fleet in Phnom Penh to Cambodia's most trusted bus service</p>
        </div>
        <div className="about-tl-row">
          <div className="about-tl-line" />
          <div className="about-tl-progress" id="tl-prog" />
          {[
            { id: "tl1", icon: "🚌", year: "2014", title: "Founded", desc: "Started with 5 buses, Phnom Penh to Siem Reap" },
            { id: "tl2", icon: "🗺️", year: "2017", title: "20+ Routes", desc: "Added Sihanoukville, Battambang and Kampot" },
            { id: "tl3", icon: "💻", year: "2022", title: "Online Booking", desc: "Book seats and pay online easily" },
            { id: "tl4", icon: "🏆", year: "2026", title: "2M Passengers", desc: "Cambodia's most trusted bus service" },
          ].map((t) => (
            <div key={t.id} id={t.id} className="about-tl-item">
              <div className="about-tl-dot">{t.icon}</div>
              <div className="about-tl-year">{t.year}</div>
              <h4>{t.title}</h4>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="about-cta" id="about-cta">
        <h2>Ready for your next journey?</h2>
        <p>Book your seat in minutes and travel across Cambodia with us.</p>
        <a href="/booking" className="about-btn-primary" onClick={(e) => {
          e.preventDefault();
          window.location.href = "/booking";
        }}>
          Book Ticket Now →
        </a>
      </section>

    </div>
  );
}