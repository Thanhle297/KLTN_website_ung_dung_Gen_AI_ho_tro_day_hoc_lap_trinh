import React from "react";
import { ThreeDots } from "react-loader-spinner";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
      role="status"
      aria-live="polite"
    >
      <ThreeDots
        color="#1976d2"
        height={50}
        width={50}
        ariaLabel="loading"
        wrapperStyle={{ display: "flex" }}
      />
      {label ? (
        <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>{label}</span>
      ) : null}
    </div>
  );
}
