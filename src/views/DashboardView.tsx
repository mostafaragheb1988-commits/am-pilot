import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  CheckCircle2, 
  Store, 
  UserCheck, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  MapPin, 
  ArrowUpRight, 
  ShieldAlert, 
  Plus, 
  PhoneCall, 
  FileText,
  ChevronLeft
} from 'lucide-react';
import { storage } from '../services/storage';
import { NavTab } from '../components/Sidebar';
import { 
  formatArabicDate, 
  MEETING_TYPE_MAP, 
  TASK_PRIORITY_MAP 
} from '../utils/formatters';

interface DashboardViewProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenQuickAction: (action?: 'merchant' | 'meeting' | 'task' | 'call' | 'note') => void;
  onSelectMerchantForDetail?: (merchantId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenQuickAction,
  onSelectMerchantForDetail,
}) => {
  const [kpis, setKpis] = useState(storage.getCalculatedKPIs());
  const [briefing, setBriefing] = useState<string>('');
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  // Reload KPIs whenever store changes
  useEffect(() => {
    const update = () => setKpis(storage.getCalculatedKPIs());
    update();
    return storage.subscribeToStore ? storage.subscribeToStore(update) : undefined;
  }, []);

  // Fetch AI daily briefing
  const fetchBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenda: {
            meetingsCount: kpis.todayMeetingsCount,
            meetings: kpis.todayMeetings.map(m => ({ title: m.title, time: m.startTime, merchant: m.merchantName })),
          },
          overdueTasks: kpis.overdueTasks.map(t => ({ title: t.title, merchant: t.merchantName, priority: t.priority })),
          riskMerchants: storage.getMerchants().filter(m => m.status === 'churn_risk' || m.risk === 'high').map(m => m.name),
          metrics: {
            completionRate: kpis.completionRate,
            totalMerchants: kpis.totalMerchantsCount,
          },
        }),
      });
      const data = await res.json();
      setBriefing(data.briefing || 'إحاطة اليوم جاهزة: ركز على اجتماعاتك الصباحية وإغلاق التذاكر المتأخرة.');
    } catch {
      setBriefing('صباح الخير! جدول اليوم يتضمن اجتماعات هامة مع عملاء استراتيجيين، بالإضافة إلى متابعات تحتاج إغلاقاً فورياً لتفادي المخاطر.');
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  const handleCompleteTask = (id: string) => {
    storage.completeTask(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* 1. TOP QUICK ACTIONS ROW */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            إجراءات سريعة:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenQuickAction('meeting')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold transition"
          >
            <Calendar className="w-3.5 h-3.5" />
            إضافة اجتماع
          </button>
          <button
            onClick={() => onOpenQuickAction('task')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-semibold transition"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            إضافة متابعة
          </button>
          <button
            onClick={() => onOpenQuickAction('merchant')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition"
          >
            <Store className="w-3.5 h-3.5" />
            إضافة عميل
          </button>
          <button
            onClick={() => onOpenQuickAction('call')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            تسجيل مكالمة
          </button>
          <button
            onClick={() => onOpenQuickAction('note')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold transition"
          >
            <FileText className="w-3.5 h-3.5" />
            إضافة ملاحظة
          </button>
        </div>
      </div>

      {/* 2. 6 KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Today Meetings */}
        <div 
          onClick={() => onNavigateTab('calendar')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">اجتماعات اليوم</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {kpis.todayMeetingsCount}
          </div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-0.5 mt-1">
            عرض جدول اليوم <ChevronLeft className="w-3 h-3" />
          </span>
        </div>

        {/* Card 2: Due Today Tasks */}
        <div 
          onClick={() => onNavigateTab('tasks')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">متابعات اليوم</span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {kpis.todayDueTasksCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            مستحقة الإغلاق قبل المساء
          </span>
        </div>

        {/* Card 3: Overdue Tasks (Critical Alert) */}
        <div 
          onClick={() => onNavigateTab('tasks')}
          className={`rounded-2xl p-4 border shadow-xs transition cursor-pointer group ${
            kpis.overdueTasksCount > 0 
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">المهام المتأخرة</span>
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 tabular-nums">
            {kpis.overdueTasksCount}
          </div>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-0.5 mt-1 font-medium">
            تحتاج تدخلاً فورياً <ChevronLeft className="w-3 h-3" />
          </span>
        </div>

        {/* Card 4: Completed Tasks */}
        <div 
          onClick={() => onNavigateTab('tasks')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">المهام المكتملة</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {kpis.completedTasksCount}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
            نسبة إنجاز {kpis.completionRate}%
          </span>
        </div>

        {/* Card 5: Total Merchants */}
        <div 
          onClick={() => onNavigateTab('merchants')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">إجمالي العملاء</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {kpis.totalMerchantsCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            في المحفظة الحالية
          </span>
        </div>

        {/* Card 6: Needs Followup / Risk */}
        <div 
          onClick={() => onNavigateTab('merchants')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">يحتاجون متابعة</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {kpis.needsFollowupMerchantsCount}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">
            {kpis.churnRiskMerchantsCount} معرض لخسارة الحساب
          </span>
        </div>
      </div>

      {/* 3. AI DAILY BRIEFING CARD */}
      <div className="bg-gradient-to-r from-[#142D4E] to-[#1E3E62] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/30 text-sky-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-sky-200 uppercase tracking-wide">
                الإحاطة الصباحية الذكية | AI Daily Briefing
              </h2>
            </div>
            
            {loadingBriefing ? (
              <div className="py-4 flex items-center gap-3 text-slate-300 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                <span>جاري توليد الإحاطة الذكية لجدول وأولويات اليوم...</span>
              </div>
            ) : (
              <div className="text-sm sm:text-base leading-relaxed text-slate-100 whitespace-pre-line pt-1">
                {briefing}
              </div>
            )}
          </div>

          <button
            onClick={fetchBriefing}
            disabled={loadingBriefing}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition shrink-0"
            title="تحديث الإحاطة الآن"
          >
            <RefreshCw className={`w-4 h-4 ${loadingBriefing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. TWO-COLUMN SPLIT: PRIORITY CENTER & TODAY'S AGENDA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN (7 Cols): Today's Agenda (Meetings & Tasks) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section: Today's Meetings */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  جدول اجتماعات اليوم
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
              >
                التقويم الكامل <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {kpis.todayMeetings.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  لا توجد اجتماعات مجدولة لهذا اليوم.
                </p>
                <button
                  onClick={() => onOpenQuickAction('meeting')}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  + جدولة موعد جديد
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {kpis.todayMeetings.map(mtg => (
                  <div
                    key={mtg.id}
                    className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="px-2.5 py-1.5 rounded-xl bg-[#142D4E] text-white text-xs font-bold text-center shrink-0 tabular-nums">
                        {mtg.startTime}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {mtg.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          {mtg.merchantName && (
                            <span className="font-semibold text-blue-700 dark:text-blue-400">
                              {mtg.merchantName}
                            </span>
                          )}
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {mtg.location}
                          </span>
                          <span>·</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {MEETING_TYPE_MAP[mtg.type] || mtg.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateTab('calendar')}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 transition shrink-0 font-medium"
                    >
                      التفاصيل
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Today's Due Tasks */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  متابعات مستحقة اليوم
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
              >
                إدارة المهام <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {kpis.todayDueTasks.length === 0 ? (
              <div className="py-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/60">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  رائع! أنجزت كافة متابعات اليوم.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {kpis.todayDueTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition shrink-0"
                        title="تعليم كمكتملة"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-transparent hover:text-emerald-600" />
                      </button>

                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          {task.merchantName && (
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {task.merchantName}
                            </span>
                          )}
                          <span>·</span>
                          <span className={TASK_PRIORITY_MAP[task.priority]?.color}>
                            {TASK_PRIORITY_MAP[task.priority]?.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 transition shrink-0"
                    >
                      إنجاز
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* LEFT COLUMN (5 Cols): Priority Center & Performance */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Priority Center */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  مركز الأولويات العاجلة (Top 3)
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {kpis.priorities.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-[#142D4E] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.reason}
                    </p>
                    <div className="mt-2 flex items-center justify-end">
                      {item.type === 'task' && (
                        <button
                          onClick={() => onNavigateTab('tasks')}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          تنفيذ المهمة <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {item.type === 'merchant' && (
                        <button
                          onClick={() => onNavigateTab('merchants')}
                          className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                        >
                          ملف التاجر <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {item.type === 'meeting' && (
                        <button
                          onClick={() => onNavigateTab('calendar')}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          تفاصيل الموعد <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Overview & Weekly Pulse */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              نبض الإنتاجية الأسبوعي
            </h3>

            {/* Completion Rate Progress */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                <span>معدل إنجاز المتابعات</span>
                <span className="tabular-nums font-bold text-blue-600 dark:text-blue-400">{kpis.completionRate}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, kpis.completionRate))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">المهام المنجزة</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {kpis.completedTasksCount}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">تجار تحت الخطر</span>
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  {kpis.churnRiskMerchantsCount}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('reports')}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition text-center"
              >
                توليد التقرير التنفيذي الأسبوعي
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
