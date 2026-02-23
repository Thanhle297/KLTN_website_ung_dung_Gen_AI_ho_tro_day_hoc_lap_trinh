import React, { useState } from "react";
import "../styles/Contact.scss";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaGithub,
  FaPaperPlane,
  FaLinkedinIn,
} from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import admin from "../IMG/thanh2.jpg";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const devs = [
    {
      name: "Lê Quang Thành",
      role: "Full Stack Developer",
      description: "Frontend & Backend",
      img: admin,
      facebook: "https://www.facebook.com/thanh.le.964218/",
      github: "https://github.com/thanhle297",
      linkedin: "#",
    },
    {
      name: "Lê Quang Thành",
      role: "Backend Engineer",
      description: "API & Database",
      img: admin,
      facebook: "https://www.facebook.com/thanh.le.964218/",
      github: "https://github.com/Thanhle297",
      linkedin: "#",
    },
    {
      name: "Lê Quang Thành",
      role: "UI/UX Designer",
      description: "Design & Experience",
      img: admin,
      facebook: "https://www.facebook.com/thanh.le.964218/",
      github: "https://github.com/Thanhle297",
      linkedin: "#",
    },
  ];

  const contactInfo = [
    {
      icon: FaPhoneAlt,
      title: "Điện thoại",
      content: "+84 987020297",
      link: "tel:+84987020297",
      color: "#10b981",
    },
    {
      icon: FaEnvelope,
      title: "Email",
      content: "thanhle01112004@gmail.com",
      link: "mailto:thanhle01112004@gmail.com",
      color: "#3b82f6",
    },
    {
      icon: FaMapMarkerAlt,
      title: "Địa chỉ",
      content: "136 Xuân Thủy, Cầu Giấy, Hà Nội",
      link: "https://maps.google.com",
      color: "#ef4444",
    },
    {
      icon: FaFacebookF,
      title: "Facebook",
      content: "Thành Lê",
      link: "https://www.facebook.com/thanh.le.964218/",
      color: "#1877f2",
    },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Form submitted:", formData);
      setIsSubmitting(false);
      setFormData({ name: "", email: "", message: "" });
      setShowSuccess(true);
    }, 1500);
  };

  return (
    <div className="contact-page">
      {/* Animated Background */}
      <div className="animated-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Header Section */}
      <div className="contact-header">
        <div className="header-icon">
          <IoSparkles />
        </div>
        <h1 className="title">
          Liên hệ với <span className="gradient-text">chúng tôi</span>
        </h1>
        <p className="subtitle">
          Hãy gửi cho chúng tôi tin nhắn hoặc liên hệ qua các kênh bên dưới.
          <br />
          Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.
        </p>
      </div>

      {/* Contact Info Cards */}
      <div className="contact-container">
        {contactInfo.map((item, index) => (
          <a
            href={item.link}
            className="contact-card"
            key={index}
            style={{ "--card-color": item.color }}
            target={item.link.startsWith("http") ? "_blank" : "_self"}
            rel="noopener noreferrer"
          >
            <div className="card-glow"></div>
            <div className="icon-wrapper">
              <item.icon className="icon" />
            </div>
            <h3>{item.title}</h3>
            <p>{item.content}</p>
          </a>
        ))}
      </div>

      {/* Team Section */}
      <div className="team-section">
        <h2 className="dev-section-title">
          <span className="gradient-text">Nhóm phát triển</span>
        </h2>
        <p className="team-subtitle">Đội ngũ tài năng đằng sau dự án</p>

        <div className="dev-container">
          {devs.map((dev, i) => (
            <div className="dev-card" key={i}>
              <div className="dev-card-inner">
                <div className="dev-image-wrapper">
                  <img src={dev.img} alt={dev.name} />
                  <div className="image-overlay"></div>
                </div>
                <div className="dev-info">
                  <h3>{dev.name}</h3>
                  <p className="dev-role">{dev.role}</p>
                  <p className="dev-description">{dev.description}</p>
                  <div className="socials">
                    <a
                      href={dev.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Facebook"
                      aria-label="Facebook"
                    >
                      <FaFacebookF />
                    </a>
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="GitHub"
                      aria-label="GitHub"
                    >
                      <FaGithub />
                    </a>
                    <a
                      href={dev.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="LinkedIn"
                      aria-label="LinkedIn"
                    >
                      <FaLinkedinIn />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="form-section">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Gửi tin nhắn cho chúng tôi</h2>
            <p>Chúng tôi sẽ phản hồi trong vòng 24 giờ</p>
          </div>

          <div className="form-group">
            <label htmlFor="name">Họ và tên</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Nhập họ và tên của bạn"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Nội dung tin nhắn</label>
            <textarea
              id="message"
              name="message"
              placeholder="Nhập nội dung tin nhắn của bạn..."
              rows="5"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Đang gửi...
              </>
            ) : (
              <>
                <FaPaperPlane />
                Gửi tin nhắn
              </>
            )}
          </button>
          {showSuccess && (
            <div className="form-success" role="alert">
              Tin nhắn đã được gửi thành công!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
