import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Edit3, 
  FileText,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Merchant, CommercialOpportunity, Meeting, Task } from '../types';
import { storage } from '../services/storage';
import { 
  formatArabicDate, 
  formatArabicCurrency, 
  MERCHANT_STATUS_MAP, 
  IMPORTANCE_MAP, 
  RISK_MAP,
  MEETING_TYPE_MAP,
  TASK_PRIORITY_MAP
} from '../utils/formatters';

interface MerchantDetailModalProps {
  merchantId: string;
  isOpen: boolean;
  onClose: () => void;
  onEditMerchant: (merchant: Merchant) => void;
  onQuickAddMeeting: (merchantId: string) => void;
  onQuickAddTask: (merchantId: string) => void;
}

export const MerchantDetailModal: React.FC<MerchantDetailModalProps> = ({
  merchantId,
  isOpen,
  onClose,
  onEditMerchant,
  onQuickAddMeeting,
  onQuickAddTask,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'meetings' | 'tasks' | 'opportunities' | 'notes'>('info');
  const [newNote, setNewNote] = useState('');
  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppValue, setNewOppValue] = useState<number>(50000);
  const [showAddOpp, setShowAddOpp] = useState(false);

  const merchant = storage.getMerchant(merchantId);
  const allMeetings = storage.getMeetings().filter(m => m.merchantId === merchantId);
  const allTasks = storage.getTasks().filter(t => t.merchantId === merchantId);
  const allActivities = storage.getActivityLogs().filter(a => a.entityId === merchantId);

  if (!isOpen || !merchant) return null;

  const upcomingMeetings = allMeetings.filter(m => m.status === 'planned');
  const pastMeetings = allMeetings.filter(m => m.status === 'completed' || m.status === 'cancelled');
  const openTasks = allTasks.filter(t => t.status !== 'completed');
  const completedTasks = allTasks.filter(t => t.status === 'completed');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedNotes = `${merchant.generalNotes}\n[${todayStr}] ${newNote.trim()}`;
    storage.saveMerchant({
      ...merchant,
      generalNotes: updatedNotes,
      updatedAt: new Date().toISOString(),
    });
    setNewNote('');
  };

  const handleAddOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOppTitle.trim()) return;

    const newOpp: CommercialOpportunity = {
      id: 'opp-' + Date.now(),
      merchantId: merchant.id,
      title: newOppTitle.trim(),
      estimatedValue: Number(newOppValue) || 0,
      stage: 'identified',
      expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: 'فرصة تجارية مسجلة حديثاً من ملف التاجر.',
    };

    const currentOpps = merchant.opportunities || [];
    storage.saveMerchant({
      ...merchant,
      opportunities: [newOpp, ...currentOpps],
      updatedAt: new Date().toISOString(),
    });

    setNewOppTitle('');
    setShowAddOpp(false);
  };

  const statusConfig = MERCHANT_STATUS_MAP[merchant.status] || MERCHANT_STATUS_MAP.active;
  const importanceConfig = IMPORTANCE_MAP[merchant.importance] || IMPORTANCE_MAP.normal;
  const riskConfig = RISK_MAP[merchant.risk] || RISK_MAP.low;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header Profile Banner */}
        <div className="px-6 py-5 bg-[#142D4E] text-white flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/20 text-xl font-bold shrink-0">
              {merchant.name.slice(0, 2)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {merchant.name}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/10 text-sky-200 tabular-nums">
                  {merchant.mid}
                </span>
                {merchant.isArchived && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                    مؤرشف
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span>{merchant.mcc}</span>
                <span>·</span>
                <span>تاريخ البدء: {merchant.relationshipStartDate}</span>
              </div>

              {/* Status Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                  {statusConfig.label}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${importanceConfig.bg} ${importanceConfig.text}`}>
                  أهمية: {importanceConfig.label}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${riskConfig.bg} ${riskConfig.text}`}>
                  مخاطر: {riskConfig.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onEditMerchant(merchant)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs font-semibold flex items-center gap-1.5"
              title="تعديل بيانات التاجر"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">تعديل</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1">
            {[
              { id: 'info', label: 'البيانات والتواصل', count: undefined },
              { id: 'meetings', label: 'الاجتماعات والمواعيد', count: allMeetings.length },
              { id: 'tasks', label: 'المتابعات والمهام', count: openTasks.length },
              { id: 'opportunities', label: 'الفرص التجارية', count: (merchant.opportunities || []).length },
              { id: 'notes', label: 'الملاحظات والتوصيات', count: undefined },
            ].map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 tabular-nums">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onQuickAddMeeting(merchant.id)}
              className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-semibold transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              اجتماع
            </button>
            <button
              onClick={() => onQuickAddTask(merchant.id)}
              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-semibold transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              متابعة
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              
              {/* Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">الشخص المسؤول</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {merchant.contactPerson || 'غير محدد'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">رقم الهاتف</span>
                  <a href={`tel:${merchant.phone}`} className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5" dir="ltr">
                    <Phone className="w-3.5 h-3.5" />
                    {merchant.phone || 'غير مسجل'}
                  </a>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">البريد الإلكتروني</span>
                  <a href={`mailto:${merchant.email}`} className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 truncate" dir="ltr">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{merchant.email || 'غير مسجل'}</span>
                  </a>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                  <span className="text-xs text-slate-400 block mb-1">العنوان والموقع الجغرافي</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    {merchant.address || 'العنوان غير مدخل'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">رمز النشاط التجاري (MCC)</span>
                  <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                    {merchant.mcc}
                  </span>
                </div>
              </div>

              {/* General Overview Notes */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ملاحظات عامة حول حساب التاجر:
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {merchant.generalNotes || 'لا توجد ملاحظات عامة مسجلة بعد.'}
                </p>
              </div>

              {/* Recent Activities for this merchant */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  سجل التفاعلات والأنشطة المسجلة:
                </h4>
                {allActivities.length === 0 ? (
                  <p className="text-xs text-slate-400">لا توجد أنشطة مسجلة لهذا التاجر بعد.</p>
                ) : (
                  <div className="space-y-2">
                    {allActivities.map(act => (
                      <div key={act.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-xs flex items-start gap-2.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{act.description}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{act.timestamp.slice(0, 10)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: MEETINGS */}
          {activeTab === 'meetings' && (
            <div className="space-y-6">
              
              {/* Upcoming Meetings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    الاجتماعات القادمة ({upcomingMeetings.length})
                  </h4>
                  <button
                    onClick={() => onQuickAddMeeting(merchant.id)}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    + جدولة موعد
                  </button>
                </div>

                {upcomingMeetings.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    لا توجد اجتماعات مستقبلية مجدولة.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingMeetings.map(mtg => (
                      <div key={mtg.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">{mtg.title}</h5>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold">
                            {mtg.date} ({mtg.startTime} - {mtg.endTime})
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                          <span>{MEETING_TYPE_MAP[mtg.type]}</span>
                          <span>·</span>
                          <span>المكان: {mtg.location}</span>
                        </div>
                        {mtg.objective && (
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            <strong>الهدف:</strong> {mtg.objective}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Meetings */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  الاجتماعات السابقة والمخرجات ({pastMeetings.length})
                </h4>

                {pastMeetings.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    لا توجد اجتماعات سابقة مسجلة.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {pastMeetings.map(mtg => (
                      <div key={mtg.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">{mtg.title}</h5>
                          <span className="text-xs text-slate-500 tabular-nums">{mtg.date}</span>
                        </div>
                        {mtg.outcome && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                            <strong>النتائج والقرارات:</strong> {mtg.outcome}
                          </div>
                        )}
                        {mtg.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            <strong>الملاحظات:</strong> {mtg.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              
              {/* Open Tasks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    المتابعات المفتوحة ({openTasks.length})
                  </h4>
                  <button
                    onClick={() => onQuickAddTask(merchant.id)}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    + إضافة متابعة
                  </button>
                </div>

                {openTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    لا توجد مهام أو متابعات مفتوحة لهذا التاجر حالياً.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {openTasks.map(task => (
                      <div key={task.id} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {task.title}
                          </h5>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className={TASK_PRIORITY_MAP[task.priority]?.color}>
                              {TASK_PRIORITY_MAP[task.priority]?.label}
                            </span>
                            <span>·</span>
                            <span>استحقاق: {task.dueDate}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => storage.completeTask(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 shrink-0"
                        >
                          إنجاز
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Tasks */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  المتابعات المكتملة ({completedTasks.length})
                </h4>
                {completedTasks.length === 0 ? (
                  <p className="text-xs text-slate-400">لا توجد مهام مكتملة مسجلة بعد.</p>
                ) : (
                  <div className="space-y-1.5">
                    {completedTasks.map(task => (
                      <div key={task.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span className="line-through">{task.title}</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">مكتملة ✓</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: COMMERCIAL OPPORTUNITIES */}
          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  الفرص التجارية ومشاريع التوسع
                </h4>
                <button
                  onClick={() => setShowAddOpp(!showAddOpp)}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold hover:bg-blue-100"
                >
                  {showAddOpp ? 'إلغاء' : '+ تسجيل فرصة جديدة'}
                </button>
              </div>

              {showAddOpp && (
                <form onSubmit={handleAddOpportunity} className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      عنوان الفرصة التجارية *
                    </label>
                    <input
                      type="text"
                      required
                      value={newOppTitle}
                      onChange={e => setNewOppTitle(e.target.value)}
                      placeholder="مثال: ترقية 30 نقطة بيع إضافية أو ربط بوابة التجارة الإلكترونية"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      القيمة التقديرية (بالريال السعودي)
                    </label>
                    <input
                      type="number"
                      value={newOppValue}
                      onChange={e => setNewOppValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs tabular-nums"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      حفظ الفرصة
                    </button>
                  </div>
                </form>
              )}

              {(merchant.opportunities || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  لا توجد فرص تجارية مسجلة حالياً لهذا العميل.
                </p>
              ) : (
                <div className="space-y-3">
                  {(merchant.opportunities || []).map(opp => (
                    <div key={opp.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">{opp.title}</h5>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {formatArabicCurrency(opp.estimatedValue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>المرحلة: {opp.stage === 'negotiation' ? 'مفاوضات' : opp.stage === 'identified' ? 'تم تحديدها' : opp.stage === 'won' ? 'ناجحة' : 'ملغاة'}</span>
                        <span>·</span>
                        <span>الإغلاق المتوقع: {opp.expectedCloseDate}</span>
                      </div>
                      {opp.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                          {opp.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  إضافة ملاحظة أو توصية جديدة:
                </label>
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="سجل أي تفاصيل جديدة، ملاحظات حول المسؤولين، أو توصيات للفريق..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    حفظ الملاحظة في ملف العميل
                  </button>
                </div>
              </form>

              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  سجل الملاحظات والتوصيات التاريخية:
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                  {merchant.generalNotes || 'لا توجد ملاحظات مسجلة بعد.'}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
