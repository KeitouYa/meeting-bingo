## Review Summary

- **First reviewed:** 2026-06-23 — VP Product, VP Engineering, VP Design (plan-review skill). 33 issues, all applied (table below).
- **Re-reviewed (2nd pass):** 2026-06-23 — VPs verified prior fixes hold up (speech-hook restart, §7.2 callback contract, alias cleanup, one-shot pulse, aria-live cluster all sound). Second pass surfaced new/under-specified items introduced by the revisions; see "Second-pass findings" below.
- **Disposition:** Approve all recommendations

### First-pass changes applied

| # | Severity | Area | Change applied |
|---|----------|------|----------------|
| 1 | Critical | Speech hook | Restart driven by a ref + plain `onend` handler, not a `setState` updater |
| 2 | High | Speech hook | Fatal vs transient error classification; transient errors keep listening alive |
| 3 | High | Performance | Detect against latest final chunk only; cap stored transcript; memoize card/squares |
| 4 | High | Architecture | GameBoard uses PRD §7.2 callback contract (no raw `setGame` passed down) |
| 5 | High | Detection | Remove `api→interface` alias; word-boundary alias matching; drop dead dotted aliases |
| 6 | High | UX | Near-bingo "one away" hint UI wired from `getClosestToWin()` in M3 |
| 7 | High | Scope | Explicit out-of-scope: no Join Game / Invite Others / multiplayer / leaderboard |
| 8 | High | Scope | MVP ships text share + link; result-card image explicitly deferred |
| 9–12 | High | A11y | `aria-pressed`/labels, non-color state marker, `aria-live`, reduced-motion pulled forward |
| 13–25 | Medium | Various | See itemized milestone edits and Open Questions |
| 26–33 | Low | Various | See itemized milestone edits and Open Questions |

### Second-pass findings (applied)

| # | Severity | Area | Change applied |
|---|----------|------|----------------|
| S1 | Critical | Speech wiring | Detection callback must be ref-driven too — read latest `card`/`alreadyFilled` from refs, not a closure captured at `startListening`. |
| S2 | High | Near-bingo hint | `getClosestToWin()` extended to return the completing word(s), not just a line name; banner names the word(s) per UXR Scene 8 (incl. tied lines → "X or Y"). |
| S3 | High | Auto-fill ownership | App owns a `fillSquares(words)` handler (the §7.2 interface has no speech-fill callback); define `winningWord` capture on an auto-fill win, not just manual taps. |
| S4 | High | Detection window | Detect against a small rolling buffer (last ~1–2 finals), not a single final chunk; unify with the transcript cap. |
| S5 | High | Categories | Architecture `categories.ts` is authoritative; "verbatim" replaced with "with listed edits applied"; reconcile word deltas + confirm ≥40 unique/pack. |
| S6 | High | Alias edge cases | Per-alias phrase-vs-token branching; resolve `continuous integration` literal-vs-alias overlap. |
| S7 | High | Card preview | Resolve US-1.3: either a preview/ready step or set `startedAt` on first listen/fill (not category-select). |
| S8 | High | US-4.2 | Render the winning card on WinScreen ("screenshot-ready layout"); only the canvas image is deferred. |
| S9 | High | Timeline | 90-min target applies to the M1–M3 manual-play checkpoint; M4–M6 + tests are post-workshop. |
| S10 | High | A11y focus/kbd | Move focus to new screen's heading on transition; define grid keyboard model + focus order. |
| S11 | High | Listening affordance | "Listening, not recording" supersedes the architecture `bg-red-500 animate-pulse` everywhere (TranscriptPanel + GameHeader StatusIndicator). |
| S12 | High | Share/virality | Result-card image cut re-rated as a hit to the core viral loop; screenshot-ready WinScreen preserved as fallback. |
| S13–S21 | Medium/Low | Various | Manual-unfill decision, dedupe write-back lowercasing, stable memo handlers, square prop shape, deterministic scaffold, contrast-bound token decision, explainer placement, FREE-square aria, eslint/manifest/emoji cleanups — see milestone edits. |

### Unresolved / needs decision (remaining true open items)

- Confirm the 90-min checkpoint mapping in S9 is acceptable to the workshop owner.
- Confirm manual-unfill behavior for auto-filled squares (S13 / Open Question 6).

---

# Meeting Bingo — Implementation Plan

- **Derived from**: `meeting-bingo-prd.md`, `meeting-bingo-architecture.md`, `meeting-bingo-uxr.md`
- **Target**: Functional MVP, single-player, zero-cost, browser-native
- **Stack**: Vite + React 18 + TypeScript + Tailwind CSS + canvas-confetti

---

## 1. Goal & Constraints

Build a browser-based 5×5 bingo game that auto-fills squares when meeting buzzwords are detected via the Web Speech API. No backend, no accounts, no audio leaves the device. Manual tap is always available as a fallback.

**Hard constraints (from docs):**
- $0 infrastructure — static hosting only (Vercel).
- Audio processed locally, never recorded or transmitted.
- Core game must work even when speech recognition is unavailable (progressive enhancement).
- Card render < 100ms; auto-fill visible within 500ms of detection.

---

## 2. Build Order (Milestones)

Each milestone is independently testable. Ship M1–M4 for a working MVP; M5–M6 are polish/stretch.

### M0 — Project Scaffold

- Scaffold deterministically: `npm create vite@latest` into a **temp dir** with `--template react-ts`, then copy `src/`, `index.html`, and config files into the repo (preserving existing `README.md`/`.gitignore`/docs).
  - Do NOT run `create-vite` directly in the non-empty repo root — it prompts interactively and can clobber `README.md`. (Resolves Open Question 1.)
  - Drop the unused `lint` script from `package.json` unless eslint config + deps are added.
- Install deps: `canvas-confetti`; dev deps: `tailwindcss postcss autoprefixer @types/canvas-confetti` (the types package is required for strict `tsc && vite build`, else typecheck fails).
- Set `sourcemap: false` (or `'hidden'`) for production builds — don't ship source maps publicly.
- **Design tokens:** encode PRD §6.6 colors in `tailwind.config.js` `theme.extend` (or CSS vars).
  - Resolve PRD light-blue filled (`#dbeafe`) vs. architecture solid `bg-blue-500` — pick one source of truth so BingoSquare/WinScreen consume tokens, not hardcoded classes.
  - **Bind the choice to contrast (WCAG AA):** if fill is pale `#dbeafe`, fill text must be dark (`--text-primary #1f2937`), NOT white; if fill is `bg-blue-500`, white text passes.
  - The winning square must NOT use white text on pale `#86efac` (~1.5:1 fails) — use a darker green bg (green-500/600) or dark text on the pale green.
- Configure Tailwind (`tailwind.config.js`, `postcss.config.js`, `src/index.css` directives) per architecture doc.
- Add `vite.config.ts` (port 3000), confirm `npm run dev` serves a blank app.
- **Done when**: dev server runs, Tailwind class renders.

### M1 — Data & Core Logic (no UI)

Pure, unit-testable modules — build these first so the UI sits on solid logic.

- `src/types/index.ts` — all interfaces (Category, BingoSquare, BingoCard, GameState, WinningLine, SpeechRecognitionState, Toast).
- `src/data/categories.ts` — the 3 packs (agile, corporate, tech).
  - Architecture `categories.ts` is the authoritative word source (over PRD §4.2); copy its lists, then verify each pack has ≥40 **unique** words after dedup (US-1.2).
  - Note the PRD/architecture deltas are intentional (architecture omits `WIP limit`/`peel back the onion`, adds `parking lot`/`A/B test`/etc.).
  - Do NOT copy `WORD_ALIASES` verbatim — apply the edits below.
- `src/lib/cardGenerator.ts` — Fisher-Yates shuffle, 24 words + center FREE space, 5×5 grid with `row-col` IDs.
- `src/lib/bingoChecker.ts` — `checkForBingo` (5 rows, 5 cols, 2 diagonals), `countFilled`, `getClosestToWin`.
  - **Extend `getClosestToWin`** to return the unfilled square word(s) on the closest line (e.g. `{ needed, line, words: string[] }`) and to return all lines tied at "one away" — the architecture version returns only a line *name* (`"Row 1"`), which cannot drive the UXR Scene 8 "Need: X or Y" copy.
- `src/lib/wordDetector.ts` — `detectWords` (word-boundary regex for single words, substring for phrases, case-insensitive), `WORD_ALIASES`, `detectWordsWithAliases`.
  - **Fix aliases before copying:**
    - remove the `api → 'interface'` alias (false positives);
    - in `detectWordsWithAliases`, branch **per alias string** the same way `detectWords` branches per word — phrase aliases (`'ci cd'`, `'continuous integration'`) use substring, single-token aliases (`'cicd'`) use word-boundary;
    - either strip non-alphanumerics in `normalizeText` so dotted acronyms (`m.v.p.`, `r.o.i.`) can match, or delete those dead entries.
    - Resolve the `'continuous integration'` collision (it is both a literal agile-pack word and a CI/CD alias) so a single utterance fills at most the intended square.
  - **Dedupe contract:** callers MUST seed the `alreadyFilled` Set with `word.toLowerCase()` (matches the internal check), since `detectWords` returns the original-cased word. Verify `API` and `CI/CD` detect-then-skip correctly.
- `src/lib/utils.ts` — `cn()` className helper (clsx + tailwind-merge, or a minimal join).
- **Done when**: card generates 24 unique words + free space; all 12 winning lines detected; word detection matches exact + phrase + alias cases.

### M2 — Static Screens & Navigation

- `src/App.tsx` — screen state machine: `landing → category → game → win`, `GameState` held in root (per architecture).
  - **US-1.3 resolution:** set `startedAt` on first listen/first fill (NOT on category-select) so "time to BINGO" is meaningful, and treat in-game "New Card" as the regenerate affordance — OR insert a lightweight preview/ready step between category and game (also the natural home for the M4 pre-permission explainer). Pick one and build it; do not leave as an open question.
- `src/components/LandingPage.tsx` — hero, "New Game" CTA, privacy line, "How It Works" steps.
- `src/components/CategorySelect.tsx` + `CategoryCard` — 3 cards with icon/name/sample words, Back button.
- `src/components/ui/` — `Button`, `Card`, `Toast`.
- **Done when**: can navigate Landing → Category → (empty) Game and back.

### M3 — Playable Game (manual mode)

#### Components

- `src/components/BingoCard.tsx` — 5×5 grid layout (responsive, `aspect-square`).
- `src/components/BingoSquare.tsx` — states: default / filled / auto-filled / free / winning (per architecture styling).
- `src/components/GameBoard.tsx` — header (logo, status, `X/24` counter), card, controls.
- `src/components/GameControls.tsx` — New Card, listening toggle (stub until M4).

#### UX & accessibility

- **Near-bingo hint (PRD US-3.2 / UXR Moment 2):** consume the extended `getClosestToWin()` to render a "One away!" banner that **names the completing word(s)** (e.g. `Need: "Scope Creep" or "MVP"`, UXR Scene 8) — not the line name — and apply an intensified (one-shot, reduced-motion-aware) highlight to the near-complete line.
- **BingoSquare accessibility:**
  - `aria-pressed={isFilled}` on togglable squares only; `aria-label` = word + state ("Sprint, filled" / "winning square"); the FREE square is `disabled` so it must NOT carry `aria-pressed` (contradictory) — convey "free space, filled" via label/text, not toggle semantics.
  - Filled & winning squares carry a non-color marker (icon + text alt), not color + line-through alone (WCAG 1.4.1).
- **Focus & keyboard (WCAG):**
  - on every `setScreen` transition move focus to the new screen's heading (`tabIndex={-1}` + `.focus()`) so AT users aren't stranded and WinScreen's "BINGO!" is announced (Principle 3).
  - Define the grid keyboard model — at minimum verify tab order is grid → transcript → controls; preferably `role="grid"` with arrow-key roving tabindex so reaching controls isn't 25 tabs.
- **Reduced motion (here, not M5):**
  - gate all motion behind `prefers-reduced-motion` from first introduction.
  - Make the auto-fill pulse a **one-shot** animation that settles to a static filled style — do NOT tie a permanent `animate-pulse` to `isAutoFilled`.

#### Wiring & win

- Wire manual tap → toggle fill → recount → maintain `alreadyFilled` → `checkForBingo` → on win call `onWin`. Capture the **winning word** (square whose fill completed the line) at win time and thread it into WinScreen.
  - **Manual unfill (US-3.1):** manual taps toggle freely and must update `filledCount`, `alreadyFilled`, and re-run `checkForBingo`. Decide on record whether *auto-filled* squares are user-unfillable; if they are locked (honoring US-2.3 "permanent"), present them as `aria-disabled` so the `aria-pressed` toggle semantics stay truthful.
- `src/components/WinScreen.tsx` — render the **full winning card with the winning line highlighted** (PRD §6.5 / UXR Scene 9) plus stats (time to bingo, winning word, squares filled, category), Play Again / Home.
  - This screenshot-ready layout satisfies US-4.2 and preserves the UXR Moment 4 viral artifact for manual screenshot-share; only the *programmatic* canvas image (M5) is deferred.
- **Done when**: full game is playable by tapping; BINGO triggers win screen with correct stats; near-bingo "one away" hint shows when exactly one square remains on a line. **This is the minimum demoable MVP.**

### M4 — Speech Recognition & Auto-Fill

#### Speech hook

- `src/hooks/useSpeechRecognition.ts` — Web Speech API wrapper: `continuous`, `interimResults`, `lang='en-US'`, feature detection (`isSupported`).
  - **Restart correctly:** track intended-listening state in a `useRef` (NOT in the `setState` updater). Auto-restart in a plain `onend` handler reading the ref; never call `recognition.start()` inside a `setState` callback (breaks under StrictMode). Keep try/catch for "already started".
  - **Classify errors:** fatal (`not-allowed`, `service-not-allowed`, `audio-capture`) → stop, set unavailable, fall back to manual; transient (`no-speech`, `aborted`, `network`) → keep intended-listening true so `onend` restarts. Add a restart backoff/cap (stop after N consecutive failures) to avoid loops.
  - **StrictMode-safe:** make the init effect idempotent; cleanup must fully tear down (stop, null the ref, drop handlers). Test with StrictMode ON.

#### Permissions & privacy

- **Pre-permission explainer (UXR Scene 5 / Principle 4):** show local-processing / "never recorded" copy immediately before the browser mic prompt — not only on the landing page (PRD US-2.1).
  - **Render it on a defined surface:** a modal/dialog fired by the listening toggle *before* `recognition.start()`, or as part of the preview/ready step (see M2). Do not leave its placement implicit.
- **Listening affordance supersedes architecture sample everywhere:** the architecture's `bg-red-500 animate-pulse` "recording" indicator (TranscriptPanel sample) is replaced by a non-red accent + mic glyph + "Listening, not recording" in **both** TranscriptPanel and the GameHeader StatusIndicator (PRD §6.4). Do not use the warning/yellow accent for this.
- **Permission-DENIED path (distinct from unsupported):** on `not-allowed`, show a clear message and fall back to manual mode; keep this separate from the `!isSupported` branch.
- **System-audio caveat:** Web Speech captures the device mic acoustically only — it hears speakers in the room, not a system-audio tap, and headphones break detection. Surface a one-line in-app hint on the listening screen.

#### Transcript & detection wiring

- `src/components/TranscriptPanel.tsx` — live transcript (last ~100 chars), interim text, detected-word chips, listening indicator.
  - Avoid red-pulsing-dot "recording" semantics; use an accent color + mic glyph + "Listening, not recording" affordance.
- **Detection callback must be ref-driven (not a stale closure):** the `onResult` handler must read the *current* `card` and `alreadyFilled` from refs updated each render — do NOT pass a closure captured once at `startListening`, or every detection runs against the initial empty `alreadyFilled` (repeat-fills, broken dedupe).
  - After filling, write back `alreadyFilled.add(word.toLowerCase())` for each detected word (detection returns original case).
- Wire a small **rolling buffer of the last ~1–2 final chunks** (not a single final, and not the unbounded accumulation) → `detectWordsWithAliases` → fill matching squares (`isAutoFilled=true`) → toast → re-check bingo, all within 500ms.
  - A single buzzword/phrase ("scope creep", "code review") can split across two finals, so one chunk is insufficient.
  - Unify this with the transcript cap: one rolling window, sized comfortably larger than the longest phrase, kept independent of the 100-char display slice.
  - Memoize `BingoCard`/`BingoSquare` — and ensure per-square handlers are **stable** (`useCallback`, or have the square call `onSquareClick` with its own row/col) or the memo is defeated.
- **Live regions:** `aria-live="polite"` on the transcript/detected-words region and Toast container; announce auto-fills ("Sprint detected and filled").
- Hide/disable speech UI gracefully when `!isSupported` (manual mode still works).
- **Done when**: speaking a buzzword fills its square automatically with a toast; unsupported browsers fall back cleanly.

### M5 — Polish

- `src/lib/shareUtils.ts` + Share button: clipboard text summary + play link; native share sheet on mobile; (stretch) canvas image of result card.
- canvas-confetti celebration on win (no sound — user is in a meeting).
- `src/hooks/useLocalStorage.ts` + persist current game (resume after tab switch/reload).
- Responsive tweaks (mobile portrait/landscape), reduced-motion respect.
- **Done when**: win → confetti + shareable summary copied; reload resumes game.

### M6 — Deploy & Verify

- `npm run build` clean (tsc + vite). Fix type errors.
- Deploy to Vercel (static).
- Run the manual testing checklist below.
- **Done when**: live URL passes the smoke test on Chrome + one mobile browser.

### Explicitly out of scope for MVP (decisions on record)

- **No multiplayer affordances** — landing follows PRD §6.2 ("New Game" only). No "Join Game", no "Invite Others", no leaderboard, no other-player progress. (The UXR storyboard's two-button hero and Custom-category tile are intentionally NOT built.)
- **Share = text + play link** for MVP (satisfies PRD US-4.3 "image OR text"). Result-card **image** is deferred; note virality/share-rate metrics may be weaker without it.
- **Light/dark theme deferred (P2)** — ship the light palette only; revisit post-MVP.
- **No custom category creation** — exactly 3 packs (Agile/Corporate/Tech).

---

## 3. File Manifest (target structure)

```
src/
  main.tsx, App.tsx, index.css
  components/  LandingPage CategorySelect GameBoard BingoCard BingoSquare
               TranscriptPanel WinScreen GameControls  ui/{Button,Card,Toast}
  hooks/       useSpeechRecognition useLocalStorage   (useGame, useBingoDetection NOT built for MVP — see note)
  lib/         cardGenerator wordDetector bingoChecker shareUtils utils
  data/        categories.ts
  types/       index.ts
  context/     GameContext.tsx   (optional — root useState is sufficient for MVP)
```

> Note: the architecture lists `useGame`/`useBingoDetection`/`GameContext`. For the MVP, root-level `useState` in `App.tsx` (as the doc's sample `App.tsx` shows) is enough; introduce hooks/context only if `GameBoard` prop-drilling gets noisy. Don't build them speculatively.

> **GameBoard contract (resolved):** Use the PRD §7.2 callback interface — `{ game, isListening, onSquareClick, onToggleListening, onNewCard }` plus `onWin` — rather than passing the raw `setGame` setter into the child (architecture's sample). Keep all `GameState` transitions in `App.tsx`. The architecture's `setGame`-down sample is superseded.
>
> **Auto-fill path:** §7.2 has no speech-fill callback, so define one — App owns a `fillSquares(words: string[])` handler (or the speech hook lives in App). Both manual `onSquareClick` and `fillSquares` must recount `filledCount`, maintain `alreadyFilled`, re-run `checkForBingo`, and **capture `winningWord` on either path** (manual tap OR auto-fill can complete the line). Pass the whole `square` object to `BingoSquare` (per architecture, stable reference) rather than flat props, so `React.memo` holds.

---

## 4. Key Technical Decisions & Risks

| Area | Decision | Risk / Mitigation |
|------|----------|-------------------|
| Speech API | Web Speech API, Chrome-first | Firefox limited → feature-detect, manual fallback always present |
| Auto-restart | Restart recognition `onend` while listening | Can throw "already started" → wrap in try/catch |
| Detection accuracy | Word-boundary regex + phrase substring + aliases | Misses → manual tap; tune `WORD_ALIASES` |
| Multi-word phrases | Substring match (e.g. "code review") | Handled separately from single-word boundary match |
| Duplicate detection | Track `alreadyFilled` set; fill once | Same word repeated only fills once |
| State | Root `useState` | Lift to Context only if needed |
| Performance | Pure logic, no heavy deps | Keep detection O(words) per final transcript chunk |

---

## 5. Testing Checklist (gate before "done")

**Logic (M1):**
- 24 unique words + free space
- all 12 winning lines
- exact/phrase/alias detection
- duplicate fills once.

**Game (M3):**
- manual tap toggles
- counter accurate
- win screen stats correct
- play-again regenerates.

**Speech (M4):**
- permission prompt
- listening indicator
- transcript displays
- buzzword auto-fills <500ms
- multi-word detected
- graceful fallback when unsupported.

**Win/Share (M5):**
- confetti plays, no jank
- winning line highlighted
- share copies correct content + link
- mobile native share.

**Accessibility & design system (gate alongside each milestone):**
- `aria-pressed`/`aria-label` on squares
- non-color filled/winning markers (WCAG 1.4.1)
- `aria-live` on transcript + toasts
- motion gated behind `prefers-reduced-motion`, auto-fill pulse is one-shot
- PRD §6.6 colors driven by tokens, no hardcoded `bg-blue-500`
- every emoji-as-icon pairs with a text label, decorative emoji `aria-hidden`.

---

## 6. Suggested Sequencing for One Sitting

1. M0 scaffold → commit.
2. M1 logic (+ quick vitest or manual node checks) → commit.
3. M2 + M3 → **playable manual MVP** → commit (good checkpoint to demo).
4. M4 speech → commit.
5. M5 polish → commit.
6. M6 deploy.

Stop after step 3 and you still have a working, demoable game — speech is additive.

---

## Open questions before coding

1. **Scaffold in place vs. subfolder** — `npm create vite@latest .` into the non-empty repo (LICENSE, README, .gitignore, docs) is interactive/non-deterministic and contradicts the architecture's subfolder approach. Decide: scaffold to a temp dir and copy in, OR use a subfolder, OR pre-confirm create-vite preserves README/.gitignore.
2. **Tests (strongly recommended)** — add Vitest unit tests for `lib/`: `detectWords`/`detectWordsWithAliases` (alias false-positives, `CI/CD`, dedupe casing), `checkForBingo` (all 12 lines incl. diagonals through free space), `cardGenerator` (24 unique + free space). The detection edge cases above are the riskiest place to skip tests.
3. **Scope** — should I build through the full MVP (M1–M5) or stop at the manual-play checkpoint (M3) for review first?
4. **Timeline reconciliation** — map M0–M6 to the PRD's 90-minute phases and state whether the 90-min target is still a goal or formally relaxed (tests + M5/M6 will exceed it).
5. **Category source of truth** — declare the architecture `categories.ts` authoritative over PRD §4.2; confirm each pack has 40+ unique words (US-1.2).
6. **Manual unfill (US-3.1)** — define toggle behavior; specify whether auto-filled squares can be un-toggled; ensure unfill updates `filledCount` + `alreadyFilled` + re-checks bingo.
7. **Card preview / regenerate-before-start (US-1.3)** — add a preview step (UXR Scene 5) or document that in-game "New Card" satisfies regeneration.
