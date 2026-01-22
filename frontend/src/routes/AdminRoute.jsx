// src/routes/AdminRoute.jsx
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  
  // Cho phép admin và teacher truy cập dashboard
  const allowedRoles = ["admin", "teacher"];
  if (!allowedRoles.includes(role)) return <Navigate to="/" />;

  return children;
}
