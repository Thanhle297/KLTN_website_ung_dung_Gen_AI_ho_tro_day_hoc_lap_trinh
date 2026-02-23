import React, { useState, useEffect } from "react";
import "../styles/Profile.scss";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [snackMsg, setSnackMsg] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    fetch(`${process.env.REACT_APP_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => setSnackMsg("Không thể tải thông tin người dùng"));
  }, [token]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/me/update`, {
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
    setSnackMsg(data.message || "Cập nhật thành công");
  };

  if (!user) return <p>Đang tải...</p>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Thông tin tài khoản</h1>

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

        <button type="button" className="save-btn" onClick={handleSave}>
          Lưu thay đổi
        </button>

        {snackMsg && (
          <div className="profile-snackbar" role="alert" onClick={() => setSnackMsg("")}>
            {snackMsg}
          </div>
        )}
      </div>
    </div>
  );
}
