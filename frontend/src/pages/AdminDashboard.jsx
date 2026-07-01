import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Booking from "../pages/Booking";
import Schedule from "../pages/Schedule";
import SeatSelection from "../pages/SeatSelection";
import PassengerInfo from "../pages/PassengerInfo";
import Payment from "../pages/Payment";
import Ticket from "../pages/Ticket";
import TicketHistory from "../pages/TicketHistory";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Branch from "../pages/Branch";
import About from "../pages/About";
import Contact from "../pages/Contact";
import AdminDashboard from "../pages/AdminDashboard";
import AdminRoute from "../components/AdminRoute";
import { useLanguage } from "../context/LanguageContext";
const { t } = useLanguage();
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/seat-selection" element={<SeatSelection />} />
      <Route path="/passenger-info" element={<PassengerInfo />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/ticket" element={<Ticket />} />
      <Route path="/history" element={<TicketHistory />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/branch" element={<Branch />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      <Route
        path="/admin-dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
    </Routes>
  );
}