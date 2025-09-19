import React from 'react';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="icon">
        <a href="#" onClick={() => console.log('點擊首頁')}>
          <i className="fa-solid fa-house"></i>
          <span>首頁</span>
        </a>
      </div>
      <div className="icon">
        <a href="#" onClick={() => console.log('點擊信用卡')}>
          <i className="fa-solid fa-credit-card"></i>
          <span>信用卡</span>
        </a>
      </div>
      <div className="icon">
        <a href="#" onClick={() => console.log('點擊商家回饋')}>
          <i className="fa-solid fa-gift"></i>
          <span>商家回饋</span>
        </a>
      </div>
      <div className="icon">
        <a href="#" onClick={() => console.log('點擊會員')}>
          <i className="fa-solid fa-user"></i>
          <span>會員</span>
        </a>
      </div>
    </nav>
  );
}

export default Navbar;