import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Bell, 
  Sun, 
  Moon, 
  Plus, 
  CheckCheck,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';
import { AppNotification } from '../types';
import { formatArabicDate } from '../utils/formatters';
import { NavTab } from './Sidebar';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onOpenQuickAction: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigateTab: (tab: NavTab) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onOpenQuickAction,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateTab,
  darkMode,
  onToggleDarkMode,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'الرئيسية', subtitle: 'نظرة عامة على محفظتك، أولويات اليوم، والإحاطة الذكية' },
    merchants: { title: 'إدارة العملاء والتجار', subtitle: 'قاعدة بيانات التجار، التقييم، وتفاصيل الحسابات' },
    calendar: { title: 'التقويم والاجتماعات', subtitle: 'جدول المواعيد، الزيارات الميدانية، ومخرجات اللقاءات' },
    tasks: { title: 'المتابعات والمهام', subtitle: 'إدارة المهام، المتابعات العاجلة، وسجل الإنجازات' },
    ai: { title: 'مساعد الذكاء الاصطناعي', subtitle: 'تحليل المحفظة، استخراج المهام، وتوصيات مدفوعة بالبيانات' },
    reports: { title: 'التقارير والتحليلات', subtitle: 'تقارير الإنتاجية اليومية، الأسبوعية، والشهرية القابلة للطباعة' },
    settings: { title: 'الإعدادات والبيانات', subtitle: 'إدارة البيانات، النسخ الاحتياطي، وتفضيلات النظام' },
  };

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors no-print">
      <div className="px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left / Start Zone (Mobile Menu + Breadcrumb & Title) */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -mr-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <h1 className="text-lg lg:text-xl font-bold text-[#142D4E] dark:text-white truncate">
              {tabTitles[currentTab]?.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
              {tabTitles[currentTab]?.subtitle}
            </p>
          </div>
        </div>

        {/* Right / End Zone (Date, Quick Action, Notifications, Theme) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Today's Date Tag */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>{formatArabicDate(todayStr)}</span>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={onOpenQuickAction}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2878C8] hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">إجراء سريع</span>
            <span className="sm:hidden">إضافة</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            title={darkMode ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="التنبيهات"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* Notifications Menu */}
            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    التنبيهات والإشعارات ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      تعليم الكل كمقروء
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      لا توجد إشعارات جديدة حالياً
                    </div>
                  ) : (
                    notifications.map(n => {
                      const getIcon = () => {
                        switch (n.type) {
                          case 'meeting_today': return <Clock className="w-4 h-4 text-blue-600" />;
                          case 'task_overdue': return <AlertTriangle className="w-4 h-4 text-rose-600" />;
                          case 'merchant_risk': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
                          default: return <Sparkles className="w-4 h-4 text-sky-600" />;
                        }
                      };

                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            if (n.targetTab) {
                              onNavigateTab(n.targetTab);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 rounded-xl transition cursor-pointer flex items-start gap-2.5 ${n.read ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50'}`}
                        >
                          <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs">
                            {getIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                          </div>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
