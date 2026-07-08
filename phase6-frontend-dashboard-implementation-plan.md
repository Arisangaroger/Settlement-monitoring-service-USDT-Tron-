# Implementation Plan — Phase 6: Frontend / Dashboard

## Purpose of This Phase

Everything hard is already done. By this point, correct data flows in automatically (Phase 3), is safely deduplicated across two paths (Phase 5), and is exposed through a documented, tested REST API (Phase 4). This phase is purely about **presentation** — turning already-correct data into something clean, readable, and pleasant to look at. Because this is the lowest-risk, most "known quantity" part of the whole project, the main danger here isn't technical difficulty — it's spending disproportionate time polishing visuals at the expense of the backend work that's actually being graded more heavily ("Backend Engineering," "Blockchain Integration," "Database Design" are explicit evaluation criteria; the dashboard just needs to be "clean and responsive").

**Definition of done for this phase:** a working, responsive dashboard that correctly displays live data from your Phase 4 API — summary stats, a transaction list with filtering, and a search function — built against the real, already-stable API contract, not mocked data.

---

## Sub-feature 6.1 — Project Scaffolding & API Client Setup

**Goal:** Stand up the frontend project and establish one clean way of talking to your backend.

Tasks:
- [ ] Initialize a Next.js (or plain React) project, TypeScript enabled.
- [ ] Set up a small typed API client module (e.g., using `fetch` or `axios`) with functions like `getTransactions(params)`, `getTransactionById(id)`, `searchByHash(hash)`, `getStats()` — mirroring the DTOs you defined on the backend in Phase 4.
- [ ] Point this client at your backend's base URL via an environment variable (`NEXT_PUBLIC_API_URL` or similar), not hardcoded — add it to the frontend's own `.env.example`.
- [ ] Confirm a basic "hello world" page can successfully call `getStats()` and log the real response before building any actual UI — this is the frontend equivalent of Phase 3's "verify the connection before building logic" principle.

**Acceptance criteria:** A running frontend project that successfully fetches and logs real data from your live backend API.

---

## Sub-feature 6.2 — Layout & Design Foundation

**Goal:** Establish a clean, consistent visual foundation before building individual components, so you're not restyling everything repeatedly.

Tasks:
- [ ] Choose a simple, consistent approach to styling (Tailwind CSS is a strong default choice here — fast to build with, keeps things visually consistent without needing a full design system).
- [ ] Build a basic page layout: header/title, main content area, consistent spacing and typography.
- [ ] Establish a small set of reusable primitives you'll need repeatedly: a card container, a status badge, a simple table/list wrapper — build these once, use them everywhere, rather than styling each screen independently.
- [ ] Decide on a simple, professional color palette (e.g., neutral background, one accent color, clear green/amber for confirmed/pending states) — this alone makes a huge visual difference for relatively little effort.

**Acceptance criteria:** A consistent-looking shell (header + layout + a couple of reusable styled primitives) ready to hold real content.

---

## Sub-feature 6.3 — Summary Stats Cards

**Goal:** Implement the four required top-level metrics.

Tasks:
- [ ] Build a `StatsCard` component (label, value, optional icon/accent color) and render four of them: Total Transactions, Total USDT Received, Confirmed Transactions, Pending Transactions.
- [ ] Wire this to your `getStats()` API call.
- [ ] Format the USDT amount clearly (e.g., thousands separators, fixed decimal places) — raw unformatted numbers look unpolished and are an easy, cheap win.
- [ ] Add a loading state (e.g., skeleton placeholders) for these cards while the initial fetch is in flight, rather than a blank flash or layout shift.

**Acceptance criteria:** Four stat cards showing real, correctly formatted numbers that match what you manually verified against the database in Phase 4.

---

## Sub-feature 6.4 — Recent / Full Transactions Table

**Goal:** Implement the core data table showing individual transactions.

Tasks:
- [ ] Build a `TransactionsTable` component with columns: transaction hash (truncated, e.g., `TXa1b2...c3d4`, with a copy-to-clipboard button — full hashes are long and not useful to display in full inline), amount + token symbol, status badge (confirmed/pending, color-coded), block number, timestamp (formatted as relative or readable absolute time).
- [ ] Wire it to your paginated `getTransactions()` endpoint.
- [ ] Implement pagination controls (next/previous or page numbers) matching whatever pagination strategy you built on the backend in Phase 4.
- [ ] Add a sensible empty state ("No transactions yet") for when the monitored wallet hasn't received anything.

**Acceptance criteria:** A table correctly displaying real, paginated transaction data, with properly formatted and readable values in every column.

---

## Sub-feature 6.5 — Filtering (Confirmed / Pending)

**Goal:** Let users narrow the transaction list by status, per the dashboard's implied use case (a settlement monitor needs to answer "what's still pending?" quickly).

Tasks:
- [ ] Add a simple filter control (tabs or a dropdown: All / Confirmed / Pending) above the transactions table.
- [ ] Wire the selected filter into the `status` query parameter on `getTransactions()`.
- [ ] Ensure changing the filter resets pagination back to page 1 (a common, easy-to-miss bug — filtering to page 1 of a new result set while stuck on page 5 looks broken).
- [ ] Reflect the active filter clearly in the UI (visually distinct active tab/selected state).

**Acceptance criteria:** Switching filters correctly updates the displayed transactions and resets pagination, using the same backend filtering you already built and tested in Phase 4.

---

## Sub-feature 6.6 — Search by Transaction Hash

**Goal:** Implement a simple UI for the required hash-search functionality.

Tasks:
- [ ] Add a search input (with a clear placeholder, e.g., "Search by transaction hash").
- [ ] Wire it to your `searchByHash()` API call, showing either the matched transaction or a clear "not found" message.
- [ ] Add basic input validation matching your backend's expected hash format, giving immediate feedback for obviously malformed input rather than waiting on a round-trip to the server.
- [ ] Consider debouncing the search input if you want live-as-you-type search, or keep it simple with an explicit search button/enter-to-submit — either is fine; pick the simpler one unless you have time to spare.

**Acceptance criteria:** Searching a real transaction hash from your data returns and displays that transaction; searching a nonexistent hash shows a clear, non-broken "not found" state.

---

## Sub-feature 6.7 — Data Freshness Strategy

**Goal:** Decide, deliberately, how "live" the dashboard should feel, given your backend's actual update cadence (12-second confirmation updates, 5-minute reconciliation, near-instant webhook).

Tasks:
- [ ] Implement a periodic refetch (e.g., re-poll `getStats()` and the current transaction list every 15–30 seconds) so the dashboard reflects backend updates without requiring a manual page reload — a reasonable, simple choice given your confirmation-updater job runs every 12 seconds.
- [ ] Alternatively/additionally, add a manual "Refresh" button for on-demand updates.
- [ ] Avoid over-engineering this with something like WebSockets/live push for this assessment's scope — a simple interval-based refetch is proportionate to the problem and easy to justify ("the dashboard refreshes every N seconds, which comfortably matches the backend's own update cadence").

**Acceptance criteria:** The dashboard visibly updates on its own (e.g., a pending transaction's status flips to confirmed on screen) without a manual page reload, within a reasonable time window.

---

## Sub-feature 6.8 — Loading & Error States (Throughout)

**Goal:** Make sure the dashboard never looks "broken" during normal operation — network hiccups, empty states, and slow responses should all be handled gracefully.

Tasks:
- [ ] Add loading indicators for every data-fetching component (stats cards, table, search) — consistent with the skeleton approach from 6.3.
- [ ] Add error states for failed API calls (e.g., "Unable to load transactions — please try again"), rather than a blank screen or unhandled console error.
- [ ] Test this deliberately by temporarily stopping the backend while the frontend is running, confirming the UI degrades gracefully rather than crashing.

**Acceptance criteria:** Every data-dependent part of the UI has a defined loading state, a defined error state, and a defined empty state — verified by deliberately triggering each one.

---

## Sub-feature 6.9 — Responsive Design Verification

**Goal:** Satisfy the assignment's explicit "clean and responsive" requirement, checked deliberately rather than assumed.

Tasks:
- [ ] Test the dashboard at common breakpoints (mobile ~375px, tablet ~768px, desktop) using browser dev tools' device emulation.
- [ ] Ensure the stats cards reflow into a single column (or two) on narrow screens rather than overflowing or shrinking illegibly.
- [ ] Ensure the transactions table either scrolls horizontally on small screens or switches to a stacked/card-based layout — a raw wide table squeezed onto a phone screen is a common, easily-avoided rough edge.
- [ ] Verify touch targets (buttons, pagination controls) are large enough to tap comfortably on mobile.

**Acceptance criteria:** The dashboard looks and functions cleanly at mobile, tablet, and desktop widths, checked directly rather than assumed to "probably be fine" because Tailwind is responsive by default.

---

## Sub-feature 6.10 — Basic Accessibility Pass

**Goal:** A small amount of effort here meaningfully improves perceived polish and code quality, at low cost.

Tasks:
- [ ] Ensure sufficient color contrast for status badges and text (don't rely on color alone to convey confirmed/pending — pair color with a text label, which you're already doing).
- [ ] Ensure interactive elements (buttons, filter tabs, pagination) are real semantic elements (`<button>`, not styled `<div>`s with click handlers) so they're keyboard-navigable by default.
- [ ] Add basic `alt`/`aria-label` attributes where appropriate (e.g., the copy-to-clipboard icon button).

**Acceptance criteria:** The dashboard is fully operable via keyboard alone (tab through filters, pagination, search) and passes a quick automated check (e.g., browser Lighthouse accessibility score).

---

## Sub-feature 6.11 — Component Tests (Bonus Coverage)

**Goal:** Extend the testing discipline from earlier phases to the frontend, where reasonable.

Tasks:
- [ ] Write a handful of component tests (e.g., React Testing Library) for the highest-value components: `StatsCard` renders correctly given props, `TransactionsTable` renders rows and empty state correctly, filter tabs update state correctly.
- [ ] Don't over-invest here relative to backend test coverage — a small, meaningful set of frontend tests is a fine bonus-points signal; exhaustive frontend testing isn't where this assessment's weight lies.

**Acceptance criteria:** A small, focused test suite covering the core presentational logic, not necessarily exhaustive UI coverage.

---

## Sub-feature 6.12 — Manual End-to-End Verification (Full Stack, Real Data)

**Goal:** Confirm the entire system — blockchain integration, database, backend jobs, APIs, and now the frontend — genuinely works together as one coherent product.

Tasks:
- [ ] With the full stack running (backend + frontend + Postgres, ideally already via Docker Compose at this point), send a real test transaction to your monitored wallet.
- [ ] Watch it appear in the dashboard (via the periodic refetch from 6.7) without any manual intervention: first as pending, then flipping to confirmed as the confirmation-updater job does its work.
- [ ] Verify the stats cards update correctly to reflect the new transaction.
- [ ] Verify searching for that transaction's hash successfully finds it.
- [ ] Verify the filter correctly shows/hides it based on its current status.

**Acceptance criteria:** A full, observed, real end-to-end demonstration — from a real testnet transaction to it appearing, updating, and being searchable on the dashboard — with nothing manually inserted or faked.

---

## Consolidated Output of Phase 6 (what you carry forward)

By the end of this phase you should have:
1. A working, responsive Next.js/React dashboard
2. Summary stats, transaction table, filtering, and search all wired to the real, already-tested Phase 4 API
3. Sensible loading/error/empty states throughout
4. Verified responsive behavior at mobile/tablet/desktop widths
5. A basic accessibility pass
6. A small frontend test suite
7. A full, observed, real end-to-end demonstration of the entire system working together

Only Phase 7 (Docker, docs, diagrams, final polish) remains after this.

---

## Suggested Order to Tackle These Sub-features

6.1 → 6.2 → 6.3 → 6.4 → 6.5 → 6.6 → 6.7 → 6.8 (ongoing alongside 6.3–6.6) → 6.9 → 6.10 → 6.11 → 6.12

As with logging/config in earlier phases, 6.8 (loading/error states) is best built incrementally alongside each component (6.3–6.6) rather than bolted on afterward — it's much easier to add a loading state while you're already inside a component than to retrofit it later across several components at once.
