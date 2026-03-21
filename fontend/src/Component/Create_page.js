import React, { useMemo, useState } from 'react';
import '../App.css';
import AuthLayout from './AuthLayout';

const EnvelopeIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#007bff' : '#6c757d'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#787878" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#787878" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#787878" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

function CreatePage ({ onTogglePage, setCurrentEmail }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 5);
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return 'Enter password';
    if (passwordStrength <= 1) return 'Weak Password';
    if (passwordStrength === 2) return 'Fair Password';
    if (passwordStrength === 3) return 'Good Password';
    if (passwordStrength === 4) return 'Good Password';
    return 'Strong Password';
  }, [passwordStrength, password.length]);

  const handleCreate = async () => {
    if (!agree) {
      alert('Please agree to Terms and Privacy.');
      return;
    }
    if (!email || !phone || !password || !confirmPassword) {
      alert('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please check.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && onTogglePage) {
        alert('Account created successfully!');
        onTogglePage('login');
      } else {
        alert(data.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error:', error);
      const msg = error.message || 'An error occurred.';
      if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        alert('Cannot reach server. Please ensure the backend is running on port 5001.');
      } else {
        alert(msg);
      }
    }
  };

  return (
    <AuthLayout
      title="Create New Account"
      subtitle="Join us - enjoy our services with the most updated features."
    >
      <div className="login-card create-account-card" style={{ maxWidth: '100%' }}>
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

        <label className="field-label" htmlFor="email">Email<span className="required">*</span></label>
        <div className={`input-wrap ${focusedField === 'email' ? 'active' : ''}`}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            placeholder="lostandfound@gmail.com"
          />
          <span className="input-icon create-input-icon"><EnvelopeIcon active={focusedField === 'email'} /></span>
        </div>

        <label className="field-label" htmlFor="phone">Phone Number<span className="required">*</span></label>
        <div className={`input-wrap ${focusedField === 'phone' ? 'active' : ''}`}>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
            placeholder="07x xxxxxxx"
          />
          <span className="input-icon create-input-icon"><PhoneIcon /></span>
        </div>

        <label className="field-label" htmlFor="password">Password<span className="required">*</span></label>
        <div className={`input-wrap ${focusedField === 'password' ? 'active' : ''}`}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            placeholder="Lost@1234"
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

        <div className="strength-wrap strength-wrap-5" aria-label="password strength">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`strength-segment ${passwordStrength >= n ? 'active' : ''}`}
              style={{ backgroundColor: passwordStrength >= n ? '#20c15e' : '#ececec' }}
            />
          ))}
        </div>
        <p className="strength-text">{strengthLabel}</p>

        <label className="field-label" htmlFor="confirmPassword">Confirm Password<span className="required">*</span></label>
        <div className={`input-wrap ${focusedField === 'confirmPassword' ? 'active' : ''}`}>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            className="input-icon-btn create-input-icon"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
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
    </AuthLayout>
  );
}

export default CreatePage;
