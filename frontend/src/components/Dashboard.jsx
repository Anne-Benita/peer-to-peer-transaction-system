import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = ({ setActiveTab, onCashInOpen, onCashOutOpen, refreshTrigger }) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [recentTxs, setRecentTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch wallet details
        const walletRes = await api.get('/wallets/me');
        if (walletRes.data && walletRes.data.success) {
          setWallet(walletRes.data.data);
        }

        // Fetch transaction history (limit 4)
        const txRes = await api.get('/transfers?limit=4');
        if (txRes.data && txRes.data.success) {
          setRecentTxs(txRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [refreshTrigger]);

  const formatCurrency = (val) => {
    if (!wallet) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getTxDetails = (tx) => {
    const isCredit = tx.type === 'CASH_IN' || (tx.type === 'TRANSFER' && tx.receiver_wallet_id === wallet?.id);
    
    let typeLabel = '';
    let amountSign = '';
    let amountClass = '';
    let iconColor = '';

    if (tx.type === 'CASH_IN') {
      typeLabel = 'Cash In (MoMo)';
      amountSign = '+';
      amountClass = 'tx-positive';
      iconColor = 'icon-success';
    } else if (tx.type === 'CASH_OUT') {
      typeLabel = 'Cash Out (MoMo)';
      amountSign = '-';
      amountClass = 'tx-negative';
      iconColor = 'icon-error';
    } else {
      // P2P Transfer
      if (isCredit) {
        typeLabel = 'Received';
        amountSign = '+';
        amountClass = 'tx-positive';
        iconColor = 'icon-success';
      } else {
        typeLabel = 'Sent';
        amountSign = '-';
        amountClass = 'tx-negative';
        iconColor = 'icon-primary';
      }
    }

    return { typeLabel, amountSign, amountClass, iconColor };
  };

  if (loading && !wallet) {
    return (
      <div className="dashboard-loading animate-fade-in">
        <div className="spinner"></div>
        <p>Loading your wallet...</p>
        <style jsx="true">{`
          .dashboard-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 400px;
            gap: 16px;
            color: var(--text-secondary);
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--border-glass);
            border-top: 4px solid var(--accent-secondary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container animate-slide-up">
      {/* Header section */}
      <div className="welcome-header">
        <div className="user-profile">
          <div className="avatar-bubble">
            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
          </div>
          <div className="user-info">
            <span className="greeting">Hello,</span>
            <span className="username">{user?.first_name} {user?.last_name}</span>
          </div>
        </div>
        <div className="momo-pill">
          <span className="momo-dot"></span>
          <span>MTN MoMo Active</span>
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="glass-card balance-card">
        <div className="card-header">
          <span className="card-title">Available Balance</span>
          <button 
            className="eye-toggle"
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? (
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
        
        <div className="balance-amount">
          {showBalance ? (
            <>
              <span className="currency">{wallet?.currency || 'XAF'}</span>
              <span className="value">{formatCurrency(wallet?.balance)}</span>
            </>
          ) : (
            <span className="value-hidden">••••••</span>
          )}
        </div>

        <div className="account-number-display">
          <span>MTN Wallet: {user?.phone_number}</span>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="actions-grid">
        <button className="action-btn" onClick={() => setActiveTab('transfer')}>
          <div className="action-icon-bubble bg-gradient-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="action-svg">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
          <span>Send Money</span>
        </button>

        <button className="action-btn" onClick={onCashInOpen}>
          <div className="action-icon-bubble bg-gradient-yellow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="action-svg mtn-yellow-text">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span>Cash In</span>
        </button>

        <button className="action-btn" onClick={onCashOutOpen}>
          <div className="action-icon-bubble bg-gradient-grey">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="action-svg">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span>Cash Out</span>
        </button>
      </div>

      {/* Recent Activity Ledger */}
      <div className="activity-section">
        <div className="section-header">
          <h3>Recent Transactions</h3>
          <button className="view-all-btn" onClick={() => setActiveTab('history')}>
            View All
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="glass-card empty-activity">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="empty-icon">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <p>No transactions yet</p>
            <p className="subtext">Send money or Cash In from MoMo to start</p>
          </div>
        ) : (
          <div className="tx-list">
            {recentTxs.map((tx) => {
              const { typeLabel, amountSign, amountClass, iconColor } = getTxDetails(tx);
              return (
                <div key={tx.id} className="tx-item glass-card">
                  <div className="tx-item-left">
                    <div className={`tx-icon-wrapper ${iconColor}`}>
                      {tx.type === 'CASH_IN' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="item-svg">
                          <polyline points="17 11 12 6 7 11" />
                          <line x1="12" y1="18" x2="12" y2="6" />
                        </svg>
                      )}
                      {tx.type === 'CASH_OUT' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="item-svg">
                          <polyline points="7 13 12 18 17 13" />
                          <line x1="12" y1="6" x2="12" y2="18" />
                        </svg>
                      )}
                      {tx.type === 'TRANSFER' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="item-svg">
                          <path d="M17 2.1l4 4-4 4" />
                          <path d="M3 12.2v-2a4 4 0 0 1 4-4h14" />
                          <path d="M7 21.9l-4-4 4-4" />
                          <path d="M21 9.8v2a4 4 0 0 1-4 4H3" />
                        </svg>
                      )}
                    </div>
                    <div className="tx-meta-info">
                      <span className="tx-type-title">{typeLabel}</span>
                      <span className="tx-desc-text">{tx.description}</span>
                    </div>
                  </div>
                  <div className="tx-item-right">
                    <span className={`tx-amount ${amountClass}`}>
                      {amountSign}{tx.amount} XAF
                    </span>
                    <span className="tx-date-text">
                      {new Date(tx.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx="true">{`
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-bubble {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-glass);
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 600;
          color: var(--accent-secondary);
          font-size: 15px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .greeting {
          font-size: 13px;
          color: var(--text-muted);
        }

        .username {
          font-size: 16px;
          font-weight: 600;
        }

        .momo-pill {
          background: rgba(255, 203, 5, 0.12);
          border: 1px solid rgba(255, 203, 5, 0.2);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: var(--mtn-yellow);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .momo-dot {
          width: 6px;
          height: 6px;
          background: var(--mtn-yellow);
          border-radius: 50%;
        }

        .balance-card {
          background: var(--accent-gradient);
          color: #fff;
          border: none;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
          border-radius: var(--radius-xl);
          box-shadow: 0 16px 32px rgba(0, 112, 224, 0.25);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-title {
          font-size: 14px;
          font-weight: 500;
          opacity: 0.85;
        }

        .eye-toggle {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .eye-icon {
          width: 18px;
          height: 18px;
        }

        .balance-amount {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .currency {
          font-size: 20px;
          font-weight: 700;
          opacity: 0.9;
        }

        .value {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -1px;
        }

        .value-hidden {
          font-size: 32px;
          letter-spacing: 2px;
          line-height: 1;
        }

        .account-number-display {
          font-size: 13px;
          opacity: 0.8;
          font-weight: 500;
          margin-top: 4px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .action-btn {
          background: transparent;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .action-icon-bubble {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: var(--transition-smooth);
        }

        .action-btn:hover .action-icon-bubble {
          transform: translateY(-4px);
        }

        .bg-gradient-blue {
          background: rgba(0, 112, 224, 0.15);
          border: 1px solid rgba(0, 112, 224, 0.25);
          color: var(--accent-secondary);
        }

        .bg-gradient-yellow {
          background: rgba(255, 203, 5, 0.15);
          border: 1px solid rgba(255, 203, 5, 0.25);
          color: var(--mtn-yellow);
        }

        .bg-gradient-grey {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
        }

        .action-svg {
          width: 22px;
          height: 22px;
        }

        .action-btn span {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .activity-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }

        .section-header h3 {
          font-size: 16px;
          font-weight: 600;
        }

        .view-all-btn {
          background: transparent;
          border: none;
          color: var(--accent-secondary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .empty-activity {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          padding: 36px 20px;
          color: var(--text-muted);
        }

        .empty-icon {
          width: 44px;
          height: 44px;
          opacity: 0.3;
        }

        .empty-activity p {
          font-size: 15px;
          font-weight: 500;
        }

        .empty-activity .subtext {
          font-size: 13px;
          opacity: 0.8;
        }

        .tx-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tx-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          transition: var(--transition-smooth);
        }

        .tx-item:hover {
          background: var(--bg-tertiary);
        }

        .tx-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tx-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .icon-success {
          background: rgba(16, 185, 129, 0.12);
          color: var(--color-success);
        }

        .icon-error {
          background: rgba(244, 63, 94, 0.12);
          color: var(--color-error);
        }

        .icon-primary {
          background: rgba(0, 112, 224, 0.12);
          color: var(--accent-secondary);
        }

        .item-svg {
          width: 18px;
          height: 18px;
        }

        .tx-meta-info {
          display: flex;
          flex-direction: column;
        }

        .tx-type-title {
          font-size: 14px;
          font-weight: 600;
        }

        .tx-desc-text {
          font-size: 12px;
          color: var(--text-muted);
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tx-item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .tx-amount {
          font-size: 15px;
          font-weight: 700;
        }

        .tx-positive {
          color: var(--color-success);
        }

        .tx-negative {
          color: var(--text-primary);
        }

        .tx-date-text {
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
