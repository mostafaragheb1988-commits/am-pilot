import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  FileText, 
  CheckCircle2, 
  Plus, 
  RefreshCw, 
  AlertCircle,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Store,
  Check
} from 'lucide-react';
import { storage, getTodayDateString } from '../services/storage';
import { TaskPriority, TaskCategory } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isExtractedTasks?: boolean;
}

export const AIAssistantView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'extractor'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'assistant',
      text: 'أهلاً بك يا مدير الحسابات! أنا مساعدك الذكي المرتبط مباشرة بقاعدة بيانات تجارك، اجتماعاتك، ومهامك المسجلة. يمكنك سؤالي عن أولويات اليوم، التجار المعرضين للمخاطر، ملخص الأسبوع، أو تحليل الملاحظات.',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Meeting Notes Extractor State
  const [meetingNotesInput, setMeetingNotesInput] = useState('');
  const [extractorMerchantId, setExtractorMerchantId] = useState('');
  const [extractorMeetingTitle, setExtractorMeetingTitle] = useState('');
  const [extractorLoading, setExtractorLoading] = useState(false);
  const [extractedResult, setExtractedResult] = useState<{
    summary?: string;
    keyDecisions?: string[];
    actionItems?: Array<{
      title: string;
      priority: TaskPriority;
      category: TaskCategory;
      suggestedDaysFromNow: number;
    }>;
    recommendedNextStep?: string;
  } | null>(null);
  const [importedTaskIds, setImportedTaskIds] = useState<Record<number, boolean>>({});

  const merchants = storage.getMerchants().filter(m => !m.isArchived);
  const todayStr = getTodayDateString();

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Suggested prompt chips
  const suggestedPrompts = [
    'لخص لي جدول وأولويات يومي',
    'إيه أهم 3 أولويات عندي النهارده؟',
    'اعرض كل المتابعات المتأخرة والعملاء المرتبطين بها',
    'مين العملاء اللي محتاجين زيارة أو معرضين للفقدان؟',
    'مين العملاء اللي بقالي فترة متواصلتش معاهم؟',
    'اعمل لي ملخص تحليلي لأداء الأسبوع',
    'إيه أهم الفرص التجارية المفتوحة في المحفظة؟',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // Gather verified portfolio context to ground the response
      const allMerchants = storage.getMerchants().filter(m => !m.isArchived);
      const allTasks = storage.getTasks();
      const allMeetings = storage.getMeetings();
      const kpis = storage.getCalculatedKPIs();

      const context = {
        todayDate: todayStr,
        kpis: {
          completionRate: kpis.completionRate,
          totalMerchants: kpis.totalMerchantsCount,
          overdueTasksCount: kpis.overdueTasksCount,
          todayMeetingsCount: kpis.todayMeetingsCount,
        },
        merchants: allMerchants.map(m => ({
          name: m.name,
          mid: m.mid,
          status: m.status,
          risk: m.risk,
          importance: m.importance,
          lastUpdated: m.updatedAt,
          opportunitiesCount: (m.opportunities || []).length,
          opportunities: m.opportunities,
        })),
        tasks: allTasks.map(t => ({
          title: t.title,
          merchant: t.merchantName,
          dueDate: t.dueDate,
          priority: t.priority,
          status: t.status,
          category: t.category,
        })),
        meetings: allMeetings.map(mtg => ({
          title: mtg.title,
          merchant: mtg.merchantName,
          date: mtg.date,
          time: mtg.startTime,
          status: mtg.status,
          type: mtg.type,
          outcome: mtg.outcome,
        })),
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          context,
        }),
      });

      const data = await res.json();
      const replyText = data.reply || data.error || 'عذراً، لم أتمكن من استلام الإجابة الذكية.';

      const assistantMsg: Message = {
        id: 'asst-' + Date.now(),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'asst-err-' + Date.now(),
          sender: 'assistant',
          text: 'حدث خطأ في الاتصال بالخادم. يرجى التأكد من تشغيل الخادم والمحاولة مجدداً.',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Notes extraction handler
  const handleExtractNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingNotesInput.trim() || extractorLoading) return;

    setExtractorLoading(true);
    setExtractedResult(null);
    setImportedTaskIds({});

    const merchant = merchants.find(m => m.id === extractorMerchantId);

    try {
      const res = await fetch('/api/ai/meeting-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingTitle: extractorMeetingTitle || 'اجتماع عمل ومتابعة تجارية',
          merchantName: merchant ? merchant.name : 'عميل غير محدد',
          notes: meetingNotesInput.trim(),
        }),
      });

      const data = await res.json();
      setExtractedResult(data);
    } catch {
      alert('حدث خطأ أثناء تحليل ملاحظات الاجتماع.');
    } finally {
      setExtractorLoading(false);
    }
  };

  const handleImportTask = (item: any, index: number) => {
    const merchant = merchants.find(m => m.id === extractorMerchantId);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (item.suggestedDaysFromNow || 1));
    const dueDateStr = dueDate.toISOString().split('T')[0];

    storage.saveTask({
      id: 't-ext-' + Date.now() + '-' + index,
      title: item.title,
      description: `مهمة مستخرجة بالذكاء الاصطناعي من اجتماع: ${extractorMeetingTitle || 'اجتماع عميل'}`,
      merchantId: extractorMerchantId || undefined,
      merchantName: merchant ? merchant.name : undefined,
      createdAt: new Date().toISOString(),
      dueDate: dueDateStr,
      priority: item.priority || 'high',
      status: 'new',
      category: item.category || 'merchant_followup',
      nextAction: 'متابعة ما تم الاتفاق عليه في الاجتماع',
      notes: '',
      postponedCount: 0,
    });

    setImportedTaskIds(prev => ({ ...prev, [index]: true }));
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      
      {/* Top Selector Mode Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              مساعد الذكاء الاصطناعي الموجه (AI Pilot)
            </h2>
            <p className="text-xs text-slate-500">
              مدعوم ببيانات محفظتك الحقيقية بنسبة 100% بدون اختلاق
            </p>
          </div>
        </div>

        <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            الدردشة الذكية
          </button>
          <button
            onClick={() => setActiveTab('extractor')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeTab === 'extractor'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            محلل مخرجات الاجتماعات
          </button>
        </div>
      </div>

      {/* TAB 1: CHAT ASSISTANT */}
      {activeTab === 'chat' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[650px] overflow-hidden">
          
          {/* Messages Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#142D4E]'
                      : 'bg-gradient-to-tr from-blue-600 to-sky-400'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#2878C8] text-white rounded-tl-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tr-xs shadow-xs border border-slate-200/50 dark:border-slate-700/50'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span
                    className={`text-[10px] block mt-1 tabular-nums ${
                      msg.sender === 'user' ? 'text-blue-200 text-left' : 'text-slate-400 text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl rounded-tr-xs px-4 py-3 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>المساعد الذكي يحلل بيانات محفظتك لإعداد الإجابة...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Chips Bar */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-1.5 overflow-x-auto shrink-0">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 ml-1">
              اقتراحات سريعة:
            </span>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSendMessage(p)}
                className="text-xs px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 whitespace-nowrap transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="اكتب استفسارك أو طلبك باللغة العربية (مثال: مين العملاء اللي محتاج أزورهم الأسبوع ده؟)..."
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="px-5 py-3 rounded-2xl bg-[#142D4E] hover:bg-blue-900 disabled:opacity-50 text-white font-semibold flex items-center gap-2 transition shrink-0"
              >
                <span>إرسال</span>
                <Send className="w-4 h-4 -scale-x-100" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* TAB 2: MEETING INTELLIGENCE EXTRACTOR */}
      {activeTab === 'extractor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Notes Input Form (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                تحويل ملاحظات الاجتماع إلى مهام
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                الصق الملاحظات السريعة التي دونتها أثناء الاجتماع ليقوم النموذج بتحليلها واستخراج التوصيات وتوليد مهام متابعة مجدولة تلقائياً.
              </p>
            </div>

            <form onSubmit={handleExtractNotes} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  العميل المرتبط (اختياري)
                </label>
                <select
                  value={extractorMerchantId}
                  onChange={e => setExtractorMerchantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">اختر التاجر</option>
                  {merchants.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  عنوان الاجتماع
                </label>
                <input
                  type="text"
                  value={extractorMeetingTitle}
                  onChange={e => setExtractorMeetingTitle(e.target.value)}
                  placeholder="مثال: اجتماع تجديد عقد نقاط البيع مع هاف مليون"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  نص ملاحظات الاجتماع أو المحضر السريع *
                </label>
                <textarea
                  required
                  rows={8}
                  value={meetingNotesInput}
                  onChange={e => setMeetingNotesInput(e.target.value)}
                  placeholder="اكتب أو الصق الملاحظات هنا... مثال:
قابلنا الأستاذ فهد المدير المالي. اشتكى من تأخر التسوية في فروع الخبر. طلب خفض العمولة إلى 0.95%. اتفقنا نرسل له عرض معدل قبل يوم الخميس، ونوفر 20 جهاز إضافي لفروع الرياض الجديدة."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={extractorLoading || !meetingNotesInput.trim()}
                className="w-full py-3 rounded-2xl bg-[#2878C8] hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs"
              >
                {extractorLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التحليل الذكي واستخراج المخرجات...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>تحليل الملاحظات واستخراج المهام</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Column (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              المخرجات والمهام المستخرجة
            </h3>

            {!extractedResult && !extractorLoading && (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs max-w-sm mx-auto">
                  قم بإدخال ملاحظات الاجتماع والضغط على "تحليل" لتظهر القرارات والمهام المقترحة القابلة للإضافة بضغطة زر.
                </p>
              </div>
            )}

            {extractedResult && (
              <div className="space-y-5 animate-in fade-in">
                
                {/* Executive Summary */}
                {extractedResult.summary && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 space-y-1">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">
                      الملخص التنفيذي:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {extractedResult.summary}
                    </p>
                  </div>
                )}

                {/* Key Decisions */}
                {extractedResult.keyDecisions && extractedResult.keyDecisions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      القرارات والالتزامات المسجلة:
                    </span>
                    <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-600 dark:text-slate-300">
                      {extractedResult.keyDecisions.map((dec, i) => (
                        <li key={i} className="leading-relaxed">{dec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items to Import */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      مهام المتابعة المقترحة للتسجيل:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      اضغط على "+ إضافة للمحفظة" لحفظ المهمة
                    </span>
                  </div>

                  {(!extractedResult.actionItems || extractedResult.actionItems.length === 0) ? (
                    <p className="text-xs text-slate-400">لم يتم رصد مهام مباشرة من النص المرفق.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {extractedResult.actionItems.map((item, idx) => {
                        const isImported = importedTaskIds[idx];
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                              isImported
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-300'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {item.title}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span>الأولوية: {item.priority === 'urgent' ? 'عاجل' : item.priority === 'high' ? 'مرتفع' : 'متوسط'}</span>
                                <span>·</span>
                                <span>الاستحقاق المقترح: بعد {item.suggestedDaysFromNow || 1} يوم</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleImportTask(item, idx)}
                              disabled={isImported}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition shrink-0 ${
                                isImported
                                  ? 'bg-emerald-600 text-white cursor-default'
                                  : 'bg-[#2878C8] hover:bg-blue-600 text-white cursor-pointer shadow-xs'
                              }`}
                            >
                              {isImported ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>تمت الإضافة ✓</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>إضافة للمهام</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recommended Next Step */}
                {extractedResult.recommendedNextStep && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300">
                    <strong>الخطوة القادمة الموصى بها:</strong> {extractedResult.recommendedNextStep}
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
