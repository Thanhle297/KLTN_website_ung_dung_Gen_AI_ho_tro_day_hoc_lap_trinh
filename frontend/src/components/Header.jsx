import React from "react";
import "../styles/Header.scss";

export default function Header() {
  return (
    <header className="header">
      <div className="header__logo">MyLogo</div>
      <nav className="header__nav">
        <ul>
          <li><a href="#">Trang chủ</a></li>
          <li><a href="#">Giới thiệu</a></li>
          <li><a href="#">Dịch vụ</a></li>
          <li><a href="#">Liên hệ</a></li>
        </ul>
      </nav>
    </header>
  );
}