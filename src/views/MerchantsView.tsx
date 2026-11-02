import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  Search, 
  Plus, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Edit3, 
  Archive, 
  Trash2, 
  Phone, 
  Mail, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { storage } from '../services/storage';
import { Merchant, MerchantStatus, MerchantImportance, MerchantRisk } from '../types';
import { 
  MERCHANT_STATUS_MAP, 
  IMPORTANCE_MAP, 
  RISK_MAP 
} from '../utils/formatters';
import { MerchantDetailModal } from '../components/MerchantDetailModal';

interface MerchantsViewProps {
  onOpenQuickAction: (action?: 'merchant' | 'meeting' | 'task' | 'call' | 'note') => void;
  selectedMerchantId?: string | null;
  onClearSelectedMerchant?: () => void;
}

export const MerchantsView: React.FC<MerchantsViewProps> = ({
  onOpenQuickAction,
  selectedMerchantId: propSelectedMerchantId,
  onClearSelectedMerchant,
}) => {
  const [merchants, setMerchants] = useState<Merchant[]>(storage.getMerchants());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'importance' | 'risk'>('importance');
  const [showArchived, setShowArchived] = useState(false);

  // Selected Merchant for detail modal
  const [activeMerchantId, setActiveMerchantId] = useState<string | null>(propSelectedMerchantId || null);

  // Edit Merchant Modal State
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    if (propSelectedMerchantId) {
      setActiveMerchantId(propSelectedMerchantId);
    }
  }, [propSelectedMerchantId]);

  useEffect(() => {
    const update = () => setMerchants(storage.getMerchants());
    update();
    return storage.subscribeToStore ? storage.subscribeToStore(update) : undefined;
  }, []);

  // Filtered & Sorted merchants
  const filteredMerchants = useMemo(() => {
    return merchants
      .filter(m => {
        if (!showArchived && m.isArchived) return false;
        if (showArchived && !m.isArchived) return false;

        if (statusFilter !== 'all' && m.status !== statusFilter) return false;
        if (importanceFilter !== 'all' && m.importance !== importanceFilter) return false;
        if (riskFilter !== 'all' && m.risk !== riskFilter) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = m.name.toLowerCase().includes(q);
          const matchMid = m.mid.toLowerCase().includes(q);
          const matchContact = (m.contactPerson || '').toLowerCase().includes(q);
          const matchMcc = (m.mcc || '').toLowerCase().includes(q);
          if (!matchName && !matchMid && !matchContact && !matchMcc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
        if (sortBy === 'date') return b.relationshipStartDate.localeCompare(a.relationshipStartDate);
        if (sortBy === 'importance') {
          const weights: Record<MerchantImportance, number> = { strategic: 4, high: 3, medium: 2, normal: 1 };
          return weights[b.importance] - weights[a.importance];
        }
        if (sortBy === 'risk') {
          const weights: Record<MerchantRisk, number> = { high: 3, medium: 2, low: 1 };
          return weights[b.risk] - weights[a.risk];
        }
        return 0;
      });
  }, [merchants, searchTerm, statusFilter, importanceFilter, riskFilter, sortBy, showArchived]);

  const handleDeleteMerchant = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف بيانات العميل (${name}) نهائياً؟`)) {
      storage.deleteMerchant(id);
    }
  };

  const handleArchiveMerchant = (id: string) => {
    storage.archiveMerchant(id);
  };

  const handleSaveEditMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMerchant) return;
    storage.saveMerchant({
      ...editingMerchant,
      updatedAt: new Date().toISOString(),
    });
    setEditingMerchant(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* Top Action & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Row 1: Search and Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="البحث باسم العميل، رقم التاجر MID، اسم المسؤول، أو النشاط MCC..."
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenQuickAction('merchant')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2878C8] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عميل جديد</span>
            </button>
          </div>
        </div>

        {/* Row 2: Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          {/* Status segmented filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium ml-1">الحالة:</span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'active', label: 'نشط' },
              { id: 'needs_followup', label: 'يحتاج متابعة' },
              { id: 'churn_risk', label: 'معرض للفقدان' },
              { id: 'inactive', label: 'غير نشط' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  statusFilter === tab.id 
                    ? 'bg-[#142D4E] text-white font-bold' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Importance & Risk Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={importanceFilter}
              onChange={e => setImportanceFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
            >
              <option value="all">كل مستويات الأهمية</option>
              <option value="strategic">استراتيجي</option>
              <option value="high">مرتفع</option>
              <option value="medium">متوسط</option>
              <option value="normal">عادي</option>
            </select>

            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
            >
              <option value="all">كل مستويات المخاطر</option>
              <option value="high">مخاطر مرتفعة</option>
              <option value="medium">مخاطر متوسطة</option>
              <option value="low">مخاطر منخفضة</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
            >
              <option value="importance">ترتيب حسب: الأهمية</option>
              <option value="risk">ترتيب حسب: المخاطر</option>
              <option value="name">ترتيب حسب: الاسم أبجدياً</option>
              <option value="date">ترتيب حسب: تاريخ البداية</option>
            </select>

            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1.5 rounded-xl font-medium transition text-xs ${
                showArchived 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {showArchived ? 'عرض النشطين' : 'المؤرشفون'}
            </button>
          </div>

        </div>

      </div>

      {/* Merchants List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {filteredMerchants.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Store className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              لا توجد نتائج مطابقة
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              جرب تغيير كلمات البحث أو إعادة ضبط خيارات التصفية لعرض تجار المحفظة.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setImportanceFilter('all');
                setRiskFilter('all');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-5 py-3.5">العميل / الشركة</th>
                  <th className="px-4 py-3.5">Merchant ID</th>
                  <th className="px-4 py-3.5">الشخص المسؤول</th>
                  <th className="px-4 py-3.5">الحالة</th>
                  <th className="px-4 py-3.5">الأهمية</th>
                  <th className="px-4 py-3.5">المخاطر</th>
                  <th className="px-5 py-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredMerchants.map(merchant => {
                  const status = MERCHANT_STATUS_MAP[merchant.status] || MERCHANT_STATUS_MAP.active;
                  const importance = IMPORTANCE_MAP[merchant.importance] || IMPORTANCE_MAP.normal;
                  const risk = RISK_MAP[merchant.risk] || RISK_MAP.low;

                  return (
                    <tr 
                      key={merchant.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Name & MCC */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm shrink-0 border border-blue-100 dark:border-blue-900">
                            {merchant.name.slice(0, 2)}
                          </div>
                          <div>
                            <span 
                              onClick={() => setActiveMerchantId(merchant.id)}
                              className="font-bold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer block"
                            >
                              {merchant.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-xs">
                              {merchant.mcc}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* MID */}
                      <td className="px-4 py-4 font-mono font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                        {merchant.mid}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {merchant.contactPerson || 'غير محدد'}
                        </span>
                        <span className="text-[11px] text-slate-400 block" dir="ltr">
                          {merchant.phone}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* Importance */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${importance.bg} ${importance.text}`}>
                          {importance.label}
                        </span>
                      </td>

                      {/* Risk */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${risk.bg} ${risk.text}`}>
                          {risk.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveMerchantId(merchant.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition"
                            title="عرض الملف الكامل للتاجر"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setEditingMerchant(merchant)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition"
                            title="تعديل البيانات"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleArchiveMerchant(merchant.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition"
                            title={merchant.isArchived ? 'إلغاء الأرشفة' : 'أرشفة العميل'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteMerchant(merchant.id, merchant.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                            title="حذف نهائي"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Merchant Detail Modal */}
      {activeMerchantId && (
        <MerchantDetailModal
          merchantId={activeMerchantId}
          isOpen={true}
          onClose={() => {
            setActiveMerchantId(null);
            onClearSelectedMerchant?.();
          }}
          onEditMerchant={m => {
            setActiveMerchantId(null);
            setEditingMerchant(m);
          }}
          onQuickAddMeeting={mId => onOpenQuickAction('meeting')}
          onQuickAddTask={mId => onOpenQuickAction('task')}
        />
      )}

      {/* Edit Merchant Modal */}
      {editingMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                تعديل بيانات العميل: {editingMerchant.name}
              </h3>
              <button
                onClick={() => setEditingMerchant(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditMerchant} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">اسم الشركة / التاجر</label>
                  <input
                    type="text"
                    required
                    value={editingMerchant.name}
                    onChange={e => setEditingMerchant({ ...editingMerchant, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Merchant ID (MID)</label>
                  <input
                    type="text"
                    required
                    value={editingMerchant.mid}
                    onChange={e => setEditingMerchant({ ...editingMerchant, mid: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">الشخص المسؤول</label>
                  <input
                    type="text"
                    value={editingMerchant.contactPerson}
                    onChange={e => setEditingMerchant({ ...editingMerchant, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">رقم الهاتف</label>
                  <input
                    type="text"
                    value={editingMerchant.phone}
                    onChange={e => setEditingMerchant({ ...editingMerchant, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editingMerchant.email}
                    onChange={e => setEditingMerchant({ ...editingMerchant, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">الحالة</label>
                  <select
                    value={editingMerchant.status}
                    onChange={e => setEditingMerchant({ ...editingMerchant, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="active">نشط</option>
                    <option value="needs_followup">يحتاج متابعة</option>
                    <option value="churn_risk">معرض لفقدان العلاقة</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">الأهمية</label>
                  <select
                    value={editingMerchant.importance}
                    onChange={e => setEditingMerchant({ ...editingMerchant, importance: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="strategic">استراتيجي</option>
                    <option value="high">مرتفع</option>
                    <option value="medium">متوسط</option>
                    <option value="normal">عادي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">المخاطر</label>
                  <select
                    value={editingMerchant.risk}
                    onChange={e => setEditingMerchant({ ...editingMerchant, risk: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="low">منخفض</option>
                    <option value="medium">متوسط</option>
                    <option value="high">مرتفع</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">العنوان</label>
                <input
                  type="text"
                  value={editingMerchant.address}
                  onChange={e => setEditingMerchant({ ...editingMerchant, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">ملاحظات عامة</label>
                <textarea
                  rows={3}
                  value={editingMerchant.generalNotes}
                  onChange={e => setEditingMerchant({ ...editingMerchant, generalNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMerchant(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
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
