import "./About.css";
import { useLanguage } from "../context/LanguageContext";
const { t } = useLanguage();

export default function About() {
  return (
    <div className="about-page">
      {/* Hero */}
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
            src="https://scontent.fpnh1-2.fna.fbcdn.net/v/t39.30808-6/672687353_122162782268930524_6565412347807004389_n.jpg?stp=dst-jpg_tt6&cstp=mx1707x2048&ctp=s1707x2048&_nc_cat=101&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeExPWGNBcn-rNlW9lVjUClfLe-UWFJAUdQt75RYUkBR1FRft1C5hldqwO9RC2V_in6eJzWkOofzZD0br-3wbiuV&_nc_ohc=lX6vzNvdaM8Q7kNvwEDlXk7&_nc_oc=Adpc56J0d68SCg22ZfeanCNr5OSBdr9ZIFOztRiJ67nfSaomkJXMc97p31hWl55zIkw&_nc_zt=23&_nc_ht=scontent.fpnh1-2.fna&_nc_gid=CF1Tl28kSO9BrXr1RRbudA&_nc_ss=7b2a8&oh=00_Af9oTydyeFfHRKdiyyIWYFnkCMR0YUH1o2Y_vSgSd6DqBA&oe=6A4875E5"
            alt="Cambodia Bus Express coach on the highway"
          />
        </div>
      </section>

      {/* Stats */}
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

      {/* Mission */}
      <section className="about-mission">
        <div className="about-mission__image">
          <img
            src="https://scontent.fpnh1-1.fna.fbcdn.net/v/t39.30808-6/702107069_122169944834930524_4887506534900695446_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1365&ctp=s2048x1365&_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeH4Z2uRGLOEJGRGbHnObDeIIb4VHHd00rMhvhUcd3TSszAy9VttETpduTx-hBrxXg_hbWCQUbPWjqTOBl19y9M3&_nc_ohc=jfg5mXqY7xIQ7kNvwFxUIom&_nc_oc=AdrGRP9wZ8jsNsoBQpFwSXxiH00ZwJVCEFA-64VLmwkr0RRDqCv_MEwUogaELpccxZg&_nc_zt=23&_nc_ht=scontent.fpnh1-1.fna&_nc_gid=4iL8y-DWfFRAydPFmw9L9A&_nc_ss=7b2a8&oh=00_Af9t5oDw0tP_n7hSy3RMTrbJRIFpgHzJCUT-SOi0a-IgJQ&oe=6A486D69"
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

      {/* Values */}
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

      {/* CTA */}
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