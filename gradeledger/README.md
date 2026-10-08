# GradeLedger

> A production-grade academic grade calculator and GPA tracker — built like a premium SaaS product.

[![Deploy to GitHub Pages](https://github.com/joeliman/gradeledger/actions/workflows/deploy.yml/badge.svg)](https://github.com/joeliman/gradeledger/actions/workflows/deploy.yml)

**Live App:** [https://joeliman.github.io/gradeledger/](https://joeliman.github.io/gradeledger/)

---

## Features

### Multiple Grading Systems
| System | Scale | Description |
|--------|-------|-------------|
| 4.0 GPA | A+ (4.0) → F (0.0) | US standard with +/- grades |
| 10-Point CGPA | O (10) → U (0) | Indian universities (Anna University, etc.) |
| Percentage | A+ (90%+) → F (<50%) | Direct percentage mapping |
| Custom | User-defined | Define your own grade boundaries |

### Core Capabilities
- 📚 **Multi-profile support** — track multiple students or academic programs
- 📅 **Semester management** — Fall/Spring/Summer/Winter terms
- 📊 **Per-course assessments** — assignments, quizzes, midterm, final, labs with weight validation
- 🧮 **Live calculations** — SGPA, CGPA, percentage equivalent, class rank band, academic standing
- 🔮 **What-if simulator** — change any pending score, see GPA impact instantly
- 🎯 **Target planner** — calculate what scores you need for your target GPA
- 📈 **Insights** — GPA trend chart, grade distribution, course performance ranking
- 💾 **Import/Export** — JSON backup/restore, CSV export
- ↩️ **Undo/Redo** — full history, up to 50 steps
- ⌨️ **Command palette** — Cmd/Ctrl+K with fuzzy search
- 🌙 **Light/Dark/System theme**
- 📱 **Mobile-responsive** — bottom navigation on mobile

### Grading Formulas

**Course Grade:**
```
percentage = Σ(score / maxScore × weight) / Σ(completedWeight) × 100
```

**SGPA (Semester GPA):**
```
SGPA = Σ(gradePoints × credits) / Σ(credits)
```

**CGPA (Cumulative GPA):**
```
CGPA = Σ(gradePoints × credits across all semesters) / Σ(all credits)
```

**Target Score:**
```
requiredGradePoints = (targetCGPA × totalFutureCredits - currentCreditPoints) / remainingCredits
```

**Academic Standing:**
| Standing | Threshold |
|----------|-----------|
| Distinction | ≥75% of max |
| First Class | ≥60% of max |
| Second Class | ≥50% of max |
| Pass | ≥40% of max |
| Fail | <40% of max |

---

## Tech Stack

- **Framework:** Vite + React 19 + TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + custom CSS design tokens
- **State:** Zustand with persist + immer middleware
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Animation:** Framer Motion
- **Primitives:** Radix UI (Dialog, Tabs, Tooltip, Dropdown, Select)
- **Icons:** Lucide React
- **Tests:** Vitest + React Testing Library

---

## Project Structure

```
src/
├── components/         # Shared layout components
│   ├── AppLayout.tsx
│   ├── Topbar.tsx
│   ├── Sidebar.tsx
│   ├── MainWorkspace.tsx
│   ├── BottomNav.tsx
│   ├── CommandPalette.tsx
│   ├── GradingSystemSelector.tsx
│   └── ImportExportDialog.tsx
├── features/
│   ├── courses/        # Course table, assessment rows, add course dialog
│   ├── planner/        # Target GPA planner + what-if simulator
│   └── insights/       # Charts and analytics
├── lib/
│   ├── grading/        # Pure grading math functions (unit-tested)
│   │   ├── index.ts
│   │   └── grading.test.ts
│   ├── demo-data.ts    # Realistic seed data
│   └── utils.ts        # Helpers
├── store/
│   └── index.ts        # Zustand store with undo/redo
├── types/
│   └── index.ts        # TypeScript types
└── test/
    └── setup.ts        # Vitest setup
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/joeliman/gradeledger.git
cd gradeledger

# Install
npm install

# Development
npm run dev

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Y` / `Shift+Z` | Redo |
| `Enter` / `Tab` | Commit inline edit |
| `Escape` | Cancel inline edit |

---

## License

MIT — see [LICENSE](./LICENSE)
