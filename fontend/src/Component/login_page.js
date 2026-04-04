import React, { useState } from 'react';
import '../App.css';
import AuthLayout from './AuthLayout';
import { apiUrl } from '../apiConfig';

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function LoginPage({ onTogglePage, setCurrentEmail, setCurrentUser, onAdminLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password.');
      return;
    }

    try {
      const loginResponse = await fetch(apiUrl('/users/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok) {
        alert(loginData.message || 'Invalid login');
        return;
      }
      setCurrentEmail && setCurrentEmail(email);
      setCurrentUser && setCurrentUser(loginData.user || null);

      if (loginData.user?.role === 'admin') {
        if (typeof onAdminLogin === 'function') {
          onAdminLogin();
        }
        return;
      }

      const otpResponse = await fetch(apiUrl('/users/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const otpData = await otpResponse.json().catch(() => ({}));

      if (otpResponse.ok) {
        if (otpData?.message) {
          alert(otpData.message + (otpData.devOtp ? `\nTest OTP: ${otpData.devOtp}` : ''));
        }
        onTogglePage && onTogglePage('otp', email);
      } else {
        alert(otpData.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error(error);
      alert(
        'Cannot reach the API server.\n\n' +
          '1) Open a terminal in the Backend folder and run: npm start\n' +
          '2) Wait until you see: Server is running on port 5001\n' +
          '3) Try login again (frontend can stay on port 3000).'
      );
    }
  };

  return (
    <AuthLayout
      title="Login to your Account"
      subtitle="Welcome back! Select method to log in:"
    >
      <div className="social-btns-row">
        <button className="social-btn" type="button">
          <span className="social-icon" style={{ color: '#1877f2' }}>f</span>
          Facebook
        </button>
        <button className="social-btn" type="button">
          <span className="social-icon" style={{ color: '#4285f4' }}>G</span>
          Google
        </button>
      </div>

      <p className="divider-text">or continue with email</p>

      <label className="field-label" htmlFor="email">Email or Username</label>
      <div className="input-wrap">
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email or username"
        />
      </div>

      <label className="field-label" htmlFor="password" style={{ marginTop: 16 }}>Password</label>
      <div className="input-wrap">
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
        <button
          type="button"
          className="input-icon-btn create-input-icon"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      <div className="row-between" style={{ marginTop: 16 }}>
        <label className="remember-wrap">
          <input type="checkbox" defaultChecked />
          <span>Remember Me</span>
        </label>
        <button className="text-link" type="button" onClick={() => onTogglePage && onTogglePage('update')}>
          Forgot Password?
        </button>
      </div>

      <button className="primary-btn" type="button" onClick={handleLogin}>
        Login
      </button>

      <div className="footer-link" style={{ marginTop: 24 }}>
        New on our platform?{' '}
        <button type="button" onClick={() => onTogglePage && onTogglePage('create')}>
          Create an account
        </button>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
