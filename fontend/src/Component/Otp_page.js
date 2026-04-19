import React, { useState, useEffect } from 'react';
import '../App.css';
import AuthLayout from './AuthLayout';
import { apiUrl } from '../apiConfig';

const OTP_DURATION_SECONDS = 2 * 60; // 2 minutes

function OtpPage({ onTogglePage, onAuthSuccess, email }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(OTP_DURATION_SECONDS);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      const res = await fetch(apiUrl('/users/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTimeLeft(OTP_DURATION_SECONDS);
        setOtp(['', '', '', '', '', '']);
        const resendMsg = data?.message || 'New code sent!';
        alert(resendMsg + (data?.devOtp ? `\nTest OTP: ${data.devOtp}` : ''));
      } else {
        alert(data.message || 'Failed to resend');
      }
    } catch (e) {
      alert('Cannot reach server.');
    }
    setResending(false);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const displayTime = `${mins}:${secs.toString().padStart(2, '0')}`;

  const updateDigit = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      alert('Please enter the full 6-digit code.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/users/verify-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await response.json();
      if (response.ok) {
        const user = data.user;
        if (onAuthSuccess) {
          // If the verified user is an admin, they might need the admin view
          if (user?.role === 'admin') {
            // Check if there is a special onAdminLogin prop (usually in LoginPage context)
            // But here we just complete auth and let the parent handle the role.
            onAuthSuccess('admin', user); 
          } else {
            onAuthSuccess('matching', user);
          }
        } else if (onTogglePage) {
          onTogglePage(user?.role === 'admin' ? 'admin' : 'matching');
        }
      } else {
        alert(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while verifying OTP');
    }
  };

  return (
    <AuthLayout
      title="Enter OTP"
      subtitle={
        <>
          We have sent a code to <strong>{email}</strong>{' '}
          <button className="text-link" type="button" onClick={() => onTogglePage && onTogglePage('login')}>Edit</button>
        </>
      }
    >
      <div className="login-card" style={{ maxWidth: '100%' }}>
        <p style={{ marginBottom: 16, fontSize: 14, color: '#6c757d' }}>
          Code expires in <strong style={{ color: timeLeft <= 30 ? '#e74c3c' : '#007bff' }}>{displayTime}</strong>
        </p>

        <div className="row-between" style={{ justifyContent: 'space-evenly', marginBottom: '16px' }}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              value={digit}
              onChange={(e) => updateDigit(idx, e.target.value)}
              onFocus={(e) => e.target.select()}
              maxLength={1}
              pattern="[0-9]*"
              inputMode="numeric"
              style={{
                width: 52,
                height: 64,
                fontSize: 28,
                textAlign: 'center',
                borderRadius: 10,
                border: '1px solid #d7d7d7',
              }}
            />
          ))}
        </div>

        {timeLeft > 0 && (
          <button className="primary-btn" type="button" onClick={handleVerify}>
            Verify Code
          </button>
        )}
        {timeLeft === 0 && (
          <p style={{ marginTop: 12, textAlign: 'center', fontSize: 14, color: '#e74c3c' }}>
            OTP expired. Please go back and request a new code.
          </p>
        )}

        <div style={{ marginTop: 12, textAlign: 'center', fontSize: 14 }}>
          Didn't get a code?{' '}
          <button className="text-link" type="button" onClick={handleResend} disabled={resending}>
            {resending ? 'Sending...' : 'Click To Resend'}
          </button>
        </div>

        <div className="footer-link" style={{ marginTop: 18 }}>
          <button type="button" onClick={() => onTogglePage && onTogglePage('login')}>
            Cancel
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default OtpPage;
