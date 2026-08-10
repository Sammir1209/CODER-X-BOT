# Checkout Sentinel - QA Automation Extension & Platform

A Staff-level **Google Chrome Extension (Manifest V3)**, **React 18**, **TypeScript (Strict)**, **TailwindCSS**, **Zustand**, and **Supabase (PostgreSQL + RLS)** platform engineered exclusively for **authorized payment checkout QA automation** in staging, sandbox, and local test environments.

> [!IMPORTANT]
> **Strict Ethical & Compliance Policy**
> - **Zero Real Credit Cards**: Handles ONLY authorized test fixtures (e.g. Stripe sandbox test cards `424242...`) and synthetic test tokens.
> - **Domain Allowlist Security Guard**: Hard-coded domain verification blocks execution on non-authorized domains (`localhost`, `*.staging.example.com`).
> - **Same-Origin iFrame Safety**: Protected cross-origin payment iframes (Stripe Elements) are recognized without SOP bypasses.
> - **Privacy by Design**: No card numbers, CVVs, or session secrets are ever stored in extension storage or logged to Supabase. Only execution metadata (`status`, `duration_ms`, `test_case_id`, `error_code`) is persisted.

---

## 🛠 Tech Stack

- **Chrome Extension**: Manifest V3, React 18, TypeScript, TailwindCSS, Lucide Icons, Zustand, Shadow DOM Overlay
- **Backend & Auth**: Supabase PostgreSQL, Row Level Security (RLS), Supabase Auth
- **Testing**: Vitest (Unit), Playwright (E2E), Express (Local Test Checkout)
- **Package Manager**: `npm`

---

## 🚀 Getting Started

### 1. Installation

```bash
# Install dependencies
npm install
```

### 2. Launch Local Test Checkout Mock Server

```bash
npm run server
```
Navigating to `http://localhost:3000/test-checkout` opens the local sandbox test checkout page with realistic scenarios (`?scenario=success`, `?scenario=declined`, `?scenario=3ds`, `?scenario=error`).

### 3. Run Unit & E2E Tests

```bash
# Vitest unit test suite
npm run test

# Playwright E2E integration tests
npm run test:e2e
```

### 4. Build Extension for Chrome

```bash
npm run build
```
This outputs production-ready extension bundle files into `dist/`.

To load in Chrome:
1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist/` folder.

---

## 🖥 Floating Chrome Overlay

When on an authorized QA domain with a detected checkout form, a draggable, collapsible floating overlay UI appears automatically (Toggle visibility anytime with `Ctrl + Shift + Q`).

It provides:
- Live status indicators (`● DETECTED`, `● FILLING`, `● SUBMITTING`, `✓ SUCCESS`, `× DECLINED`)
- Test scenario fixture selector
- Execution controls (`▶ START TEST`, `■ STOP`)
- Timer metrics

---

## 📊 Database Schema & Supabase RLS

SQL migration file is located in `supabase/migrations/20260808000000_init_checkout_qa.sql`.

Tables:
- `projects` (user_id, name, environment)
- `authorized_domains` (project_id, domain, enabled)
- `test_cases` (project_id, name, provider, expected_result, test_reference)
- `test_sessions` (project_id, started_at, finished_at, status)
- `test_results` (session_id, test_case_id, result, duration_ms, error_code, metadata)

All tables enforce Row Level Security tied to `auth.uid()`.

---

## 📁 Repository Structure

```
Card/
├── ARCHITECTURE.md
├── SECURITY.md
├── IMPLEMENTATION_PLAN.md
├── README.md
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── manifest.json
├── index.html
├── server/
│   └── testCheckoutServer.ts
├── src/
│   ├── background/
│   │   ├── serviceWorker.ts
│   │   ├── messageRouter.ts
│   │   └── sessionManager.ts
│   ├── content/
│   │   ├── detector.ts
│   │   ├── fieldMapper.ts
│   │   ├── formFiller.ts
│   │   ├── checkoutObserver.ts
│   │   ├── overlay.ts
│   │   ├── messaging.ts
│   │   └── index.ts
│   ├── popup/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   └── styles/
│   ├── stores/
│   ├── types/
│   └── utils/
├── supabase/
│   └── migrations/
└── tests/
    ├── unit/
    └── e2e/
```
