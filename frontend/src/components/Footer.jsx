// Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.scss";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        {/* Logo & Description */}
        <div className="footer__section footer__about">
          <h3 className="footer__logo">TEdu Technology</h3>
          <p className="footer__description">
            Nền tảng học lập trình hiện đại, cung cấp các khóa học chất lượng
            cao với AI hỗ trợ học tập thông minh.
          </p>
          <div className="footer__social">
            <a
              href="https://www.facebook.com/thanh.le.964218/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook"></i>
            </a>
            <a
              href="https://github.com/Thanhle297"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <i className="fab fa-github"></i>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="mailto:contact@tedu.vn" aria-label="Email">
              <i className="fas fa-envelope"></i>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer__section">
          <h4 className="footer__title">Liên kết nhanh</h4>
          <ul className="footer__links">
            <li>
              <Link to="/">Trang chủ</Link>
            </li>
            <li>
              <Link to="/course">Khóa học</Link>
            </li>
            <li>
              <Link to="/contact">Liên hệ</Link>
            </li>
            <li>
              <Link to="/profile">Tài khoản</Link>
            </li>
          </ul>
        </div>

        {/* Courses */}
        <div className="footer__section">
          <h4 className="footer__title">Khóa học phổ biến</h4>
          <ul className="footer__links">
            <li>
              <a href="#python">Python cơ bản</a>
            </li>
            <li>
              <a href="#javascript">JavaScript hiện đại</a>
            </li>
            <li>
              <a href="#react">React cho người mới</a>
            </li>
            <li>
              <a href="#data-structure">Cấu trúc dữ liệu</a>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer__section">
          <h4 className="footer__title">Hỗ trợ</h4>
          <ul className="footer__links">
            <li>
              <a href="#faq">Câu hỏi thường gặp</a>
            </li>
            <li>
              <a href="#guide">Hướng dẫn sử dụng</a>
            </li>
            <li>
              <a href="#terms">Điều khoản dịch vụ</a>
            </li>
            <li>
              <a href="#privacy">Chính sách bảo mật</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <p className="footer__copyright">
          © {currentYear} TEdu Technology. Designed with{" "}
          <i className="fas fa-heart" aria-hidden="true"></i> for education.
        </p>
      </div>
    </footer>
  );
}
