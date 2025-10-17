// DifficultySlider.jsx
import { useState } from "react";
import "../styles/DifficultySlider.scss";

export default function DifficultySlider({ onChange }) {
  const levels = ["Dễ", "Khá", "Khó"];
  const [level, setLevel] = useState(0); // 0 = Dễ, 1 = Khá, 2 = Khó

  const handleClick = (i) => {
    setLevel(i);
    if (onChange) onChange(i); // gửi lên CodeEx
  };

  return (
    <div className="slider-container">
      <div className="slider-track">
        <div className="slider-thumb" style={{ left: `${level * 33.33}%` }} />
        {levels.map((label, i) => (
          <button
            key={i}
            className={`slider-btn ${level === i ? "active" : ""}`}
            onClick={() => handleClick(i)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
