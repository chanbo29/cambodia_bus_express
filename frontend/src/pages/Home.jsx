import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppPromoModal from "../components/AppPromoModal";
import NewsPromotions from "../components/NewsPromotions";
import "./Home.css";
import { useLanguage } from "../context/LanguageContext";
import "./AppPromoModal.css";
import "./NewsPromotions.css";
import {
  MapPin,
  CalendarDays,
  Search,
  ArrowRight,
  Repeat2,
  Armchair,
  ShieldCheck,
  Zap,
  Headphones,
  Users,
  Clock,
  Bus,
} from "lucide-react";

const HERO_IMAGES = [
  "https://scontent.fpnh1-2.fna.fbcdn.net/v/t39.30808-6/687818738_122165825672930524_7811700234168784521_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1365&ctp=s2048x1365&_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHtLrntpT183iQW-pIgkMKKIzhQ_i-RNDwjOFD-L5E0PET5rWlCHLD4SOGloQ97Q-3uGHCIpgJjRc3lzW1hxaW3&_nc_ohc=Ras1v4X44j8Q7kNvwGqe8Yd&_nc_oc=AdoJ6Z548qRbfNYNbLyu414AfQ8YpDQAbZ0T1mt0fHasZJOE_6FTij87g0YZlDIC0oI&_nc_zt=23&_nc_ht=scontent.fpnh1-2.fna&_nc_gid=Ldc1Vu3Zsk0OJVk1cOSFpw&_nc_ss=7b2a8&oh=00_Af_a9t-MMfcy5z97o0QbiV-B_Axsj2DLrx-9JwMAZzCxEw&oe=6A443831",
  "https://scontent.fpnh1-1.fna.fbcdn.net/v/t39.30808-6/689300154_122165825588930524_662632099761546958_n.jpg?stp=dst-jpg_tt6&cstp=mx1333x1333&ctp=s1333x1333&_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeF4cwWBsTUxnYLAoRKjqdfaEjZNkyqebqQSNk2TKp5upFhZrFKNHdIiI8eLdslTyGYRZ56z9dJtWWmNMLb482W3&_nc_ohc=1jMvN1124VUQ7kNvwHpefRK&_nc_oc=AdoygY4qsWof-l0Iok36q3DSexEZfHHamIrNNCfvwFLyEme3jZ7L0QGSxRbhvVc_MzM&_nc_zt=23&_nc_ht=scontent.fpnh1-1.fna&_nc_gid=l7PYtMxMeboKOCP3OBsayg&_nc_ss=7b2a8&oh=00_Af9NXtMdqlBXJHE-gyZr0YrcfWf_JmRr9OWs3LKuuRIilw&oe=6A4450AA",
  "https://scontent.fpnh1-2.fna.fbcdn.net/v/t39.30808-6/687385754_122165825594930524_442183138976551976_n.jpg?stp=dst-jpg_tt6&cstp=mx1333x1333&ctp=s1333x1333&_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFwePRWPtr2bq_8U3MlphwYFnEMoq_3zggWcQyir_fOCPcSs_SDCPNufeWfNZmlBqXcfCHEkXVYmfn1c2b1Ty2i&_nc_ohc=tj7vvJuKcNkQ7kNvwG7iQjj&_nc_oc=Adqp8adN5vcdf8HiNdxVXCRN7q3btNVets5YfAXKF0RQiPGNL5krFzA-9x9txaNRLuM&_nc_zt=23&_nc_ht=scontent.fpnh1-2.fna&_nc_gid=Bylp-qI7nXmda6aJa-M7Cg&_nc_ss=7b2a8&oh=00_Af92T5YuVD2fCvnyJGN0sNHS3JvhrGZKCu91WfJYWWHWDg&oe=6A444C89",
  "https://scontent.fpnh1-2.fna.fbcdn.net/v/t39.30808-6/687759227_122165825570930524_5274866822242586995_n.jpg?stp=dst-jpg_tt6&cstp=mx1333x1333&ctp=s1333x1333&_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeE_tnE-MVMn23TjLzkzSBiUjDQXKpkYOhSMNBcqmRg6FKVltOyrXDvTMLTQbbfM1BYrOIeKP5C23kPUebXrPlNF&_nc_ohc=ZSNr7akuB1oQ7kNvwFVrAmm&_nc_oc=Adq_E_jv4M6YitWs3xO9UYQSgWawztBMOmbUaW1l_-Jg5w2Mbx7ygr_dyWnoihBkG4c&_nc_zt=23&_nc_ht=scontent.fpnh1-2.fna&_nc_gid=cZ8kWC5vAthNwP95IwUFmg&_nc_ss=7b2a8&oh=00_Af9jPqQL5IsaK8q_IhxiV_zZ05xuZ9e1z1LMsMvzVdFYOQ&oe=6A4435C1",
];

export default function Home() {
  const navigate = useNavigate();

  const [trip, setTrip] = useState({
    from: "",
    to: "",
    date: "",
    passengers: "1",
  });

  const [activeImage, setActiveImage] = useState(0);

  // Auto-advance the hero image every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const searchBuses = () => {
    localStorage.setItem(
      "bookingData",
      JSON.stringify({
        from_city: trip.from,
        to_city: trip.to,
        travel_date: trip.date,
        passengers: trip.passengers,
        departure_time: trip.time,
      })
    );

    navigate("/booking");
  };

  const swapCities = () => {
    setTrip({
      ...trip,
      from: trip.to,
      to: trip.from,
    });
  };

  return (
    <main className="home-page">
      <AppPromoModal />

      <section className="home-hero">
        <div className="hero-dots dots-left"></div>

        <div className="home-content">
          <span className="home-tag">
            TRAVEL SAFE • TRAVEL EASY • TRAVEL HAPPY
          </span>

          <h1>
            Travel Across <br />
            Cambodia <br />
            <strong>Safely &</strong> <br />
            <strong>Comfortably</strong>
          </h1>

          <p>
            Book your bus tickets online easily, choose your seats, and enjoy
            your journey with Cambodia Bus Express.
          </p>

          <button className="home-book-btn" onClick={searchBuses}>
            Book Ticket Now <ArrowRight size={18} />
          </button>
        </div>

        <div className="home-bus-img">
          {HERO_IMAGES.map((src, index) => (
            <img
              key={src}
              src={src}
              alt="Cambodia Bus Express"
              className={index === activeImage ? "active" : ""}
            />
          ))}

          <div className="hero-slider-dots">
            {HERO_IMAGES.map((_, index) => (
              <button
                key={index}
                className={index === activeImage ? "active" : ""}
                onClick={() => setActiveImage(index)}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>

          <div className="hero-stat-chip top">
            <strong>2M+</strong>
            <span>Happy Riders</span>
          </div>

          <div className="hero-stat-chip bottom">
            <strong>84</strong>
            <span>Routes Nationwide</span>
          </div>
        </div>

        <div className="hero-dots dots-right"></div>
      </section>

      <section className="home-search">
        <SearchField icon={<MapPin />} label="From">
          <select
            value={trip.from}
            onChange={(e) => setTrip({ ...trip, from: e.target.value })}
          >
            <option value="">Select departure</option>
            <option value="Phnom Penh">Phnom Penh</option>
            <option value="Siem Reap">Siem Reap</option>
            <option value="Battambang">Battambang</option>
            <option value="Kampot">Kampot</option>
            <option value="Sihanoukville">Sihanoukville</option>
          </select>
        </SearchField>

        <button className="home-swap" onClick={swapCities} type="button">
          <Repeat2 size={22} />
        </button>

        <SearchField icon={<MapPin />} label="To">
          <select
            value={trip.to}
            onChange={(e) => setTrip({ ...trip, to: e.target.value })}
          >
            <option value="">Select destination</option>
            <option value="Siem Reap">Siem Reap</option>
            <option value="Phnom Penh">Phnom Penh</option>
            <option value="Sihanoukville">Sihanoukville</option>
            <option value="Battambang">Battambang</option>
            <option value="Kampot">Kampot</option>
          </select>
        </SearchField>

        <SearchField icon={<CalendarDays />} label="Date">
          <input
            type="date"
            value={trip.date}
            onChange={(e) => setTrip({ ...trip, date: e.target.value })}
          />
        </SearchField>

        <SearchField icon={<Users />} label="Passengers">
          <select
            value={trip.passengers}
            onChange={(e) => setTrip({ ...trip, passengers: e.target.value })}
          >
            <option value="1">1 Passenger</option>
            <option value="2">2 Passengers</option>
            <option value="3">3 Passengers</option>
            <option value="4">4 Passengers</option>
            <option value="5">5 Passengers</option>
          </select>
        </SearchField>

        <button className="home-search-btn" onClick={searchBuses}>
          <Search size={21} />
          Search Buses
        </button>
      </section>

      <section className="home-features">
        <Feature
          icon={<Armchair />}
          title="Comfortable Seats"
          text="Spacious and comfortable seats for your journey"
        />

        <Feature
          icon={<ShieldCheck />}
          title="Safe & Secure"
          text="Your safety is our top priority"
        />

        <Feature
          icon={<Zap />}
          title="Easy Booking"
          text="Book tickets online in just a few clicks"
        />

        <Feature
          icon={<Headphones />}
          title="24/7 Support"
          text="We're here to help you anytime, anywhere"
        />
      </section>

      <NewsPromotions />

      <section className="popular-routes-section">
        <div className="section-heading">
          <span>Popular Routes</span>
          <h2>Explore Top Bus Routes</h2>
          <p>Choose your favorite destination and start your trip today.</p>
        </div>

        <div className="popular-route-grid">
          <RouteCard
            from="Phnom Penh"
            to="Siem Reap"
            time="5 - 6 hrs"
            price="$1X"
            image="https://media.istockphoto.com/id/519306346/photo/sunset-over-phnom-penh.jpg?s=612x612&w=0&k=20&c=gMD5CoIjR-x-grpcO-ejvy3U8gp9K_qsY14LxAzdDRk="
          />

          <RouteCard
            from="Phnom Penh"
            to="Sihanoukville"
            time="3 - 4 hrs"
            price="$1X"
            image="https://www.greeneratravel.com/userfiles/850x450-sihanoukville.jpg"
          />

          <RouteCard
            from="Phnom Penh"
            to="Battambang"
            time="4 - 5 hrs"
            price="$1X"
            image="https://www.asiakingtravel.com/images/thumbs/2025/05/20099/484485091-954347766728937-8962258597941090426-n_1296x730xcrop.webp"
          />

          <RouteCard
            from="Siem Reap"
            to="Phnom Penh"
            time="5 - 6 hrs"
            price="$1X"
            image="https://www.geckoroutes.com/_next/image/?url=%2Fimages%2Fwp-uploads%2F2020%2F06%2Fsiem-reap-cambodia.jpg&w=3840&q=75"
          />
        </div>
      </section>
    </main>
  );
}

function SearchField({ icon, label, children }) {
  return (
    <div className="home-search-item">
      <div className="home-search-icon">{icon}</div>

      <div>
        <small>{label}</small>
        {children}
      </div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="home-feature">
      <div className="home-feature-icon">{icon}</div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function RouteCard({ from, to, time, price, image }) {
  const navigate = useNavigate();

  const bookRoute = () => {
    localStorage.setItem(
      "bookingData",
      JSON.stringify({
        from_city: from,
        to_city: to,
        travel_date: "",
        passengers: "1",
      })
    );

    navigate("/booking");
  };

  return (
    <div className="popular-route-card">
      <img src={image} alt={to} />

      <div className="popular-route-body">
        <div>
          <h3>{from}</h3>
          <p>→ {to}</p>
        </div>

        <div className="route-meta">
          <span>
            <Clock size={15} />
            {time}
          </span>

          <strong>{price}</strong>
        </div>

        <button onClick={bookRoute}>
          <Bus size={18} />
          Book Now
        </button>
      </div>
    </div>
  );
}