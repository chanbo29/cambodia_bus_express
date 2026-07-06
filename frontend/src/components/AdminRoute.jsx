import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("access");
  const user  = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) return <Navigate to="/login" replace />;
  if (!user?.is_staff && !user?.is_superuser) return <Navigate to="/" replace />;

  return children;
}