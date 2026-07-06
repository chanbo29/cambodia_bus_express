import { useEffect, useState } from "react";
import {
  Bus,
  MapPin,
  Ticket,
  Users,
  Tag,
  FileBarChart,
  DollarSign,
  CalendarCheck,
  UserPlus,
  ClipboardCheck,
  TrendingUp,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";
import "./Reports.css";
import AdminSidebar from "../components/AdminSidebar";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Reports() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [newUsersCount, setNewUsersCount] = useState(null);
  const [activePromoCount, setActivePromoCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    API.get("/bookings/")
      .then((res) => setBookings(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));

    // Optional — only present if a /users/ endpoint exists; fails silently otherwise
    API.get("/users/")
      .then((res) => {
        const users = Array.isArray(res.data) ? res.data : [];
        const thisYear = new Date().getFullYear();
        const count = users.filter(
          (u) => new Date(u.date_joined).getFullYear() === thisYear
        ).length;
        setNewUsersCount(count);
      })
      .catch(() => setNewUsersCount(null));

    API.get("/promotions/")
      .then((res) => {
        const promos = Array.isArray(res.data) ? res.data : [];
        setActivePromoCount(promos.filter((p) => p.active).length);
      })
      .catch(() => setActivePromoCount(null));
  }, []);

  const passengerCount = (item) => {
    if (!item?.seat_numbers) return 1;
    return item.seat_numbers.split(",").map((s) => s.trim()).filter(Boolean).length;
  };

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // ---- Primary stats ----
  const totalSales = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
  const totalBookings = bookings.length;
  const ticketsSold = bookings.reduce((sum, b) => sum + passengerCount(b), 0);

  // ---- Secondary stats ----
  const avgBookingValue = totalBookings > 0 ? totalSales / totalBookings : 0;

  const todaysRevenue = bookings
    .filter((b) => b.travel_date === todayStr)
    .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

  // ---- Monthly revenue (current year) ----
  const monthlyData = MONTH_NAMES.map((name, index) => {
    const monthBookings = bookings.filter((b) => {
      if (!b.travel_date) return false;
      const d = new Date(b.travel_date);
      return d.getMonth() === index && d.getFullYear() === today.getFullYear();
    });
    return {
      month: name,
      bookings: monthBookings.length,
      revenue: monthBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0),
    };
  }).filter((m) => m.bookings > 0 || m.revenue > 0);

  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);

  // ---- Top routes by revenue ----
  const routeMap = {};
  bookings.forEach((b) => {
    const key = `${b.from_city} → ${b.to_city}`;
    if (!routeMap[key]) routeMap[key] = { route: key, bookings: 0, revenue: 0 };
    routeMap[key].bookings += 1;
    routeMap[key].revenue += Number(b.total_price || 0);
  });
  const topRoutes = Object.values(routeMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const topRouteMaxRevenue = Math.max(...topRoutes.map((r) => r.revenue), 1);
  const mostPopularRoute = topRoutes[0]?.route || "—";

  // ---- Revenue by vehicle type ----
  const vehicleMap = {};
  bookings.forEach((b) => {
    const key = b.vehicle_type || "Unknown";
    if (!vehicleMap[key]) vehicleMap[key] = { type: key, bookings: 0, revenue: 0 };
    vehicleMap[key].bookings += 1;
    vehicleMap[key].revenue += Number(b.total_price || 0);
  });
  const vehicleBreakdown = Object.values(vehicleMap).sort((a, b) => b.revenue - a.revenue);
  const vehicleMaxRevenue = Math.max(...vehicleBreakdown.map((v) => v.revenue), 1);

  // ---- Bookings by day of week (reveals weekly demand pattern) ----
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  bookings.forEach((b) => {
    if (!b.travel_date) return;
    const [y, m, d] = b.travel_date.split("-").map(Number);
    const day = new Date(y, m - 1, d).getDay();
    dowCounts[day] += 1;
  });
  const maxDowCount = Math.max(...dowCounts, 1);

  return (
    <div className="admin-page">
      <AdminSidebar />
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
          <a onClick={() => navigate("/admin-dashboard")}>
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
          <a className="active">
            <FileBarChart size={20} /> Reports
          </a>
          
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Reports</h1>
            <p>Sales, bookings, and revenue overview.</p>
          </div>
        </header>

        <section className="admin-stats">
          <div>
            <DollarSign />
            <span>Total Sales</span>
            <h3>{loading ? "—" : `$${totalSales.toFixed(2)}`}</h3>
          </div>
          <div>
            <CalendarCheck />
            <span>Total Bookings</span>
            <h3>{loading ? "—" : totalBookings}</h3>
          </div>
          <div>
            <Ticket />
            <span>Tickets Sold</span>
            <h3>{loading ? "—" : ticketsSold}</h3>
          </div>
          <div>
            <UserPlus />
            <span>New Users (this year)</span>
            <h3>{newUsersCount === null ? "—" : newUsersCount}</h3>
          </div>
        </section>

        <section className="admin-stats">
          <div>
            <TrendingUp />
            <span>Avg. Booking Value</span>
            <h3>{loading ? "—" : `$${avgBookingValue.toFixed(2)}`}</h3>
          </div>
          <div>
            <DollarSign />
            <span>Today's Revenue</span>
            <h3>{loading ? "—" : `$${todaysRevenue.toFixed(2)}`}</h3>
          </div>
          <div>
            <Award />
            <span>Most Popular Route</span>
            <h3 className="reports-route-stat">{loading ? "—" : mostPopularRoute}</h3>
          </div>
          <div>
            <Tag />
            <span>Active Promotions</span>
            <h3>{activePromoCount === null ? "—" : activePromoCount}</h3>
          </div>
        </section>

        <section className="admin-card">
          <div className="card-title">
            <h2>Monthly Revenue</h2>
            <p>{loading ? "Loading..." : `${monthlyData.length} month(s) with activity`}</p>
          </div>

          {monthlyData.length === 0 && !loading && (
            <p className="reports-empty">No booking data yet to report on.</p>
          )}

          {monthlyData.length > 0 && (
            <>
              <div className="reports-chart">
                {monthlyData.map((m) => (
                  <div className="reports-bar-col" key={m.month}>
                    <div className="reports-bar-track">
                      <div
                        className="reports-bar-fill"
                        style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                        title={`$${m.revenue.toFixed(2)}`}
                      />
                    </div>
                    <span>{m.month.slice(0, 3)}</span>
                  </div>
                ))}
              </div>

              <div className="route-table">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Bookings</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((m) => (
                      <tr key={m.month}>
                        <td>{m.month}</td>
                        <td>{m.bookings}</td>
                        <td>${m.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <div className="dashboard-grid-2col">
          <section className="admin-card">
            <div className="card-title">
              <h2>Top Routes by Revenue</h2>
              <p>{loading ? "Loading..." : `Top ${topRoutes.length}`}</p>
            </div>

            {topRoutes.length === 0 && !loading && (
              <p className="reports-empty">No route data yet.</p>
            )}

            <div className="reports-route-list">
              {topRoutes.map((r) => (
                <div className="reports-route-row" key={r.route}>
                  <div className="reports-route-row-top">
                    <span className="reports-route-name">{r.route}</span>
                    <span className="reports-route-revenue">${r.revenue.toFixed(2)}</span>
                  </div>
                  <div className="reports-route-bar-track">
                    <div
                      className="reports-route-bar-fill"
                      style={{ width: `${(r.revenue / topRouteMaxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="reports-route-bookings">{r.bookings} booking(s)</span>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-card">
            <div className="card-title">
              <h2>Revenue by Vehicle Type</h2>
              <p>{loading ? "Loading..." : `${vehicleBreakdown.length} type(s)`}</p>
            </div>

            {vehicleBreakdown.length === 0 && !loading && (
              <p className="reports-empty">No vehicle data yet.</p>
            )}

            <div className="reports-route-list">
              {vehicleBreakdown.map((v) => (
                <div className="reports-route-row" key={v.type}>
                  <div className="reports-route-row-top">
                    <span className="reports-route-name">{v.type}</span>
                    <span className="reports-route-revenue">${v.revenue.toFixed(2)}</span>
                  </div>
                  <div className="reports-route-bar-track">
                    <div
                      className="reports-route-bar-fill alt"
                      style={{ width: `${(v.revenue / vehicleMaxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="reports-route-bookings">{v.bookings} booking(s)</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="admin-card">
          <div className="card-title">
            <h2>Bookings by Day of Week</h2>
            <p>Reveals weekly demand patterns across all routes</p>
          </div>

          <div className="reports-dow-chart">
            {DAY_NAMES.map((name, i) => (
              <div className="reports-bar-col" key={name}>
                <div className="reports-bar-track">
                  <div
                    className="reports-bar-fill dow"
                    style={{ height: `${(dowCounts[i] / maxDowCount) * 100}%` }}
                    title={`${dowCounts[i]} booking(s)`}
                  />
                </div>
                <span>{name}</span>
                <small>{dowCounts[i]}</small>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}