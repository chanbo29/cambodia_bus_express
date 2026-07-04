import { useEffect, useRef, useState } from "react";


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
    title: "",
    tag: "",
  },
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782921731/696734506_122168990546930524_7695005599975160121_n_hpcmd2.jpg",
    title: "",
    tag: "",
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
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782924151/632206418_122153741198930524_5139780497092700137_n_t2ldu6.jpg",
    title: "",
    tag: "",
  },
  {
    src: "https://res.cloudinary.com/jvwlddbl/image/upload/v1782924151/651009201_122157313316930524_5414813989880167356_n_ofaebq.jpg",
    title: "",
    tag: "",
  },
];

// How many pixels per second the track moves.
// Lower = slower, higher = faster.
const PIXELS_PER_SECOND = 60;

const VISIBLE_WITHOUT_SCROLL = 5;

export default function NewsPromotions() {
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(null);

  const needsAutoScroll = PROMO_IMAGES.length > VISIBLE_WITHOUT_SCROLL;

  // Duplicate list for seamless loop
  const marqueeItems = needsAutoScroll
    ? [...PROMO_IMAGES, ...PROMO_IMAGES]
    : PROMO_IMAGES;

  useEffect(() => {
    if (!needsAutoScroll || !trackRef.current) return;

    const calculate = () => {
      // scrollWidth is the full duplicated track width.
      // We only need to scroll half of it (one full set).
      const halfWidth = trackRef.current.scrollWidth / 2;
      // duration = distance / speed → same speed on every screen size
      const secs = halfWidth / PIXELS_PER_SECOND;
      setDuration(secs);
    };

    // Calculate after first paint so scrollWidth is accurate
    calculate();

    // Recalculate if the window resizes (e.g. rotation on mobile)
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, [needsAutoScroll]);

  return (
    <section className="news-promo-section">
      <h2 className="news-promo-heading">News &amp; Promotions</h2>

      <div
        className={`news-promo-viewport ${needsAutoScroll ? "scrolling" : ""}`}
      >
        {needsAutoScroll && (
          <>
            <div className="news-promo-fade left" />
            <div className="news-promo-fade right" />
          </>
        )}

        <div
          ref={trackRef}
          className={`news-promo-track ${
            needsAutoScroll ? "auto-scroll" : "static-grid"
          }`}
          style={
            needsAutoScroll && duration != null
              ? { animationDuration: `${duration}s` }
              : {}
          }
        >
          {marqueeItems.map((item, i) => (
            <div
              className="news-promo-card"
              key={`${item.src}-${i}`}
            >
              <img src={item.src} alt={item.title || "Promotion"} />
              {item.tag && (
                <span className="news-promo-tag">{item.tag}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}