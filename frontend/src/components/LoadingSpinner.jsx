import React from "react";
import "../styles/LoadingSpinner.scss";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="loading-spinner" role="status" aria-live="polite">
      <span className="loading-spinner__icon" aria-hidden="true" />
      {label ? <span className="loading-spinner__text">{label}</span> : null}
    </div>
  );
}
