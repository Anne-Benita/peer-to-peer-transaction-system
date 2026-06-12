import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CashOutForm = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.get('/wallets/me');
        if (res.data && res.data.success) {
          setWallet(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load wallet', err);
      }
    };
    fetchWallet();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const withAmount = parseFloat(amount);
    if (isNaN(withAmount) || withAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (wallet && withAmount > wallet.balance) {
      setError(`Insufficient balance. You only have ${wallet.balance} XAF available.`);
      return;
    }

    setLoading(true);

    try {
      // Simulate MTN MoMo cash-out API call
      const res = await api.post('/wallets/cash-out', {
        amount: withAmount,
      });

      if (res.data && res.data.success) {
        setSuccessData(res.data.data);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cash Out failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="modal-overlay">
        <div className="glass-card modal-content animate-scale-in">
          <div className="success-icon-bubble">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="checkmark-svg">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Cash Out Successful!</h2>
          <p className="success-description">
            Your withdraw of {successData.amount} XAF to your MTN MoMo number {user?.phone_number} is completed.
          </p>

          <div className="receipt-box">
            <div className="receipt-row">
              <span className="receipt-key">Reference</span>
              <span className="receipt-val">{successData.reference}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-key">Destination</span>
              <span className="receipt-val">MTN Mobile Money</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-key">Status</span>
              <span className="receipt-val text-success">COMPLETED</span>
            </div>
          </div>

          <button onClick={onClose} className="btn-primary">
            Done
          </button>
        </div>

        <style jsx="true">{`
          .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(2, 2, 3, 0.85);
            backdrop-filter: blur(8px);
            z-index: 500;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }

          .modal-content {
            width: 100%;
            max-width: 400px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 16px;
            padding: 30px 24px;
            border-radius: var(--radius-xl);
          }

          .success-icon-bubble {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.15);
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--color-success);
            animation: checkmark 0.4s ease-out forwards;
          }

          .checkmark-svg {
            width: 30px;
            height: 30px;
          }

          .success-description {
            font-size: 14px;
            color: var(--text-secondary);
            line-height: 1.5;
          }

          .receipt-box {
            width: 100%;
            background: var(--bg-tertiary);
            border: 1px solid var(--border-glass);
            border-radius: var(--radius-md);
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 13px;
          }

          .receipt-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .receipt-key {
            color: var(--text-muted);
          }

          .receipt-val {
            font-weight: 600;
          }

          .text-success {
            color: var(--color-success);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content animate-scale-in">
        <div className="modal-header">
          <h2>MTN MoMo Cash Out</h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="close-svg">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="description">
          Withdraw funds from your app wallet and transfer them back to your MTN Mobile Money account.
        </p>

        {wallet && (
          <div className="wallet-balance-banner">
            <span>Available Balance</span>
            <span className="balance">{wallet.balance} XAF</span>
          </div>
        )}

        <div className="momo-number-box">
          <span className="label">MTN Number</span>
          <span className="phone">{user?.phone_number}</span>
          <span className="yellow-badge">MTN Mobile Money</span>
        </div>

        {error && (
          <div className="error-banner animate-scale-in">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Amount (XAF)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="e.g. 2,000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Initiating Mobile Transfer...' : 'Confirm Cash Out'}
          </button>
        </form>
      </div>

      <style jsx="true">{`
        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(2, 2, 3, 0.85);
          backdrop-filter: blur(8px);
          z-index: 500;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .modal-content {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
          border-radius: var(--radius-xl);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 700;
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .close-svg {
          width: 20px;
          height: 20px;
        }

        .description {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.5;
          text-align: left;
        }

        .wallet-balance-banner {
          background: var(--bg-secondary);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          width: 100%;
        }

        .wallet-balance-banner .balance {
          font-weight: 700;
          color: var(--accent-secondary);
        }

        .momo-number-box {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-start;
          width: 100%;
          position: relative;
        }

        .momo-number-box .label {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }

        .momo-number-box .phone {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .yellow-badge {
          position: absolute;
          right: 12px;
          top: 12px;
          background: var(--mtn-yellow);
          color: #000;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 4px;
        }

        .modal-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .error-banner {
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.2);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          color: var(--color-error);
          font-size: 13px;
          width: 100%;
          text-align: left;
        }
      `}</style>
    </div>
  );
};

export default CashOutForm;
