import { useState, useEffect } from "react";
import abaLogo from "../assets/aba.jpg";
import wingLogo from "../assets/wing.jpg";
import bakongLogo from "../assets/bakong.png";
// Real payment QR image, hosted on Cloudinary
const PAYMENT_QR_URL = "https://res.cloudinary.com/jvwlddbl/image/upload/v1783503722/photo_2026-06-23_15-03-06_zrth3p.jpg";
import { useNavigate } from "react-router-dom";
import {
  Bus, Search, MapPin, Calendar, Users, User,
  CreditCard, Ticket, CheckCircle, ArrowLeft, ArrowRight,
  Home, Phone, Mail, ShieldCheck, Clock, Download, X, AlertTriangle,
} from "lucide-react";
import "./Booking.css";
import { createBooking, getSchedules, getBookedSeats, checkPromo } from "../services/booking";
import { useLanguage } from "../context/LanguageContext";

const DEFAULT_IMAGE_BY_TYPE = {
  "VIP Van":   "https://res.cloudinary.com/jvwlddbl/image/upload/v1782981287/4074-outside_tjn5vx.png",
  "Night Bus": "https://res.cloudinary.com/jvwlddbl/image/upload/v1782981286/3477-outside_xnuivm.png",
};

function getCambodiaTodayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Phnom_Penh" });
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
  if (hmMatch) return { hours: Number(hmMatch[1]), minutes: Number(hmMatch[2]) };
  return null;
}

export default function Booking() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);

  const [booking, setBooking] = useState({
    from: "Phnom Penh", to: "Siem Reap",
    date: getCambodiaTodayStr(), passengers: 2,
    trip: null, seats: [],
    passengerName: "", phone: "", email: "",
    paymentMethod: "ABA Pay", bookingCode: "", bookingTime: "",
  });

  // "waiting" -> showing the QR + waiting for demo payment confirmation
  // "confirmed" -> showing the green checkmark, right before revealing the ticket
  // null -> overlay hidden
  const [payingState, setPayingState] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("bookingData");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      setBooking((prev) => ({
        ...prev,
        from: data.from || data.from_city || prev.from,
        to:   data.to   || data.to_city   || prev.to,
        date: data.date || data.travel_date || prev.date,
        passengers: Number(data.passengers) || prev.passengers,
      }));
    } catch (e) { console.log(e); }
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
    } catch (e) { console.log(e); }
  }, []);

  const [allSchedules, setAllSchedules] = useState([]);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getSchedules().then((d) => setAllSchedules(Array.isArray(d) ? d : [])).catch(console.log);
  }, []);

  const handleSearchBuses = async () => {
    const todayStr = getCambodiaTodayStr();
    if (booking.date && booking.date < todayStr) {
      alert(`Cannot book a trip for a past date (${booking.date}). Today is ${todayStr}.`);
      return;
    }
    setSearching(true);
    let selectedDay = null;
    if (booking.date) {
      const [y, m, d] = booking.date.split("-").map(Number);
      selectedDay = new Date(y, m - 1, d).getDay();
    }
    const cambodiaNowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh", hour12: false });
    const cambodiaNow = new Date(cambodiaNowStr);
    const isToday = booking.date === todayStr;

    const matches = allSchedules.filter((s) => {
      const routeOk = s.from_city?.toLowerCase() === booking.from.toLowerCase() && s.to_city?.toLowerCase() === booking.to.toLowerCase();
      if (!routeOk) return false;
      if (s.days_of_week && selectedDay !== null) {
        const activeDays = s.days_of_week.split(",").map(Number);
        if (!activeDays.includes(selectedDay)) return false;
      }
      if (isToday && s.departure_time) {
        const dep = parseDepartureTime(s.departure_time);
        if (dep) {
          const depToday = new Date(cambodiaNow);
          depToday.setHours(dep.hours, dep.minutes, 0, 0);
          if (depToday.getTime() <= cambodiaNow.getTime()) return false;
        }
      }
      return true;
    });

    if (matches.length === 0) { setSearching(false); alert("No route found. Try a different route."); return; }

    const withAvailability = await Promise.all(matches.map(async (s) => {
      const seatsTotal = s.seats || 32;
      try {
        const taken = await getBookedSeats({ from_city: booking.from, to_city: booking.to, date: booking.date, time: s.departure_time });
        return { id: s.id, name: s.bus_type || s.bus_name || "Vehicle", busType: s.bus_type, time: s.departure_time, arrive: s.arrival_time, duration: s.duration, price: Number(s.price), img: s.image || null, seatsTotal, availableSeats: Math.max(seatsTotal - taken.length, 0) };
      } catch {
        return { id: s.id, name: s.bus_type || s.bus_name || "Vehicle", busType: s.bus_type, time: s.departure_time, arrive: s.arrival_time, duration: s.duration, price: Number(s.price), img: s.image || null, seatsTotal, availableSeats: seatsTotal };
      }
    }));

    setSearching(false);
    setAvailableTrips(withAvailability);
    setStep(2);
  };

  const isTripNearlyFull = (t) => t.seatsTotal > 0 && t.availableSeats / t.seatsTotal <= 0.2;
  const isTripSoldOut    = (t) => t.availableSeats <= 0;

  const [seats, setSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  const seatsTotal     = booking.trip?.seatsTotal || seats.length || 0;
  const seatsRemaining = Math.max(seatsTotal - bookedSeats.length, 0);
  const isNearlyFull   = !loadingSeats && seatsTotal > 0 && (seatsRemaining <= 5 || seatsRemaining / seatsTotal <= 0.15) && seatsRemaining > 0;
  const isFullyBooked  = !loadingSeats && seatsTotal > 0 && seatsRemaining === 0;

  const loadSeatsForTrip = async () => {
    if (!booking.trip) return;
    setLoadingSeats(true);
    setSeats(Array.from({ length: booking.trip.seatsTotal || 32 }, (_, i) => i + 1));
    try {
      const taken = await getBookedSeats({ from_city: booking.from, to_city: booking.to, date: booking.date, time: booking.trip.time });
      setBookedSeats(taken.map((s) => Number(s)).filter((n) => !isNaN(n)));
    } catch { setBookedSeats([]); }
    finally { setLoadingSeats(false); }
  };

  const [usePromo, setUsePromo] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);

  const subtotal       = booking.trip ? booking.trip.price * Number(booking.passengers) : 0;
  const discountAmount = appliedPromo ? Math.round(subtotal * (appliedPromo.discount_percent / 100) * 100) / 100 : 0;
  const totalPrice     = Math.max(subtotal - discountAmount, 0);

  const togglePromo = () => {
    setUsePromo((p) => !p);
    if (usePromo) { setPromoCodeInput(""); setAppliedPromo(null); setPromoError(""); }
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) { setPromoError("Enter a promo code"); return; }
    setCheckingPromo(true); setPromoError("");
    try { setAppliedPromo(await checkPromo(promoCodeInput.trim())); }
    catch (err) { setAppliedPromo(null); setPromoError(err.response?.data?.error || "Invalid promo code"); }
    finally { setCheckingPromo(false); }
  };

  const removeAppliedPromo = () => { setAppliedPromo(null); setPromoCodeInput(""); setPromoError(""); };

  const toggleSeat = (seat) => {
    if (bookedSeats.includes(seat)) return;
    setBooking((prev) => {
      if (!prev.seats.includes(seat) && prev.seats.length >= Number(prev.passengers)) {
        alert(`You can select only ${prev.passengers} seat(s)`); return prev;
      }
      return { ...prev, seats: prev.seats.includes(seat) ? prev.seats.filter((s) => s !== seat) : [...prev.seats, seat] };
    });
  };

  // Actually creates the booking on the backend. Returns true/false so the
  // caller (the payment overlay flow) knows whether to proceed or bail out.
  const executeBooking = async () => {
    try {
      const data = await createBooking({
        passenger_name: booking.passengerName, phone: booking.phone, email: booking.email,
        from_city: booking.from, to_city: booking.to, travel_date: booking.date,
        departure_time: booking.trip?.time, seat_numbers: booking.seats.join(", "),
        vehicle_type: booking.trip?.name || "Bus", total_price: totalPrice,
        ...(appliedPromo ? { promo_code: appliedPromo.code } : {}),
      });
      const bookedAt = data.created_at
        ? new Date(data.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
        : new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
      setBooking((prev) => ({ ...prev, bookingCode: data.booking_code, bookingTime: bookedAt }));
      localStorage.setItem("lastBookingResult", JSON.stringify(data));
      return true;
    } catch (err) {
      alert("Booking failed: " + (err.response?.data ? JSON.stringify(err.response.data) : "Cannot connect to server"));
      return false;
    }
  };

  // Click handler for "Pay & Confirm" -- shows the QR overlay first (demo
  // wait), then creates the booking, then shows a brief "confirmed" state
  // before revealing the ticket on step 5.
  const handlePayClick = () => {
    if (!booking.passengerName || !booking.phone || !booking.email) {
      alert("Please fill passenger information");
      return;
    }

    setPayingState("waiting");

    setTimeout(async () => {
      const ok = await executeBooking();
      if (!ok) {
        setPayingState(null);
        return;
      }
      setPayingState("confirmed");
      setTimeout(() => {
        setPayingState(null);
        setStep(5);
      }, 1200);
    }, 2000);
  };

  const paymentMethods = [
    { name: "ABA Pay",  desc: "Pay securely using ABA mobile app", logo: abaLogo,    recommended: true },
    { name: "Wing",     desc: "Pay securely using Wing mobile app",  logo: wingLogo },
    { name: "Bakong",   desc: "Pay securely using Bakong QR",        logo: bakongLogo },
  ];

  const STEPS = [
    [t("booking_step_search"),    t("booking_step_search_sub")],
    [t("booking_step_trip"),      t("booking_step_trip_sub")],
    [t("booking_step_seat"),      t("booking_step_seat_sub")],
    [t("booking_step_passenger"), t("booking_step_passenger_sub")],
    [t("booking_step_payment"),   t("booking_step_payment_sub")],
  ];

  return (
    <div className="bk-page">
      <div className="bk-layout">

        {/* ── Sidebar ─────────────────────────────── */}
        <aside className="bk-sidebar">
          <div className="bk-sidebar-logo">
            <div className="bk-sidebar-logo-icon"><Bus size={20} /></div>
            <div><h3>Cambodia Bus</h3><p>EXPRESS</p></div>
          </div>

          <nav className="bk-steps">
            {STEPS.map(([title, desc], i) => (
              <div key={i} className={`bk-step ${step === i+1 ? "on" : step > i+1 ? "done" : ""}`}>
                <div className="bk-step-num">
                  {step > i+1 ? <CheckCircle size={14} /> : i+1}
                </div>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </nav>

          <div className="bk-comfort-card">
            <ShieldCheck size={22} />
            <h3>{t("booking_comfort")}</h3>
            <p>{t("booking_comfort_sub")}</p>
            <Bus size={80} className="bk-comfort-bus" />
          </div>
        </aside>

        {/* ── Main ────────────────────────────────── */}
        <main className="bk-main">

          {/* ══ STEP 1: Search ══ */}
          {step === 1 && (
            <div className="bk-step-content">
              <div className="bk-heading">
                <h1>{t("booking_title")}</h1>
                <p>{t("booking_subtitle")}</p>
              </div>

              <div className="bk-search-card">
                <div className="bk-search-grid">
                  <BkField label={t("booking_from")} icon={<MapPin size={16} />}>
                    <select value={booking.from} onChange={(e) => setBooking({ ...booking, from: e.target.value })}>
                      <option>Phnom Penh</option><option>Siem Reap</option>
                      <option>Battambang</option><option>Sihanoukville</option>
                    </select>
                  </BkField>

                  <button className="bk-swap" onClick={() => setBooking({ ...booking, from: booking.to, to: booking.from })}>⇄</button>

                  <BkField label={t("booking_to")} icon={<MapPin size={16} />}>
                    <select value={booking.to} onChange={(e) => setBooking({ ...booking, to: e.target.value })}>
                      <option>Siem Reap</option><option>Phnom Penh</option>
                      <option>Battambang</option><option>Sihanoukville</option>
                    </select>
                  </BkField>

                  <BkField label={t("booking_date")} icon={<Calendar size={16} />}>
                    <input type="date" value={booking.date} min={getCambodiaTodayStr()} onChange={(e) => setBooking({ ...booking, date: e.target.value })} />
                  </BkField>

                  <BkField label={t("booking_passengers")} icon={<Users size={16} />}>
                    <input type="number" min="1" value={booking.passengers} onChange={(e) => setBooking({ ...booking, passengers: Math.max(1, Number(e.target.value)||1), seats: [] })} />
                  </BkField>

                  <button className="bk-search-btn" onClick={handleSearchBuses}>
                    <Search size={17} />
                    {searching ? t("booking_searching") : t("booking_search_btn")}
                  </button>
                </div>
              </div>

              <div className="bk-benefits">
                {[
                  [<ShieldCheck size={22}/>, t("booking_benefits_price"),   t("booking_benefits_price_sub")],
                  [<Ticket size={22}/>,      t("booking_benefits_easy"),    t("booking_benefits_easy_sub")],
                  [<CreditCard size={22}/>,  t("booking_benefits_secure"),  t("booking_benefits_secure_sub")],
                  [<Phone size={22}/>,       t("booking_benefits_support"), t("booking_benefits_support_sub")],
                ].map(([icon, title, desc], i) => (
                  <div key={i} className="bk-benefit">
                    {icon}<b>{title}</b><span>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ STEP 2: Select trip ══ */}
          {step === 2 && (
            <div className="bk-step-content">
              <div className="bk-heading">
                <h1>{t("booking_select_trip")}</h1>
                <p>{booking.from} → {booking.to} &nbsp;•&nbsp; {booking.date} &nbsp;•&nbsp; {booking.passengers} {t("booking_passengers")}</p>
              </div>

              <div className="bk-trip-list">
                {availableTrips.length === 0 && <p className="bk-empty">{t("booking_no_trips")}</p>}
                {availableTrips.map((trip) => {
                  const soldOut    = isTripSoldOut(trip);
                  const nearlyFull = !soldOut && isTripNearlyFull(trip);
                  const selected   = booking.trip?.id === trip.id;
                  return (
                    <div key={trip.id} className={`bk-trip-card ${selected ? "sel" : ""} ${soldOut ? "sold-out" : ""}`}
                      onClick={() => !soldOut && setBooking({ ...booking, trip })}>
                      <div className="bk-radio">{selected && <CheckCircle size={14} />}</div>
                      <img src={trip.img || DEFAULT_IMAGE_BY_TYPE[trip.busType] || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=500&auto=format&fit=crop"} alt={trip.name} />
                      <div className="bk-trip-info">
                        <h3>{trip.name}</h3>
                        <div className="bk-time-row">
                          <span><b>{trip.time}</b>{t("booking_departure")}</span>
                          <ArrowRight size={14} />
                          <span><b>{trip.arrive}</b>{t("booking_arrival")}</span>
                          <span><Clock size={13} />{trip.duration}</span>
                        </div>
                        <div className="bk-avail-badge">
                          {soldOut ? (
                            <span className="bk-badge sold-out"><AlertTriangle size={12} />{t("booking_sold_out")}</span>
                          ) : nearlyFull ? (
                            <span className="bk-badge nearly-full"><AlertTriangle size={12} />{t("booking_only")} {trip.availableSeats} {t("booking_seat")} {t("booking_seats_left")}</span>
                          ) : (
                            <span className="bk-badge available"><Users size={12} />{trip.availableSeats} {t("booking_seats_available")}</span>
                          )}
                        </div>
                      </div>
                      <div className="bk-trip-price">
                        <strong>${trip.price}.00</strong>
                        <small>{t("booking_per_seat")}</small>
                        <button disabled={soldOut}>{soldOut ? t("booking_sold_out") : selected ? "Selected ✓" : t("booking_select")}</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bk-actions">
                <button className="bk-back" onClick={() => setStep(1)}><ArrowLeft size={16} />{t("booking_back")}</button>
                <button className="bk-next" onClick={async () => {
                  if (!booking.trip) { alert(t("booking_select_trip")); return; }
                  if (booking.passengers > booking.trip.availableSeats) { alert(`${t("booking_only")} ${booking.trip.availableSeats} ${t("booking_seat")} ${t("booking_seats_left")}`); return; }
                  await loadSeatsForTrip(); setStep(3);
                }}>{t("booking_continue_seat")}<ArrowRight size={16} /></button>
              </div>
            </div>
          )}

          {/* ══ STEP 3: Seats ══ */}
          {step === 3 && (
            <div className="bk-step-content bk-two-col">
              <div>
                <div className="bk-heading">
                  <h1>{t("booking_choose_seats")}</h1>
                  <p>{loadingSeats ? t("booking_checking") : `${t("booking_select_seats")} ${booking.passengers} ${t("booking_seat_s")}`}</p>
                </div>

                {isFullyBooked && (
                  <div className="bk-alert full"><strong>{t("booking_fully_booked")}</strong><span>{t("booking_fully_booked_msg")}</span></div>
                )}
                {isNearlyFull && (
                  <div className="bk-alert nearly-full"><strong>{t("booking_nearly_full")}</strong><span>{t("booking_only")} {seatsRemaining} {t("booking_seat")} {t("booking_nearly_full_msg")}</span></div>
                )}

                <div className="bk-legend">
                  <span><b className="av" />  {t("booking_legend_available")}</span>
                  <span><b className="sl" />  {t("booking_legend_selected")}</span>
                  <span><b className="bk" />  {t("booking_legend_booked")}</span>
                </div>

                <div className="bk-seat-card">
                  <div className="bk-driver">{t("booking_driver")}</div>
                  <div className="bk-seat-grid">
                    {seats.map((seat) => (
                      <button key={seat}
                        disabled={bookedSeats.includes(seat)}
                        onClick={() => toggleSeat(seat)}
                        className={bookedSeats.includes(seat) ? "bk-seat booked" : booking.seats.includes(seat) ? "bk-seat selected" : "bk-seat"}>
                        {seat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <BookingSummary booking={booking} totalPrice={totalPrice} subtotal={subtotal} discountAmount={discountAmount} appliedPromo={appliedPromo} t={t} />

              <div className="bk-actions full-span">
                <button className="bk-back" onClick={() => setStep(2)}><ArrowLeft size={16} />{t("booking_back")}</button>
                <button className="bk-next" onClick={() => booking.seats.length === Number(booking.passengers) ? setStep(4) : alert(`${t("booking_select_seats")} ${booking.passengers} ${t("booking_seat_s")}`)}>{t("booking_continue")}<ArrowRight size={16} /></button>
              </div>
            </div>
          )}

          {/* ══ STEP 4: Passenger + Payment ══ */}
          {step === 4 && (
            <div className="bk-step-content bk-two-col">
              <div>
                <div className="bk-heading">
                  <h1>{t("booking_passenger_info")}</h1>
                  <p>{t("booking_passenger_sub")}</p>
                </div>

                <div className="bk-form">
                  <BkField label={t("booking_full_name")} icon={<User size={16} />}>
                    <input value={booking.passengerName} placeholder="John Doe" onChange={(e) => setBooking({ ...booking, passengerName: e.target.value })} />
                  </BkField>
                  <BkField label={t("booking_phone")} icon={<Phone size={16} />}>
                    <input value={booking.phone} placeholder="012 345 678" onChange={(e) => setBooking({ ...booking, phone: e.target.value })} />
                  </BkField>
                  <BkField label={t("booking_email")} icon={<Mail size={16} />}>
                    <input value={booking.email} placeholder="john@gmail.com" onChange={(e) => setBooking({ ...booking, email: e.target.value })} />
                  </BkField>
                </div>

                {/* Promo */}
                <div className="bk-promo-box">
                  <div className="bk-promo-row">
                    <div><h3>{t("booking_promo_title")}</h3><p>{t("booking_promo_sub")}</p></div>
                    <button className={`bk-switch ${usePromo ? "on" : ""}`} onClick={togglePromo}><span /></button>
                  </div>
                  {usePromo && (
                    <div className="bk-promo-input-row">
                      {appliedPromo ? (
                        <div className="bk-promo-pill">
                          <CheckCircle size={15} />
                          <div><strong>{appliedPromo.code}</strong><span>{appliedPromo.discount_percent}{t("booking_promo_off")}</span></div>
                          <button onClick={removeAppliedPromo}><X size={14} /></button>
                        </div>
                      ) : (
                        <>
                          <input className="bk-promo-input" value={promoCodeInput} onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())} placeholder={t("booking_promo_placeholder")} />
                          <button className="bk-promo-apply" onClick={handleApplyPromo} disabled={checkingPromo}>{checkingPromo ? t("booking_promo_checking") : t("booking_promo_apply")}</button>
                        </>
                      )}
                      {promoError && <p className="bk-promo-error">{promoError}</p>}
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div className="bk-payment-section">
                  <h3>{t("booking_payment_title")}</h3>
                  <div className="bk-payment-list">
                    {paymentMethods.map((m) => (
                      <button key={m.name} className={`bk-payment-card ${booking.paymentMethod === m.name ? "active" : ""}`}
                        onClick={() => setBooking({ ...booking, paymentMethod: m.name })}>
                        <div className="bk-pay-check">{booking.paymentMethod === m.name ? <CheckCircle size={22} /> : <span />}</div>
                        <img src={m.logo} alt={m.name} />
                        <div><h4>{m.name}</h4><p>{m.desc}</p></div>
                        {m.recommended && <span className="bk-recommended">Recommended</span>}
                      </button>
                    ))}
                  </div>
                  <div className="bk-secure-note"><ShieldCheck size={16} />{t("booking_secure")}</div>
                </div>
              </div>

              <BookingSummary booking={booking} totalPrice={totalPrice} subtotal={subtotal} discountAmount={discountAmount} appliedPromo={appliedPromo} t={t} />

              <div className="bk-actions full-span">
                <button className="bk-back" onClick={() => setStep(3)}><ArrowLeft size={16} />{t("booking_back")}</button>
                <button className="bk-next" onClick={handlePayClick}><CreditCard size={16} />{t("booking_pay_btn")}</button>
              </div>
            </div>
          )}

          {/* ══ STEP 5: Confirmation ══ */}
          {step === 5 && (
            <div className="bk-step-content bk-confirm">
              <div className="bk-success-icon"><CheckCircle size={64} /></div>
              <h1>{t("booking_confirmed")}</h1>
              <p className="bk-confirm-sub">{t("booking_confirmed_sub")}</p>

              <div className="bk-code-box">
                <div>
                  <h3>{t("booking_code")}</h3>
                  <strong>{booking.bookingCode}</strong>
                  {booking.bookingTime && (
                    <span className="bk-booked-at"><Clock size={12} />{t("booking_booked_on")} {booking.bookingTime}</span>
                  )}
                </div>
                <button onClick={() => navigator.clipboard.writeText(booking.bookingCode)}>{t("booking_copy")}</button>
              </div>

              <div className="bk-confirm-summary">
                {[
                  [t("booking_trip"),       booking.trip?.name],
                  [t("booking_route"),      `${booking.from} → ${booking.to}`],
                  [t("booking_date_label"), booking.date],
                  [t("booking_booked_at"),  booking.bookingTime],
                  [t("booking_seats_label"),booking.seats.join(", ")],
                  [t("booking_total_paid"), `$${totalPrice.toFixed(2)}`],
                ].map(([label, val]) => (
                  <div key={label}><span>{label}</span><b>{val}</b></div>
                ))}
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${booking.bookingCode}`} alt="QR" />
              </div>

              <div className="bk-actions center">
                <button className="bk-back" onClick={() => navigate("/history")}><Download size={16} />{t("booking_my_tickets")}</button>
                <button className="bk-next" onClick={() => navigate("/")}><Home size={16} />{t("booking_back_home")}</button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Payment processing overlay ──────────────────────── */}
      {payingState && (
        <div className="bk-pay-overlay">
          <div className="bk-pay-card">
            {payingState === "waiting" && (
              <>
                <img src={PAYMENT_QR_URL} alt="Payment QR code" className="bk-pay-qr" />
                <h3>Scan to pay ${totalPrice.toFixed(4)}</h3>
                <p>Waiting for payment confirmation via {booking.paymentMethod}...</p>
                <div className="bk-pay-spinner" />
              </>
            )}

            {payingState === "confirmed" && (
              <>
                <div className="bk-pay-success-icon">
                  <CheckCircle size={40} />
                </div>
                <h3>Payment confirmed!</h3>
                <p>Generating your ticket...</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BkField({ label, icon, children }) {
  return (
    <div className="bk-field">
      <label>{label}</label>
      <div className="bk-input">{icon}{children}</div>
    </div>
  );
}

function BookingSummary({ booking, totalPrice, subtotal, discountAmount, appliedPromo, t }) {
  return (
    <aside className="bk-summary">
      <h3>{t("booking_summary")}</h3>
      {[
        [t("booking_summary_trip"),       booking.trip?.name || "-"],
        [t("booking_summary_route"),      `${booking.from} → ${booking.to}`],
        [t("booking_summary_date"),       booking.date],
        [t("booking_summary_passengers"), booking.passengers],
        [t("booking_summary_seats"),      booking.seats.join(", ") || "-"],
      ].map(([label, val]) => (
        <div key={label} className="bk-summary-row"><span>{label}</span><b>{val}</b></div>
      ))}
      {appliedPromo && (
        <>
          <div className="bk-summary-row"><span>{t("booking_summary_subtotal")}</span><b>${subtotal.toFixed(2)}</b></div>
          <div className="bk-summary-row discount"><span>{t("booking_summary_discount")} ({appliedPromo.code})</span><b>-${discountAmount.toFixed(2)}</b></div>
        </>
      )}
      <div className="bk-summary-total"><span>{t("booking_summary_total")}</span><strong>${totalPrice.toFixed(2)}</strong></div>
    </aside>
  );
}