import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("access");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.is_staff || user.is_superuser;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}