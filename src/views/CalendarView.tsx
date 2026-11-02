import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Save, 
  Sparkles, 
  CalendarCheck,
  FileText,
  CalendarDays
} from 'lucide-react';
import { storage, getTodayDateString } from '../services/storage';
import { Meeting, MeetingType, MeetingStatus, TaskPriority, TaskCategory } from '../types';
import { 
  formatArabicDate, 
  formatShortArabicDate, 
  MEETING_TYPE_MAP, 
  MEETING_STATUS_MAP 
} from '../utils/formatters';

interface CalendarViewProps {
  onOpenQuickAction: (action?: 'merchant' | 'meeting' | 'task' | 'call' | 'note') => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenQuickAction }) => {
  const [meetings, setMeetings] = useState<Meeting[]>(storage.getMeetings());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 10, 2)); // 2 Nov 2026

  // Meeting Completion Modal State
  const [completingMeeting, setCompletingMeeting] = useState<Meeting | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [outcomeSummary, setOutcomeSummary] = useState('');
  const [followupTaskTitle, setFollowupTaskTitle] = useState('');
  const [followupDueDate, setFollowupDueDate] = useState('');
  const [scheduleNextMeeting, setScheduleNextMeeting] = useState(false);
  const [nextMeetingDate, setNextMeetingDate] = useState('');
  const [nextMeetingTitle, setNextMeetingTitle] = useState('');

  // Selected meeting detail modal
  const [viewingMeeting, setViewingMeeting] = useState<Meeting | null>(null);

  // Subscribe to storage
  useEffect(() => {
    const update = () => setMeetings(storage.getMeetings());
    update();
    return storage.subscribeToStore ? storage.subscribeToStore(update) : undefined;
  }, []);

  const todayStr = getTodayDateString();

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 10, 2));
  };

  // Month Grid Calculation
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust for Saturday start if preferred in Saudi (Saturday = 6)
    // Let's use Sunday-to-Saturday standard
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

    // Preceding month trailing days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: i, isCurrentMonth: true });
    }

    // Next month fill up to multiple of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: i, isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Week Grid Calculation
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay(); // 0 Sunday
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - dayOfWeek);

    const days: Array<{ date: Date; dateStr: string; dayName: string }> = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const dayName = new Intl.DateTimeFormat('ar-SA', { weekday: 'short' }).format(current);
      days.push({ date: current, dateStr, dayName });
    }
    return days;
  }, [currentDate]);

  // Complete meeting handler
  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingMeeting) return;

    const followups: any[] = [];
    if (followupTaskTitle.trim()) {
      followups.push({
        title: followupTaskTitle.trim(),
        priority: 'high' as TaskPriority,
        category: 'merchant_followup' as TaskCategory,
        dueDate: followupDueDate || todayStr,
      });
    }

    storage.completeMeeting(
      completingMeeting.id,
      outcomeNotes,
      outcomeSummary,
      followups
    );

    // Schedule next meeting if requested
    if (scheduleNextMeeting && nextMeetingDate && nextMeetingTitle.trim()) {
      storage.saveMeeting({
        id: 'mtg-' + Date.now(),
        title: nextMeetingTitle.trim(),
        merchantId: completingMeeting.merchantId,
        merchantName: completingMeeting.merchantName,
        date: nextMeetingDate,
        startTime: '10:00',
        endTime: '11:00',
        location: completingMeeting.location || 'مقر العميل',
        type: completingMeeting.type,
        objective: 'متابعة تنفيذ قرارات الاجتماع السابق',
        agenda: '',
        notes: '',
        status: 'planned',
        createdAt: new Date().toISOString(),
      });
    }

    setCompletingMeeting(null);
    setOutcomeNotes('');
    setOutcomeSummary('');
    setFollowupTaskTitle('');
    setScheduleNextMeeting(false);
  };

  const currentMonthTitle = new Intl.DateTimeFormat('ar-SA', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  const currentDayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* Calendar Header Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Navigation & Month Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <CalendarIcon className="w-5 h-5" />
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">
              {currentMonthTitle}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {formatArabicDate(currentDayStr)}
            </span>
          </div>

          <div className="flex items-center gap-1 mr-4">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
            >
              اليوم
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher + Add Meeting */}
        <div className="flex items-center gap-3 justify-end">
          
          {/* Segmented View Mode */}
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl transition ${
                viewMode === 'month' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-xl transition ${
                viewMode === 'week' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              أسبوعي
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-xl transition ${
                viewMode === 'day' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              يومي
            </button>
          </div>

          <button
            onClick={() => onOpenQuickAction('meeting')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#2878C8] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>جدولة اجتماع</span>
          </button>
        </div>

      </div>

      {/* VIEW MODE 1: MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-center py-3 text-xs font-bold text-slate-600 dark:text-slate-400">
            <div>الأحد</div>
            <div>الإثنين</div>
            <div>الثلاثاء</div>
            <div>الأربعاء</div>
            <div>الخميس</div>
            <div>الجمعة</div>
            <div>السبت</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-x-reverse divide-slate-100 dark:divide-slate-800/80">
            {monthData.map((day, idx) => {
              const dayMeetings = meetings.filter(m => m.date === day.dateStr);
              const isToday = day.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(new Date(day.dateStr));
                    setViewMode('day');
                  }}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition cursor-pointer hover:bg-blue-50/40 dark:hover:bg-slate-800/40 ${
                    !day.isCurrentMonth ? 'opacity-40 bg-slate-50/20 dark:bg-slate-900/40' : ''
                  } ${isToday ? 'bg-blue-50/50 dark:bg-blue-950/20 font-bold' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold tabular-nums w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {day.dayNum}
                    </span>

                    {dayMeetings.length > 0 && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tabular-nums">
                        {dayMeetings.length} لقاء
                      </span>
                    )}
                  </div>

                  {/* Meeting Snippets */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {dayMeetings.slice(0, 2).map(mtg => (
                      <div
                        key={mtg.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingMeeting(mtg);
                        }}
                        className={`text-[10px] p-1 rounded-lg truncate border font-medium ${
                          mtg.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                            : 'bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border-blue-200'
                        }`}
                        title={`${mtg.startTime} - ${mtg.title}`}
                      >
                        <span className="tabular-nums font-bold ml-1">{mtg.startTime}</span>
                        <span>{mtg.merchantName || mtg.title}</span>
                      </div>
                    ))}
                    {dayMeetings.length > 2 && (
                      <span className="text-[9px] text-slate-400 block text-center">
                        +{dayMeetings.length - 2} مواعيد أخرى
                      </span>
                    )}
                  </div>

                  <div />
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VIEW MODE 2: WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-x-reverse divide-slate-100 dark:divide-slate-800">
            {weekDays.map((day, idx) => {
              const dayMeetings = meetings.filter(m => m.date === day.dateStr);
              const isToday = day.dateStr === todayStr;

              return (
                <div key={idx} className="flex flex-col min-h-[450px]">
                  {/* Day Header */}
                  <div className={`p-3 text-center border-b border-slate-200 dark:border-slate-800 ${
                    isToday ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}>
                    <span className="text-xs font-bold block">{day.dayName}</span>
                    <span className="text-sm font-extrabold tabular-nums block mt-0.5">
                      {formatShortArabicDate(day.dateStr)}
                    </span>
                  </div>

                  {/* Day Column Events */}
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                    {dayMeetings.length === 0 ? (
                      <div className="text-[11px] text-slate-400 text-center py-6">
                        لا مواعيد
                      </div>
                    ) : (
                      dayMeetings.map(mtg => (
                        <div
                          key={mtg.id}
                          onClick={() => setViewingMeeting(mtg)}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-800 shadow-xs cursor-pointer space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                              {mtg.startTime} - {mtg.endTime}
                            </span>
                            <span className="text-[10px]">{MEETING_TYPE_MAP[mtg.type]}</span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white line-clamp-2">
                            {mtg.title}
                          </h4>
                          {mtg.merchantName && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {mtg.merchantName}
                            </p>
                          )}
                          {mtg.status === 'completed' && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> تم بنجاح
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                جدول أعمال يوم: {formatArabicDate(currentDayStr)}
              </h3>
              <p className="text-xs text-slate-500">
                قائمة المقابلات والزيارات الميدانية المجدولة في هذا اليوم
              </p>
            </div>
            <button
              onClick={() => onOpenQuickAction('meeting')}
              className="text-xs px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              + إضافة اجتماع لهذا اليوم
            </button>
          </div>

          {meetings.filter(m => m.date === currentDayStr).length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CalendarDays className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs">لا توجد اجتماعات مسجلة في هذا اليوم.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.filter(m => m.date === currentDayStr).map(mtg => (
                <div
                  key={mtg.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="px-3 py-2 rounded-xl bg-[#142D4E] text-white text-center font-bold text-sm shrink-0 tabular-nums">
                      <div>{mtg.startTime}</div>
                      <div className="text-[10px] text-slate-300 font-normal">{mtg.endTime}</div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {mtg.title}
                        </h4>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                          {MEETING_TYPE_MAP[mtg.type]}
                        </span>
                        {mtg.status === 'completed' && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                            تم بنجاح ✓
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                        {mtg.merchantName && (
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            العميل: {mtg.merchantName}
                          </span>
                        )}
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {mtg.location}
                        </span>
                      </div>

                      {mtg.objective && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                          <strong>الهدف:</strong> {mtg.objective}
                        </p>
                      )}

                      {mtg.outcome && (
                        <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 text-xs text-emerald-900 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60">
                          <strong>المخرجات والقرارات:</strong> {mtg.outcome}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {mtg.status !== 'completed' && (
                      <button
                        onClick={() => {
                          setCompletingMeeting(mtg);
                          setOutcomeNotes(mtg.notes || '');
                          setOutcomeSummary('');
                          setFollowupTaskTitle(`متابعة مخرجات اجتماع ${mtg.merchantName || mtg.title}`);
                          setFollowupDueDate(todayStr);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>توثيق وإكمال الاجتماع</span>
                      </button>
                    )}

                    <button
                      onClick={() => setViewingMeeting(mtg)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold"
                    >
                      التفاصيل
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MEETING COMPLETION WORKFLOW MODAL */}
      {completingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  توثيق مخرجات الاجتماع: {completingMeeting.title}
                </h3>
              </div>
              <button
                onClick={() => setCompletingMeeting(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  النتيجة والقرارات المتخذة (Outcome) *
                </label>
                <input
                  type="text"
                  required
                  value={outcomeSummary}
                  onChange={e => setOutcomeSummary(e.target.value)}
                  placeholder="مثال: تمت الموافقة على تجديد العقد بنسبة خصم 10% وتحديد موعد الربط التقني"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  ملاحظات وتفاصيل النقاش
                </label>
                <textarea
                  rows={3}
                  value={outcomeNotes}
                  onChange={e => setOutcomeNotes(e.target.value)}
                  placeholder="سجل تفاصيل الملاحظات ونقاط الحوار الهامة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Automatic Follow-up Task Generator */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>توليد مهمة متابعة فورية من الاجتماع:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={followupTaskTitle}
                      onChange={e => setFollowupTaskTitle(e.target.value)}
                      placeholder="عنوان مهمة المتابعة الناتجة"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={followupDueDate}
                      onChange={e => setFollowupDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Next Meeting Option */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="schedNext"
                    checked={scheduleNextMeeting}
                    onChange={e => setScheduleNextMeeting(e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <label htmlFor="schedNext" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    جدولة الاجتماع أو الزيارة القادمة مباشرة
                  </label>
                </div>

                {scheduleNextMeeting && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <input
                        type="text"
                        value={nextMeetingTitle}
                        onChange={e => setNextMeetingTitle(e.target.value)}
                        placeholder="عنوان اللقاء القادم"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        value={nextMeetingDate}
                        onChange={e => setNextMeetingDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCompletingMeeting(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  <Save className="w-4 h-4" />
                  حفظ واعتماد مخرجات الاجتماع
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* VIEW MEETING DETAILS MODAL */}
      {viewingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                  {MEETING_TYPE_MAP[viewingMeeting.type]}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {viewingMeeting.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingMeeting(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
              <div><strong>العميل:</strong> {viewingMeeting.merchantName || 'غير مرتبط'}</div>
              <div><strong>التاريخ:</strong> {formatArabicDate(viewingMeeting.date)}</div>
              <div><strong>الوقت:</strong> {viewingMeeting.startTime} - {viewingMeeting.endTime}</div>
              <div><strong>المكان:</strong> {viewingMeeting.location}</div>
              {viewingMeeting.objective && <div><strong>الهدف:</strong> {viewingMeeting.objective}</div>}
              {viewingMeeting.outcome && (
                <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                  <strong>النتيجة المسجلة:</strong> {viewingMeeting.outcome}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
                    storage.deleteMeeting(viewingMeeting.id);
                    setViewingMeeting(null);
                  }
                }}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                حذف الموعد
              </button>

              <button
                onClick={() => setViewingMeeting(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
