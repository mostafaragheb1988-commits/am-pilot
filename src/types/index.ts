export type MerchantStatus = 'active' | 'needs_followup' | 'churn_risk' | 'inactive';
export type MerchantImportance = 'strategic' | 'high' | 'medium' | 'normal';
export type MerchantRisk = 'low' | 'medium' | 'high';

export interface CommercialOpportunity {
  id: string;
  merchantId: string;
  title: string;
  estimatedValue?: number;
  stage: 'identified' | 'negotiation' | 'won' | 'lost';
  expectedCloseDate: string;
  notes: string;
}

export interface Merchant {
  id: string;
  name: string;
  mid: string;
  contactPerson: string;
  phone: string;
  email: string;
  mcc: string; // e.g. "5411 - بقالة وسوبرماركت"
  address: string;
  relationshipStartDate: string;
  status: MerchantStatus;
  importance: MerchantImportance;
  risk: MerchantRisk;
  generalNotes: string;
  isArchived: boolean;
  opportunities?: CommercialOpportunity[];
  createdAt: string;
  updatedAt: string;
}

export type MeetingType = 
  | 'client_visit' 
  | 'online_meeting' 
  | 'phone_call' 
  | 'internal_meeting' 
  | 'commercial_followup';

export type MeetingStatus = 'planned' | 'completed' | 'postponed' | 'cancelled';

export interface Meeting {
  id: string;
  title: string;
  merchantId?: string;
  merchantName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  type: MeetingType;
  objective: string;
  agenda: string;
  notes: string;
  outcome?: string;
  status: MeetingStatus;
  createdAt: string;
}

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'new' | 'in_progress' | 'completed' | 'overdue' | 'postponed';
export type TaskCategory = 
  | 'merchant_followup' 
  | 'operational_issue' 
  | 'commercial_opportunity' 
  | 'documents' 
  | 'meeting' 
  | 'admin_task' 
  | 'other';

export interface Task {
  id: string;
  title: string;
  description: string;
  merchantId?: string;
  merchantName?: string;
  meetingId?: string;
  createdAt: string;
  dueDate: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  nextAction: string;
  notes: string;
  completedAt?: string;
  postponedCount: number;
  isRecurring?: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 
    | 'merchant_created' 
    | 'merchant_updated' 
    | 'meeting_scheduled' 
    | 'meeting_completed' 
    | 'task_created' 
    | 'task_completed' 
    | 'task_postponed' 
    | 'call_logged' 
    | 'note_added';
  entityId: string;
  entityTitle: string;
  description: string;
}

export interface AppNotification {
  id: string;
  type: 'meeting_today' | 'task_overdue' | 'task_due_today' | 'merchant_risk' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetTab?: 'dashboard' | 'merchants' | 'calendar' | 'tasks' | 'ai' | 'reports';
}

export interface AccountManagerProfile {
  name: string;
  title: string;
  email: string;
  phone: string;
  region: string;
  portfolioTargetCount: number;
}
