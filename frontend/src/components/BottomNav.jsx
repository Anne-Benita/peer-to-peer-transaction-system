import React from 'react';

const BottomNav = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <div className="bottom-nav">
      <button 
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
        <span>Home</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'transfer' ? 'active' : ''}`}
        onClick={() => setActiveTab('transfer')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        <span>Send</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => setActiveTab('history')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
        <span>Activity</span>
      </button>

      <button 
        className="nav-item logout-btn"
        onClick={onLogout}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>Logout</span>
      </button>

      <style jsx="true">{`
        .bottom-nav {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 72px;
          background: rgba(18, 20, 28, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid var(--border-glass);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 0 10px;
          z-index: 100;
          border-bottom-left-radius: inherit;
          border-bottom-right-radius: inherit;
        }

        .nav-item {
          background: transparent;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: var(--transition-smooth);
          flex: 1;
        }

        .nav-item:hover {
          color: var(--text-primary);
        }

        .nav-item.active {
          color: var(--accent-secondary);
        }

        .nav-icon {
          width: 20px;
          height: 20px;
          transition: var(--transition-smooth);
        }

        .nav-item.active .nav-icon {
          transform: translateY(-2px) scale(1.1);
        }

        .logout-btn:hover {
          color: var(--color-error);
        }
      `}</style>
    </div>
  );
};

export default BottomNav;
