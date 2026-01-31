// src/routes/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 < Date.now()) {
      return <Navigate to="/login" />;
    }

    const allowedRoles = ["admin", "teacher"];
    if (!allowedRoles.includes(decoded.role)) {
      return <Navigate to="/" />;
    }
    return children;
  } catch (err) {
    localStorage.removeItem("token");
    return <Navigate to="/login" />;
  }
}
