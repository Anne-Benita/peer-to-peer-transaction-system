import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = ({ onRegisterLink }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-slide-up">
      <div className="logo-section">
        <div className="logo-bubble">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="logo-icon">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <h1>P2P Wallet</h1>
        <p>Fintech System for MTN MoMo</p>
      </div>

      <div className="glass-card form-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to your secure digital wallet</p>

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

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group password-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="eye-icon">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="eye-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Log In'}
          </button>
        </form>

        <div className="footer-links">
          <span>Don't have an wallet?</span>
          <button onClick={onRegisterLink} className="link-btn">Create one now</button>
        </div>
      </div>

      <style jsx="true">{`
        .login-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 20px 0;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
        }

        .logo-bubble {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: var(--accent-gradient);
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 8px 20px rgba(0, 112, 224, 0.3);
        }

        .logo-icon {
          width: 28px;
          height: 28px;
          color: #fff;
        }

        .logo-section h1 {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .logo-section p {
          font-size: 14px;
          color: var(--text-muted);
        }

        .form-card h2 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .form-card .subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 24px;
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

        .password-group {
          position: relative;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .pwd-toggle {
          position: absolute;
          right: 16px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: var(--transition-smooth);
        }

        .pwd-toggle:hover {
          color: var(--text-primary);
        }

        .eye-icon {
          width: 18px;
          height: 18px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 6px;
          font-size: 14px;
          margin-top: 24px;
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

export default Login;
