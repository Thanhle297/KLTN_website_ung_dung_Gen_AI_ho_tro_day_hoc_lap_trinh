// Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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

  useEffect(() => {
    const fullname = localStorage.getItem("fullname");
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    if (token && fullname) setUser({ fullname, role });
  }, []);

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenMenu(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header__logo">
        <Link to="/">
          <img src={logo} alt="Logo" />
        </Link>
      </div>

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
            <Link to="/Contact">Liên hệ</Link>
          </li>
        </ul>
      </nav>

      <div className="header__auth" ref={menuRef}>
        {!user ? (
          <button className="login-btn" onClick={() => navigate("/login")}>
            Đăng nhập
          </button>
        ) : (
          <div className="user-menu">
            <div className="avatar" onClick={() => setOpenMenu(!openMenu)}>
              {user.fullname.charAt(0).toUpperCase()}
            </div>
            {openMenu && (
              <ul className="dropdown">
                <div className="user-info">
                  <span>Xin chào,</span>
                  <strong>{user.fullname}</strong>
                </div>

                {(user.role === "admin" || user.role === "teacher") && (
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

        <button
          className="hamburger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <i className={`fas ${isMobileMenuOpen ? "fa-times" : "fa-bars"}`}></i>
        </button>
      </div>
    </header>
  );
}
