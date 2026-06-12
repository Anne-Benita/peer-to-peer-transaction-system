import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TransferForm = ({ onTransferSuccess }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [wallet, setWallet] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Fetch current wallet to display available balance
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

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');

    if (!recipient) {
      setError('Please enter a recipient email or phone number');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (wallet && transferAmount > wallet.balance) {
      setError(`Insufficient balance. You only have ${wallet.balance} XAF available.`);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/transfers', {
        recipient,
        amount: transferAmount,
        description,
      });

      if (res.data && res.data.success) {
        setSuccessData(res.data.data);
        if (onTransferSuccess) {
          onTransferSuccess();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed. Check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="receipt-container animate-scale-in">
        <div className="glass-card receipt-card">
          <div className="success-checkmark-bubble">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="receipt-checkmark">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="status-label">Transfer Successful</span>
          
          <div className="receipt-amount-section">
            <span className="receipt-currency">XAF</span>
            <span className="receipt-value">{successData.amount}</span>
          </div>

          <hr className="divider" />

          <div className="receipt-details">
            <div className="detail-row">
              <span className="detail-label">Reference</span>
              <span className="detail-value">{successData.reference}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Recipient</span>
              <span className="detail-value">{recipient}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Note</span>
              <span className="detail-value">{successData.description || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">
                {new Date(successData.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <button onClick={() => setSuccessData(null)} className="btn-primary mt-2">
            Make Another Transfer
          </button>
        </div>

        <style jsx="true">{`
          .receipt-container {
            padding: 10px 0;
          }

          .receipt-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 30px 20px;
          }

          .success-checkmark-bubble {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.15);
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--color-success);
            margin-bottom: 8px;
            animation: checkmark 0.4s ease-out forwards;
          }

          .receipt-checkmark {
            width: 30px;
            height: 30px;
          }

          .status-label {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-success);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 16px;
          }

          .receipt-amount-section {
            display: flex;
            align-items: baseline;
            gap: 6px;
            margin-bottom: 24px;
          }

          .receipt-currency {
            font-size: 18px;
            font-weight: 700;
            color: var(--text-secondary);
          }

          .receipt-value {
            font-size: 40px;
            font-weight: 700;
            letter-spacing: -1px;
          }

          .divider {
            width: 100%;
            border: none;
            border-top: 1px dashed var(--border-glass);
            margin-bottom: 20px;
          }

          .receipt-details {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
          }

          .detail-label {
            color: var(--text-muted);
          }

          .detail-value {
            font-weight: 600;
            color: var(--text-primary);
          }

          .mt-2 {
            margin-top: 8px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="transfer-container animate-slide-up">
      <div className="form-header">
        <h2>Send Money</h2>
        <p>Transfer funds instantly to any registered P2P account</p>
      </div>

      <div className="glass-card form-card">
        {wallet && (
          <div className="balance-info-banner">
            <span className="banner-title">Available Balance</span>
            <span className="banner-amount">{wallet.balance} XAF</span>
          </div>
        )}

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

        <form onSubmit={handleTransfer} className="transfer-form">
          <div className="form-group">
            <label className="form-label">Recipient</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                className="form-input search-input" 
                placeholder="Friend's email or MTN Phone Number"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
              <div className="input-search-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="badge-search-icon">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (XAF)</label>
            <input 
              type="number" 
              className="form-input" 
              placeholder="Min. 100 XAF"
              min="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Lunch repayment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing Transfer...' : 'Send Transfer'}
          </button>
        </form>
      </div>

      <style jsx="true">{`
        .transfer-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }

        .form-header h2 {
          font-size: 22px;
          font-weight: 700;
        }

        .form-header p {
          font-size: 14px;
          color: var(--text-muted);
        }

        .balance-info-banner {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .banner-title {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .banner-amount {
          font-size: 15px;
          font-weight: 700;
          color: var(--accent-secondary);
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          padding-right: 48px;
        }

        .input-search-badge {
          position: absolute;
          right: 16px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }

        .badge-search-icon {
          width: 18px;
          height: 18px;
        }

        .transfer-form {
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
      `}</style>
    </div>
  );
};

export default TransferForm;
