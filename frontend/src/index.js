import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
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


// Chặn phím tắt phổ biến
document.addEventListener('keydown', e => {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'V', 'v'].includes(e.key)) ||
    (e.ctrlKey && ['U', 'u', 'S', 's', 'C', 'c', 'V', 'v'].includes(e.key))
  ) {
    e.preventDefault();
  }
});

// Chặn chuột phải
document.addEventListener('contextmenu', e => e.preventDefault());

