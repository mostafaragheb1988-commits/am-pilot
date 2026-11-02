# AM Pilot – Smart Account Management Assistant (مساعد مدير الحسابات الذكي)

AM Pilot is an individual productivity and relationship management web platform built Arabic-first with a full RTL layout, designed specifically for Account Managers to orchestrate merchants, meetings, daily priorities, follow-ups, and executive reports powered by grounded server-side AI.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The clarifying questions were acknowledged. The following recommended defaults have been adopted to guarantee a complete, production-grade MVP experience:
> - **Industry Preset**: Sample data will feature real-world MENA Fintech, Retail, and POS merchants (e.g., Carrefour, Noon Payments, Jarir, HungerStation, Bateel) with realistic MID numbers, MCC codes, and commercial opportunities.
> - **AI Integration**: Dual presentation with a proactive **Daily Briefing & Priority Center** on the dashboard plus an interactive **AI Assistant** tab with quick-prompt shortcuts and custom conversational analysis.
> - **Report & Data Export**: Built-in formatted **Printable Arabic Executive Reports** (browser print-to-PDF optimized with dedicated `@media print` styles) as well as **JSON Data Backup & Restore** and **CSV Export**.

---

## 1. Overview & Core Concept

- **What It Does**: AM Pilot equips an individual Account Manager with a consolidated cockpit to oversee their entire merchant portfolio. It manages merchant dossiers, schedules and tracks meetings across day/week/month views, logs meeting outcomes with automated follow-up task generation, detects schedule conflicts, flags overdue tasks and at-risk merchants, and runs server-side Gemini AI to synthesize daily agendas, parse meeting notes into actionable tickets, and compute productivity analytics.
- **Target Persona**: An individual corporate/enterprise Account Manager, Merchant Success Partner, or Relationship Manager handling 15–50+ active accounts.
- **Key Value**: Replaces scattered notes, spreadsheets, and calendar reminders with an integrated, intelligent Arabic workflow that ensures zero lost follow-ups and delivers crisp executive reporting.

---

## 2. User Experience & Visual Design

### Visual Identity & Theme
- **Color Palette**:
  - Primary Canvas: Deep Navy Blue (`#142D4E` / `slate-900` in dark mode)
  - Interactive & Brand Accent: Professional Blue (`#2878C8`)
  - Surface Background: Light Cool Grey (`#F5F7FA`) in light mode; Slate-950 (`#0B1120`) in dark mode
  - Structural Cards: Pure White (`#FFFFFF`) with subtle hairline border (`border-slate-200`) and soft elevation in light mode; Dark Slate (`#1E293B`) in dark mode
  - Semantic Status Tokens:
    - Success / Active: Emerald Green (`#10B981` / `text-emerald-700 dark:text-emerald-400`)
    - Warning / Attention: Amber Orange (`#F59E0B` / `text-amber-700 dark:text-amber-400`)
    - Critical / At-Risk / Overdue: Crimson Red (`#EF4444` / `text-rose-700 dark:text-rose-400`)
- **Typography & RTL Discipline**:
  - Primary Font: Cairo / IBM Plex Sans Arabic / Alexandria modern Arabic sans-serif for legible UI labels, headers, and numerals.
  - Direction: Strict `dir="rtl"` layout across all screens, drawers, modal sheets, and tables.
  - Numbers: High-legibility tabular figures (`tabular-nums`) for MIDs, phone numbers, times, percentages, and dates.
- **Anti-Slop Discipline**:
  - No decorative status dots or fake telemetry indicators.
  - Metadata rendered with unboxed clean text and subtle separators (`·`).
  - No card-within-card stacking; clean 1-elevation surfaces with hairline dividers.

### Primary Navigation Sections
1. **الرئيسية (Dashboard)**: KPI stat cards, Today's Agenda, Priority Center (Top 3 urgency items), Activity overview & completion gauges, AI Daily Briefing card, and Quick Action buttons.
2. **العملاء (Merchants)**: Comprehensive merchant directory, search by name/MID/contact, status & risk filtering, sort by importance/activity date, and dedicated merchant profile sheet (showing info, interaction timeline, upcoming/past meetings, open tasks, commercial opportunities, and notes).
3. **التقويم والاجتماعات (Calendar & Meetings)**: Day, Week, and Month interactive calendar views; meeting creation/editing modal with conflict detection; post-meeting note logging with outcome recording and direct follow-up generation.
4. **المتابعات والمهام (Follow-ups & Tasks)**: Unified task management matrix; automatic overdue categorization; filter by priority, category, and merchant; one-click complete or postpone (+1 day, +3 days, +1 week); activity log preserving completed/postponed history.
5. **مساعد AI (AI Assistant)**: Arabic AI command center backed by server-side Gemini API. Includes instant preset prompts (*"لخص لي يومي"*, *"إيه أهم 3 أولويات عندي؟"*, *"مين العملاء اللي بقالي فترة متواصلتش معاهم؟"*, *"حول ملاحظات الاجتماع لمهام"*) and open conversational input grounded strictly on real stored merchant and task records.
6. **التقارير والتحليلات (Reports & Analytics)**: Daily, Weekly, and Monthly productivity reports with real calculated metrics (completion rates, interaction volume, overdue ratios, risk exposures), clear computation methodologies, and one-click Print / Save to PDF.
7. **الإعدادات (Settings)**: Data management (export JSON backup, restore JSON, load sample demo data, clear all demo data), light/dark mode preference, and Account Manager profile details.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Persistent Client-Side Store with Server-Side Gemini API Proxy**
  - *Chosen Approach*: Reactive local persistence (localStorage with schema versioning and initial rich demo dataset) coupled with Express `/api/ai/*` server endpoints powered by `@google/genai` (model: `gemini-3.8-flash`).
  - *Why*: Guarantees instant 0ms latency for offline navigation and scheduling, prevents losing state across refreshes, and complies strictly with the requirement that API keys and AI calls remain server-side only.
- **Decision 2: Realistic MENA Merchant Demo Dataset with One-Click Reset**
  - *Chosen Approach*: Pre-populate the app on first launch with 8 realistic merchants (Hypermarkets, Delivery apps, Electronics chains, Boutiques) containing complete MIDs, contacts, upcoming meetings, overdue follow-ups, and interaction notes. Provide a prominent "Clear Demo Data" button in Settings and on the dashboard banner.
  - *Why*: An Account Management app without records looks empty; realistic data allows immediate testing of all calendar views, overdue detection, AI synthesis, and report calculations.
- **Decision 3: Transparent Calculation Methodology in Reports**
  - *Chosen Approach*: Every metric in Daily, Weekly, and Monthly reports displays a subtle info tooltip or subtitle stating exact arithmetic (e.g. `معدل إنجاز المتابعات = المهام المكتملة ÷ (المهام المكتملة + المهام المتأخرة + المهام قيد التنفيذ) × 100`).
  - *Why*: Satisfies the explicit requirement: *"Every metric must have a clearly defined calculation method. Do not interpret activity volume as revenue growth unless actual revenue or GMV data has been entered."*
- **Decision 4: Meeting Outcome & Follow-up Generation Flow**
  - *Chosen Approach*: When an Account Manager marks a meeting as "تم" (Completed), an interactive outcome dialog prompts them for notes, key decisions, and lets them add 1 or more follow-up tasks linked directly to that merchant and meeting.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AM PILOT (Frontend UI)                          │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Sidebar Navigation  │  │        Top Context Header Bar         │  │
│  │  (الرئيسية، العملاء...) │  │  (Breadcrumb, Search, Theme, Quick)   │  │
│  └──────────┬────────────┘  └───────────────────┬───────────────────┘  │
│             │                                   │                      │
│  ┌──────────▼───────────────────────────────────▼───────────────────┐  │
│  │                          View Router                             │  │
│  │  Dashboard  ·  Merchants  ·  Calendar  ·  Tasks  ·  AI  ·  Reports│  │
│  └──────────────────────────────┬───────────────────────────────────┘  │
│                                 │                                      │
│  ┌──────────────────────────────▼───────────────────────────────────┐  │
│  │                Central Reactive Store (storage.ts)               │  │
│  │   - Merchants    - Meetings    - Tasks    - Activity Logs        │  │
│  │   - Notifications              - In-memory & localStorage Cache  │  │
│  └──────────────┬───────────────────────────────────▲───────────────┘  │
└─────────────────┼───────────────────────────────────┼──────────────────┘
                  │                                   │
                  ▼                                   │
┌─────────────────────────────────────────────────────┴──────────────────┐
│                   Server-side Backend (server.ts / Vite)               │
│                                                                        │
│  POST /api/ai/briefing       ──> Gemini 3.8 Flash (Daily Summary)      │
│  POST /api/ai/chat           ──> Gemini 3.8 Flash (Grounded AM Q&A)    │
│  POST /api/ai/extract-tasks  ──> Gemini 3.8 Flash (Meeting Notes => AM)│
│                                                                        │
│  Headers: { 'User-Agent': 'aistudio-build' }                           │
│  process.env.GEMINI_API_KEY (Server Secrets Only)                      │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Entities & Data Models

- **Merchant (`Merchant`)**:
  - `id`: string (uuid)
  - `name`: string (e.g., "أسواق العثيم", "نون للتجارة الإلكترونية")
  - `mid`: string (Merchant ID, e.g. "MID-984210")
  - `contactPerson`: string
  - `phone`: string
  - `email`: string
  - `mcc`: string (Merchant Category Code & Description, e.g. "5411 - بقالة وسوبرماركت")
  - `address`: string
  - `relationshipStartDate`: string (YYYY-MM-DD)
  - `status`: `'active'` | `'needs_followup'` | `'churn_risk'` | `'inactive'`
  - `importance`: `'strategic'` | `'high'` | `'medium'` | `'normal'`
  - `risk`: `'low'` | `'medium'` | `'high'`
  - `generalNotes`: string
  - `isArchived`: boolean
  - `createdAt`: string, `updatedAt`: string

- **Meeting (`Meeting`)**:
  - `id`: string
  - `title`: string
  - `merchantId`: string
  - `merchantName`: string
  - `date`: string (YYYY-MM-DD)
  - `startTime`: string (HH:MM)
  - `endTime`: string (HH:MM)
  - `location`: string
  - `type`: `'client_visit'` | `'online_meeting'` | `'phone_call'` | `'internal_meeting'` | `'commercial_followup'`
  - `objective`: string
  - `agenda`: string
  - `notes`: string
  - `outcome`: string
  - `status`: `'planned'` | `'completed'` | `'postponed'` | `'cancelled'`

- **Task (`Task`)**:
  - `id`: string
  - `title`: string
  - `description`: string
  - `merchantId`?: string
  - `merchantName`?: string
  - `meetingId`?: string
  - `createdAt`: string
  - `dueDate`: string (YYYY-MM-DD)
  - `priority`: `'urgent'` | `'high'` | `'medium'` | `'low'`
  - `status`: `'new'` | `'in_progress'` | `'completed'` | `'overdue'` | `'postponed'`
  - `category`: `'merchant_followup'` | `'operational_issue'` | `'commercial_opportunity'` | `'documents'` | `'meeting'` | `'admin_task'` | `'other'`
  - `nextAction`: string
  - `notes`: string
  - `completedAt`?: string
  - `postponedCount`: number

- **ActivityLog (`ActivityLog`)**:
  - `id`: string
  - `timestamp`: string
  - `type`: `'merchant_created'` | `'merchant_updated'` | `'meeting_scheduled'` | `'meeting_completed'` | `'task_completed'` | `'task_postponed'` | `'call_logged'` | `'note_added'`
  - `entityId`: string
  - `entityTitle`: string
  - `description`: string

- **NotificationAlert (`NotificationAlert`)**:
  - `id`: string
  - `type`: `'meeting_today'` | `'task_overdue'` | `'task_due_today'` | `'merchant_risk'` | `'system'`
  - `title`: string
  - `message`: string
  - `timestamp`: string
  - `read`: boolean
  - `linkSection`?: string

---

## 5. Execution Plan & Quality Verification

1. **Phase 1: Environment & Server Foundations**:
   - Update `metadata.json` with official app name ("AM Pilot") and Arabic description.
   - Configure Tailwind v4 with `@custom-variant dark` in `src/index.css`.
   - Implement server API endpoints in `server.ts` or Vite dev plugin for Gemini 3.8 Flash AI operations with server-side authentication (`process.env.GEMINI_API_KEY`).
2. **Phase 2: Data Models, Seed Data & Storage Layer**:
   - Implement `src/types/index.ts` with strict TypeScript types for all entities.
   - Implement `src/data/seedData.ts` with realistic MENA merchants, meetings, tasks, and history.
   - Implement `src/services/storage.ts` with reactive subscribers, localStorage caching, backup export/import, and automatic overdue task recalculation.
3. **Phase 3: Core UI Framework & Navigation**:
   - Build right-hand Arabic RTL Sidebar navigation with collapsible mobile support.
   - Build Top Header bar with quick action buttons, search, notification center, and theme switcher.
   - Implement Quick Action Modals (إضافة عميل، إضافة اجتماع، إضافة مهمة، تسجيل مكالمة، ملاحظة).
4. **Phase 4: Dashboard (الرئيسية)**:
   - 6 dynamic KPI cards with real calculations.
   - Today's Agenda (scheduled meetings, tasks due today).
   - Priority Center (top 3 urgent algorithmic recommendations).
   - Activity Overview & completion statistics.
   - AI Daily Briefing card with direct refresh button.
5. **Phase 5: Merchant Management (العملاء)**:
   - Comprehensive data table with search, status & risk filter badges, and sort.
   - Dedicated Merchant Profile Sheet with tabs: Info, Interaction Timeline, Meetings, Tasks, Opportunities, and Notes.
   - Add/Edit/Delete/Archive merchant modal.
6. **Phase 6: Calendar & Meetings (التقويم والاجتماعات)**:
   - Day, Week, and Month views with conflict detection.
   - Meeting details modal with complete outcome recording and instant follow-up task generator.
7. **Phase 7: Follow-up & Task Management (المتابعات والمهام)**:
   - Filterable task board with status tabs (الكل، متأخرة، اليوم، قيد التنفيذ، مكتملة).
   - One-click actions: Mark Complete, Postpone (+1d, +3d, +7d), Edit.
   - Overdue tasks spotlight.
8. **Phase 8: AI Assistant (مساعد الذكاء الاصطناعي)**:
   - Chat interface with pre-built prompt cards and custom Arabic prompt input.
   - Real data context injection (sends merchants, tasks, and meetings to the server-side model).
   - Meeting notes extractor tool to convert freeform notes into structured tasks.
9. **Phase 9: Reports & Analytics (التقارير والتحليلات)**:
   - Daily, Weekly, and Monthly tabs with real aggregate formulas.
   - Clear formula explanation labels.
   - Print-optimized CSS styling for one-click browser PDF export.
10. **Phase 10: Verification & Quality Assurance**:
    - Run `compile_applet` and `lint_applet`.
    - Test all user workflows: adding merchants, completing meetings, generating follow-ups, testing overdue flags, verifying Arabic RTL alignment, and confirming dark/light modes.
