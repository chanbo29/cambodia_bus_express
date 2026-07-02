import { useState, useEffect } from "react";
import abaLogo from "../assets/aba.jpg";
import wingLogo from "../assets/wing.jpg";
import bakongLogo from "../assets/bakong.png";
import { useNavigate } from "react-router-dom";
import {
  Bus,
  Search,
  MapPin,
  Calendar,
  Users,
  User,
  CreditCard,
  Ticket,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Home,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  Download,
  X,
  AlertTriangle,
} from "lucide-react";
import "./Booking.css";
import { createBooking, getSchedules, getBookedSeats, checkPromo } from "../services/booking";
import { useLanguage } from "../context/LanguageContext";


const DEFAULT_IMAGE_BY_TYPE = {
  "VIP Van": "https://res.cloudinary.com/jvwlddbl/image/upload/v1782981287/4074-outside_tjn5vx.png",
  "Night Bus": "https://res.cloudinary.com/jvwlddbl/image/upload/v1782981286/3477-outside_xnuivm.png",
};

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

export default function Booking() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);

  const [booking, setBooking] = useState({
    from: "Phnom Penh",
    to: "Siem Reap",
    date: getCambodiaTodayStr(),
    passengers: 2,
    trip: null,
    seats: [],
    passengerName: "",
    phone: "",
    email: "",
    paymentMethod: "ABA Pay",
    bookingCode: "",
    bookingTime: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("bookingData");
    if (!saved) return;

    try {
      const data = JSON.parse(saved);

      setBooking((prev) => ({
        ...prev,
        from: data.from || data.from_city || prev.from,
        to: data.to || data.to_city || prev.to,
        date: data.date || data.travel_date || prev.date,
        passengers: Number(data.passengers) || prev.passengers,
      }));
    } catch (err) {
      console.log("Failed to parse bookingData:", err);
    }

    localStorage.removeItem("bookingData");
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("passengerInfo");
    if (!saved) return;

    try {
      const info = JSON.parse(saved);
      setBooking((prev) => ({
        ...prev,
        passengerName: prev.passengerName || info.passengerName || "",
        phone: prev.phone || info.phone || "",
        email: prev.email || info.email || "",
      }));
    } catch (err) {
      console.log("Failed to parse passengerInfo:", err);
    }
  }, []);

  const [allSchedules, setAllSchedules] = useState([]);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getSchedules()
      .then((data) => setAllSchedules(Array.isArray(data) ? data : []))
      .catch((err) => console.log(err));
  }, []);

  const handleSearchBuses = async () => {
    const cambodiaTodayStr = getCambodiaTodayStr();
    if (booking.date && booking.date < cambodiaTodayStr) {
      alert(
        `Cannot book a trip for a past date (${booking.date}). Today is ${cambodiaTodayStr}.`
      );
      return;
    }

    setSearching(true);

    let selectedDay = null;
    if (booking.date) {
      const [y, m, d] = booking.date.split("-").map(Number);
      selectedDay = new Date(y, m - 1, d).getDay();
    }

    const cambodiaNowStr = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Phnom_Penh",
      hour12: false,
    });
    const cambodiaNow = new Date(cambodiaNowStr);
    const isToday = booking.date === cambodiaTodayStr;

    const matches = allSchedules.filter((s) => {
      const routeMatches =
        s.from_city?.toLowerCase() === booking.from.toLowerCase() &&
        s.to_city?.toLowerCase() === booking.to.toLowerCase();

      if (!routeMatches) return false;

      if (s.days_of_week && selectedDay !== null) {
        const activeDays = s.days_of_week.split(",").map(Number);
        if (!activeDays.includes(selectedDay)) return false;
      }

      if (isToday && s.departure_time) {
        const depTime = parseDepartureTime(s.departure_time);
        if (depTime) {
          const depToday = new Date(cambodiaNow);
          depToday.setHours(depTime.hours, depTime.minutes, 0, 0);
          if (depToday.getTime() <= cambodiaNow.getTime()) return false;
        }
      }

      return true;
    });

    if (matches.length === 0) {
      setSearching(false);
      alert("No route found for this trip. Please try a different route.");
      return;
    }

    // Fetch real seat availability for each matching trip so the trip
    // list can show "X seats left" / a nearly-full warning up front,
    // not just after the customer has already picked a trip.
    const withAvailability = await Promise.all(
      matches.map(async (s) => {
        const seatsTotal = s.seats || 32;
        try {
          const taken = await getBookedSeats({
            from_city: booking.from,
            to_city: booking.to,
            date: booking.date,
            time: s.departure_time,
          });
          const bookedCount = taken.length;
          return {
            id: s.id,
            name: s.bus_type || s.bus_name || "Vehicle",
            busType: s.bus_type,
            time: s.departure_time,
            arrive: s.arrival_time,
            duration: s.duration,
            price: Number(s.price),
            img: s.image || null,
            seatsTotal,
            availableSeats: Math.max(seatsTotal - bookedCount, 0),
          };
        } catch (err) {
          return {
            id: s.id,
            name: s.bus_type || s.bus_name || "Vehicle",
            busType: s.bus_type,
            time: s.departure_time,
            arrive: s.arrival_time,
            duration: s.duration,
            price: Number(s.price),
            img: s.image || null,
            seatsTotal,
            availableSeats: seatsTotal,
          };
        }
      })
    );

    setSearching(false);
    setAvailableTrips(withAvailability);
    setStep(2);
  };

  // A trip is "nearly full" once 80%+ of its seats are taken (≤20% remaining)
  const isTripNearlyFull = (trip) =>
    trip.seatsTotal > 0 && trip.availableSeats / trip.seatsTotal <= 0.2;

  const isTripSoldOut = (trip) => trip.availableSeats <= 0;

  const [seats, setSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Both VIP Van and Night Bus now use the exact same simple numbered
  // seat grid - no separate floors/beds layout.
  const seatsTotal = booking.trip?.seatsTotal || seats.length || 0;
  const seatsRemaining = Math.max(seatsTotal - bookedSeats.length, 0);
  const isNearlyFull =
    !loadingSeats &&
    seatsTotal > 0 &&
    (seatsRemaining <= 5 || seatsRemaining / seatsTotal <= 0.15) &&
    seatsRemaining > 0;
  const isFullyBooked = !loadingSeats && seatsTotal > 0 && seatsRemaining === 0;

  const loadSeatsForTrip = async () => {
    if (!booking.trip) return;

    setLoadingSeats(true);
    setSeats(
      Array.from({ length: booking.trip.seatsTotal || 32 }, (_, i) => i + 1)
    );

    try {
      const taken = await getBookedSeats({
        from_city: booking.from,
        to_city: booking.to,
        date: booking.date,
        time: booking.trip.time,
      });
      setBookedSeats(taken.map((s) => Number(s)).filter((n) => !isNaN(n)));
    } catch (err) {
      console.log("Failed to load booked seats:", err);
      setBookedSeats([]);
    } finally {
      setLoadingSeats(false);
    }
  };

  const [usePromo, setUsePromo] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);

  const subtotal = booking.trip
    ? booking.trip.price * Number(booking.passengers)
    : 0;

  const discountAmount = appliedPromo
    ? Math.round(subtotal * (appliedPromo.discount_percent / 100) * 100) / 100
    : 0;

  const totalPrice = Math.max(subtotal - discountAmount, 0);

  const togglePromo = () => {
    setUsePromo((prev) => !prev);
    if (usePromo) {
      setPromoCodeInput("");
      setAppliedPromo(null);
      setPromoError("");
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) {
      setPromoError("Enter a promo code");
      return;
    }

    setCheckingPromo(true);
    setPromoError("");

    try {
      const data = await checkPromo(promoCodeInput.trim());
      setAppliedPromo(data);
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err.response?.data?.error || "Invalid promo code");
    } finally {
      setCheckingPromo(false);
    }
  };

  const removeAppliedPromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError("");
  };

  const steps = [
    [t("booking_step_search"), t("booking_step_search_sub")],
    [t("booking_step_trip"), t("booking_step_trip_sub")],
    [t("booking_step_seat"), t("booking_step_seat_sub")],
    [t("booking_step_passenger"), t("booking_step_passenger_sub")],
    [t("booking_step_payment"), t("booking_step_payment_sub")],
  ];

  const paymentMethods = [
    {
      name: "ABA Pay",
      desc: "Pay securely using ABA mobile app",
      logo: abaLogo,
      recommended: true,
    },
    {
      name: "Wing",
      desc: "Pay securely using Wing mobile app",
      logo: wingLogo,
    },
    {
      name: "Bakong",
      desc: "Pay securely using Bakong QR",
      logo: bakongLogo,
    },
  ];

  const toggleSeat = (seat) => {
    if (bookedSeats.includes(seat)) return;

    setBooking((prev) => {
      const selected = prev.seats.includes(seat);

      if (!selected && prev.seats.length >= Number(prev.passengers)) {
        alert(`You can select only ${prev.passengers} seat(s)`);
        return prev;
      }

      return {
        ...prev,
        seats: selected
          ? prev.seats.filter((s) => s !== seat)
          : [...prev.seats, seat],
      };
    });
  };

  const finishBooking = async () => {
    if (!booking.passengerName || !booking.phone || !booking.email) {
      alert("Please fill passenger information");
      return;
    }

    const payload = {
      passenger_name: booking.passengerName,
      phone: booking.phone,
      email: booking.email,
      from_city: booking.from,
      to_city: booking.to,
      travel_date: booking.date,
      departure_time: booking.trip?.time,
      seat_numbers: booking.seats.join(", "),
      vehicle_type: booking.trip?.name || "Bus",
      total_price: totalPrice,
      ...(appliedPromo ? { promo_code: appliedPromo.code } : {}),
    };

    try {
      const data = await createBooking(payload);

      const bookedAt = data.created_at
        ? new Date(data.created_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : new Date().toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          });

      setBooking({
        ...booking,
        bookingCode: data.booking_code,
        bookingTime: bookedAt,
      });

      localStorage.setItem("lastBookingResult", JSON.stringify(data));

      setStep(5);
    } catch (err) {
      const message = err.response?.data
        ? JSON.stringify(err.response.data)
        : "Cannot connect to backend server";
      alert("Booking failed: " + message);
    }
  };

  return (
    <div className="new-booking-page">
      <div className="booking-layout-new">
        <aside className="booking-step-sidebar">
          {steps.map(([title, desc], index) => (
            <div
              key={title}
              className={`side-step ${step >= index + 1 ? "active" : ""}`}
            >
              <div className="side-step-number">
                {step > index + 1 ? <CheckCircle size={18} /> : index + 1}
              </div>
              <div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            </div>
          ))}

          <div className="comfort-card">
            <ShieldCheck />
            <h3>{t("booking_comfort")}</h3>
            <p>{t("booking_comfort_sub")}</p>
            <Bus size={95} />
          </div>
        </aside>

        <main className="booking-content-new">
          {step === 1 && (
            <>
              <div className="page-heading">
                <h1>{t("booking_title")}</h1>
                <p>{t("booking_subtitle")}</p>
              </div>

              <section className="search-panel-new">
                <div className="field-new">
                  <label>{t("booking_from")}</label>
                  <div>
                    <MapPin size={18} />
                    <select
                      value={booking.from}
                      onChange={(e) =>
                        setBooking({ ...booking, from: e.target.value })
                      }
                    >
                      <option>Phnom Penh</option>
                      <option>Siem Reap</option>
                      <option>Battambang</option>
                      <option>Sihanoukville</option>
                    </select>
                  </div>
                </div>

                <div className="swap-icon">⇄</div>

                <div className="field-new">
                  <label>{t("booking_to")}</label>
                  <div>
                    <MapPin size={18} />
                    <select
                      value={booking.to}
                      onChange={(e) =>
                        setBooking({ ...booking, to: e.target.value })
                      }
                    >
                      <option>Siem Reap</option>
                      <option>Phnom Penh</option>
                      <option>Battambang</option>
                      <option>Sihanoukville</option>
                    </select>
                  </div>
                </div>

                <div className="field-new">
                  <label>{t("booking_date")}</label>
                  <div>
                    <Calendar size={18} />
                    <input
                      type="date"
                      value={booking.date}
                      min={getCambodiaTodayStr()}
                      onChange={(e) =>
                        setBooking({ ...booking, date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="field-new">
                  <label>{t("booking_passengers")}</label>
                  <div>
                    <Users size={18} />
                    <input
                      type="number"
                      min="1"
                      value={booking.passengers}
                      onChange={(e) => {
                        const value = Math.max(1, Number(e.target.value) || 1);
                        setBooking({
                          ...booking,
                          passengers: value,
                          seats: [],
                        });
                      }}
                    />
                  </div>
                </div>

                <button className="search-btn-new" onClick={handleSearchBuses}>
                  <Search size={18} />
                  {searching ? t("booking_searching") : t("booking_search_btn")}
                </button>
              </section>

              <section className="benefits-row">
                <div>
                  <ShieldCheck />
                  <b>{t("booking_benefits_price")}</b>
                  <span>{t("booking_benefits_price_sub")}</span>
                </div>
                <div>
                  <Ticket />
                  <b>{t("booking_benefits_easy")}</b>
                  <span>{t("booking_benefits_easy_sub")}</span>
                </div>
                <div>
                  <CreditCard />
                  <b>{t("booking_benefits_secure")}</b>
                  <span>{t("booking_benefits_secure_sub")}</span>
                </div>
                <div>
                  <Phone />
                  <b>{t("booking_benefits_support")}</b>
                  <span>{t("booking_benefits_support_sub")}</span>
                </div>
              </section>
            </>
          )}

          {step === 2 && (
            <section className="modern-card">
              <div className="card-head-new">
                <div>
                  <h2>{t("booking_select_trip")}</h2>
                  <p>
                    {booking.from} → {booking.to} • {booking.date} •{" "}
                    {booking.passengers} {t("booking_passengers")}
                  </p>
                </div>
              </div>

              <div className="modern-trip-list">
                {availableTrips.length === 0 && (
                  <p style={{ color: "var(--text-muted)", fontSize: "13.5px" }}>
                    {t("booking_no_trips")}
                  </p>
                )}

                {availableTrips.map((trip) => {
                  const soldOut = isTripSoldOut(trip);
                  const nearlyFull = !soldOut && isTripNearlyFull(trip);

                  return (
                  <div
                    key={trip.id}
                    className={`modern-trip ${
                      booking.trip?.id === trip.id ? "selected" : ""
                    } ${soldOut ? "sold-out" : ""}`}
                    onClick={() => {
                      if (soldOut) return;
                      setBooking({ ...booking, trip });
                    }}
                  >
                    <div className="trip-radio">
                      {booking.trip?.id === trip.id && <CheckCircle size={18} />}
                    </div>

                    <img
                      src={
                        trip.img ||
                        DEFAULT_IMAGE_BY_TYPE[trip.busType] ||
                        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=500&auto=format&fit=crop"
                      }
                      alt={trip.name}
                    />

                    <div className="trip-name">
                      <h3>{trip.name}</h3>

                      <div className="time-row">
                        <span>
                          <b>{trip.time}</b>
                          {t("booking_departure")}
                        </span>
                        <ArrowRight size={18} />
                        <span>
                          <b>{trip.arrive}</b>
                          {t("booking_arrival")}
                        </span>
                        <span>
                          <Clock size={14} />
                          {trip.duration}
                        </span>
                      </div>

                      <div className="seat-availability-row">
                        {soldOut ? (
                          <span className="seat-badge sold-out">
                            <AlertTriangle size={13} />
                            {t("booking_sold_out")}
                          </span>
                        ) : nearlyFull ? (
                          <span className="seat-badge nearly-full">
                            <AlertTriangle size={13} />
                            {t("booking_only")} {trip.availableSeats} {t("booking_seat")} {t("booking_seats_left")}
                          </span>
                        ) : (
                          <span className="seat-badge available">
                            <Users size={13} />
                            {trip.availableSeats} {t("booking_seats_available")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="trip-price">
                      <strong>${trip.price}.00</strong>
                      <small>{t("booking_per_seat")}</small>
                      <button disabled={soldOut}>
                        {soldOut ? t("booking_sold_out") : t("booking_select")}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>

              <div className="bottom-actions">
                <button className="back-btn-new" onClick={() => setStep(1)}>
                  <ArrowLeft size={18} />
                  {t("booking_back")}
                </button>

                <button
                  className="next-btn-new"
                  onClick={async () => {
                    if (!booking.trip) {
                      alert(t("booking_select_trip"));
                      return;
                    }

                    if (booking.passengers > booking.trip.availableSeats) {
                      alert(
                        `${t("booking_only")} ${booking.trip.availableSeats} ${t("booking_seat")} ${t("booking_seats_left")}`
                      );
                      return;
                    }

                    await loadSeatsForTrip();
                    setStep(3);
                  }}
                >
                  {t("booking_continue_seat")}
                  <ArrowRight size={18} />
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="modern-card seat-modern-wrap">
              <div>
                <h2>{t("booking_choose_seats")}</h2>
                <p>
                  {loadingSeats
                    ? t("booking_checking")
                    : `${t("booking_select_seats")} ${booking.passengers} ${t("booking_seat_s")}`}
                </p>

                {isFullyBooked && (
                  <div className="seat-alert-banner full">
                    <strong>{t("booking_fully_booked")}</strong>
                    <span>{t("booking_fully_booked_msg")}</span>
                  </div>
                )}

                {isNearlyFull && (
                  <div className="seat-alert-banner nearly-full">
                    <strong>{t("booking_nearly_full")}</strong>
                    <span>
                      {t("booking_only")} {seatsRemaining} {t("booking_seat")} {t("booking_nearly_full_msg")}
                    </span>
                  </div>
                )}

                <div className="seat-legend-new">
                  <span><b className="available"></b> {t("booking_legend_available")}</span>
                  <span><b className="selected"></b> {t("booking_legend_selected")}</span>
                  <span><b className="booked"></b> {t("booking_legend_booked")}</span>
                </div>

                <div className="bus-seat-card">
                  <div className="driver-new">{t("booking_driver")}</div>

                  <div className="seat-grid-new">
                    {seats.map((seat) => (
                      <button
                        key={seat}
                        disabled={bookedSeats.includes(seat)}
                        onClick={() => toggleSeat(seat)}
                        className={
                          bookedSeats.includes(seat)
                            ? "booked"
                            : booking.seats.includes(seat)
                            ? "selected"
                            : ""
                        }
                      >
                        {seat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <BookingSummary booking={booking} totalPrice={totalPrice} subtotal={subtotal} discountAmount={discountAmount} appliedPromo={appliedPromo} />

              <div className="bottom-actions full">
                <button className="back-btn-new" onClick={() => setStep(2)}>
                  <ArrowLeft size={18} />
                  {t("booking_back")}
                </button>

                <button
                  className="next-btn-new"
                  onClick={() =>
                    booking.seats.length === Number(booking.passengers)
                      ? setStep(4)
                      : alert(`${t("booking_select_seats")} ${booking.passengers} ${t("booking_seat_s")}`)
                  }
                >
                  {t("booking_continue")}
                  <ArrowRight size={18} />
                </button>
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="modern-card passenger-modern">
              <div>
                <h2>{t("booking_passenger_info")}</h2>
                <p>{t("booking_passenger_sub")}</p>

                <div className="passenger-form-new">
                  <div className="field-new">
                    <label>{t("booking_full_name")}</label>
                    <div>
                      <User size={18} />
                      <input
                        value={booking.passengerName}
                        placeholder="John Doe"
                        onChange={(e) =>
                          setBooking({ ...booking, passengerName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="field-new">
                    <label>{t("booking_phone")}</label>
                    <div>
                      <Phone size={18} />
                      <input
                        value={booking.phone}
                        placeholder="012 345 678"
                        onChange={(e) =>
                          setBooking({ ...booking, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="field-new">
                    <label>{t("booking_email")}</label>
                    <div>
                      <Mail size={18} />
                      <input
                        value={booking.email}
                        placeholder="john@gmail.com"
                        onChange={(e) =>
                          setBooking({ ...booking, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="promo-toggle-box">
                    <div className="promo-toggle-row">
                      <div>
                        <h3 className="payment-title" style={{ margin: 0 }}>
                          {t("booking_promo_title")}
                        </h3>
                        <p className="promo-toggle-sub">{t("booking_promo_sub")}</p>
                      </div>

                      <button
                        type="button"
                        className={`promo-switch ${usePromo ? "on" : ""}`}
                        onClick={togglePromo}
                        aria-pressed={usePromo}
                      >
                        <span className="promo-switch-knob" />
                      </button>
                    </div>

                    {usePromo && (
                      <div className="promo-input-row">
                        {appliedPromo ? (
                          <div className="promo-applied-pill">
                            <CheckCircle size={16} />
                            <div>
                              <strong>{appliedPromo.code}</strong>
                              <span>
                                {appliedPromo.discount_percent}{t("booking_promo_off")}
                                {appliedPromo.description ? ` — ${appliedPromo.description}` : ""}
                              </span>
                            </div>
                            <button type="button" onClick={removeAppliedPromo}>
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              value={promoCodeInput}
                              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                              placeholder={t("booking_promo_placeholder")}
                              className="promo-input"
                            />
                            <button
                              type="button"
                              className="promo-apply-btn"
                              onClick={handleApplyPromo}
                              disabled={checkingPromo}
                            >
                              {checkingPromo ? t("booking_promo_checking") : t("booking_promo_apply")}
                            </button>
                          </>
                        )}

                        {promoError && <p className="promo-error">{promoError}</p>}
                      </div>
                    )}
                  </div>

                  <div className="payment-logo-section">
                    <h3 className="payment-title">{t("booking_payment_title")}</h3>

                    <div className="payment-logo-list">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.name}
                          type="button"
                          className={`payment-card ${
                            booking.paymentMethod === method.name
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setBooking({
                              ...booking,
                              paymentMethod: method.name,
                            })
                          }
                        >
                          <div className="payment-check">
                            {booking.paymentMethod === method.name ? (
                              <CheckCircle size={34} />
                            ) : (
                              <div className="circle"></div>
                            )}
                          </div>

                          <div className="payment-logo">
                            <img src={method.logo} alt={method.name} />
                          </div>

                          <div className="payment-info">
                            <h4>{method.name}</h4>
                            <p>{method.desc}</p>
                          </div>

                          {method.recommended && (
                            <div className="recommended-badge">
                              Recommended
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="payment-security">
                      <ShieldCheck size={28} />
                      <span>{t("booking_secure")}</span>
                    </div>

                    <div className="secure-payment-note">
                      <ShieldCheck size={18} />
                      {t("booking_secure")}
                    </div>
                  </div>
                </div>
              </div>

              <BookingSummary booking={booking} totalPrice={totalPrice} subtotal={subtotal} discountAmount={discountAmount} appliedPromo={appliedPromo} />

              <div className="bottom-actions full">
                <button className="back-btn-new" onClick={() => setStep(3)}>
                  <ArrowLeft size={18} />
                  {t("booking_back")}
                </button>

                <button className="next-btn-new" onClick={finishBooking}>
                  <CreditCard size={18} />
                  {t("booking_pay_btn")}
                </button>
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="modern-card confirm-card">
              <div className="success-big">
                <CheckCircle size={70} />
              </div>

              <h1>{t("booking_confirmed")}</h1>
              <p>{t("booking_confirmed_sub")}</p>

              <div className="final-ticket-new">
                <div>
                  <h3>{t("booking_code")}</h3>
                  <strong>{booking.bookingCode}</strong>
                  {booking.bookingTime && (
                    <p className="booked-at-note">
                      <Clock size={13} />
                      {t("booking_booked_on")} {booking.bookingTime}
                    </p>
                  )}
                </div>

                <button onClick={() => navigator.clipboard.writeText(booking.bookingCode)}>
                  {t("booking_copy")}
                </button>
              </div>

              <div className="confirm-summary">
                <div>
                  <span>{t("booking_trip")}</span>
                  <b>{booking.trip?.name}</b>
                </div>
                <div>
                  <span>{t("booking_route")}</span>
                  <b>{booking.from} → {booking.to}</b>
                </div>
                <div>
                  <span>{t("booking_date_label")}</span>
                  <b>{booking.date}</b>
                </div>
                <div>
                  <span>{t("booking_booked_at")}</span>
                  <b>{booking.bookingTime}</b>
                </div>
                <div>
                  <span>{t("booking_seats_label")}</span>
                  <b>{booking.seats.join(", ")}</b>
                </div>
                <div>
                  <span>{t("booking_total_paid")}</span>
                  <b>${totalPrice.toFixed(2)}</b>
                </div>

                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.bookingCode}`}
                  alt="QR"
                />
              </div>

              <div className="bottom-actions center">
                <button className="back-btn-new" onClick={() => navigate("/history")}>
                  <Download size={18} />
                  {t("booking_my_tickets")}
                </button>

                <button className="next-btn-new" onClick={() => navigate("/")}>
                  <Home size={18} />
                  {t("booking_back_home")}
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function BookingSummary({ booking, totalPrice, subtotal, discountAmount, appliedPromo }) {
  const { t } = useLanguage();
  return (
    <aside className="booking-summary-new">
      <h3>{t("booking_summary")}</h3>

      <p>
        <span>{t("booking_summary_trip")}</span>
        <b>{booking.trip?.name || "-"}</b>
      </p>

      <p>
        <span>{t("booking_summary_route")}</span>
        <b>{booking.from} → {booking.to}</b>
      </p>

      <p>
        <span>{t("booking_summary_date")}</span>
        <b>{booking.date}</b>
      </p>

      <p>
        <span>{t("booking_summary_passengers")}</span>
        <b>{booking.passengers}</b>
      </p>

      <p>
        <span>{t("booking_summary_seats")}</span>
        <b>{booking.seats.join(", ") || "-"}</b>
      </p>

      {appliedPromo && (
        <>
          <p>
            <span>{t("booking_summary_subtotal")}</span>
            <b>${subtotal.toFixed(2)}</b>
          </p>
          <p className="summary-discount-row">
            <span>{t("booking_summary_discount")} ({appliedPromo.code})</span>
            <b>-${discountAmount.toFixed(2)}</b>
          </p>
        </>
      )}

      <div className="summary-total-new">
        <span>{t("booking_summary_total")}</span>
        <strong>${totalPrice.toFixed(2)}</strong>
      </div>
    </aside>
  );
}