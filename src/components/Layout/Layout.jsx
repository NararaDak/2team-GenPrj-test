import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
  return (
    <div className="layout-container">
      <nav className="sidebar">
        <h2>소상공인 광고 도우미</h2>
        <ul>
          <li>
            <NavLink to="/test" className={({ isActive }) => (isActive ? 'active' : '')}>
              접속테스트
            </NavLink>
          </li>
          <li>
            <NavLink to="/image-generation" className={({ isActive }) => (isActive ? 'active' : '')}>
              이미지 생성
            </NavLink>
          </li>
          <li>
            <NavLink to="/image-prompt" className={({ isActive }) => (isActive ? 'active' : '')}>
              이미지변경
            </NavLink>
          </li>
          <li>
            <NavLink to="/background-generation" className={({ isActive }) => (isActive ? 'active' : '')}>
              백그라운드생성
            </NavLink>
          </li>
          <li>
            <NavLink to="/adcopy-generation" className={({ isActive }) => (isActive ? 'active' : '')}>
              광고문구 생성
            </NavLink>
          </li>
          <li>
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
              로그인
            </NavLink>
          </li>
          <li>
            <NavLink to="/image-attachment" className={({ isActive }) => (isActive ? 'active' : '')}>
              이미지첨부
            </NavLink>
          </li>
        </ul>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
