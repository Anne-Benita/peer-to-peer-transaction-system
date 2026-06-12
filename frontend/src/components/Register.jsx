import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Register = ({ onLoginLink }) => {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Standard Validation
    if (!firstName || !lastName || !email || !phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Phone number format validation (Cameroon local prefixes)
    // Local Cameroon phone numbers have 9 digits. MTN typically starts with 650-654, 670-679, 680-683.
    const cleanPhone = phone.replace(/\s+/g, '').replace('+', '');
    if (cleanPhone.length < 9) {
      setError('MTN Phone number must be at least 9 digits');
      return;
    }

    setLoading(true);

    try {
      await register(firstName, lastName, email, phone, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="register-container animate-scale-in">
        <div className="glass-card success-card">
          <div className="success-icon-bubble">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="checkmark-icon">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Registration Successful!</h2>
          <p>Your digital wallet has been initialized automatically with 0.00 XAF.</p>
          <button onClick={onLoginLink} className="btn-primary">
            Sign In Now
          </button>
        </div>
        
        <style jsx="true">{`
          .success-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 16px;
            padding: 40px 24px;
            margin-top: 60px;
          }

          .success-icon-bubble {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.15);
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--color-success);
            margin-bottom: 8px;
            animation: checkmark 0.5s ease-out forwards;
          }

          .checkmark-icon {
            width: 36px;
            height: 36px;
          }

          .success-card h2 {
            font-size: 22px;
            font-weight: 600;
          }

          .success-card p {
            color: var(--text-secondary);
            font-size: 15px;
            line-height: 1.5;
            margin-bottom: 12px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="register-container animate-slide-up">
      <div className="logo-section">
        <h2>Create Account</h2>
        <p>Set up your MTN MoMo compatible digital wallet</p>
      </div>

      <div className="glass-card form-card">
        {error && (
          <div className="error-banner animate-scale-in">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="error-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Alain"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Nkemeni"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="alain@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">MTN Mobile Money Phone Number</label>
            <div className="phone-input-wrapper">
              <input 
                type="tel" 
                className="form-input phone-input" 
                placeholder="e.g. 677889900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <div className="momo-badge">
                <span className="momo-text">MoMo</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="footer-links">
          <span>Already registered?</span>
          <button onClick={onLoginLink} className="link-btn">Log In here</button>
        </div>
      </div>

      <style jsx="true">{`
        .register-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
          margin-top: 10px;
        }

        .logo-section h2 {
          font-size: 24px;
          font-weight: 700;
        }

        .logo-section p {
          font-size: 14px;
          color: var(--text-muted);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .phone-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .phone-input {
          padding-right: 70px;
        }

        .momo-badge {
          position: absolute;
          right: 12px;
          background: var(--mtn-gradient);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
        }

        .momo-text {
          color: #000;
          font-size: 11px;
          font-weight: 700;
        }

        .error-banner {
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.2);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          color: var(--color-error);
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .error-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 6px;
          font-size: 14px;
          margin-top: 20px;
          color: var(--text-secondary);
        }

        .link-btn {
          background: transparent;
          border: none;
          color: var(--accent-secondary);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .link-btn:hover {
          color: var(--accent-primary);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Register;
