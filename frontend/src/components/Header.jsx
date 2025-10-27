import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../IMG/Logo_noback.png";
import "../styles/Header.scss";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null); // ✅ tham chiếu vùng menu

  useEffect(() => {
    const fullname = localStorage.getItem("fullname");
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    if (token && fullname) setUser({ fullname, role });
  }, []);

  // ✅ đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ đóng menu khi đổi route
  useEffect(() => {
    setOpenMenu(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fullname");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header__logo">
        <Link to="/">
          <img src={logo} alt="Logo" className="logo-img" />
        </Link>
      </div>

      <nav className="header__nav">
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
            <i className="fas fa-sign-in-alt"></i>
          </button>
        ) : (
          <div className="user-menu">
            <div className="avatar" onClick={() => setOpenMenu(!openMenu)}>
              {user.fullname.charAt(0).toUpperCase()}
            </div>
            {openMenu && (
              <ul className="dropdown">
                <li>
                  <strong>{user.fullname}</strong>
                </li>
                <li>
                  <Link to="/profile">Thông tin tài khoản</Link>
                </li>
                <li>
                  <button onClick={handleLogout}>Đăng xuất</button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
