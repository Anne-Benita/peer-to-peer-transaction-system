import React, { useState, useEffect } from 'react';
import api from '../services/api';

const TransactionList = ({ refreshTrigger }) => {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [myWalletID, setMyWalletID] = useState('');

  useEffect(() => {
    const fetchWalletAndHistory = async () => {
      try {
        setLoading(true);
        // Get wallet ID first to identify sent/received transfers
        const walletRes = await api.get('/wallets/me');
        let walletId = '';
        if (walletRes.data && walletRes.data.success) {
          setMyWalletID(walletRes.data.data.id);
          walletId = walletRes.data.data.id;
        }

        // Build query string
        let url = `/transfers?page=${page}&limit=${limit}`;
        if (typeFilter) url += `&type=${typeFilter}`;
        if (statusFilter) url += `&status=${statusFilter}`;

        const txRes = await api.get(url);
        if (txRes.data && txRes.data.success) {
          setTxs(txRes.data.data);
          const totalCount = txRes.data.meta?.total || 0;
          setTotalPages(Math.ceil(totalCount / limit) || 1);
        }
      } catch (err) {
        console.error('Failed to load transaction history', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAndHistory();
  }, [page, typeFilter, statusFilter, refreshTrigger]);

  // Reset page when filters change
  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const getTxStyle = (tx) => {
    const isCredit = tx.type === 'CASH_IN' || (tx.type === 'TRANSFER' && tx.receiver_wallet_id === myWalletID);
    
    let label = '';
    let amountSign = '';
    let amountClass = '';
    let colorClass = '';

    if (tx.type === 'CASH_IN') {
      label = 'Cash In (MoMo)';
      amountSign = '+';
      amountClass = 'tx-positive';
      colorClass = 'badge-success';
    } else if (tx.type === 'CASH_OUT') {
      label = 'Cash Out (MoMo)';
      amountSign = '-';
      amountClass = 'tx-negative';
      colorClass = 'badge-error';
    } else {
      // P2P Transfer
      if (isCredit) {
        label = 'Received';
        amountSign = '+';
        amountClass = 'tx-positive';
        colorClass = 'badge-success';
      } else {
        label = 'Sent';
        amountSign = '-';
        amountClass = 'tx-negative';
        colorClass = 'badge-primary';
      }
    }

    return { label, amountSign, amountClass, colorClass };
  };

  return (
    <div className="history-container animate-slide-up">
      <div className="section-header">
        <h2>Transaction Activity</h2>
        <p>View and search your complete digital ledger history</p>
      </div>

      {/* Filter controls */}
      <div className="filters-card glass-card">
        <div className="filter-group">
          <label className="filter-label">Filter by Type</label>
          <select value={typeFilter} onChange={handleTypeChange} className="filter-select">
            <option value="">All Transactions</option>
            <option value="TRANSFER">P2P Transfers</option>
            <option value="CASH_IN">Cash In (MTN)</option>
            <option value="CASH_OUT">Cash Out (MTN)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Filter by Status</label>
          <select value={statusFilter} onChange={handleStatusChange} className="filter-select">
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : txs.length === 0 ? (
        <div className="glass-card empty-history">
          <p>No transactions found matching your filters</p>
        </div>
      ) : (
        <div className="history-list">
          {txs.map((tx) => {
            const { label, amountSign, amountClass, colorClass } = getTxStyle(tx);
            return (
              <div key={tx.id} className="history-item glass-card">
                <div className="item-main">
                  <div className="item-meta">
                    <span className="reference-text">{tx.reference}</span>
                    <span className={`badge ${colorClass}`}>{label}</span>
                  </div>
                  <span className={`item-amount ${amountClass}`}>
                    {amountSign}{tx.amount} XAF
                  </span>
                </div>
                
                <p className="item-desc">{tx.description}</p>
                
                <div className="item-footer">
                  <span className="status-indicator">
                    <span className={`dot ${tx.status === 'COMPLETED' ? 'dot-success' : 'dot-warning'}`}></span>
                    {tx.status}
                  </span>
                  <span className="date-text">
                    {new Date(tx.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                onClick={() => setPage((p) => Math.max(p - 1, 1))} 
                disabled={page === 1}
                className="btn-pagination"
              >
                Previous
              </button>
              <span className="page-indicator">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))} 
                disabled={page === totalPages}
                className="btn-pagination"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx="true">{`
        .history-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }

        .section-header h2 {
          font-size: 22px;
          font-weight: 700;
        }

        .section-header p {
          font-size: 14px;
          color: var(--text-muted);
        }

        .filters-card {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 14px 18px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .filter-select {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          outline: none;
          cursor: pointer;
        }

        .spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }

        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid var(--border-glass);
          border-top: 3px solid var(--accent-secondary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-history {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
          font-size: 15px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-item {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px;
        }

        .item-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .item-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-start;
        }

        .reference-text {
          font-family: monospace;
          font-size: 13px;
          color: var(--text-muted);
        }

        .item-amount {
          font-size: 18px;
          font-weight: 700;
        }

        .tx-positive {
          color: var(--color-success);
        }

        .tx-negative {
          color: var(--text-primary);
        }

        .item-desc {
          font-size: 14px;
          color: var(--text-secondary);
          text-align: left;
        }

        .item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--text-muted);
          border-top: 1px solid var(--border-glass);
          padding-top: 10px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .dot-success { background: var(--color-success); }
        .dot-warning { background: var(--color-warning); }

        .pagination-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          padding: 10px 0;
        }

        .btn-pagination {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .btn-pagination:hover:not(:disabled) {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        .btn-pagination:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-indicator {
          font-size: 14px;
          color: var(--text-muted);
        }

        .badge-primary {
          background: rgba(0, 112, 224, 0.15);
          color: var(--accent-secondary);
        }
      `}</style>
    </div>
  );
};

export default TransactionList;
