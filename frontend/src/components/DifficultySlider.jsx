// DifficultySlider.jsx
import { useState } from "react";
import "../styles/DifficultySlider.scss";
import { FaRobot } from "react-icons/fa";

export default function DifficultySlider({ onChange }) {
  // 0 = Tất cả, 1 = 1 phần, 2 = Không
  const [level, setLevel] = useState(0);
  const colors = ["#4CAF50", "#FFC107", "#F44336"]; // xanh - vàng - đỏ

  const handleClick = (i) => {
    setLevel(i);
    if (onChange) onChange(i);
  };

  return (
    <div className="slider-container">
      <div className="slider-track">
        <div
          className="slider-thumb"
          style={{
            left: `${level * 33.33}%`,
            backgroundColor: colors[level],
          }}
        />
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            className={`slider-btn ${level === i ? "active" : ""}`}
            onClick={() => handleClick(i)}
          >
            <FaRobot
              size={28}
              color={level === i ? colors[i] : "#9e9e9e"}
              className="robot-icon"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
