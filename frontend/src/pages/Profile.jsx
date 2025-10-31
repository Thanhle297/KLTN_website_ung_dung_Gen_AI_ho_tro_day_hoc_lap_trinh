import React, { useState, useEffect } from "react";
import "../styles/Profile.scss";

export default function Profile() {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    fetch("http://103.90.224.183:3001/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => alert("Không thể tải thông tin người dùng"));
  }, [token]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const res = await fetch(`http://103.90.224.183:3001/api/users/${user._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fullname: user.fullname,
        email: user.email,
      }),
    });

    const data = await res.json();
    alert(data.message || "Cập nhật thành công");
  };

  if (!user) return <p>Đang tải...</p>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Thông tin tài khoản</h2>

        <div className="profile-info">
          <label>
            Họ và tên:
            <input
              type="text"
              name="fullname"
              value={user.fullname || ""}
              onChange={handleChange}
            />
          </label>

          <label>
            Tên đăng nhập:
            <input
              type="text"
              name="username"
              value={user.username || ""}
              disabled
            />
          </label>

          <label>
            Email:
            <input
              type="email"
              name="email"
              value={user.email || ""}
              onChange={handleChange}
            />
          </label>

          <label>
            Vai trò:
            <input type="text" name="role" value={user.role || ""} disabled />
          </label>
        </div>

        <button className="save-btn" onClick={handleSave}>
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}
