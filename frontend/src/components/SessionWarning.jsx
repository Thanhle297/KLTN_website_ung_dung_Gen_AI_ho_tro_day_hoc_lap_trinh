// components/SessionWarning.jsx
import { useEffect } from "react";
import "../styles/SessionWarning.scss";

export default function SessionWarning({ countdown, onContinue, onLogout }) {
  // Auto logout khi countdown = 0
  useEffect(() => {
    if (countdown <= 0) onLogout();
  }, [countdown, onLogout]);

  return (
    <div className="session-warning">
      <div className="session-warning__box">
        <h3>Phiên làm việc sắp hết hạn</h3>
        <p>
          Bạn sẽ bị đăng xuất sau <b>{countdown}</b> giây nếu không thao tác.
        </p>
        <button onClick={onContinue}>Tiếp tục phiên</button>
      </div>
    </div>
  );
}
