import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { QuickActionModal } from './components/QuickActionModal';
import { DashboardView } from './views/DashboardView';
import { MerchantsView } from './views/MerchantsView';
import { CalendarView } from './views/CalendarView';
import { TasksView } from './views/TasksView';
import { AIAssistantView } from './views/AIAssistantView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { storage } from './services/storage';
import { AccountManagerProfile, AppNotification } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickActionInitial, setQuickActionInitial] = useState<'merchant' | 'meeting' | 'task' | 'call' | 'note'>('task');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);

  // Profile & Notifications & KPIs
  const [profile, setProfile] = useState<AccountManagerProfile>(storage.getProfile());
  const [notifications, setNotifications] = useState<AppNotification[]>(storage.getNotifications());
  const [kpis, setKpis] = useState(storage.getCalculatedKPIs());

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ampilot_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });

  // Apply dark class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ampilot_dark_mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Sync store updates
  useEffect(() => {
    const handleUpdate = () => {
      setProfile(storage.getProfile());
      setNotifications(storage.getNotifications());
      setKpis(storage.getCalculatedKPIs());
    };
    return storage.subscribeToStore ? storage.subscribeToStore(handleUpdate) : undefined;
  }, []);

  const handleOpenQuickAction = (action: 'merchant' | 'meeting' | 'task' | 'call' | 'note' = 'task') => {
    setQuickActionInitial(action);
    setIsQuickActionOpen(true);
  };

  const handleSelectMerchantForDetail = (merchantId: string) => {
    setSelectedMerchantId(merchantId);
    setCurrentTab('merchants');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors" dir="rtl">
      
      {/* 1. RIGHT SIDEBAR (RTL) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'merchants') {
            setSelectedMerchantId(null);
          }
        }}
        overdueCount={kpis.overdueTasksCount}
        profile={profile}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. MAIN CONTENT WRAPPER */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:mr-20' : 'lg:mr-72'
        }`}
      >
        {/* TOP CONTEXT HEADER BAR */}
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenQuickAction={() => handleOpenQuickAction('task')}
          notifications={notifications}
          onMarkNotificationRead={(id) => storage.markNotificationRead(id)}
          onMarkAllNotificationsRead={() => storage.markAllNotificationsRead()}
          onNavigateTab={(tab) => setCurrentTab(tab)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* VIEW PORT CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenQuickAction={handleOpenQuickAction}
              onSelectMerchantForDetail={handleSelectMerchantForDetail}
            />
          )}

          {currentTab === 'merchants' && (
            <MerchantsView
              onOpenQuickAction={handleOpenQuickAction}
              selectedMerchantId={selectedMerchantId}
              onClearSelectedMerchant={() => setSelectedMerchantId(null)}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              onOpenQuickAction={handleOpenQuickAction}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              onOpenQuickAction={handleOpenQuickAction}
            />
          )}

          {currentTab === 'ai' && (
            <AIAssistantView />
          )}

          {currentTab === 'reports' && (
            <ReportsView />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              profile={profile}
              onUpdateProfile={(updated) => storage.updateProfile(updated)}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
            />
          )}
        </main>
      </div>

      {/* QUICK ACTION MODAL */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        initialAction={quickActionInitial}
        onSuccess={() => {
          // updates happen automatically via store subscription
        }}
      />

    </div>
  );
}
