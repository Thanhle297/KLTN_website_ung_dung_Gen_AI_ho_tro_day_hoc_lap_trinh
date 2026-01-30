import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import logo from "../IMG/Logo_noback.png";
import "../styles/Header.scss";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Load user từ JWT (DUY NHẤT)
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      // Token hết hạn → logout
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/login");
        return;
      }

      setUser({
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        fullname: decoded.fullname,
      });
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [navigate]);

  // =========================
  // Click outside → đóng menu
  // =========================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !e.target.closest(".hamburger-btn")
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đổi route → đóng menu
  useEffect(() => {
    setOpenMenu(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // =========================
  // Logout
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const canAccessAdmin =
    user && (user.role === "admin" || user.role === "teacher");

  return (
    <header className="header">
      {/* Logo */}
      <div className="header__logo">
        <Link to="/">
          <img src={logo} alt="Logo" />
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className={`header__nav ${isMobileMenuOpen ? "active" : ""}`}
        ref={mobileMenuRef}
      >
        <ul>
          <li>
            <Link to="/">Trang chủ</Link>
          </li>
          <li>
            <Link to="/course">Khóa học</Link>
          </li>
          <li>
            <Link to="/contact">Liên hệ</Link>
          </li>
        </ul>
      </nav>

      {/* Auth / User */}
      <div className="header__auth" ref={menuRef}>
        {!user ? (
          <button className="login-btn" onClick={() => navigate("/login")}>
            Đăng nhập
          </button>
        ) : (
          <div className="user-menu">
            <div className="avatar" onClick={() => setOpenMenu(!openMenu)}>
              {user.username.charAt(0).toUpperCase()}
            </div>

            {openMenu && (
              <ul className="dropdown">
                <div className="user-info">
                  <span>Xin chào,</span>
                  <strong>{user.fullname || user.username}</strong>
                </div>

                {canAccessAdmin && (
                  <li>
                    <Link to="/admin">
                      <i className="fas fa-user-shield"></i> Quản trị
                    </Link>
                  </li>
                )}

                <li>
                  <Link to="/profile">
                    <i className="fas fa-user-circle"></i> Tài khoản
                  </Link>
                </li>

                <li>
                  <button onClick={handleLogout} className="logout-item">
                    <i className="fas fa-sign-out-alt"></i> Đăng xuất
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}

        {/* Mobile button */}
        <button
          className="hamburger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <i className={`fas ${isMobileMenuOpen ? "fa-times" : "fa-bars"}`} />
        </button>
      </div>
    </header>
  );
}
