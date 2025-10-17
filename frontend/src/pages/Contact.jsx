import React from "react";
import "../styles/Contact.scss";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaGithub,
} from "react-icons/fa";
import admin from"../IMG/thanh2.jpg"

export default function Contact() {
  const devs = [
    {
      name: "Lê Quang Thành",
      role: "Frontend ",
      img: admin,
      facebook: "https://www.facebook.com/thanh.le.964218/",
      github: "https://github.com/thanhle297",
    },
    {
      name: "Lê Quang Thành",
      role: "Backend ",
      img: admin,
      facebook: "https://www.facebook.com/thanh.le.964218/",
      github: "https://github.com/Thanhle297",
    },
    {
      name: "Lê Quang Thành",
      role: "UI/UX ",
      img: admin,
      facebook: "https://www.facebook.com/thanh.le.964218/",
      github: "https://github.com/Thanhle297",
    },
  ];

  return (
    <div className="contact-page">
      <h1 className="title">Liên hệ với chúng tôi</h1>
      <p className="subtitle">
        Hãy gửi cho chúng tôi tin nhắn hoặc liên hệ qua các kênh bên dưới. Chúng tôi luôn sẵn sàng hỗ trợ bạn.
      </p>

      <div className="contact-container">
        <div className="contact-card">
          <FaPhoneAlt className="icon" />
          <h3>Điện thoại</h3>
          <p>+84 987020297</p>
        </div>

        <div className="contact-card">
          <FaEnvelope className="icon" />
          <h3>Email</h3>
          <p>thanhle01112004@gmail.com</p>
        </div>

        <div className="contact-card">
          <FaMapMarkerAlt className="icon" />
          <h3>Địa chỉ</h3>
          <p>136 Xuân Thủy, Cầu Giấy, Hà Nội</p>
        </div>

        <div className="contact-card">
          <FaFacebookF className="icon" />
          <h3>Facebook</h3>
          <p>fb.com/eduplatform.vn</p>
        </div>
      </div>

      <h2 className="dev-section-title">Nhóm phát triển</h2>
      <div className="dev-container">
        {devs.map((dev, i) => (
          <div className="dev-card" key={i}>
            <img src={dev.img} alt={dev.name} />
            <h3>{dev.name}</h3>
            <p>{dev.role}</p>
            <div className="socials">
              <a href={dev.facebook} target="_blank" rel="noreferrer">
                <FaFacebookF />
              </a>
              <a href={dev.github} target="_blank" rel="noreferrer">
                <FaGithub />
              </a>
            </div>
          </div>
        ))}
      </div>

      <form className="contact-form">
        <h2>Gửi tin nhắn</h2>
        <input type="text" placeholder="Họ và tên" required />
        <input type="email" placeholder="Email của bạn" required />
        <textarea placeholder="Nội dung tin nhắn..." rows="5" required></textarea>
        <button type="submit">Gửi</button>
      </form>
    </div>
  );
}
