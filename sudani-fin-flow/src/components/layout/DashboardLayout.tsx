import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

export function DashboardLayout() {
  const { t } = useTranslation();
  const location = useLocation();

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return t('dashboard');
      case '/students':
        return t('studentManagement');
      case '/payments':
        return t('paymentManagement');
      case '/expenses':
        return t('expenseManagement');
      case '/reports':
        return t('financialReports');
      case '/settings':
        return t('settings');
      default:
        return t('dashboard');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header title={getPageTitle()} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-elegant p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}