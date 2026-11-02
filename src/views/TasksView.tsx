import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Store, 
  Edit3, 
  Trash2, 
  FastForward, 
  ChevronDown,
  ArrowUpDown,
  X,
  Save,
  Check
} from 'lucide-react';
import { storage, getTodayDateString } from '../services/storage';
import { Task, TaskPriority, TaskStatus, TaskCategory } from '../types';
import { 
  formatArabicDate, 
  TASK_PRIORITY_MAP, 
  TASK_STATUS_MAP, 
  TASK_CATEGORY_MAP 
} from '../utils/formatters';

interface TasksViewProps {
  onOpenQuickAction: (action?: 'merchant' | 'meeting' | 'task' | 'call' | 'note') => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenQuickAction }) => {
  const [tasks, setTasks] = useState<Task[]>(storage.getTasks());
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'today' | 'in_progress' | 'completed' | 'postponed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [merchantFilter, setMerchantFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Postpone dropdown state
  const [postponeMenuTaskId, setPostponeMenuTaskId] = useState<string | null>(null);

  const merchants = storage.getMerchants().filter(m => !m.isArchived);
  const todayStr = getTodayDateString();

  useEffect(() => {
    const update = () => setTasks(storage.getTasks());
    update();
    return storage.subscribeToStore ? storage.subscribeToStore(update) : undefined;
  }, []);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        // Tab filter
        if (activeTab === 'overdue') {
          if (t.status !== 'overdue' && (t.status === 'completed' || t.dueDate >= todayStr)) return false;
        } else if (activeTab === 'today') {
          if (t.dueDate !== todayStr) return false;
        } else if (activeTab === 'in_progress') {
          if (t.status !== 'in_progress' && t.status !== 'new') return false;
        } else if (activeTab === 'completed') {
          if (t.status !== 'completed') return false;
        } else if (activeTab === 'postponed') {
          if (t.status !== 'postponed') return false;
        }

        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (merchantFilter !== 'all' && t.merchantId !== merchantFilter) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchMerchant = (t.merchantName || '').toLowerCase().includes(q);
          const matchDesc = (t.description || '').toLowerCase().includes(q);
          if (!matchTitle && !matchMerchant && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') return a.dueDate.localeCompare(b.dueDate);
        if (sortBy === 'priority') {
          const weights: Record<TaskPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return weights[b.priority] - weights[a.priority];
        }
        if (sortBy === 'createdAt') return b.createdAt.localeCompare(a.createdAt);
        return 0;
      });
  }, [tasks, activeTab, priorityFilter, categoryFilter, merchantFilter, searchTerm, sortBy, todayStr]);

  const overdueList = tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && t.dueDate < todayStr));

  const handleComplete = (id: string) => {
    storage.completeTask(id);
  };

  const handlePostpone = (id: string, days: number) => {
    storage.postponeTask(id, days);
    setPostponeMenuTaskId(null);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`هل أنت متأكد من حذف المهمة: "${title}"؟`)) {
      storage.deleteTask(id);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    storage.saveTask(editingTask);
    setEditingTask(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* 1. DEDICATED OVERDUE ALERT SECTION (If any exist) */}
      {overdueList.length > 0 && activeTab !== 'overdue' && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-rose-500 text-white">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                تنبيه عاجل: توجد {overdueList.length} مهام متأخرة تجاوزت موعد الاستحقاق!
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('overdue')}
              className="text-xs text-rose-700 dark:text-rose-300 font-bold hover:underline"
            >
              عرض كافة المهام المتأخرة ←
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {overdueList.slice(0, 2).map(task => (
              <div 
                key={task.id}
                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate">
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {task.title}
                  </span>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                    استحقاق: {task.dueDate} · {task.merchantName || 'مهمة عامة'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handlePostpone(task.id, 1)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold"
                    title="تأجيل ليوم واحد"
                  >
                    +1 يوم
                  </button>
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold"
                  >
                    إنجاز
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. TASK CONTROLS & FILTER BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Row 1: Search & Add Task Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="البحث في المهام، الوصف، أو اسم العميل..."
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => onOpenQuickAction('task')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2878C8] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مهمة جديدة</span>
          </button>
        </div>

        {/* Row 2: Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'كافة المهام', count: tasks.length },
              { id: 'overdue', label: 'المتأخرة', count: overdueList.length, isAlert: true },
              { id: 'today', label: 'مستحقة اليوم', count: tasks.filter(t => t.dueDate === todayStr && t.status !== 'completed').length },
              { id: 'in_progress', label: 'قيد التنفيذ', count: tasks.filter(t => t.status === 'in_progress' || t.status === 'new').length },
              { id: 'completed', label: 'المكتملة', count: tasks.filter(t => t.status === 'completed').length },
              { id: 'postponed', label: 'المؤجلة', count: tasks.filter(t => t.status === 'postponed').length },
            ].map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? tab.isAlert ? 'bg-rose-600 text-white font-bold' : 'bg-[#142D4E] text-white font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={merchantFilter}
              onChange={e => setMerchantFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
            >
              <option value="all">كل العملاء</option>
              {merchants.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
            >
              <option value="all">كل الأولويات</option>
              <option value="urgent">عاجل</option>
              <option value="high">مرتفع</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
            >
              <option value="all">كل التصنيفات</option>
              <option value="merchant_followup">متابعة عميل</option>
              <option value="operational_issue">مشكلة تشغيلية</option>
              <option value="commercial_opportunity">فرصة تجارية</option>
              <option value="documents">مستندات</option>
              <option value="meeting">اجتماع</option>
              <option value="admin_task">مهمة إدارية</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
            >
              <option value="dueDate">ترتيب حسب تاريخ الاستحقاق</option>
              <option value="priority">ترتيب حسب الأولوية</option>
              <option value="createdAt">ترتيب حسب تاريخ الإنشاء</option>
            </select>
          </div>

        </div>

      </div>

      {/* 3. TASKS LIST */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              لا توجد مهام في هذه القائمة
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              تم إنجاز كافة المهام أو لا توجد عناصر مطابقة لخيارات التصفية المختارة.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && (task.status === 'overdue' || task.dueDate < todayStr);
            const isPostponeOpen = postponeMenuTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isOverdue 
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20' 
                    : isCompleted
                    ? 'border-slate-200 dark:border-slate-800 opacity-70 bg-slate-50/40 dark:bg-slate-900/40'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'
                }`}
              >
                {/* Right: Checkbox + Title + Meta */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  
                  {/* Complete Checkbox Button */}
                  <button
                    onClick={() => handleComplete(task.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition shrink-0 mt-0.5 cursor-pointer ${
                      isCompleted 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                    }`}
                    title={isCompleted ? 'مكتملة' : 'تعليم كمكتملة'}
                  >
                    {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-sm font-bold text-slate-900 dark:text-white ${isCompleted ? 'line-through text-slate-500 dark:text-slate-500' : ''}`}>
                        {task.title}
                      </h4>

                      {/* Priority Badge */}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TASK_PRIORITY_MAP[task.priority]?.badge}`}>
                        {TASK_PRIORITY_MAP[task.priority]?.label}
                      </span>

                      {/* Category Label */}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {TASK_CATEGORY_MAP[task.category] || task.category}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Meta Row: Merchant & Due Date */}
                    <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                      {task.merchantName && (
                        <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                          <Store className="w-3.5 h-3.5" />
                          {task.merchantName}
                        </span>
                      )}

                      <span className={`flex items-center gap-1 font-medium ${
                        isOverdue 
                          ? 'text-rose-600 dark:text-rose-400 font-bold' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>استحقاق: {task.dueDate}</span>
                        {isOverdue && <span className="text-rose-600">(متأخرة!)</span>}
                      </span>

                      {task.postponedCount > 0 && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400">
                          أُجلت {task.postponedCount} مرات
                        </span>
                      )}

                      {task.nextAction && (
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-xs">
                          الإجراء: {task.nextAction}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Left: Quick Actions (Postpone, Edit, Delete) */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center relative">
                  
                  {/* Postpone Button with Dropdown */}
                  {!isCompleted && (
                    <div className="relative">
                      <button
                        onClick={() => setPostponeMenuTaskId(isPostponeOpen ? null : task.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                        title="تأجيل المهمة"
                      >
                        <FastForward className="w-3.5 h-3.5 text-amber-500" />
                        <span>تأجيل</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {isPostponeOpen && (
                        <div className="absolute left-0 mt-1.5 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-40 text-xs animate-in fade-in">
                          <button
                            onClick={() => handlePostpone(task.id, 1)}
                            className="w-full text-right px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
                          >
                            +1 يوم غداً
                          </button>
                          <button
                            onClick={() => handlePostpone(task.id, 3)}
                            className="w-full text-right px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
                          >
                            +3 أيام
                          </button>
                          <button
                            onClick={() => handlePostpone(task.id, 7)}
                            className="w-full text-right px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
                          >
                            +1 أسبوع
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit Button */}
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                    title="تعديل المهمة"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(task.id, task.title)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                    title="حذف المهمة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                تعديل المهمة / المتابعة
              </h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">عنوان المهمة *</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">العميل المرتبط</label>
                  <select
                    value={editingTask.merchantId || ''}
                    onChange={e => {
                      const m = merchants.find(item => item.id === e.target.value);
                      setEditingTask({
                        ...editingTask,
                        merchantId: e.target.value || undefined,
                        merchantName: m ? m.name : undefined,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="">بدون عميل محدد</option>
                    {merchants.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    required
                    value={editingTask.dueDate}
                    onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">الأولوية</label>
                  <select
                    value={editingTask.priority}
                    onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="urgent">عاجل</option>
                    <option value="high">مرتفع</option>
                    <option value="medium">متوسط</option>
                    <option value="low">منخفض</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">الحالة</label>
                  <select
                    value={editingTask.status}
                    onChange={e => setEditingTask({ ...editingTask, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="new">جديدة</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="completed">مكتملة</option>
                    <option value="overdue">متأخرة</option>
                    <option value="postponed">مؤجلة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">التصنيف</label>
                  <select
                    value={editingTask.category}
                    onChange={e => setEditingTask({ ...editingTask, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="merchant_followup">متابعة عميل</option>
                    <option value="operational_issue">مشكلة تشغيلية</option>
                    <option value="commercial_opportunity">فرصة تجارية</option>
                    <option value="documents">مستندات</option>
                    <option value="meeting">اجتماع</option>
                    <option value="admin_task">مهمة إدارية</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">الإجراء التالي (Next Action)</label>
                <input
                  type="text"
                  value={editingTask.nextAction}
                  onChange={e => setEditingTask({ ...editingTask, nextAction: e.target.value })}
                  placeholder="الخطوة التنفيذية المحددة..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">وصف المهمة</label>
                <textarea
                  rows={3}
                  value={editingTask.description}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  <Save className="w-4 h-4" />
                  حفظ التعديلات
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
