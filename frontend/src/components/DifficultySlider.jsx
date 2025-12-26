// DifficultySlider.jsx
import { useState } from "react";
import "../styles/DifficultySlider.scss";
import { FaRobot } from "react-icons/fa";

export default function DifficultySlider({ onChange }) {
  const [level, setLevel] = useState(0);
  const colors = ["#4CAF50", "#FFC107", "#F44336"];

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
            // Di chuyển thumb theo tỷ lệ 100% chiều rộng của chính nó
            transform: `translateX(${level * 100}%)`,
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
              size={22}
              // Icon màu trắng khi được chọn, xám khi chưa chọn
              color={level === i ? "#FFFFFF" : "#adb5bd"}
              className="robot-icon"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
