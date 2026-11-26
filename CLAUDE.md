# CLAUDE.md — HARVESTIQ Engineering Guide

## Project Overview
**HARVESTIQ** (*Intelligence That Grows With You. — From monitoring crops to predicting harvests.*) is an AgriTech SaaS platform for hydroponic and vertical lettuce farming operations.

- **Current Development Stage**: Stage 1 Complete (Frontend + Deterministic Demonstration Data + Local Persistence).
- **Explicit Scope**: Hydroponic/vertical farming, Lettuce cultivars, single farm (`Verdant Valley Vertical Farm`) with 4 growing zones (`Zone A`–`Zone D`), batch-level crop growth and harvest intelligence.
- **Stage Boundaries**: Backend/database persistence (Stage 2) and ML model training/inference (Stage 3) are intentionally excluded in Stage 1. All predictions and sensor streams are clearly labeled as demonstration/simulated data.

## Technology Stack
- **Framework**: React 19 + Vite 8 + TypeScript
- **Routing**: `react-router-dom` v7 (`BrowserRouter`)
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";` + theme tokens in `src/index.css`)
- **Charts**: `recharts`
- **Icons**: `lucide-react`

## Folder Structure
```text
src/
├── assets/images/        # Generated facility & avatar visual assets
├── components/
│   ├── batches/          # BatchFormModal (CRUD registration/edit)
│   ├── harvest/          # RecordHarvestModal
│   ├── layout/           # AppShell (sidebar, quick search, notifications, profile)
│   └── ui/               # SectionCard, Modal, ConfirmDialog, StatusBadge, Toast
├── context/              # FarmDataContext (reactive state + derived predictions)
├── data/                 # mockDataset.ts (deterministic seed datasets)
├── pages/                # 9 routes (Landing, Dashboard, Batches, BatchDetail, Predictions, Environment, Harvest, Analytics, Settings)
├── services/             # farmService.ts (localStorage persistence abstraction for Stage 2 swap)
├── types/                # harvestiq.ts (strict TypeScript domain interfaces)
└── utils/                # calculations.ts, formatters.ts (crop age, maturity rules, CSV export)
```

## Design System
- **Primary Forest Green**: `#153F32`
- **Secondary Green**: `#287A55`
- **Soft Sage**: `#E8F0E8`
- **Canvas Background**: `#F7F9F5`
- **Card Surface**: `#FFFFFF` with `1px solid #DFE6DD` hairline borders
- **Primary Ink**: `#202923` | **Muted Ink**: `#78847D`
- **Warm Accent**: `#D7A65B`
- **Typography**: `Plus Jakarta Sans` (display), `DM Sans` (body), `IBM Plex Mono` + `tabular-nums` (numeric metrics, dates, tables).

## Development Conventions
1. Components read and mutate farm state exclusively through `useFarmData()` (backed by `farmService`), never importing raw mock arrays directly into view logic.
2. Stage 1 calculations (`computeDemoHarvestPrediction`, `calculateCropAgeDays`) are strictly deterministic rule-based calculations and are always labeled `DEMONSTRATION DATA` or `DEMONSTRATION MODEL – NOT VALIDATED WITH REAL FARM DATA`.
3. Do not fabricate ML accuracy metrics; keep the Model Evaluation section explicit about requiring sufficient real harvest records.

## Commands
- `npm run dev` — Start development server on port 3000
- `npm run lint` — Run TypeScript typechecking (`tsc --noEmit`)
- `npm run build` — Build production bundle (`vite build`)
