import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Calendar, 
  CheckSquare, 
  PhoneCall, 
  FileText,
  Save,
  Clock,
  Sparkles
} from 'lucide-react';
import { storage, getTodayDateString } from '../services/storage';
import { 
  Merchant, 
  Meeting, 
  Task, 
  MerchantStatus, 
  MerchantImportance, 
  MerchantRisk,
  TaskPriority,
  TaskCategory,
  MeetingType
} from '../types';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'merchant' | 'meeting' | 'task' | 'call' | 'note';
  onSuccess?: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  initialAction = 'task',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'merchant' | 'meeting' | 'task' | 'call' | 'note'>(initialAction);
  const merchants = storage.getMerchants().filter(m => !m.isArchived);
  const todayStr = getTodayDateString();

  // --- Task State ---
  const [taskTitle, setTaskTitle] = useState('');
  const [taskMerchantId, setTaskMerchantId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(todayStr);
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('high');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('merchant_followup');
  const [taskDesc, setTaskDesc] = useState('');

  // --- Meeting State ---
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingMerchantId, setMeetingMerchantId] = useState('');
  const [meetingDate, setMeetingDate] = useState(todayStr);
  const [meetingStartTime, setMeetingStartTime] = useState('11:00');
  const [meetingEndTime, setMeetingEndTime] = useState('12:00');
  const [meetingLocation, setMeetingLocation] = useState('مقر العميل');
  const [meetingType, setMeetingType] = useState<MeetingType>('client_visit');
  const [meetingObjective, setMeetingObjective] = useState('');

  // --- Merchant State ---
  const [merchantName, setMerchantName] = useState('');
  const [merchantMid, setMerchantMid] = useState('MID-' + Math.floor(100000 + Math.random() * 900000));
  const [merchantContact, setMerchantContact] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantMcc, setMerchantMcc] = useState('5411 - تجزئة وسوبرماركت');
  const [merchantAddress, setMerchantAddress] = useState('الرياض');
  const [merchantImportance, setMerchantImportance] = useState<MerchantImportance>('high');
  const [merchantRisk, setMerchantRisk] = useState<MerchantRisk>('low');
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatus>('active');

  // --- Call Log State ---
  const [callMerchantId, setCallMerchantId] = useState('');
  const [callContact, setCallContact] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('تم الاتفاق على إرسال العرض المحدث');
  const [createFollowupFromCall, setCreateFollowupFromCall] = useState(true);

  // --- Quick Note State ---
  const [noteMerchantId, setNoteMerchantId] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  if (!isOpen) return null;

  // Handlers
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const selectedMerchant = merchants.find(m => m.id === taskMerchantId);

    const newTask: Task = {
      id: 't-' + Date.now(),
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      merchantId: taskMerchantId || undefined,
      merchantName: selectedMerchant ? selectedMerchant.name : undefined,
      createdAt: new Date().toISOString(),
      dueDate: taskDueDate,
      priority: taskPriority,
      status: taskDueDate < todayStr ? 'overdue' : 'new',
      category: taskCategory,
      nextAction: 'متابعة التنفيذ فوراً',
      notes: '',
      postponedCount: 0,
    };

    storage.saveTask(newTask);
    onSuccess?.();
    onClose();
  };

  const handleSaveMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    const selectedMerchant = merchants.find(m => m.id === meetingMerchantId);

    // Conflict check
    const existingMeetings = storage.getMeetings().filter(m => m.date === meetingDate && m.status !== 'cancelled');
    const hasConflict = existingMeetings.some(m => {
      return (meetingStartTime >= m.startTime && meetingStartTime < m.endTime) ||
             (meetingEndTime > m.startTime && meetingEndTime <= m.endTime);
    });

    if (hasConflict) {
      if (!confirm('تنبيه: يوجد اجتماع آخر متداخل في نفس الوقت والتاريخ! هل تود الاستمرار وحفظ الموعد؟')) {
        return;
      }
    }

    const newMeeting: Meeting = {
      id: 'mtg-' + Date.now(),
      title: meetingTitle.trim(),
      merchantId: meetingMerchantId || undefined,
      merchantName: selectedMerchant ? selectedMerchant.name : undefined,
      date: meetingDate,
      startTime: meetingStartTime,
      endTime: meetingEndTime,
      location: meetingLocation,
      type: meetingType,
      objective: meetingObjective.trim(),
      agenda: '',
      notes: '',
      status: 'planned',
      createdAt: new Date().toISOString(),
    };

    storage.saveMeeting(newMeeting);
    onSuccess?.();
    onClose();
  };

  const handleSaveMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName.trim()) return;

    const newMerchant: Merchant = {
      id: 'm-' + Date.now(),
      name: merchantName.trim(),
      mid: merchantMid.trim(),
      contactPerson: merchantContact.trim(),
      phone: merchantPhone.trim(),
      email: merchantEmail.trim(),
      mcc: merchantMcc.trim(),
      address: merchantAddress.trim(),
      relationshipStartDate: todayStr,
      status: merchantStatus,
      importance: merchantImportance,
      risk: merchantRisk,
      generalNotes: 'تمت الإضافة عبر نموذج الإجراء السريع.',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveMerchant(newMerchant);
    onSuccess?.();
    onClose();
  };

  const handleSaveCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callNotes.trim()) return;

    const merchant = merchants.find(m => m.id === callMerchantId);
    const merchantNameStr = merchant ? merchant.name : 'عميل عام';

    // Log activity
    storage.logActivity(
      'call_logged',
      callMerchantId || 'general',
      merchantNameStr,
      `مكالمة هاتفية مع (${callContact || merchant?.contactPerson || 'الجهة المسؤولة'}): ${callNotes}`
    );

    // Also record as a completed phone meeting
    storage.saveMeeting({
      id: 'mtg-call-' + Date.now(),
      title: `مكالمة هاتفية: ${merchantNameStr}`,
      merchantId: callMerchantId || undefined,
      merchantName: merchantNameStr,
      date: todayStr,
      startTime: new Date().toTimeString().slice(0, 5),
      endTime: new Date().toTimeString().slice(0, 5),
      location: 'مكالمة هاتفية مباشرة',
      type: 'phone_call',
      objective: 'متابعة دورية',
      agenda: 'تسجيل المكالمة',
      notes: callNotes,
      outcome: callOutcome,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    // Optionally create follow-up task
    if (createFollowupFromCall && callMerchantId) {
      storage.saveTask({
        id: 't-' + Date.now(),
        title: `متابعة مخرجات مكالمة ${merchantNameStr}`,
        description: `بناءً على مكالمة اليوم: ${callOutcome}`,
        merchantId: callMerchantId,
        merchantName: merchantNameStr,
        createdAt: new Date().toISOString(),
        dueDate: todayStr,
        priority: 'high',
        status: 'new',
        category: 'merchant_followup',
        nextAction: callOutcome,
        notes: '',
        postponedCount: 0,
      });
    }

    onSuccess?.();
    onClose();
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const merchant = merchants.find(m => m.id === noteMerchantId);
    const merchantNameStr = merchant ? merchant.name : 'ملاحظة عامة';

    storage.logActivity(
      'note_added',
      noteMerchantId || 'general',
      noteTitle || merchantNameStr,
      noteContent
    );

    // If attached to merchant, append to merchant notes
    if (merchant) {
      const updatedNotes = `${merchant.generalNotes}\n[${todayStr}] ${noteTitle ? noteTitle + ': ' : ''}${noteContent}`;
      storage.saveMerchant({
        ...merchant,
        generalNotes: updatedNotes,
        updatedAt: new Date().toISOString(),
      });
    }

    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              إجراء سريع جديد
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'task', label: 'إضافة متابعة', icon: CheckSquare },
            { id: 'meeting', label: 'إضافة اجتماع', icon: Calendar },
            { id: 'merchant', label: 'إضافة عميل', icon: Store },
            { id: 'call', label: 'تسجيل مكالمة', icon: PhoneCall },
            { id: 'note', label: 'إضافة ملاحظة', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected 
                    ? 'bg-[#142D4E] text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: ADD TASK */}
          {activeTab === 'task' && (
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان المهمة / المتابعة *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="مثال: إرسال عرض الأسعار المعدل لمطاعم هاف مليون"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    العميل المرتبط (اختياري)
                  </label>
                  <select
                    value={taskMerchantId}
                    onChange={e => setTaskMerchantId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">بدون ربط بتاجر محدد</option>
                    {merchants.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    تاريخ الاستحقاق *
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    الأولوية
                  </label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="urgent">عاجل جداً</option>
                    <option value="high">مرتفع</option>
                    <option value="medium">متوسط</option>
                    <option value="low">منخفض</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    نوع المهمة
                  </label>
                  <select
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="merchant_followup">متابعة عميل</option>
                    <option value="operational_issue">مشكلة تشغيلية</option>
                    <option value="commercial_opportunity">فرصة تجارية</option>
                    <option value="documents">مستندات وعقود</option>
                    <option value="meeting">اجتماع</option>
                    <option value="admin_task">مهمة إدارية</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  تفاصيل إضافية / وصف
                </label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  placeholder="ملاحظات توضيحية للإجراء المطلوب..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2878C8] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  حفظ المهمة
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ADD MEETING */}
          {activeTab === 'meeting' && (
            <form onSubmit={handleSaveMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان الاجتماع *
                </label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={e => setMeetingTitle(e.target.value)}
                  placeholder="مثال: زيارة ميدانية لمناقشة تجديد العقد السنوي"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    العميل المرتبط
                  </label>
                  <select
                    value={meetingMerchantId}
                    onChange={e => setMeetingMerchantId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">بدون ربط بتاجر محدد</option>
                    {merchants.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    نوع الاجتماع
                  </label>
                  <select
                    value={meetingType}
                    onChange={e => setMeetingType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="client_visit">زيارة عميل ميدانية</option>
                    <option value="online_meeting">اجتماع أونلاين</option>
                    <option value="phone_call">مكالمة هاتفية رسمية</option>
                    <option value="commercial_followup">متابعة تجارية</option>
                    <option value="internal_meeting">اجتماع داخلي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    التاريخ *
                  </label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    وقت البداية
                  </label>
                  <input
                    type="time"
                    required
                    value={meetingStartTime}
                    onChange={e => setMeetingStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    وقت النهاية
                  </label>
                  <input
                    type="time"
                    required
                    value={meetingEndTime}
                    onChange={e => setMeetingEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  المكان أو الرابط
                </label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={e => setMeetingLocation(e.target.value)}
                  placeholder="مقر الشركة، طريق الملك فهد، أو رابط Google Meet"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  الهدف من الاجتماع
                </label>
                <input
                  type="text"
                  value={meetingObjective}
                  onChange={e => setMeetingObjective(e.target.value)}
                  placeholder="المخرجات المرجوة والاتفاق المتوقع..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2878C8] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  جدولة الاجتماع
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ADD MERCHANT */}
          {activeTab === 'merchant' && (
            <form onSubmit={handleSaveMerchant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    اسم العميل / الشركة *
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantName}
                    onChange={e => setMerchantName(e.target.value)}
                    placeholder="مثال: شركة الحلول الرقمية للتجارة"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Merchant ID (MID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantMid}
                    onChange={e => setMerchantMid(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    الشخص المسؤول
                  </label>
                  <input
                    type="text"
                    value={merchantContact}
                    onChange={e => setMerchantContact(e.target.value)}
                    placeholder="الاسم والمنصب"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={merchantPhone}
                    onChange={e => setMerchantPhone(e.target.value)}
                    placeholder="+966 ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={merchantEmail}
                    onChange={e => setMerchantEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    مستوى الأهمية
                  </label>
                  <select
                    value={merchantImportance}
                    onChange={e => setMerchantImportance(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="strategic">استراتيجي</option>
                    <option value="high">مرتفع</option>
                    <option value="medium">متوسط</option>
                    <option value="normal">عادي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    مستوى المخاطر
                  </label>
                  <select
                    value={merchantRisk}
                    onChange={e => setMerchantRisk(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="low">منخفض</option>
                    <option value="medium">متوسط</option>
                    <option value="high">مرتفع (خطر خسارة التاجر)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    الحالة
                  </label>
                  <select
                    value={merchantStatus}
                    onChange={e => setMerchantStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="active">نشط</option>
                    <option value="needs_followup">يحتاج متابعة</option>
                    <option value="churn_risk">معرض لفقدان العلاقة</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  النشاط التجاري / MCC
                </label>
                <input
                  type="text"
                  value={merchantMcc}
                  onChange={e => setMerchantMcc(e.target.value)}
                  placeholder="5411 - أسواق التجزئة والسوبرماركت"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2878C8] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  حفظ العميل الجديد
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: LOG CALL */}
          {activeTab === 'call' && (
            <form onSubmit={handleSaveCall} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    العميل *
                  </label>
                  <select
                    required
                    value={callMerchantId}
                    onChange={e => {
                      setCallMerchantId(e.target.value);
                      const m = merchants.find(item => item.id === e.target.value);
                      if (m) setCallContact(m.contactPerson);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="">اختر التاجر / العميل</option>
                    {merchants.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    الشخص الذي تم التحدث معه
                  </label>
                  <input
                    type="text"
                    value={callContact}
                    onChange={e => setCallContact(e.target.value)}
                    placeholder="اسم المسؤول"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ملخص ما دار في المكالمة *
                </label>
                <textarea
                  required
                  rows={3}
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  placeholder="تمت مناقشة حالة أجهزة الدفع الجديدة وإبداء الرغبة في خفض رسوم العمليات..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  النتيجة أو الخطوة المتفق عليها
                </label>
                <input
                  type="text"
                  value={callOutcome}
                  onChange={e => setCallOutcome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createFollowupCall"
                  checked={createFollowupFromCall}
                  onChange={e => setCreateFollowupFromCall(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="createFollowupCall" className="text-xs text-slate-700 dark:text-slate-300">
                  إنشاء تذكرة متابعة تلقائية في قائمة مهام اليوم
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2878C8] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  توثيق المكالمة
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: ADD NOTE */}
          {activeTab === 'note' && (
            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  العميل المرتبط (اختياري)
                </label>
                <select
                  value={noteMerchantId}
                  onChange={e => setNoteMerchantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">ملاحظة عامة للمحفظة</option>
                  {merchants.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان الملاحظة
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  placeholder="مثال: متطلبات فنية للربط السحابي"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  نص الملاحظة *
                </label>
                <textarea
                  required
                  rows={4}
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="اكتب تفاصيل الملاحظة أو التوصيات الخاصة بالعلاقة التجارية..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2878C8] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  حفظ الملاحظة
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
