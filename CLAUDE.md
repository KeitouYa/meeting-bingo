# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state: M0 complete

Vite + React 19 + TypeScript scaffold is in place. Commands below are live.

## Source-of-truth documents

Four markdown docs define the project. When they disagree, the resolution order is already recorded in `IMPLEMENTATION_PLAN.md` — follow the plan, not the raw specs.

| Doc | Role |
|-----|------|
| `IMPLEMENTATION_PLAN.md` | **Primary.** Reviewed (twice, by VP Product/Eng/Design) build plan: milestones M0–M6, resolved conflicts, accessibility gates, and a "Review Summary" of decisions on record. Start here. |
| `meeting-bingo-prd.md` | Product requirements (user stories US-x.x, priorities, success metrics). |
| `meeting-bingo-architecture.md` | Reference design: type definitions, module layout, sample code. **Authoritative for category word lists.** Note the plan supersedes several of its code samples (see below). |
| `meeting-bingo-uxr.md` | UX research / storyboard (Scenes, Moments, design principles) referenced by ID in the plan. |

### Plan overrides you must respect

`IMPLEMENTATION_PLAN.md` deliberately supersedes parts of the architecture doc's sample code. Do not copy those samples verbatim:

- **GameBoard contract:** use the PRD §7.2 callback interface (`onSquareClick`/`onToggleListening`/`onNewCard`/`onWin`), not the architecture's `setGame`-passed-down sample. All `GameState` transitions stay in `App.tsx`.
- **Speech hook:** track intended-listening in a `useRef` and restart from a plain `onend` handler — never call `recognition.start()` inside a `setState` updater. Classify errors fatal vs. transient (transient keeps listening alive).
- **Detection callback** must be ref-driven (read current `card`/`alreadyFilled` from refs), or dedupe breaks.
- **`WORD_ALIASES`** must be edited before use (remove `api→interface`, per-alias phrase-vs-token branching).
- **Listening indicator** is a non-red "Listening, not recording" affordance, replacing the architecture's `bg-red-500 animate-pulse` sample.

## Architecture (target)

Browser-only, zero-backend single-player game. **No audio ever leaves the device**; speech is processed in-browser via the Web Speech API. Static-hosted on Vercel. Core game must remain fully playable by manual tap when speech recognition is unavailable (progressive enhancement is a hard constraint).

Three concerns, kept separable so the logic is unit-testable without the UI:

- **`src/lib/`** — pure logic, no React: `cardGenerator` (Fisher-Yates, 24 words + center FREE space, 5×5 grid with `row-col` IDs), `bingoChecker` (`checkForBingo`, `countFilled`, `getClosestToWin`), `wordDetector` (`detectWords` + `detectWordsWithAliases`), `shareUtils`. Build and test these first.
- **`src/hooks/`** — `useSpeechRecognition` wraps the Web Speech API. For the MVP, root `useState` in `App.tsx` is the source of truth; `useGame`/`useBingoDetection`/`GameContext` are listed in the architecture doc but **not built for MVP** unless prop-drilling demands it.
- **`src/components/`** — screen state machine `landing → category → game → win` driven from `App.tsx`.

Core data flow: detected transcript word → `detectWordsWithAliases` → fill matching square (`isAutoFilled=true`) → toast → re-check bingo, all within a 500ms budget. Card render budget is <100ms.

`alreadyFilled` is a `Set` keyed by `word.toLowerCase()`; detection returns original-cased words, so callers must lowercase on both seed and write-back or duplicates re-fill.

## Commands

```bash
npm run dev        # Vite dev server on port 3000
npm run build      # tsc -b && vite build  (strict; typecheck must pass)
npm run typecheck  # tsc --project tsconfig.app.json --noEmit
npm run lint       # oxlint . (config: oxlint.json; react-hooks rules enabled)
npm run preview    # preview production build
```

Notes:
- No test runner is wired yet. The plan strongly recommends Vitest unit tests for `src/lib/` (the detection/bingo edge cases are the riskiest place to skip tests); run a single test with `npx vitest run <path>` once added.

## Working norms for this repo

- Open items needing a human decision are tracked under "Unresolved / needs decision" and "Open questions before coding" in `IMPLEMENTATION_PLAN.md` (e.g. 90-min workshop scope, manual-unfill behavior). Don't silently resolve these.
- Accessibility is a per-milestone gate, not a final polish step — see the plan's "Accessibility & design system" checklist (aria-pressed/labels, non-color state markers, `aria-live`, `prefers-reduced-motion`, design tokens over hardcoded colors).
