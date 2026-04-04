import React, { useMemo, useState } from 'react';
import '../App.css';
import { apiUrl } from '../apiConfig';

function CreatePage ({ onTogglePage, setCurrentEmail }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(true);

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return 'Enter password';
    if (passwordStrength <= 1) return 'Weak Password';
    if (passwordStrength === 2) return 'Fair Password';
    if (passwordStrength === 3) return 'Good Password';
    return 'Strong Password';
  }, [passwordStrength, password.length]);

  const strengthPercentage = useMemo(() => (passwordStrength / 4) * 100, [passwordStrength]);

  const handleSendOtp = async () => {
    if (!email) {
      alert('Please enter your email.');
      return;
    }
    try {
      const response = await fetch(apiUrl('/users/send-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text || 'Invalid server response' };
      }
      if (response.ok) {
        if (data.message) {
          alert(data.message + (data.devOtp ? `\nTest OTP: ${data.devOtp}` : ''));
        }
        setCurrentEmail(email);
        onTogglePage('otp');
      } else {
        alert(data.message || data.error || `Failed to send OTP (${response.status})`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Cannot reach server. Start the Backend (npm start in Backend folder) and try again.');
    }
  };

  const setPhoneDigitsOnly = (raw) => {
    setPhone(String(raw || '').replace(/\D/g, '').slice(0, 10));
  };

  const handleCreate = async () => {
    if (!agree) {
      alert('Please agree to Terms and Privacy.');
      return;
    }

    if (!email || !phone || !password || !confirmPassword) {
      alert('All fields are required.');
      return;
    }

    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      alert('Phone number must be exactly 10 digits (numbers only).');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match. Please check.');
      return;
    }

    try {
      const response = await fetch(apiUrl('/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          password,
          name: email.split('@')[0],
        }),
      });
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }
      if (response.ok) {
        if (typeof onTogglePage === 'function') {
          onTogglePage('login');
        }
        window.setTimeout(() => {
          window.alert('Account created successfully! You can log in.');
        }, 0);
      } else {
        alert(data.message || data.error || 'Could not create account.');
      }
    } catch (e) {
      console.error(e);
      alert('Cannot reach server. Is the backend running on port 5001?');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="title-wrap">
            <div className="logo-dot">||</div>
            <h2>Create New Account</h2>
          </div>
          <button className="icon-button" aria-label="close" type="button">
            ×
          </button>
        </div>

        <p className="subtitle">Create your account - enjoy our services with most updated features.</p>

        <label className="field-label" htmlFor="email">Email<span className="required">*</span></label>
        <div className="input-wrap active">
          <input
            id="email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <span className="input-icon">✉</span>
        </div>
        <button className="primary-btn" type="button" onClick={handleSendOtp} style={{ marginBottom: '16px' }}>
          Send OTP
        </button>

        <label className="field-label" htmlFor="phone">Phone Number<span className="required">*</span></label>
        <div className="input-wrap active">
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            pattern="[0-9]*"
            value={phone}
            onChange={(e) => setPhoneDigitsOnly(e.target.value)}
            placeholder="10 digits only (e.g. 0712345678)"
          />
          <span className="input-icon">☎</span>
        </div>

        <label className="field-label" htmlFor="password">Password<span className="required">*</span></label>
        <div className="input-wrap active">
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
          <span className="input-icon">◉</span>
        </div>

        <div className="strength-wrap" aria-label="password strength">
          {[1, 2, 3, 4].map((n) => (
            <span
              key={n}
              className={`strength-segment ${passwordStrength >= n ? 'active' : ''}`}
              style={{ backgroundColor: passwordStrength >= n ? '#20c15e' : '#ececec' }}
            />
          ))}
        </div>
        <p className="strength-text">{strengthLabel}</p>

        <label className="field-label" htmlFor="confirmPassword">Confirm Password<span className="required">*</span></label>
        <div className="input-wrap active">
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
          />
          <span className="input-icon">◉</span>
        </div>

        <label className="terms-wrap">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I agree with </span>
          <button type="button">Terms</button>
          <span> and </span>
          <button type="button">Privacy</button>
        </label>

        <button className="primary-btn" type="button" onClick={handleCreate}>
          Create Account
        </button>

        <div className="footer-link">
          Already have account?{' '}
          <button type="button" onClick={() => onTogglePage && onTogglePage('login')}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreatePage;
