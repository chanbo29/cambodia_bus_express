import { useEffect, useRef, useState, useCallback } from "react";

const PROMO_IMAGES = [
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782921733/688304995_122168342240930524_871956963636454236_n_rq1vqf.jpg",
    title: "Happy Father's Day",
    tag: "Father's Day",
  },
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782921733/726868848_2919129251771109_229754996216978784_n_gn82ej.jpg",
    title: "Siem Reap Express Now Open",
    tag: "New Route",
  },
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782921732/707843890_122171604482930524_6553122813415326891_n_vwhnm8.jpg",
    title: "Sihanoukville Weekend Getaway",
    tag: "Promo",
  },
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782921732/705387882_122170578674930524_2916474511808824980_n_t34sd1.jpg",
    title: "Book Early, Save More",
    tag: "Save 20%",
  },
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782921732/704467899_122170329038930524_5024689999608613795_n_ujyrbx.jpg",
    title: "Cambodia Bus Express",
    tag: "Update",
  },
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782921731/696734506_122168990546930524_7695005599975160121_n_hpcmd2.jpg",
    title: "New Routes Available",
    tag: "Routes",
  },
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782924151/658133175_122160127694930524_6280922826816495072_n_oess68.jpg",
    title: "",
    tag: "",
  },
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782924151/672687353_122162782268930524_6565412347807004389_n_lfcoi9.jpg",
    title: "",
    tag: "",
  },
];

const N = PROMO_IMAGES.length;
const RADIUS = 320;
const AUTO_INTERVAL = 3000;

export default function NewsPromotions() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [angle, setAngle] = useState(0);
  const carouselRef = useRef(null);
  const timerRef = useRef(null);

  const goTo = useCallback((index) => {
    const i = ((index % N) + N) % N;
    const targetAngle = -(360 / N) * i;
    setCurrent(i);
    setAngle(targetAngle);
    if (carouselRef.current) {
      carouselRef.current.style.animation = "none";
      carouselRef.current.style.transform = `rotateY(${targetAngle}deg)`;
    }
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto rotate
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => {
        const i = (c + 1) % N;
        const targetAngle = -(360 / N) * i;
        setAngle(targetAngle);
        if (carouselRef.current) {
          carouselRef.current.style.animation = "none";
          carouselRef.current.style.transform = `rotateY(${targetAngle}deg)`;
        }
        return i;
      });
    }, AUTO_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  const activeItem = PROMO_IMAGES[current];

  return (
    <section className="np-section">
      <div className="np-header">
        <h2 className="np-title">
          News & <span>Promotions</span>
        </h2>
        <div className="np-controls">
          <button className="np-btn" onClick={prev} aria-label="Previous">
            ←
          </button>
          <button className="np-btn" onClick={next} aria-label="Next">
            →
          </button>
        </div>
      </div>

      {/* 3D Stage */}
      <div
        className="np-stage"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="np-carousel" ref={carouselRef}>
          {PROMO_IMAGES.map((item, i) => {
            const itemAngle = (360 / N) * i;
            return (
              <div
                key={i}
                className="np-slide"
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${RADIUS}px)`,
                }}
                onClick={() => goTo(i)}
              >
                <img src={item.src} alt={item.title || "Promotion"} loading="lazy" />
                <div className="np-slide-overlay" />
                {item.tag && <span className="np-slide-tag">{item.tag}</span>}
                {item.title && <p className="np-slide-title">{item.title}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="np-dots">
        {PROMO_IMAGES.map((_, i) => (
          <button
            key={i}
            className={`np-dot ${i === current ? "active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Active slide info */}
      <div className="np-active-info">
        {activeItem.tag && (
          <span className="np-active-tag">{activeItem.tag}</span>
        )}
        {activeItem.title && (
          <p className="np-active-title">{activeItem.title}</p>
        )}
      </div>
    </section>
  );
}