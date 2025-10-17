import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import "@fortawesome/fontawesome-free/css/all.min.css";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


// // Chặn phím tắt phổ biến
// document.addEventListener('keydown', e => {
//   if (
//     e.key === 'F12' ||
//     (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
//     (e.ctrlKey && ['U', 'S'].includes(e.key))
//   ) {
//     e.preventDefault();
//   }
// });

// // Chặn chuột phải
// document.addEventListener('contextmenu', e => e.preventDefault());

// // --- Phát hiện DevTools và reload ---
// (function detectDevTools() {
//   const threshold = 160;

//   function bySize() {
//     const w = window.outerWidth - window.innerWidth;
//     const h = window.outerHeight - window.innerHeight;
//     return w > threshold || h > threshold;
//   }

//   function byDebugger() {
//     const start = performance.now();
//     debugger; // nếu DevTools mở sẽ tạm dừng ở đây
//     return performance.now() - start > 100;
//   }

//   function check() {
//     if (bySize() || byDebugger()) {
//       window.location.reload(); // reload khi phát hiện mở DevTools
//     }
//   }

//   setInterval(check, 800);
//   window.addEventListener('resize', () => {
//     if (bySize()) window.location.reload();
//   });
// })();