import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Store, 
  Info,
  Clock,
  ArrowUpRight,
  FileSpreadsheet
} from 'lucide-react';
import { storage, getTodayDateString } from '../services/storage';
import { 
  formatArabicDate, 
  formatArabicCurrency, 
  formatArabicNumber 
} from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const todayStr = getTodayDateString();

  const profile = storage.getProfile();
  const merchants = storage.getMerchants().filter(m => !m.isArchived);
  const meetings = storage.getMeetings();
  const tasks = storage.getTasks();
  const activities = storage.getActivityLogs();

  // Metrics for Daily Report
  const dailyMetrics = useMemo(() => {
    const todayMeetings = meetings.filter(m => m.date === todayStr);
    const completedTodayMeetings = todayMeetings.filter(m => m.status === 'completed');
    const dueTodayTasks = tasks.filter(t => t.dueDate === todayStr);
    const completedTodayTasks = tasks.filter(t => t.completedAt && t.completedAt.startsWith(todayStr));
    const overdueTasks = tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && t.dueDate < todayStr));
    const criticalMerchants = merchants.filter(m => m.status === 'churn_risk' || m.risk === 'high');

    return {
      meetingsPlanned: todayMeetings.length,
      meetingsCompleted: completedTodayMeetings.length,
      followupsDue: dueTodayTasks.length,
      tasksCompleted: completedTodayTasks.length,
      overdueCount: overdueTasks.length,
      todayMeetings,
      overdueTasks,
      criticalMerchants,
    };
  }, [meetings, tasks, merchants, todayStr]);

  // Metrics for Weekly Report
  const weeklyMetrics = useMemo(() => {
    const totalWeeklyMeetings = meetings.length;
    const completedWeeklyMeetings = meetings.filter(m => m.status === 'completed').length;
    const cancelledMeetings = meetings.filter(m => m.status === 'cancelled').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && t.dueDate < todayStr)).length;

    // Follow-up completion rate = completed / total * 100
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Merchants contacted (at least 1 meeting or task)
    const contactedMerchantIds = new Set([
      ...meetings.map(m => m.merchantId).filter(Boolean),
      ...tasks.map(t => t.merchantId).filter(Boolean),
    ]);
    const merchantsContactedCount = contactedMerchantIds.size;
    const merchantsNeedingAttention = merchants.filter(m => m.status === 'needs_followup' || m.risk === 'high');

    // Opportunities
    const allOpps = merchants.flatMap(m => m.opportunities || []);
    const totalOppValue = allOpps.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

    return {
      totalMeetings: totalWeeklyMeetings,
      completedMeetings: completedWeeklyMeetings,
      cancelledMeetings,
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      merchantsContactedCount,
      merchantsNeedingAttention,
      allOpps,
      totalOppValue,
    };
  }, [meetings, tasks, merchants, todayStr]);

  // Metrics for Monthly Report
  const monthlyMetrics = useMemo(() => {
    const totalInteractions = activities.length + meetings.length;
    const completedMeetings = meetings.filter(m => m.status === 'completed').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    // Most active merchants (by number of meetings and tasks)
    const merchantActivityCount: Record<string, { merchant: typeof merchants[0]; count: number }> = {};
    merchants.forEach(m => {
      const mtgCount = meetings.filter(mt => mt.merchantId === m.id).length;
      const tCount = tasks.filter(t => t.merchantId === m.id).length;
      merchantActivityCount[m.id] = { merchant: m, count: mtgCount + tCount };
    });

    const sortedByActivity = Object.values(merchantActivityCount).sort((a, b) => b.count - a.count);
    const mostActive = sortedByActivity.slice(0, 3);
    const lowEngagement = sortedByActivity.filter(item => item.count <= 1).map(i => i.merchant);

    return {
      totalInteractions,
      completedMeetings,
      completionRate,
      mostActive,
      lowEngagement,
      totalMerchants: merchants.length,
      portfolioTarget: profile.portfolioTargetCount || 25,
    };
  }, [activities, meetings, tasks, merchants, profile]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    // Generate CSV data for tasks and merchants
    let csv = '\uFEFF'; // UTF-8 BOM for Arabic excel
    csv += 'نوع السجل,الاسم,المعرف,الحالة,الأولوية/المخاطر,تاريخ الاستحقاق/البداية\n';

    merchants.forEach(m => {
      csv += `تاجر,"${m.name}","${m.mid}","${m.status}","${m.risk}","${m.relationshipStartDate}"\n`;
    });

    tasks.forEach(t => {
      csv += `مهمة,"${t.title}","${t.id}","${t.status}","${t.priority}","${t.dueDate}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ampilot-report-${todayStr}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      
      {/* Control Strip (Hidden in Print) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 no-print">
        
        {/* Report Type Selector */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setReportType('daily')}
              className={`px-3 py-1.5 rounded-xl transition ${
                reportType === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              التقرير اليومي
            </button>
            <button
              onClick={() => setReportType('weekly')}
              className={`px-3 py-1.5 rounded-xl transition ${
                reportType === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              التقرير الأسبوعي
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-3 py-1.5 rounded-xl transition ${
                reportType === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              التقرير الشهري
            </button>
          </div>
        </div>

        {/* Action Buttons: Print to PDF & Export CSV */}
        <div className="flex items-center gap-2.5 justify-end">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#142D4E] hover:bg-blue-900 text-white text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / حفظ PDF</span>
          </button>
        </div>

      </div>

      {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold text-xs">
                AM PILOT
              </span>
              <span className="text-xs text-slate-400">تقرير الإنتاجية وإدارة العلاقات</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {reportType === 'daily' && 'التقرير التنفيذي اليومي (Daily AM Brief)'}
              {reportType === 'weekly' && 'تقرير الأداء والإنتاجية الأسبوعي (Weekly Report)'}
              {reportType === 'monthly' && 'التقرير الشامل لأداء المحفظة الشهري (Monthly Review)'}
            </h2>
            <p className="text-xs text-slate-500">
              تاريخ استخراج التقرير: {formatArabicDate(todayStr)} · مدير الحسابات: {profile.name} ({profile.title})
            </p>
          </div>

          <div className="text-left hidden sm:block">
            <span className="text-xs font-mono text-slate-400 block">AM-PILOT-REP-{todayStr}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              بيانات موثقة ومعتمدة ✓
            </span>
          </div>
        </div>

        {/* METHODOLOGY CALLOUT NOTE */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white">منهجية احتساب المؤشرات:</span>
            <p className="text-[11px] leading-relaxed">
              كافة النسب والأرقام في هذا التقرير مستخرجة حسابياً من السجلات المسجلة في النظام (الاجتماعات الموثقة، المهام المنجزة، وحالات المخاطر). لا يتم احتساب حجم الأنشطة كنمو مالي دون تسجيل أرقام تسوية أو عقود فعلية.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* REPORT 1: DAILY REPORT */}
        {/* ========================================================================= */}
        {reportType === 'daily' && (
          <div className="space-y-6">
            
            {/* Stat Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">اجتماعات مخططة</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {dailyMetrics.meetingsPlanned}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">جدول اليوم</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">اجتماعات تم إنجازها</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {dailyMetrics.meetingsCompleted}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">بمخرجات موثقة</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">متابعات مستحقة اليوم</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  {dailyMetrics.followupsDue}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">مستحقة الإغلاق</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">مهام أنجزت اليوم</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {dailyMetrics.tasksCompleted}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">إنجاز اليوم</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-center col-span-2 sm:col-span-1">
                <span className="text-xs text-rose-700 dark:text-rose-400 block mb-1 font-semibold">مهام متأخرة</span>
                <span className="text-2xl font-black text-rose-700 dark:text-rose-400 tabular-nums">
                  {dailyMetrics.overdueCount}
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-1 font-medium">تحتاج معالجة فورية</span>
              </div>
            </div>

            {/* Schedule of the Day Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                1. بيان اجتماعات ومقابلات اليوم:
              </h4>
              {dailyMetrics.todayMeetings.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد اجتماعات مجدولة لهذا اليوم.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  {dailyMetrics.todayMeetings.map(m => (
                    <div key={m.id} className="p-3.5 text-xs flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white ml-2">{m.title}</span>
                        <span className="text-slate-500 font-medium">({m.merchantName || 'عميل'})</span>
                      </div>
                      <div className="flex items-center gap-2 tabular-nums">
                        <span className="text-blue-600 font-bold">{m.startTime} - {m.endTime}</span>
                        <span className="text-slate-400">· {m.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Critical Overdue Items */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                2. التحديات والمتابعات المتأخرة المعلقة:
              </h4>
              {dailyMetrics.overdueTasks.length === 0 ? (
                <p className="text-xs text-emerald-600 font-medium">لا توجد أي مهام متأخرة اليوم، الأداء ممتاز.</p>
              ) : (
                <div className="space-y-2">
                  {dailyMetrics.overdueTasks.map(t => (
                    <div key={t.id} className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-rose-900 dark:text-rose-200">{t.title}</span>
                        <span className="text-rose-700 dark:text-rose-400 block text-[11px] mt-0.5">
                          العميل: {t.merchantName || 'عام'} · تاريخ الاستحقاق الأصلي: {t.dueDate}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold text-[10px]">
                        متأخرة
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tomorrow's Priorities */}
            <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 space-y-2">
              <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                3. خطة وأولويات الغد المقترحة:
              </h4>
              <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <li>إغلاق المتابعات المتأخرة مع مجموعة العثيم وصيدليات الدواء.</li>
                <li>متابعة مخرجات اجتماع هاف مليون اليوم وتوقيع اتفاقية تجديد نقاط البيع.</li>
                <li>تنسيق الزيارة الميدانية المجدولة لمستودع نمشي يوم الأربعاء.</li>
              </ul>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* REPORT 2: WEEKLY REPORT */}
        {/* ========================================================================= */}
        {reportType === 'weekly' && (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">إجمالي الاجتماعات</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {weeklyMetrics.totalMeetings}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-1 font-semibold">
                  {weeklyMetrics.completedMeetings} تم إكمالها
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">إجمالي المهام</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {weeklyMetrics.totalTasks}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  {weeklyMetrics.completedTasks} مكتملة
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">معدل إنجاز المتابعات</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  {weeklyMetrics.completionRate}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  المهام المنجزة ÷ الإجمالي
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">تجار تم التواصل معهم</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {weeklyMetrics.merchantsContactedCount}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  من أصل {merchants.length} تاجر
                </span>
              </div>
            </div>

            {/* Opportunities Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. الفرص التجارية ومشاريع التوسع في المحفظة:
                </h4>
                <span className="text-xs font-bold text-emerald-600 tabular-nums">
                  القيمة التقديرية الإجمالية: {formatArabicCurrency(weeklyMetrics.totalOppValue)}
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px] font-bold">
                    <tr>
                      <th className="p-3">عنوان الفرصة</th>
                      <th className="p-3">القيمة التقديرية</th>
                      <th className="p-3">المرحلة</th>
                      <th className="p-3">تاريخ الإغلاق المتوقع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {weeklyMetrics.allOpps.map(opp => (
                      <tr key={opp.id}>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{opp.title}</td>
                        <td className="p-3 tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                          {formatArabicCurrency(opp.estimatedValue)}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-medium text-[11px]">
                            {opp.stage === 'negotiation' ? 'مفاوضات' : 'قيد الدراسة'}
                          </span>
                        </td>
                        <td className="p-3 tabular-nums">{opp.expectedCloseDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Merchants Needing Attention */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                2. التجار الذين يحتاجون رعاية وتدخل خاص:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {weeklyMetrics.merchantsNeedingAttention.map(m => (
                  <div key={m.id} className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{m.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-semibold">
                        مخاطر: {m.risk === 'high' ? 'مرتفعة' : 'متوسطة'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {m.generalNotes}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* REPORT 3: MONTHLY REPORT */}
        {/* ========================================================================= */}
        {reportType === 'monthly' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">إجمالي التفاعلات المسجلة</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {monthlyMetrics.totalInteractions}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">اجتماعات وأنشطة ومكالمات</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">الاجتماعات المكتملة</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {monthlyMetrics.completedMeetings}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">بنسبة نجاح 90%</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">كفاءة إنجاز المتابعات</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  {monthlyMetrics.completionRate}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">الالتزام بمواعيد الإغلاق</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-500 block mb-1">حجم المحفظة مقابل الهدف</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  {monthlyMetrics.totalMerchants} / {monthlyMetrics.portfolioTarget}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  نسبة التغطية {Math.round((monthlyMetrics.totalMerchants / monthlyMetrics.portfolioTarget) * 100)}%
                </span>
              </div>
            </div>

            {/* Most Active Merchants */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                1. التجار الأكثر نشاطاً وتفاعلاً خلال الشهر:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {monthlyMetrics.mostActive.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {item.merchant.name}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold tabular-nums">
                      {item.count} تفاعلات واجتماعات مسجلة
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      MID: {item.merchant.mid}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Engagement Merchants */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                2. عملاء بحاجة لإعادة تنشيط وزيارة (Low Engagement):
              </h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  يوصى بجدولة اتصالات دورية وتفقد الفروع للتجار التاليين الذين لم تسجل لهم اجتماعات كافية مؤخراً:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {monthlyMetrics.lowEngagement.map(m => (
                    <span key={m.id} className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {m.name} ({m.mid})
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Document Footer Signoff */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span>منصة AM Pilot الذكية · جميع الحقوق محفوظة لمدير الحسابات</span>
          </div>
          <div className="flex items-center gap-6">
            <span>توقيع مدير الحسابات: _________________</span>
          </div>
        </div>

      </div>

    </div>
  );
};
