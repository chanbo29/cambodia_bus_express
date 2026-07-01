import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bus,
  Calendar,
  Clock,
  Download,
  Eye,
  Ticket,
  CheckCircle,
  Search,
  User,
  CreditCard,
  RefreshCcw,
  ChevronDown,
  Filter,
  X,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import "./TicketHistory.css";
import { useLanguage } from "../context/LanguageContext";

// Default photo per vehicle type, shown when there's no admin-uploaded image
const DEFAULT_IMAGE_BY_TYPE = {
  "VIP Van": "https://res.cloudinary.com/jvwlddbl/image/upload/v1782926596/VAN_wsmt3p.png",
  "Night Bus": "https://res.cloudinary.com/jvwlddbl/image/upload/v1782926596/NIGHT_BUS_gun15z.png",
};
import { getBookings } from "../services/booking";

// Current time in Cambodia, plus today's date string in Cambodia time.
function getCambodiaNow() {
  const str = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Phnom_Penh",
    hour12: false,
  });
  return new Date(str);
}

function getCambodiaTodayStr() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Phnom_Penh",
  });
}

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

// Returns { status, minutesLeft } for check-in reminders.
// status: "urgent" (<=10 min), "reminder" (<=20 min), or null (not due yet,
// already departed, or not travelling today).
function getCheckInStatus(item) {
  if (item.travel_date !== getCambodiaTodayStr()) return { status: null };

  const depTime = parseDepartureTime(item.departure_time);
  if (!depTime) return { status: null };

  const now = getCambodiaNow();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const depMinutes = depTime.hours * 60 + depTime.minutes;
  const minutesLeft = depMinutes - nowMinutes;

  if (minutesLeft < 0) return { status: null, minutesLeft }; // already departed
  if (minutesLeft <= 10) return { status: "urgent", minutesLeft };
  if (minutesLeft <= 20) return { status: "reminder", minutesLeft };
  return { status: null, minutesLeft };
}

export default function TicketHistory() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = () => {
    getBookings()
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch((err) => console.log(err));
  };

  const passengerCount = (item) => {
    if (!item?.seat_numbers) return 1;
    return item.seat_numbers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean).length;
  };

  const formatBookedAt = (item) => {
    if (!item?.created_at) return null;
    return new Date(item.created_at).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Phnom_Penh",
    });
  };

  const downloadTicket = (item) => {
    const text = `
CAMBODIA BUS EXPRESS

Booking Code: ${item.booking_code}
Passenger: ${item.passenger_name || "N/A"}
Phone: ${item.phone || "N/A"}
Route: ${item.from_city} → ${item.to_city}
Date: ${item.travel_date}
Departure: ${item.departure_time}
Vehicle: ${item.vehicle_type}
Seats: ${item.seat_numbers}
Passengers: ${passengerCount(item)}
Total: $${item.total_price}
Status: ${item.status || "Paid"}
`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.booking_code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bookAgain = (item) => {
    localStorage.setItem(
      "bookingData",
      JSON.stringify({
        from: item.from_city,
        to: item.to_city,
        date: item.travel_date,
        passengers: passengerCount(item),
      })
    );
    navigate("/booking");
  };

  const closeTicket = () => {
    setClosing(true);
    setTimeout(() => {
      setSelectedTicket(null);
      setClosing(false);
    }, 220);
  };

  const filteredBookings = bookings
    .filter((item) => {
      const text = search.toLowerCase();
      return (
        item.booking_code?.toLowerCase().includes(text) ||
        item.from_city?.toLowerCase().includes(text) ||
        item.to_city?.toLowerCase().includes(text) ||
        item.passenger_name?.toLowerCase().includes(text)
      );
    })
    .filter((item) => {
      if (statusFilter === "all") return true;
      return (item.status || "paid").toLowerCase() === statusFilter;
    })
    .filter((item) => {
      if (dateFilter === "all") return true;
      if (!item.travel_date) return false;

      // Parse "YYYY-MM-DD" as local-time date components — avoids the
      // UTC-midnight parsing bug where new Date("2026-06-27") can shift
      // to the previous/next day depending on the browser's timezone.
      const [ty, tm, td] = item.travel_date.split("-").map(Number);
      const travelDate = new Date(ty, tm - 1, td);

      // "Today" is always computed in Cambodia time (Asia/Phnom_Penh),
      // not whatever timezone the browser/server happens to be in.
      const cambodiaTodayStr = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Phnom_Penh",
      }); // "en-CA" formats as YYYY-MM-DD
      const [cy, cm, cd] = cambodiaTodayStr.split("-").map(Number);
      const today = new Date(cy, cm - 1, cd);

      if (dateFilter === "today") {
        return travelDate.getTime() === today.getTime();
      }

      if (dateFilter === "week") {
        // Covers 7 days back through 7 days ahead of today, since travel
        // dates for a booking system are usually upcoming, not past.
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        return travelDate >= weekStart && travelDate <= weekEnd;
      }

      if (dateFilter === "month") {
        return (
          travelDate.getMonth() === today.getMonth() &&
          travelDate.getFullYear() === today.getFullYear()
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "highest") return Number(b.total_price) - Number(a.total_price);
      if (sortBy === "lowest") return Number(a.total_price) - Number(b.total_price);
      return 0;
    });

  const totalRevenue = bookings.reduce(
    (sum, item) => sum + Number(item.total_price || 0),
    0
  );

  const totalPassengers = bookings.reduce(
    (sum, item) => sum + passengerCount(item),
    0
  );

  return (
    <div className="th-page">
      <div className="th-shell">
        {/* Hero */}
        <section className="th-hero">
          <div className="th-hero-text">
            <span className="th-hero-tag">
              <Ticket size={15} />
              My Tickets
            </span>
            <h1>Booking History</h1>
            <p>View all your booked trips, check status, and download e-tickets.</p>
          </div>

          <div className="th-hero-stat">
            <Calendar size={28} />
            <h2>{bookings.length}</h2>
            <p>Total Bookings</p>
          </div>
        </section>

        {/* Stats */}
        <section className="th-stats">
          <div>
            <div className="th-stat-icon"><Ticket size={20} /></div>
            <div>
              <span>Bookings</span>
              <h3>{bookings.length}</h3>
            </div>
          </div>
          <div>
            <div className="th-stat-icon"><User size={20} /></div>
            <div>
              <span>Passengers</span>
              <h3>{totalPassengers}</h3>
            </div>
          </div>
          <div>
            <div className="th-stat-icon"><CreditCard size={20} /></div>
            <div>
              <span>Total Paid</span>
              <h3>${totalRevenue.toFixed(2)}</h3>
            </div>
          </div>
          <div>
            <div className="th-stat-icon"><CheckCircle size={20} /></div>
            <div>
              <span>Status</span>
              <h3>Paid</h3>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="th-filters">
          <div className="th-search">
            <Search size={18} />
            <input
              placeholder="Search by code, route, or passenger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="th-select">
            <Calendar size={16} />
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week (±7 days)</option>
              <option value="month">This Month</option>
            </select>
            <ChevronDown size={15} />
          </div>

          <div className="th-select">
            <CheckCircle size={16} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown size={15} />
          </div>

          <div className="th-select">
            <Filter size={16} />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="highest">Highest Price</option>
              <option value="lowest">Lowest Price</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </section>

        {/* Ticket grid - portrait stub cards */}
        <section className="th-grid">
          {filteredBookings.length === 0 && (
            <div className="th-empty">
              <Bus size={46} />
              <h3>No Booking Found</h3>
              <p>Try changing your search or filter.</p>
            </div>
          )}

          {filteredBookings.map((item) => (
            <article className="th-stub" key={item.id}>
              <div className="th-stub-image">
                <img
                  src={
                    DEFAULT_IMAGE_BY_TYPE[item.vehicle_type] ||
                    DEFAULT_IMAGE_BY_TYPE["Night Bus"]
                  }
                  alt={item.vehicle_type || "Bus"}
                />
                <span className="th-stub-status">
                  <CheckCircle size={12} />
                  {item.status || "Paid"}
                </span>
              </div>

              <div className="th-stub-body">
                <h2 className="th-stub-route">
                  {item.from_city} <span>→</span> {item.to_city}
                </h2>

                {(() => {
                  const { status, minutesLeft } = getCheckInStatus(item);
                  if (!status) return null;
                  return (
                    <div className={`th-checkin-alert ${status}`}>
                      {status === "urgent"
                        ? `Check in now! Departs in ${minutesLeft} min`
                        : `Reminder: departs in ${minutesLeft} min — check in soon`}
                    </div>
                  );
                })()}

                <div className="th-stub-meta">
                  <span><Calendar size={13} />{item.travel_date}</span>
                  <span><Clock size={13} />{item.departure_time}</span>
                </div>
                <div className="th-stub-meta">
                  <span><Bus size={13} />{item.vehicle_type}</span>
                </div>

                <div className="th-stub-tags">
                  <span>Seats: {item.seat_numbers}</span>
                  <span>{passengerCount(item)} pax</span>
                </div>

                {formatBookedAt(item) && (
                  <p className="th-stub-booked-at">
                    Booked: {formatBookedAt(item)}
                  </p>
                )}

                <div className="th-stub-perforation">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <span key={i} />
                  ))}
                </div>

                <div className="th-stub-code-row">
                  <div>
                    <small>Booking Code</small>
                    <strong>{item.booking_code}</strong>
                  </div>
                  <div className="th-stub-price">
                    <small>Total</small>
                    <strong>${item.total_price}</strong>
                  </div>
                </div>

                <div className="th-stub-actions">
                  <button className="th-btn-view" onClick={() => setSelectedTicket(item)}>
                    <Eye size={15} />
                    View
                  </button>
                  <button className="th-btn-ghost" onClick={() => downloadTicket(item)}>
                    <Download size={15} />
                  </button>
                  <button className="th-btn-ghost" onClick={() => bookAgain(item)}>
                    <RefreshCcw size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* Phone-style e-ticket modal */}
      {selectedTicket && (
        <div className={`th-overlay ${closing ? "closing" : ""}`} onClick={closeTicket}>
          <div
            className={`th-phone-ticket ${closing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="th-phone-notch" />

            <button className="th-close" onClick={closeTicket}>
              <X size={18} />
            </button>

            <div className="th-pt-header">
              <Bus size={26} />
              <div>
                <h3>CAMBODIA BUS</h3>
                <span>EXPRESS E-TICKET</span>
              </div>
            </div>

            <div className="th-pt-route">
              <div>
                <small>FROM</small>
                <h4>{selectedTicket.from_city}</h4>
              </div>
              <div className="th-pt-line">
                <Bus size={16} />
              </div>
              <div>
                <small>TO</small>
                <h4>{selectedTicket.to_city}</h4>
              </div>
            </div>

            <div className="th-pt-qr">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${selectedTicket.booking_code}`}
                alt="QR Code"
              />
              <strong>{selectedTicket.booking_code}</strong>
            </div>

            <div className="th-perforation">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} />
              ))}
            </div>

            <div className="th-pt-details">
              <div>
                <User size={15} />
                <span>Passenger</span>
                <b>{selectedTicket.passenger_name || "N/A"}</b>
              </div>
              <div>
                <Phone size={15} />
                <span>Phone</span>
                <b>{selectedTicket.phone || "N/A"}</b>
              </div>
              <div>
                <Calendar size={15} />
                <span>Date</span>
                <b>{selectedTicket.travel_date}</b>
              </div>
              <div>
                <Clock size={15} />
                <span>Departure</span>
                <b>{selectedTicket.departure_time}</b>
              </div>
              <div>
                <MapPin size={15} />
                <span>Vehicle</span>
                <b>{selectedTicket.vehicle_type}</b>
              </div>
              <div>
                <Ticket size={15} />
                <span>Seats</span>
                <b>{selectedTicket.seat_numbers}</b>
              </div>
              {formatBookedAt(selectedTicket) && (
                <div>
                  <Clock size={15} />
                  <span>Booked On</span>
                  <b>{formatBookedAt(selectedTicket)}</b>
                </div>
              )}
            </div>

            <div className="th-pt-footer">
              <span>
                <ShieldCheck size={14} />
                Arrive 20 min before departure
              </span>
              <strong>${selectedTicket.total_price}</strong>
            </div>

            <button
              className="th-pt-download"
              onClick={() => downloadTicket(selectedTicket)}
            >
              <Download size={17} />
              Download Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}