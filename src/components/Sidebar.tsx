import React from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  BarChart3, 
  Settings,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { AccountManagerProfile } from '../types';

export type NavTab = 
  | 'dashboard' 
  | 'merchants' 
  | 'calendar' 
  | 'tasks' 
  | 'ai' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  overdueCount: number;
  profile: AccountManagerProfile;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  overdueCount,
  profile,
  isOpenMobile,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'merchants' as NavTab, label: 'العملاء والتجار', icon: Store },
    { id: 'calendar' as NavTab, label: 'التقويم والاجتماعات', icon: Calendar },
    { 
      id: 'tasks' as NavTab, 
      label: 'المتابعات والمهام', 
      icon: CheckSquare,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'ai' as NavTab, label: 'مساعد AI الذكي', icon: Sparkles, highlight: true },
    { id: 'reports' as NavTab, label: 'التقارير والتحليلات', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'الإعدادات', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar (RTL: pinned to right) */}
      <aside
        className={`fixed top-0 right-0 h-full bg-[#142D4E] text-slate-100 z-50 flex flex-col transition-all duration-300 border-l border-slate-700/50 shadow-xl
          ${isOpenMobile ? 'translate-x-0 w-72' : 'translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'lg:w-72'}
        `}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 flex items-center justify-between border-b border-slate-700/60 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'lg:justify-center lg:w-full' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-bold text-white shadow-md text-lg shrink-0">
              AM
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold tracking-tight text-white text-lg">AM PILOT</span>
                <span className="text-[11px] text-slate-400 truncate">مساعد مدير الحسابات الذكي</span>
              </div>
            )}
          </div>

          {/* Mobile close & Desktop collapse buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
            >
              {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group relative
                  ${isActive 
                    ? 'bg-[#2878C8] text-white shadow-md shadow-blue-900/30 font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }
                  ${collapsed ? 'lg:justify-center lg:px-2' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : item.highlight ? 'text-sky-300' : 'text-slate-400'}`} />
                
                {!collapsed && (
                  <span className="flex-1 text-right truncate">
                    {item.label}
                  </span>
                )}

                {/* Badge for overdue or alerts */}
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full tabular-nums ${item.badgeColor || 'bg-blue-500 text-white'} ${collapsed ? 'lg:absolute lg:top-2 lg:left-2 lg:px-1.5 lg:text-[10px]' : ''}`}>
                    {item.badge}
                  </span>
                )}

                {item.highlight && !collapsed && (
                  <span className="text-[10px] bg-gradient-to-r from-sky-500 to-blue-500 text-white px-1.5 py-0.5 rounded font-normal shrink-0">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Mini Footer */}
        <div className="p-3 border-t border-slate-700/60 bg-slate-900/50 shrink-0">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 ${collapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-sm shrink-0 border border-blue-500/30">
              {profile.name.slice(0, 2)}
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate flex-1 text-right">
                <span className="text-sm font-semibold text-white truncate">{profile.name}</span>
                <span className="text-xs text-slate-400 truncate">{profile.title}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
