import React from 'react';
import '../App.css';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-split">
      <div className="auth-split__image" />
      <div className="auth-split__form">
        <div className="auth-brand">
          <div className="auth-brand__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <span className="auth-brand__text">iLost</span>
        </div>
        {title && <h1 className="auth-title">{title}</h1>}
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
