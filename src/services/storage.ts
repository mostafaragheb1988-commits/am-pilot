import { 
  Merchant, 
  Meeting, 
  Task, 
  ActivityLog, 
  AppNotification, 
  AccountManagerProfile,
  TaskPriority,
  TaskCategory
} from '../types';
import { 
  INITIAL_PROFILE, 
  INITIAL_MERCHANTS, 
  INITIAL_MEETINGS, 
  INITIAL_TASKS, 
  INITIAL_ACTIVITY_LOGS, 
  INITIAL_NOTIFICATIONS 
} from '../data/seedData';

const STORAGE_KEYS = {
  PROFILE: 'ampilot_profile_v1',
  MERCHANTS: 'ampilot_merchants_v1',
  MEETINGS: 'ampilot_meetings_v1',
  TASKS: 'ampilot_tasks_v1',
  ACTIVITIES: 'ampilot_activities_v1',
  NOTIFICATIONS: 'ampilot_notifications_v1',
  THEME: 'ampilot_theme_v1',
};

// Helper for formatted today YYYY-MM-DD
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Storage Manager
class StorageService {
  private todayStr = getTodayDateString();

  constructor() {
    this.initIfEmpty();
    this.refreshOverdueStatus();
  }

  public subscribeToStore(listener: Listener): () => void {
    return subscribeToStore(listener);
  }

  private initIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEYS.MERCHANTS)) {
      this.resetToDemoData();
    }
  }

  public resetToDemoData() {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_PROFILE));
    localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(INITIAL_MERCHANTS));
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(INITIAL_MEETINGS));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITY_LOGS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    this.refreshOverdueStatus();
    notifyListeners();
  }

  public clearAllData() {
    localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    notifyListeners();
  }

  // Overdue status check
  public refreshOverdueStatus() {
    const tasks = this.getTasks();
    const today = this.todayStr;
    let changed = false;

    const updated = tasks.map(t => {
      if (t.status !== 'completed' && t.dueDate < today && t.status !== 'overdue') {
        changed = true;
        return { ...t, status: 'overdue' as const };
      }
      return t;
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    }
  }

  // --- Profile ---
  public getProfile(): AccountManagerProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  }

  public updateProfile(profile: AccountManagerProfile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    notifyListeners();
  }

  // --- Merchants ---
  public getMerchants(): Merchant[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MERCHANTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getMerchant(id: string): Merchant | undefined {
    return this.getMerchants().find(m => m.id === id);
  }

  public saveMerchant(merchant: Merchant) {
    const list = this.getMerchants();
    const index = list.findIndex(m => m.id === merchant.id);
    const isNew = index === -1;

    if (isNew) {
      list.unshift(merchant);
      this.logActivity(
        'merchant_created',
        merchant.id,
        merchant.name,
        `تم إضافة العميل الجديد (${merchant.name}) برقم تاجر ${merchant.mid}`
      );
    } else {
      list[index] = merchant;
      this.logActivity(
        'merchant_updated',
        merchant.id,
        merchant.name,
        `تم تحديث بيانات العميل (${merchant.name})`
      );
    }

    localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(list));
    notifyListeners();
  }

  public deleteMerchant(id: string) {
    const list = this.getMerchants().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(list));
    notifyListeners();
  }

  public archiveMerchant(id: string) {
    const list = this.getMerchants().map(m => {
      if (m.id === id) {
        return { ...m, isArchived: !m.isArchived, updatedAt: new Date().toISOString() };
      }
      return m;
    });
    localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(list));
    notifyListeners();
  }

  // --- Meetings ---
  public getMeetings(): Meeting[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEETINGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getMeeting(id: string): Meeting | undefined {
    return this.getMeetings().find(m => m.id === id);
  }

  public saveMeeting(meeting: Meeting) {
    const list = this.getMeetings();
    const index = list.findIndex(m => m.id === meeting.id);
    const isNew = index === -1;

    if (isNew) {
      list.unshift(meeting);
      this.logActivity(
        'meeting_scheduled',
        meeting.id,
        meeting.title,
        `تم جدولة اجتماع (${meeting.title}) بتاريخ ${meeting.date} الساعة ${meeting.startTime}`
      );
    } else {
      list[index] = meeting;
    }

    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(list));
    notifyListeners();
  }

  public deleteMeeting(id: string) {
    const list = this.getMeetings().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(list));
    notifyListeners();
  }

  public completeMeeting(
    meetingId: string, 
    notes: string, 
    outcome: string, 
    generatedTasks?: Array<{ title: string; priority: TaskPriority; category: TaskCategory; dueDate: string }>
  ) {
    const list = this.getMeetings().map(m => {
      if (m.id === meetingId) {
        return {
          ...m,
          status: 'completed' as const,
          notes: notes || m.notes,
          outcome: outcome || m.outcome,
        };
      }
      return m;
    });
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(list));

    const meeting = list.find(m => m.id === meetingId);
    if (meeting) {
      this.logActivity(
        'meeting_completed',
        meeting.id,
        meeting.title,
        `تم إكمال الاجتماع وتوثيق المخرجات: ${outcome.slice(0, 80)}...`
      );
    }

    // Add generated follow-up tasks if any
    if (generatedTasks && generatedTasks.length > 0) {
      generatedTasks.forEach(gt => {
        this.saveTask({
          id: 't-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          title: gt.title,
          description: `متابعة منبثقة عن اجتماع: ${meeting?.title || ''}`,
          merchantId: meeting?.merchantId,
          merchantName: meeting?.merchantName,
          meetingId: meeting?.id,
          createdAt: new Date().toISOString(),
          dueDate: gt.dueDate || this.todayStr,
          priority: gt.priority,
          status: 'new',
          category: gt.category,
          nextAction: 'البدء في تنفيذ بنود المتابعة',
          notes: '',
          postponedCount: 0,
        });
      });
    }

    notifyListeners();
  }

  // --- Tasks ---
  public getTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveTask(task: Task) {
    const list = this.getTasks();
    const index = list.findIndex(t => t.id === task.id);
    const isNew = index === -1;

    // Check if new or updated task is already past due
    if (task.status !== 'completed' && task.dueDate < this.todayStr) {
      task.status = 'overdue';
    }

    if (isNew) {
      list.unshift(task);
      this.logActivity(
        'task_created',
        task.id,
        task.title,
        `تم إنشاء مهمة جديدة (${task.title}) موعد الاستحقاق: ${task.dueDate}`
      );
    } else {
      list[index] = task;
    }

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
    notifyListeners();
  }

  public deleteTask(id: string) {
    const list = this.getTasks().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));
    notifyListeners();
  }

  public completeTask(id: string) {
    const list = this.getTasks().map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'completed' as const,
          completedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));

    const task = list.find(t => t.id === id);
    if (task) {
      this.logActivity(
        'task_completed',
        task.id,
        task.title,
        `تم إنجاز المهمة (${task.title}) بنجاح`
      );
    }

    notifyListeners();
  }

  public postponeTask(id: string, days: number = 1) {
    const list = this.getTasks().map(t => {
      if (t.id === id) {
        const currentDate = new Date(t.dueDate || Date.now());
        currentDate.setDate(currentDate.getDate() + days);
        const newDueDate = currentDate.toISOString().split('T')[0];

        return {
          ...t,
          dueDate: newDueDate,
          status: 'postponed' as const,
          postponedCount: (t.postponedCount || 0) + 1,
        };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(list));

    const task = list.find(t => t.id === id);
    if (task) {
      this.logActivity(
        'task_postponed',
        task.id,
        task.title,
        `تم تأجيل المهمة (${task.title}) لمدة ${days} يوم إلى ${task.dueDate}`
      );
    }

    notifyListeners();
  }

  // --- Activities ---
  public getActivityLogs(): ActivityLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public logActivity(type: ActivityLog['type'], entityId: string, entityTitle: string, description: string) {
    const list = this.getActivityLogs();
    const entry: ActivityLog = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
      type,
      entityId,
      entityTitle,
      description,
    };
    list.unshift(entry);
    // keep max 200 logs
    const trimmed = list.slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(trimmed));
  }

  // --- Notifications ---
  public getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public markNotificationRead(id: string) {
    const list = this.getNotifications().map(n => {
      if (n.id === id) return { ...n, read: true };
      return n;
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    notifyListeners();
  }

  public markAllNotificationsRead() {
    const list = this.getNotifications().map(n => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    notifyListeners();
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const list = this.getNotifications();
    const newNotif: AppNotification = {
      ...notification,
      id: 'notif-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    list.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    notifyListeners();
  }

  // --- KPI Calculations ---
  public getCalculatedKPIs() {
    const today = this.todayStr;
    const merchants = this.getMerchants().filter(m => !m.isArchived);
    const meetings = this.getMeetings();
    const tasks = this.getTasks();

    const todayMeetings = meetings.filter(m => m.date === today && m.status !== 'cancelled');
    const todayDueTasks = tasks.filter(t => t.dueDate === today && t.status !== 'completed');
    const overdueTasks = tasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && t.dueDate < today));
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const needsFollowupMerchants = merchants.filter(m => m.status === 'needs_followup');
    const churnRiskMerchants = merchants.filter(m => m.status === 'churn_risk' || m.risk === 'high');

    // Follow-up completion rate = completed / total * 100
    const totalActionableTasks = tasks.length;
    const completionRate = totalActionableTasks > 0 
      ? Math.round((completedTasks.length / totalActionableTasks) * 100) 
      : 100;

    // Synthesized Top 3 Priorities for Priority Center
    const priorities: Array<{
      id: string;
      title: string;
      reason: string;
      urgency: 'high' | 'medium' | 'critical';
      type: 'task' | 'merchant' | 'meeting';
      linkId?: string;
    }> = [];

    // Priority 1: High risk / churn merchant or critical overdue task
    const criticalOverdue = overdueTasks.find(t => t.priority === 'urgent' || t.priority === 'high');
    if (criticalOverdue) {
      priorities.push({
        id: 'p-1',
        title: criticalOverdue.title,
        reason: `مهمة متأخرة مستحقة لـ ${criticalOverdue.merchantName || 'عميل'} ذات أولوية قصوى`,
        urgency: 'critical',
        type: 'task',
        linkId: criticalOverdue.id,
      });
    }

    // Priority 2: Strategic churn risk merchant
    const topRiskMerchant = merchants.find(m => m.status === 'churn_risk' || (m.risk === 'high' && m.importance === 'strategic'));
    if (topRiskMerchant) {
      priorities.push({
        id: 'p-2',
        title: `حماية واستبقاء: ${topRiskMerchant.name}`,
        reason: `تاجر استراتيجي مصنف عالي المخاطر يحتاج زيارة ميدانية أو تدخلاً تجارياً عاجلاً`,
        urgency: 'critical',
        type: 'merchant',
        linkId: topRiskMerchant.id,
      });
    }

    // Priority 3: Today's most important meeting
    const topTodayMeeting = todayMeetings[0];
    if (topTodayMeeting && priorities.length < 3) {
      priorities.push({
        id: 'p-3',
        title: topTodayMeeting.title,
        reason: `اجتماع مجدول اليوم الساعة ${topTodayMeeting.startTime} مع ${topTodayMeeting.merchantName || ''}`,
        urgency: 'high',
        type: 'meeting',
        linkId: topTodayMeeting.id,
      });
    }

    // Fill up to 3 if needed
    if (priorities.length < 3 && todayDueTasks.length > 0) {
      const topDue = todayDueTasks[0];
      if (!priorities.some(p => p.linkId === topDue.id)) {
        priorities.push({
          id: 'p-extra',
          title: topDue.title,
          reason: `متابعة مستحقة الإغلاق اليوم لـ ${topDue.merchantName || ''}`,
          urgency: 'high',
          type: 'task',
          linkId: topDue.id,
        });
      }
    }

    return {
      todayMeetingsCount: todayMeetings.length,
      todayDueTasksCount: todayDueTasks.length,
      overdueTasksCount: overdueTasks.length,
      completedTasksCount: completedTasks.length,
      totalMerchantsCount: merchants.length,
      needsFollowupMerchantsCount: needsFollowupMerchants.length,
      churnRiskMerchantsCount: churnRiskMerchants.length,
      completionRate,
      priorities: priorities.slice(0, 3),
      todayMeetings,
      todayDueTasks,
      overdueTasks,
    };
  }

  // --- Export / Import Backup ---
  public exportBackup(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      merchants: this.getMerchants(),
      meetings: this.getMeetings(),
      tasks: this.getTasks(),
      activities: this.getActivityLogs(),
      notifications: this.getNotifications(),
    };
    return JSON.stringify(payload, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.merchants)) {
        localStorage.setItem(STORAGE_KEYS.MERCHANTS, JSON.stringify(data.merchants));
      }
      if (Array.isArray(data.meetings)) {
        localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(data.meetings));
      }
      if (Array.isArray(data.tasks)) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
      }
      if (Array.isArray(data.activities)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(data.activities));
      }
      if (data.profile) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
      }
      this.refreshOverdueStatus();
      notifyListeners();
      return true;
    } catch (err) {
      console.error('Failed to import backup JSON:', err);
      return false;
    }
  }
}

export const storage = new StorageService();
