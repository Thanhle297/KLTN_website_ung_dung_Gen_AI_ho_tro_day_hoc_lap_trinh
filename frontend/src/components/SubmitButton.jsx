import React from "react";
import "../styles/SubmitButton.scss";
import { FaPaperPlane } from "react-icons/fa";

export default function SubmitButton({ label = "Nộp bài", onClick, disabled = false }) {
  return (
    <button
      className={`submit-btn ${disabled ? "disabled" : ""}`}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
    >
      <FaPaperPlane className="icon" />
      {label}
    </button>
  );
}
