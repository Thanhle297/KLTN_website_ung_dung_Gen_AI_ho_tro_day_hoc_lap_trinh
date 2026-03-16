import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import banner from "../IMG/Banner.png";
import logo from "../IMG/Logo_noback.png";
import "../styles/login.scss";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hiển thị cảnh báo nếu bị đá phiên từ IP khác
  useEffect(() => {
    if (location.state?.forceLogout) {
      setWarning("Tài khoản đã được đăng nhập từ thiết bị khác. Phiên này đã bị đăng xuất.");
      // Xóa state để không hiển thị lại khi refresh
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // ✅ CHỈ LƯU TOKEN
      localStorage.setItem("token", data.token);

      // ✅ Decode token để lấy role, enrolledCourses (nếu có trong token)
      const decoded = jwtDecode(data.token);

      // ⚠️ Nếu enrolledCourses KHÔNG nằm trong token
      // thì chỉ điều hướng theo role
      if (decoded.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/course");
      }
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="login">
      <section className="login__image">
        <img src={banner} alt="Hệ thống học lập trình trực tuyến" width={600} height={400} />
      </section>

      <section className="login__form">
        <form className="form" onSubmit={handleSubmit} autoComplete="on">
          <img src={logo} alt="TEdu Logo" className="logo" width={80} height={80} />
          <h2>Đăng nhập hệ thống</h2>

          {warning && <p className="form__warning">{warning}</p>}
          {error && <p className="form__error">{error}</p>}

          <div>
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </section>
    </div>
  );
}
