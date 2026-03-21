import React, { useState } from 'react';
import '../App.css';
import AuthLayout from './AuthLayout';

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

function UpdatePage({ onTogglePage, setCurrentEmail }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      alert('Please enter your email.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5001/users/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, forgotPassword: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setCurrentEmail && setCurrentEmail(email);
        setOtpSent(true);
        alert('OTP sent! Check your email or the backend console for the code.');
      } else {
        alert(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error(error);
      alert('Cannot reach server. Please ensure backend runs on port 5001.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      alert('Please fill all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5001/users/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && onTogglePage) {
        alert('Password updated successfully!');
        onTogglePage('login');
      } else {
        alert(data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error(error);
      alert('Cannot reach server. Please ensure backend runs on port 5001.');
    }
  };

  return (
    <AuthLayout
      title="Update Password"
      subtitle="Enter your email to receive an OTP, then set a new password."
    >
      <div className="login-card" style={{ maxWidth: '100%' }}>

        <label className="field-label" htmlFor="update-email">Email<span className="required">*</span></label>
        <div className="input-wrap">
          <input
            id="update-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={otpSent}
          />
          <span className="input-icon">✉</span>
        </div>

        {!otpSent ? (
          <button className="primary-btn" type="button" onClick={handleSendOtp} style={{ marginTop: 16 }}>
            Send OTP
          </button>
        ) : (
          <>
            <label className="field-label" htmlFor="update-otp">OTP<span className="required">*</span></label>
            <div className="input-wrap">
              <input
                id="update-otp"
                type="text"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
              />
            </div>

            <label className="field-label" htmlFor="new-password">New Password<span className="required">*</span></label>
            <div className="input-wrap">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="input-icon-btn create-input-icon"
                aria-label={showPassword ? 'Hide' : 'Show'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <label className="field-label" htmlFor="confirm-new">Confirm Password<span className="required">*</span></label>
            <div className="input-wrap">
              <input
                id="confirm-new"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="input-icon-btn create-input-icon"
                aria-label={showConfirm ? 'Hide' : 'Show'}
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <button className="primary-btn" type="button" onClick={handleUpdatePassword} style={{ marginTop: 16 }}>
              Update Password
            </button>
          </>
        )}

        <div className="footer-link" style={{ marginTop: 20 }}>
          Remember your password?{' '}
          <button type="button" onClick={() => onTogglePage && onTogglePage('login')}>
            Login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default UpdatePage;
