import { useEffect, useState } from "react";
import {
  Bus,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Ticket,
  TrendingUp,
  Tag,
  FileBarChart,
  CalendarClock,
  ArrowUpRight,
  ClipboardCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";
import { useLanguage } from "../context/LanguageContext";
const { t } = useLanguage();

// Today's date in Cambodia time as "YYYY-MM-DD" — avoids the UTC-date bug
// where toISOString() can show yesterday/tomorrow depending on the
// server/browser's own timezone.
function getCambodiaTodayStr() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Phnom_Penh",
  });
}

// Current time in Cambodia, as a Date object whose hours/minutes can be
// read directly (the date portion is not meaningful, only time-of-day is).
function getCambodiaNow() {
  const str = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Phnom_Penh",
    hour12: false,
  });
  return new Date(str);
}

// Parses "HH:MM" (24h) or "7:30 AM" / "07:30 PM" style strings into
// {hours, minutes} (24h).
function parseDepartureTime(value) {
  if (!value) return null;

  const ampmMatch = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = Number(ampmMatch[1]);
    const minutes = Number(ampmMatch[2]);
    const isPM = ampmMatch[3].toUpperCase() === "PM";
    if (hours === 12) hours = 0;
    if (isPM) hours += 12;
    return { hours, minutes };
  }

  const hmMatch = value.match(/^(\d{1,2}):(\d{2})$/);
  if (hmMatch) {
    return { hours: Number(hmMatch[1]), minutes: Number(hmMatch[2]) };
  }

  return null;
}

// Status of a departure relative to the current Cambodia time:
// "departed" once its time has passed, "boarding" within 30 minutes of
// departure, otherwise "upcoming".
function getDepartureStatus(departureTimeStr) {
  const depTime = parseDepartureTime(departureTimeStr);
  if (!depTime) return "upcoming";

  const now = getCambodiaNow();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const depMinutes = depTime.hours * 60 + depTime.minutes;
  const diff = depMinutes - nowMinutes;

  if (diff < 0) return "departed";
  if (diff <= 30) return "boarding";
  return "upcoming";
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departureFilter, setDepartureFilter] = useState("all");

  useEffect(() => {
    Promise.all([API.get("/bookings/"), API.get("/schedules/")])
      .then(([bookingsRes, schedulesRes]) => {
        setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
        setSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  const today = getCambodiaTodayStr();

  // ---- Key metrics ----
  const totalRevenue = bookings.reduce(
    (sum, b) => sum + Number(b.total_price || 0),
    0
  );

  const todaysBookings = bookings.filter((b) => b.travel_date === today);

  const totalPassengers = bookings.reduce((sum, b) => {
    const count = b.seat_numbers
      ? b.seat_numbers.split(",").map((s) => s.trim()).filter(Boolean).length
      : 1;
    return sum + count;
  }, 0);

  // ---- Today's departures, grouped by route+time ----
  const todaysDepartures = schedules
    .map((s) => {
      const bookedToday = bookings.filter(
        (b) =>
          b.travel_date === today &&
          b.from_city === s.from_city &&
          b.to_city === s.to_city &&
          b.departure_time === s.departure_time
      );

      const bookedSeats = bookedToday.reduce((sum, b) => {
        const count = b.seat_numbers
          ? b.seat_numbers.split(",").map((x) => x.trim()).filter(Boolean).length
          : 1;
        return sum + count;
      }, 0);

      return { ...s, bookedSeats };
    })
    .sort((a, b) => (a.departure_time > b.departure_time ? 1 : -1));

  const filteredDepartures =
    departureFilter === "all"
      ? todaysDepartures
      : todaysDepartures.filter(
          (d) => getDepartureStatus(d.departure_time) === departureFilter
        );

  const departureCounts = {
    all: todaysDepartures.length,
    upcoming: todaysDepartures.filter(
      (d) => getDepartureStatus(d.departure_time) === "upcoming"
    ).length,
    boarding: todaysDepartures.filter(
      (d) => getDepartureStatus(d.departure_time) === "boarding"
    ).length,
    departed: todaysDepartures.filter(
      (d) => getDepartureStatus(d.departure_time) === "departed"
    ).length,
  };

  // ---- Recent bookings (latest 6) ----
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div>
            <Bus size={32} />
          </div>
          <section>
            <h2>Cambodia Bus</h2>
            <p>Admin Panel</p>
          </section>
        </div>

        <nav>
          <a className="active" onClick={() => navigate("/admin-dashboard")}>
            <Bus size={20} /> Dashboard
          </a>
          <a onClick={() => navigate("/admin-dashboard/routes")}>
            <MapPin size={20} /> Routes
          </a>
          <a onClick={() => navigate("/admin-dashboard/bookings")}>
            <Ticket size={20} /> Bookings
          </a>
          <a onClick={() => navigate("/admin-dashboard/checkin")}>
            <ClipboardCheck size={20} /> Check-In
          </a>
          {/* <a onClick={() => navigate("/admin-dashboard/users")}>
            <Users size={20} /> Users
          </a> */}
          <a onClick={() => navigate("/admin-dashboard/promotions")}>
            <Tag size={20} /> Promotions
          </a>
          <a onClick={() => navigate("/admin-dashboard/reports")}>
            <FileBarChart size={20} /> Reports
          </a>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Overview of bookings, routes, and today's activity.</p>
          </div>
        </header>

        <section className="admin-stats">
          <div>
            <DollarSign />
            <span>Total Revenue</span>
            <h3>${totalRevenue.toFixed(2)}</h3>
          </div>

          <div>
            <Ticket />
            <span>Total Bookings</span>
            <h3>{bookings.length}</h3>
          </div>

          <div>
            <Users />
            <span>Passengers Served</span>
            <h3>{totalPassengers}</h3>
          </div>

          <div>
            <MapPin />
            <span>Active Routes</span>
            <h3>{schedules.length}</h3>
          </div>
        </section>

        <section className="admin-stats">
          <div>
            <CalendarClock />
            <span>Today's Bookings</span>
            <h3>{todaysBookings.length}</h3>
          </div>

          <div>
            <TrendingUp />
            <span>Today's Revenue</span>
            <h3>
              $
              {todaysBookings
                .reduce((sum, b) => sum + Number(b.total_price || 0), 0)
                .toFixed(2)}
            </h3>
          </div>

          <div>
            <Bus />
            <span>Departures Today</span>
            <h3>{todaysDepartures.length}</h3>
          </div>

          <div>
            <Clock />
            <span>Avg. Ticket Price</span>
            <h3>
              $
              {bookings.length > 0
                ? (totalRevenue / bookings.length).toFixed(2)
                : "0.00"}
            </h3>
          </div>
        </section>

        <div className="dashboard-grid-2col">
          <section className="admin-card">
            <div className="card-title">
              <h2>Today's Departures</h2>
              <p>{loading ? "Loading..." : `${filteredDepartures.length} shown`}</p>
            </div>

            <div className="departure-filter-tabs">
              <button
                className={departureFilter === "all" ? "active" : ""}
                onClick={() => setDepartureFilter("all")}
              >
                All ({departureCounts.all})
              </button>
              <button
                className={departureFilter === "upcoming" ? "active" : ""}
                onClick={() => setDepartureFilter("upcoming")}
              >
                Upcoming ({departureCounts.upcoming})
              </button>
              <button
                className={departureFilter === "boarding" ? "active" : ""}
                onClick={() => setDepartureFilter("boarding")}
              >
                Boarding ({departureCounts.boarding})
              </button>
              <button
                className={departureFilter === "departed" ? "active" : ""}
                onClick={() => setDepartureFilter("departed")}
              >
                Departed ({departureCounts.departed})
              </button>
            </div>

            <div className="route-table">
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Type</th>
                    <th>Departs</th>
                    <th>Booked / Seats</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartures.map((d) => {
                    const status = getDepartureStatus(d.departure_time);
                    return (
                      <tr key={d.id}>
                        <td>
                          <strong>{d.from_city}</strong>
                          <span>→ {d.to_city}</span>
                        </td>
                        <td>{d.bus_type}</td>
                        <td>{d.departure_time}</td>
                        <td>
                          {d.bookedSeats} / {d.seats}
                        </td>
                        <td>
                          <span className={`departure-status-badge ${status}`}>
                            {status === "departed" && "Departed"}
                            {status === "boarding" && "Boarding"}
                            {status === "upcoming" && "Upcoming"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && filteredDepartures.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-table">
                        {departureFilter === "all"
                          ? "No departures scheduled today"
                          : `No ${departureFilter} departures right now`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-card">
            <div className="card-title">
              <h2>Recent Bookings</h2>
              <button
                className="view-all-btn"
                onClick={() => navigate("/admin-dashboard/bookings")}
              >
                View all <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="route-table">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Route</th>
                    <th>Passenger</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.booking_code}</td>
                      <td>
                        <strong>{b.from_city}</strong>
                        <span>→ {b.to_city}</span>
                      </td>
                      <td>{b.passenger_name}</td>
                      <td>${b.total_price}</td>
                    </tr>
                  ))}

                  {!loading && recentBookings.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-table">
                        No bookings yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}