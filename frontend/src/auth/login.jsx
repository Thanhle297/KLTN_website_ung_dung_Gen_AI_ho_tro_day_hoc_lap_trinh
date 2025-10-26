import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.scss";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("fullname", data.fullname);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId",data.userId);

      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login">
      <section className="login__image">
        <img
          src="https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/11/tai-hinh-nen-dep-mien-phi.jpg"
          alt="Welcome"
        />
      </section>
      <section className="login__form">
        <form className="form" onSubmit={handleSubmit}>
          <h2>Đăng nhập hệ thống</h2>
          {error && <p className="form__error">{error}</p>}
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Đăng nhập</button>
        </form>
      </section>
    </div>
  );
}
