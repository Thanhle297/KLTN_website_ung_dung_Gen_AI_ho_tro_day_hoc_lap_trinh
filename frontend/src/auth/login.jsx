import { useState } from "react";
import { useNavigate } from "react-router-dom";
import banner from "../IMG/Banner.png";
import logo from "../IMG/Logo_noback.png";
import "../styles/login.scss";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("fullname", data.fullname);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.userId);

      navigate("/course/10");
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="login">
      <section className="login__image">
        <img src={banner} alt="Hệ thống học lập trình trực tuyến" />
      </section>
      <section className="login__form">
        <form
          className="form"
          onSubmit={handleSubmit}
          aria-label="Form đăng nhập"
        >
          <img src={logo} alt="TEdu Logo" className="logo" />
          <h2>Đăng nhập hệ thống</h2>
          {error && (
            <p className="form__error" role="alert" aria-live="polite">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-required="true"
              autoFocus
              required
            />
          </div>
          <div>
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
              required
            />
          </div>
          <button type="submit" disabled={isLoading} aria-busy={isLoading}>
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </section>
    </div>
  );
}
