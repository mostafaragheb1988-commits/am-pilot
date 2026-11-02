import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI instance with server-side authentication
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for Arabic system prompt
const SYSTEM_INSTRUCTION_BASE = `
أنت المساعد الذكي المدمج في تطبيق AM Pilot (مساعد مدير الحسابات الذكي).
دورك هو مساعدة مدير الحسابات (Account Manager) في إدارة محفظة تجاره وعملائه وتنظيم مهامه واجتماعاته بكفاءة باللغة العربية.
القواعد الصارمة:
1. الإجابة باللغة العربية الفصحى الواضحة والمهنية.
2. الاعتماد حصراً على البيانات والحقائق المرفقة في سياق الطلب (التجار، المهام، الاجتماعات، الأنشطة).
3. لا تقم أبداً باختلاق تجار أو اجتماعات أو نتائج لم ترد في البيانات المسجلة. إذا كانت المعلومة غير متوفرة، اذكر ذلك بوضوح.
4. حافظ على نبرة تنفيذية مباشرة ومحفزة.
5. قدم توصيات قابلة للتنفيذ فوراً.
`;

// Endpoint 1: Daily Briefing
app.post('/api/ai/briefing', async (req, res) => {
  try {
    const { agenda, overdueTasks, riskMerchants, metrics } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        briefing: `صباح الخير! إليك ملخص سريع ليومك: لديك ${agenda?.meetingsCount || 0} اجتماعات مجدولة اليوم، و ${overdueTasks?.length || 0} مهام متأخرة تحتاج تدخلاً سريعاً. ركز على إنجاز متابعات كبار التجار وتقليل المخاطر التشغيلية.`,
        isFallback: true,
      });
    }

    const prompt = `
قم بإعداد إحاطة صباحية تنفيذية مختصرة ومركزة لمدير الحسابات لليوم:
- ملخص جدول اليوم: ${JSON.stringify(agenda || {})}
- المتابعات والمهام المتأخرة: ${JSON.stringify(overdueTasks || [])}
- التجار المعرضين للمخاطر أو يحتاجون متابعة: ${JSON.stringify(riskMerchants || [])}
- مؤشرات الأداء الحالية: ${JSON.stringify(metrics || {})}

المطلوب:
فقرة افتتاحية تحفيزية، تليها 3 نقاط واضحة ومركزة تمثل أهم أولويات اليوم، ثم تنبيه بخصوص أي عميل يحتاج متابعة حرجة.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
      },
    });

    res.json({
      briefing: response.text || 'لم يتم استلام نص الإحاطة.',
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Error generating daily briefing:', error);
    res.status(200).json({
      briefing: 'صباح الخير! تأكد من مراجعة جدول اجتماعات اليوم والتركيز على المهام العاجلة والتجار ذوي الأولوية الاستراتيجية.',
      isFallback: true,
      error: error.message,
    });
  }
});

// Endpoint 2: Interactive AI Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'الرسالة مطلوبة' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        reply: `تم استلام استفسارك: "${message}". لم يتم العثور على مفتاح API، ولكن بناءً على البيانات المخزنة محلياً، يمكنك مراجعة شاشات المهام والعملاء للتحقق من أحدث البيانات.`,
        isFallback: true,
      });
    }

    const prompt = `
سياق بيانات محفظة مدير الحسابات الحالية:
${JSON.stringify(context || {})}

سؤال أو طلب مدير الحسابات:
"${message}"

أجب باللغة العربية باحترافية، وقدم إحصائيات وأسماء محددة من السياق المرفق دون اختلاق أي بيانات. إذا طُلب إجراء أو خطة، نظمها في نقاط مرقمة واضحة.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
      },
    });

    res.json({
      reply: response.text || 'لا توجد إجابة متاحة.',
      isFallback: false,
    });
  } catch (error: any) {
    console.error('Error in AI chat endpoint:', error);
    res.status(500).json({
      error: 'حدث خطأ أثناء معالجة الطلب الذكي: ' + (error.message || 'خطأ غير معروف'),
    });
  }
});

// Endpoint 3: Meeting Notes Analysis & Task Extraction
app.post('/api/ai/meeting-notes', async (req, res) => {
  try {
    const { meetingTitle, merchantName, notes } = req.body;

    if (!notes || !notes.trim()) {
      return res.status(400).json({ error: 'ملاحظات الاجتماع مطلوبة' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        summary: `تم تلخيص الاجتماع مع ${merchantName || 'العميل'}: تمت مناقشة النقاط التشغيلية والفرص القادمة.`,
        actionItems: [
          {
            title: `متابعة مخرجات اجتماع ${merchantName || ''}`,
            priority: 'high',
            category: 'merchant_followup',
            suggestedDaysFromNow: 2,
          },
        ],
        isFallback: true,
      });
    }

    const prompt = `
حلل ملاحظات الاجتماع التالية واستخرج ملخصاً تنفيذياً ومهام المتابعة الناتجة بدقة:
- عنوان الاجتماع: ${meetingTitle || 'اجتماع عمل'}
- العميل / التاجر: ${merchantName || 'عميل'}
- نص الملاحظات:
"""
${notes}
"""

أرجع الناتج بتنسيق JSON فقط بالشكل التالي:
{
  "summary": "ملخص شامل ومركز للاجتماع والقرارات المتخذة",
  "keyDecisions": ["قرار 1", "قرار 2"],
  "actionItems": [
    {
      "title": "عنوان المهمة المقترحة",
      "priority": "urgent" | "high" | "medium" | "low",
      "category": "merchant_followup" | "operational_issue" | "commercial_opportunity" | "documents" | "meeting" | "admin_task",
      "suggestedDaysFromNow": 1
    }
  ],
  "recommendedNextStep": "التوصية للخطوة القادمة"
}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error extracting meeting tasks:', error);
    res.status(500).json({
      error: 'فشل في تحليل ملاحظات الاجتماع: ' + error.message,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AM Pilot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
