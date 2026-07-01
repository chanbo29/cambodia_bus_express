import "./About.css";

export default function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero__dots" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} />
          ))}
        </div>

        <div className="about-hero__content">
          <span className="about-hero__tag">
            • OUR STORY • OUR MISSION • OUR PROMISE
          </span>
          <h1 className="about-hero__title">
            Connecting Cambodia,
            <br />
            <span>One Journey at a Time</span>
          </h1>
          <p className="about-hero__lede">
            Since 2014, Cambodia Bus Express has carried millions of
            passengers across the country safely and comfortably. We're
            proud to be the road that connects families, students, and
            travelers to where they need to be.
          </p>
        </div>

        <div className="about-hero__image">
          <img
            src="https://res.cloudinary.com/jvwlddbl/image/upload/v1782926596/NIGHT_BUS_gun15z.png"
            alt="Cambodia Bus Express coach on the highway"
          />
        </div>
      </section>

      <section className="about-stats">
        <div className="about-stats__item">
          <h3>10+</h3>
          <p>Years on the Road</p>
        </div>
        <div className="about-stats__item">
          <h3>45</h3>
          <p>Routes Nationwide</p>
        </div>
        <div className="about-stats__item">
          <h3>120</h3>
          <p>Buses in Our Fleet</p>
        </div>
        <div className="about-stats__item">
          <h3>2M+</h3>
          <p>Happy Passengers</p>
        </div>
      </section>

      <section className="about-mission">
        <div className="about-mission__image">
          <img
            src="https://res.cloudinary.com/jvwlddbl/image/upload/v1782926596/VAN_wsmt3p.png"
            alt="Passengers boarding a bus"
          />
        </div>
        <div className="about-mission__content">
          <span className="about-mission__eyebrow">Why We Travel</span>
          <h2>Safety and comfort, every single trip</h2>
          <p>
            Every bus in our fleet is maintained on a strict schedule and
            driven by licensed, experienced drivers. From the moment you
            book your seat to the moment you arrive, our team works to make
            sure your journey is smooth, on time, and worry-free.
          </p>
          <ul className="about-mission__list">
            <li>Daily vehicle safety inspections</li>
            <li>Trained, background-checked drivers</li>
            <li>Real-time trip tracking for every route</li>
          </ul>
        </div>
      </section>

      <section className="about-values">
        <div className="about-values__item">
          <div className="about-values__icon">🛡️</div>
          <h4>Safe &amp; Secure</h4>
          <p>Your safety is our top priority on every route, every day.</p>
        </div>
        <div className="about-values__item">
          <div className="about-values__icon">🛋️</div>
          <h4>Comfortable Seats</h4>
          <p>Spacious, reclining seats designed for long-distance comfort.</p>
        </div>
        <div className="about-values__item">
          <div className="about-values__icon">⚡</div>
          <h4>Easy Booking</h4>
          <p>Book your ticket online in just a few clicks, anytime.</p>
        </div>
        <div className="about-values__item">
          <div className="about-values__icon">🎧</div>
          <h4>24/7 Support</h4>
          <p>Our support team is here to help you anytime, anywhere.</p>
        </div>
      </section>

      <section className="about-cta">
        <h2>Ready for your next journey?</h2>
        <p>Book your seat in minutes and travel across Cambodia with us.</p>
        <a href="/booking" className="about-cta__btn">
          Book Ticket Now <span aria-hidden="true">→</span>
        </a>
      </section>
    </div>
  );
}