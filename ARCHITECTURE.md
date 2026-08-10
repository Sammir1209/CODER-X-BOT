# ARCHITECTURE.md - Checkout Sentinel Architecture

## Executive Overview

**Checkout Sentinel** is a staff-level QA Automation platform engineered for authorized payment checkouts in staging, sandbox, and local test environments.

It combines:
1. **Chrome Extension (MV3)**: Content Script engine, Heuristic Field Mapper with confidence scoring, background session runner, and a draggable/collapsible **Floating Chrome Overlay**.
2. **Web Dashboard**: Analytics, project management, test case fixtures library, session logs, and domain allowlist administration.
3. **Local Test Checkout (`/test-checkout`)**: Standalone mock payment gateway server for deterministic local QA validation (supporting SUCCESS, DECLINED, 3DS, and ERROR scenarios).
4. **Supabase PostgreSQL**: Multi-tenant database protected by Row Level Security (RLS) logging non-sensitive execution metrics.

---

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                           WEB DASHBOARD (React/Vite)                          │
│        Projects | Test Cases | Session History | Analytics | Settings         │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE POSTGRESQL & AUTH                          │
│        Multi-Tenant RLS Tables: projects, test_cases, test_results, etc.      │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            CHROME EXTENSION (MV3)                             │
├──────────────────────────┬──────────────────────────┬─────────────────────────┤
│    FLOATING OVERLAY UI   │    BACKGROUND WORKER     │     CONTENT SCRIPT      │
│ • Draggable & Collapsible│ • ServiceWorker SW       │ • Checkout Detector     │
│ • State Indicators       │ • Message Router         │ • Field Mapper (Score)  │
│ • Ctrl+Shift+Q Shortcut  │ • Domain Guard Allowlist │ • Form Filler (Native)  │
│ • Execution Controls     │ • Session Runner        │ • Mutation Observer     │
└────────────┬─────────────┴────────────┬─────────────┴────────────┬────────────┘
             │                          │                          │
             ▼                          ▼                          ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                       LOCAL TEST CHECKOUT (/test-checkout)                    │
│   Mock Checkout Page simulating SUCCESS | DECLINED | 3DS | ERROR scenarios    │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## State Machine Model

```
 [ IDLE ] ──► [ DETECTING ] ──► [ CHECKOUT_FOUND ] ──► [ READY ] ──► [ FILLING ]
    ▲               │                                                       │
    │               ▼                                                       ▼
 (Stop)      (Domain Blocked)                                        [ SUBMITTING ]
    │               │                                                       │
    │               ▼                                                       ▼
 [ STOPPED ] ◄─ [ ERROR ] ◄────── [ TIMEOUT ] ◄───────────────── [ PROCESSING ]
                                                                            │
                                                                            ▼
                                           ┌────────────────────────────────┴────────────────┐
                                           │                                                 │
                                           ▼                                                 ▼
                                     [ SUCCESS ] / [ EXPECTED_DECLINE ] / [ REQUIRES_ACTION (3DS) ]
```

---

## Security Model & Compliance

- **Domain Allowlist Guard**: Hard-coded domain validation before DOM manipulation. Execution on unapproved domains is blocked with `UnauthorizedDomainError`.
- **Zero Real Credentials**: Uses synthetic test fixtures and sandbox tokens ONLY.
- **Cross-Origin iFrames**: Respects Same-Origin Policy. Warns user cleanly when protected payment frames are detected.
- **Privacy by Design**: No card numbers, CVVs, or authorization headers are saved or transmitted to Supabase.
