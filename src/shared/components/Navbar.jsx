import React from "react";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="icon">
        <a href="#">
          <i className="fa-solid fa-house"></i>
          <span>首頁</span>
        </a>
      </div>
      <div className="icon">
        <a href="#">
          <i className="fa-solid fa-credit-card"></i>
          <span>信用卡</span>
        </a>
      </div>
      <div className="icon">
        <a href="#">
          <i className="fa-solid fa-gift"></i>
          <span>商家回饋</span>
        </a>
      </div>
      <div className="icon">
        <a href="#">
          <i className="fa-solid fa-user"></i>
          <span>會員</span>
        </a>
      </div>
    </nav>
  );
}

export default Navbar;
