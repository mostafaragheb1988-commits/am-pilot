import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Check, 
  Save, 
  Moon, 
  Sun,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { storage } from '../services/storage';
import { AccountManagerProfile } from '../types';

interface SettingsViewProps {
  profile: AccountManagerProfile;
  onUpdateProfile: (profile: AccountManagerProfile) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  darkMode,
  onToggleDarkMode,
}) => {
  const [formData, setFormData] = useState<AccountManagerProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [backupJson, setBackupJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportBackup();
    setBackupJson(jsonStr);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ampilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storage.importBackup(content);
        if (success) {
          setImportStatus('تم استرجاع النسخة الاحتياطية بنجاح!');
        } else {
          setImportStatus('فشل استرجاع الملف؛ تأكد من صحة تنسيق JSON.');
        }
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('هل تود استعادة البيانات التجريبية الافتراضية؟ سيتم تحديث جدول الأعمال وقائمة التجار.')) {
      storage.resetToDemoData();
      alert('تمت استعادة البيانات التجريبية بنجاح.');
    }
  };

  const handleClearAll = () => {
    if (confirm('تنبيه هام: هل أنت متأكد من مسح كافة السجلات للبدء بقاعدة بيانات فارغة تماماً؟')) {
      storage.clearAllData();
      alert('تم مسح البيانات بنجاح.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-16 max-w-4xl mx-auto">
      
      {/* 1. PROFILE SETTINGS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              بيانات مدير الحسابات (Account Manager Profile)
            </h3>
            <p className="text-xs text-slate-500">
              تُستخدم هذه البيانات في التقارير التنفيذية والمخاطبات الرسمية
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                الاسم الكامل *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                المسمى الوظيفي
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                البريد الإلكتروني المهني
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-900 dark:text-white"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                رقم الهاتف المباشر
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-900 dark:text-white"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                المنطقة الجغرافية / القطاع
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={e => setFormData({ ...formData, region: e.target.value })}
                placeholder="الرياض والمناطق الوسطى"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                عدد التجار المستهدف في المحفظة
              </label>
              <input
                type="number"
                value={formData.portfolioTargetCount}
                onChange={e => setFormData({ ...formData, portfolioTargetCount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                تم حفظ التعديلات بنجاح!
              </span>
            ) : <div />}

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2878C8] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              حفظ بيانات الملف
            </button>
          </div>
        </form>
      </div>

      {/* 2. DATA MANAGEMENT & BACKUP */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              إدارة البيانات والنسخ الاحتياطي (Data Management)
            </h3>
            <p className="text-xs text-slate-500">
              تصدير البيانات واستعادتها لضمان الأمان ونقل البيانات بين الأجهزة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Export Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                تصدير نسخة احتياطية (JSON)
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              تحميل ملف يحتوي على كافة بيانات التجار، الاجتماعات، المهام وسجل الأنشطة لحفظها محلياً.
            </p>
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              تصدير وحفظ النسخة الاحتياطية
            </button>
          </div>

          {/* Import Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                استرجاع نسخة احتياطية
              </h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              استيراد ملف نسخة احتياطية سبق تصديره لاستعادة سجلاتك وبياناتك فوراً.
            </p>
            <label className="block w-full py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition text-center cursor-pointer">
              <span>اختيار ملف JSON للاسترجاع</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
            {importStatus && (
              <span className="text-[11px] font-semibold text-blue-600 block text-center">
                {importStatus}
              </span>
            )}
          </div>

        </div>

        {/* Reset & Wipe Section */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            خيارات إعادة التهيئة والبيانات التجريبية:
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetDemo}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              استعادة البيانات التجريبية النموذجية
            </button>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-semibold text-rose-700 dark:text-rose-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              مسح كافة السجلات للبدء من الصفر
            </button>
          </div>
        </div>

      </div>

      {/* 3. SYSTEM & SECURITY INFO */}
      <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>الأمان وخصوصية البيانات:</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          تطبيق AM Pilot مصمم للأفراد؛ يتم حفظ وتشفير مفاتيح الذكاء الاصطناعي في الخادم فقط، دون مشاركتها مع المتصفح. بيانات تجارك تخزن محلياً وتخضع لسيطرتك الكاملة.
        </p>
      </div>

    </div>
  );
};
