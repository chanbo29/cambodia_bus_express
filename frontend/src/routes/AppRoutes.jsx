import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Booking from "../pages/Booking";
import Schedule from "../pages/Schedule";
import TicketHistory from "../pages/TicketHistory";
import Profile from "../pages/Profile";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Branch from "../pages/Branch";
import About from "../pages/About";
import FAQ from "../pages/FAQ";
import AdminDashboard from "../pages/AdminDashboard";
import AdminRoute from "../components/AdminRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/history" element={<TicketHistory />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/settings" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/branch" element={<Branch />} />
      <Route path="/about" element={<About />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<FAQ />} />

      <Route
        path="/admin-dashboard/*"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
    </Routes>
  );
}