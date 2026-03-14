// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { notifyLogout } from "../utils/sessionLogout";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);

    // Token hết hạn
    if (decoded.exp * 1000 < Date.now()) {
      notifyLogout("token_expired");
      localStorage.removeItem("token");
      return <Navigate to="/login" />;
    }

    return children;
  } catch {
    localStorage.removeItem("token");
    return <Navigate to="/login" />;
  }
}
