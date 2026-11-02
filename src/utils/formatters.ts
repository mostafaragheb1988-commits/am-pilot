// Arabic date and format helpers

export function formatArabicDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return new Intl.DateTimeFormat('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatShortArabicDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return new Intl.DateTimeFormat('ar-EG', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatArabicCurrency(amount?: number): string {
  if (amount === undefined || amount === null) return '0 ر.س';
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatArabicNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}

// Status labels & styles
export const MERCHANT_STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: 'نشط', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400' },
  needs_followup: { label: 'يحتاج متابعة', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400' },
  churn_risk: { label: 'معرض لفقدان العلاقة', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400' },
  inactive: { label: 'غير نشط', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
};

export const IMPORTANCE_MAP: Record<string, { label: string; bg: string; text: string }> = {
  strategic: { label: 'استراتيجي', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-400' },
  high: { label: 'مرتفع', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400' },
  medium: { label: 'متوسط', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
  normal: { label: 'عادي', bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-600 dark:text-slate-400' },
};

export const RISK_MAP: Record<string, { label: string; bg: string; text: string }> = {
  low: { label: 'منخفض', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400' },
  medium: { label: 'متوسط', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400' },
  high: { label: 'مرتفع', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400' },
};

export const TASK_PRIORITY_MAP: Record<string, { label: string; color: string; badge: string }> = {
  urgent: { label: 'عاجل', color: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800' },
  high: { label: 'مرتفع', color: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800' },
  medium: { label: 'متوسط', color: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800' },
  low: { label: 'منخفض', color: 'text-slate-500 dark:text-slate-400', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700' },
};

export const TASK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'جديدة', color: 'text-sky-600 dark:text-sky-400' },
  in_progress: { label: 'قيد التنفيذ', color: 'text-blue-600 dark:text-blue-400' },
  completed: { label: 'مكتملة', color: 'text-emerald-600 dark:text-emerald-400' },
  overdue: { label: 'متأخرة', color: 'text-rose-600 dark:text-rose-400 font-bold' },
  postponed: { label: 'مؤجلة', color: 'text-amber-600 dark:text-amber-400' },
};

export const TASK_CATEGORY_MAP: Record<string, string> = {
  merchant_followup: 'متابعة عميل',
  operational_issue: 'مشكلة تشغيلية',
  commercial_opportunity: 'فرصة تجارية',
  documents: 'مستندات',
  meeting: 'اجتماع',
  admin_task: 'مهمة إدارية',
  other: 'أخرى',
};

export const MEETING_TYPE_MAP: Record<string, string> = {
  client_visit: 'زيارة عميل',
  online_meeting: 'اجتماع أونلاين',
  phone_call: 'مكالمة هاتفية',
  internal_meeting: 'اجتماع داخلي',
  commercial_followup: 'متابعة تجارية',
};

export const MEETING_STATUS_MAP: Record<string, { label: string; color: string }> = {
  planned: { label: 'مخطط', color: 'text-blue-600 dark:text-blue-400' },
  completed: { label: 'تم بنجاح', color: 'text-emerald-600 dark:text-emerald-400' },
  postponed: { label: 'تم التأجيل', color: 'text-amber-600 dark:text-amber-400' },
  cancelled: { label: 'تم الإلغاء', color: 'text-rose-600 dark:text-rose-400' },
};
