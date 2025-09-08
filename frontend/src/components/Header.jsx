// import React from "react";
// import "../styles/Header.scss";

// export default function Header() {
//   return (
//     <header className="header">
//       <div className="header__logo">MyLogo</div>
//       <nav className="header__nav">
//         <ul>
//           <li><a href="#">Trang chủ</a></li>
//           <li><a href="#">Giới thiệu</a></li>
//           <li><a href="#">Dịch vụ</a></li>
//           <li><a href="#">Liên hệ</a></li>
//         </ul>
//       </nav>
//     </header>
//   );
// }


import React from "react";
import { Link } from "react-router-dom"; // ✅ import Link

import "../styles/Header.scss";

export default function Header() {
  return (
    <header className="header">
      <div className="header__logo">MyLogo</div>
      <nav className="header__nav">
        <ul>
          <li><Link to="/">Trang chủ</Link></li>
          <li><Link to="/about">Giới thiệu</Link></li>
          <li><Link to="/CodeEx">Dịch vụ</Link></li>
          <li><Link to="/contact">Liên hệ</Link></li>
        </ul>
      </nav>
    </header>
  );
}
