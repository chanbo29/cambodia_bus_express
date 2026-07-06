import { Routes, Route, Navigate } from "react-router-dom";

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

import AnnouncementsPage from "../admin/AnnouncementsPage";
import AdminDashboard from "../admin/Dashboard";
import ManageBookings from "../admin/ManageBookings";
import ManageBuses from "../admin/ManageBuses";
import ManageRoutes from "../admin/ManageRoutes";
import ManageCheckIn from "../admin/ManageCheckIn";
import ManageUsers from "../admin/ManageUsers";
import Promotions from "../admin/Promotions";
import Reports from "../admin/Reports";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "../components/AdminRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/branch" element={<Branch />} />
      <Route path="/about" element={<About />} />
      <Route path="/faq" element={<FAQ />} />

      {/* Old contact page was replaced by FAQ — redirect any stray links,
          bookmarks, or browser history pointing at /contact */}
      <Route path="/admin-dashboard/announcements" element={
        <AdminRoute><AnnouncementsPage /></AdminRoute>
      } />
      <Route path="/contact" element={<Navigate to="/faq" replace />} />

      {/* Logged-in user pages */}
      <Route
        path="/booking"
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <TicketHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Admin-only pages */}
      <Route
        path="/admin-dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin-dashboard/bookings"
        element={
          <AdminRoute>
            <ManageBookings />
          </AdminRoute>
        }
      />
      <Route
        path="/admin-dashboard/buses"
        element={
          <AdminRoute>
            <ManageBuses />
          </AdminRoute>
        }
      />
      <Route
        path="/admin-dashboard/routes"
        element={
          <AdminRoute>
            <ManageRoutes />
          </AdminRoute>
        }
      />
      <Route
        path="/admin-dashboard/users"
        element={
          <AdminRoute>
            <ManageUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin-dashboard/promotions"
        element={
          <AdminRoute>
            <Promotions />
          </AdminRoute>
        }
      />
      <Route
        path="/admin-dashboard/reports"
        element={
          <AdminRoute>
            <Reports />
          </AdminRoute>
        }
      />
      <Route path="/admin-dashboard/checkin" element={<AdminRoute><ManageCheckIn /></AdminRoute>} />
    </Routes>
    
  );
}