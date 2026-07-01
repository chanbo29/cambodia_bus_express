import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bus,
  Clock,
  MapPin,
  Users,
  Wifi,
  Snowflake,
  Armchair,
  ShieldCheck,
  ArrowRight,
  CalendarDays,
  Search,
  Star,
} from "lucide-react";

export default function Schedule() {
  const navigate = useNavigate();

  const bookingData =
    JSON.parse(localStorage.getItem("bookingData")) || {
      from_city: "Phnom Penh",
      to_city: "Siem Reap",
      travel_date: "2026-06-21",
      passengers: "1",
    };

  const defaultSchedules = [
    {
      id: 1,
      from_city: "Phnom Penh",
      to_city: "Siem Reap",
      bus_name: "VIP Bus",
      bus_type: "VIP",
      departure_time: "07:30 AM",
      arrival_time: "01:30 PM",
      duration: "6 hrs",
      seats: 32,
      price: 12,
      rating: 4.8,
    },
    {
      id: 2,
      from_city: "Phnom Penh",
      to_city: "Siem Reap",
      bus_name: "Express Bus",
      bus_type: "Standard",
      departure_time: "09:00 AM",
      arrival_time: "03:00 PM",
      duration: "6 hrs",
      seats: 35,
      price: 10,
      rating: 4.5,
    },
    {
      id: 3,
      from_city: "Phnom Penh",
      to_city: "Siem Reap",
      bus_name: "Night Bus",
      bus_type: "Sleeper",
      departure_time: "10:30 PM",
      arrival_time: "05:30 AM",
      duration: "7 hrs",
      seats: 28,
      price: 15,
      rating: 4.7,
    },
    {
      id: 4,
      from_city: "Phnom Penh",
      to_city: "Battambang",
      bus_name: "Express Bus",
      bus_type: "Standard",
      departure_time: "08:00 AM",
      arrival_time: "01:00 PM",
      duration: "5 hrs",
      seats: 35,
      price: 11,
      rating: 4.6,
    },
    {
      id: 5,
      from_city: "Phnom Penh",
      to_city: "Battambang",
      bus_name: "VIP Minibus",
      bus_type: "VIP",
      departure_time: "01:30 PM",
      arrival_time: "06:30 PM",
      duration: "5 hrs",
      seats: 18,
      price: 13,
      rating: 4.8,
    },
    {
      id: 6,
      from_city: "Phnom Penh",
      to_city: "Battambang",
      bus_name: "Night Bus",
      bus_type: "Sleeper",
      departure_time: "09:30 PM",
      arrival_time: "03:30 AM",
      duration: "6 hrs",
      seats: 28,
      price: 16,
      rating: 4.5,
    },
    {
      id: 7,
      from_city: "Phnom Penh",
      to_city: "Sihanoukville",
      bus_name: "Express Bus",
      bus_type: "Standard",
      departure_time: "08:30 AM",
      arrival_time: "12:30 PM",
      duration: "4 hrs",
      seats: 35,
      price: 10,
      rating: 4.4,
    },
    {
      id: 8,
      from_city: "Phnom Penh",
      to_city: "Kampot",
      bus_name: "VIP Minibus",
      bus_type: "VIP",
      departure_time: "07:00 AM",
      arrival_time: "10:30 AM",
      duration: "3.5 hrs",
      seats: 18,
      price: 9,
      rating: 4.7,
    },
  ];

  const [schedules, setSchedules] = useState(defaultSchedules);
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    // Later when Django schedule API works, uncomment this:
    /*
    fetch("http://127.0.0.1:8000/api/schedules/")
      .then((res) => res.json())
      .then((data) => setSchedules(data))
      .catch(() => setSchedules(defaultSchedules));
    */
  }, []);

  const filteredByRoute = schedules.filter(
    (bus) =>
      bus.from_city === bookingData.from_city &&
      bus.to_city === bookingData.to_city
  );

  let displaySchedules =
    filteredByRoute.length > 0 ? filteredByRoute : schedules;

  if (filterType !== "All") {
    displaySchedules = displaySchedules.filter(
      (bus) => bus.bus_type === filterType
    );
  }

  const selectBus = (bus) => {
    localStorage.setItem(
      "bookingData",
      JSON.stringify({
        ...bookingData,
        from_city: bus.from_city,
        to_city: bus.to_city,
        vehicle_type: bus.bus_name,
        bus_type: bus.bus_type,
        departure_time: bus.departure_time,
        arrival_time: bus.arrival_time,
        duration: bus.duration,
        price_per_seat: Number(bus.price),
      })
    );

    navigate("/seat-selection");
  };

  return (
    <main className="schedule-v2-page">
      <section className="schedule-v2-hero">
        <div>
          <span>AVAILABLE BUSES</span>
          <h1>Select Your Schedule</h1>
          <p>
            Choose the best bus for your trip and continue to seat selection.
          </p>
        </div>

        <div className="schedule-v2-hero-icon">
          <Bus size={80} />
        </div>
      </section>

      <section className="schedule-v2-container">
        <div className="trip-summary-bar">
          <SummaryItem
            icon={<MapPin />}
            label="Route"
            value={`${bookingData.from_city} → ${bookingData.to_city}`}
          />

          <SummaryItem
            icon={<CalendarDays />}
            label="Date"
            value={bookingData.travel_date || "Not selected"}
          />

          <SummaryItem
            icon={<Users />}
            label="Passengers"
            value={bookingData.passengers || "1"}
          />

          <button onClick={() => navigate("/")}>Change Search</button>
        </div>

        <div className="schedule-v2-title">
          <div>
            <h2>Available Schedules</h2>
            <p>{displaySchedules.length} buses found for your route</p>
          </div>

          <div className="schedule-filter">
            {["All", "VIP", "Standard", "Sleeper"].map((type) => (
              <button
                key={type}
                className={filterType === type ? "active" : ""}
                onClick={() => setFilterType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {displaySchedules.length === 0 ? (
          <div className="no-schedule-box">
            <Search size={45} />
            <h2>No schedules found</h2>
            <p>Please change your route or travel date.</p>
            <button onClick={() => navigate("/")}>Back to Search</button>
          </div>
        ) : (
          <div className="schedule-v2-list">
            {displaySchedules.map((bus) => (
              <div className="schedule-v2-card" key={bus.id}>
                <div className="bus-badge">
                  <Bus size={36} />
                </div>

                <div className="schedule-card-content">
                  <div className="schedule-card-head">
                    <div>
                      <h3>{bus.bus_name}</h3>
                      <div className="bus-tags">
                        <span>{bus.bus_type}</span>
                        <span className="rating">
                          <Star size={14} fill="currentColor" />
                          {bus.rating}
                        </span>
                      </div>
                    </div>

                    <div className="bus-price">
                      <small>Price / Seat</small>
                      <strong>${Number(bus.price).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="time-line-box">
                    <div>
                      <small>Departure</small>
                      <h4>{bus.departure_time}</h4>
                      <p>{bus.from_city}</p>
                    </div>

                    <div className="middle-duration">
                      <Clock size={16} />
                      <span>{bus.duration}</span>
                    </div>

                    <div>
                      <small>Arrival</small>
                      <h4>{bus.arrival_time}</h4>
                      <p>{bus.to_city}</p>
                    </div>
                  </div>

                  <div className="bus-feature-row">
                    <Feature icon={<Armchair />} text="Comfort Seat" />
                    <Feature icon={<Snowflake />} text="Air Conditioner" />
                    <Feature icon={<Wifi />} text="Free WiFi" />
                    <Feature icon={<ShieldCheck />} text="Safe Travel" />
                    <Feature icon={<Users />} text={`${bus.seats} Seats`} />
                  </div>
                </div>

                <button
                  className="select-schedule-btn"
                  onClick={() => selectBus(bus)}
                >
                  Select Bus
                  <ArrowRight size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="trip-summary-item">
      <div>{icon}</div>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Feature({ icon, text }) {
  return (
    <span>
      {icon}
      {text}
    </span>
  );
}