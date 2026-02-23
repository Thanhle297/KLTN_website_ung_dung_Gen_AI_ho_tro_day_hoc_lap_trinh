// DifficultySlider.jsx
import { useState, useEffect } from "react";
import "../styles/DifficultySlider.scss";
import { FaRobot } from "react-icons/fa";

export default function DifficultySlider({ onChange }) {
  const [level, setLevel] = useState(0);
  const colors = ["#F44336", "#FFC107", "#4CAF50"];
  const labels = ["Khó", "Trung bình", "Dễ"];

  useEffect(() => {
    if (onChange) onChange(2);
  }, []);

  const handleClick = (i) => {
    setLevel(i);
    if (onChange) onChange(2 - i);
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
            type="button"
            className={`slider-btn ${level === i ? "active" : ""}`}
            onClick={() => handleClick(i)}
            aria-label={labels[i]}
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
