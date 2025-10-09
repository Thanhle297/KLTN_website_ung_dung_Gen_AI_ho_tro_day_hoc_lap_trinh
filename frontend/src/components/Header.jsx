import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Header.scss";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);

  useEffect(() => {
    // Lấy user từ localStorage (sau khi login lưu vào)
    const fullname = localStorage.getItem("fullname");
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    if (token && fullname) {
      setUser({ fullname, role });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("fullname");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header__logo">MyLogo</div>
      <nav className="header__nav">
        <ul>
          <li><Link to="/">Trang chủ</Link></li>
          <li><Link to="/about">Giới thiệu</Link></li>
          <li><Link to="/CodeEx">Dịch vụ</Link></li>
          <li><Link to="/Contact">Liên hệ</Link></li>
        </ul>
      </nav>

      <div className="header__auth">
        {!user ? (
          <button className="login-btn" onClick={() => navigate("/login")}>
            <i className="fas fa-sign-in-alt"></i> {/* FontAwesome icon */}
          </button>
        ) : (
          <div className="user-menu">
            <div
              className="avatar"
              onClick={() => setOpenMenu(!openMenu)}
            >
              {user.fullname.charAt(0).toUpperCase()}
            </div>
            {openMenu && (
              <ul className="dropdown">
                <li><strong>{user.fullname}</strong></li>
                <li><Link to="/profile">Thông tin tài khoản</Link></li>
                <li><button onClick={handleLogout}>Đăng xuất</button></li>
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
