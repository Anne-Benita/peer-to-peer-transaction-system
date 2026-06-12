import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TransferForm from './components/TransferForm';
import TransactionList from './components/TransactionList';
import BottomNav from './components/BottomNav';
import CashInForm from './components/CashInForm';
import CashOutForm from './components/CashOutForm';

const MainAppContent = () => {
  const { user, loading, logout } = useAuth();
  const [authScreen, setAuthScreen] = useState('login'); // 'login' or 'register'
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'transfer', 'history'
  
  // Popups/Modals
  const [cashInOpen, setCashInOpen] = useState(false);
  const [cashOutOpen, setCashOutOpen] = useState(false);
  
  // State trigger to reload dashboard/activity data on any transaction
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerDataRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="app-shell flex-center">
        <div className="spinner"></div>
        <style jsx="true">{`
          .flex-center {
            display: flex;
            justify-content: center;
            align-items: center;
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

  // Unauthenticated Flow
  if (!user) {
    return (
      <div className="app-shell">
        <div className="content-area">
          {authScreen === 'login' ? (
            <Login onRegisterLink={() => setAuthScreen('register')} />
          ) : (
            <Register onLoginLink={() => setAuthScreen('login')} />
          )}
        </div>
      </div>
    );
  }

  // Authenticated Flow
  return (
    <div className="app-shell">
      {/* Content Area rendering chosen tab */}
      <div className="content-area">
        {activeTab === 'dashboard' && (
          <Dashboard 
            setActiveTab={setActiveTab} 
            onCashInOpen={() => setCashInOpen(true)}
            onCashOutOpen={() => setCashOutOpen(true)}
            refreshTrigger={refreshTrigger}
          />
        )}
        
        {activeTab === 'transfer' && (
          <TransferForm onTransferSuccess={triggerDataRefresh} />
        )}
        
        {activeTab === 'history' && (
          <TransactionList refreshTrigger={refreshTrigger} />
        )}
      </div>

      {/* Sticky Bottom Navigation Bar */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={logout} 
      />

      {/* Cash In Simulator Modal Overlay */}
      {cashInOpen && (
        <CashInForm 
          onClose={() => setCashInOpen(false)} 
          onSuccess={() => {
            triggerDataRefresh();
          }} 
        />
      )}

      {/* Cash Out Simulator Modal Overlay */}
      {cashOutOpen && (
        <CashOutForm 
          onClose={() => setCashOutOpen(false)} 
          onSuccess={() => {
            triggerDataRefresh();
          }} 
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
