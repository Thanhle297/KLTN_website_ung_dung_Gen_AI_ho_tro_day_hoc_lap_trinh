// components/DevToolsWarning.jsx
import { useEffect, useState, useRef } from "react";
import "../styles/DevToolsWarning.scss";

// ---------------------------------------------------------------------------
// Kỹ thuật 1: Resize diff — O(1), gần như miễn phí
// Phát hiện DevTools docked (bên phải / bên dưới cửa sổ trình duyệt)
// ---------------------------------------------------------------------------
const RESIZE_THRESHOLD = 160; // px

function checkResize() {
  const widthDiff = window.outerWidth - window.innerWidth;
  const heightDiff = window.outerHeight - window.innerHeight;
  return widthDiff > RESIZE_THRESHOLD || heightDiff > RESIZE_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Kỹ thuật 2: debugger timing
// Khi DevTools mở (bất kỳ chế độ nào: docked, undocked, bật sẵn),
// engine sẽ dừng tại "debugger" → elapsed time > ngưỡng.
// CHỈ chạy khi kỹ thuật 1 không phát hiện được (short-circuit).
// ---------------------------------------------------------------------------
const DEBUGGER_THRESHOLD = 100; // ms

function checkDebugger() {
  const before = performance.now();
  // eslint-disable-next-line no-debugger
  debugger;
  const elapsed = performance.now() - before;
  return elapsed > DEBUGGER_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Kỹ thuật 3: console.log getter
// Khi DevTools mở và Console tab đang active, browser sẽ evaluate
// getter của object được log → setter flag được gọi.
// Object được tạo 1 lần duy nhất, tái sử dụng để tránh memory leak.
// CHỈ chạy khi cả kỹ thuật 1 và 2 không phát hiện được.
// ---------------------------------------------------------------------------
function createConsoleProbe() {
  let triggered = false;
  const probe = {};
  Object.defineProperty(probe, "__probe__", {
    get() {
      triggered = true;
      return "devtools";
    },
    configurable: true,
  });
  return {
    probe,
    check() {
      triggered = false;
      // eslint-disable-next-line no-console
      console.log(probe);
      return triggered;
    },
  };
}

// ---------------------------------------------------------------------------
// Hook chính: kết hợp 3 kỹ thuật theo thứ tự short-circuit
// ---------------------------------------------------------------------------
function useDevToolsDetection(intervalMs = 2000) {
  const [detected, setDetected] = useState(false);
  const consoleProbeRef = useRef(null);

  useEffect(() => {
    // Khởi tạo console probe 1 lần duy nhất
    consoleProbeRef.current = createConsoleProbe();

    function runChecks() {
      // Bước 1: resize diff (miễn phí)
      if (checkResize()) {
        setDetected(true);
        return;
      }

      // Bước 2: debugger timing (chỉ chạy nếu bước 1 không phát hiện)
      if (checkDebugger()) {
        setDetected(true);
        return;
      }

      // Bước 3: console getter (chỉ chạy nếu cả 2 bước trên không phát hiện)
      if (consoleProbeRef.current.check()) {
        setDetected(true);
        return;
      }

      setDetected(false);
    }

    // Kiểm tra ngay khi mount (bắt trường hợp bật sẵn trước khi vào trang)
    runChecks();

    // Lắng nghe resize (bắt thay đổi nhanh khi dock/undock)
    window.addEventListener("resize", runChecks);

    // Kiểm tra định kỳ mỗi intervalMs giây
    const interval = setInterval(runChecks, intervalMs);

    return () => {
      window.removeEventListener("resize", runChecks);
      clearInterval(interval);
    };
  }, [intervalMs]);

  return detected;
}

// ---------------------------------------------------------------------------
// Component hiển thị cảnh báo
// ---------------------------------------------------------------------------
export default function DevToolsWarning() {
  const isDetected = useDevToolsDetection(2000);

  if (!isDetected) return null;

  return (
    <div
      className="devtools-warning"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="devtools-warning-title"
    >
      <div className="devtools-warning__overlay" />
      <div className="devtools-warning__box">
        <div className="devtools-warning__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="devtools-warning-title" className="devtools-warning__title">
          Phát hiện Công cụ Nhà phát triển
        </h2>

        <p className="devtools-warning__message">
          Công cụ nhà phát triển (DevTools) đang được mở.
          <br />
          Vui lòng đóng DevTools để tiếp tục sử dụng hệ thống.
        </p>

        <div className="devtools-warning__hint">
          <span>Nhấn</span>
          <kbd>F12</kbd>
          <span>hoặc</span>
          <kbd>Ctrl</kbd>
          <span>+</span>
          <kbd>Shift</kbd>
          <span>+</span>
          <kbd>I</kbd>
          <span>để đóng DevTools</span>
        </div>
      </div>
    </div>
  );
}
