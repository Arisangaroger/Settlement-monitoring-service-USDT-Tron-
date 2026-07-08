# Implementation Plan — Phase 7: Docker, Docs, Diagrams, Polish

## Purpose of This Phase

Every functional piece of the system already exists and works by the end of Phase 6. This final phase is about **making that work legible, reproducible, and trustworthy to someone who has never seen your code before** — the evaluator. A technically excellent system that's hard to run, undocumented, or messy will score worse than a slightly simpler system that's a joy to review. This phase is where "Documentation" (an explicit evaluation criterion) and overall polish get earned.

**Definition of done for this phase:** a complete stranger could clone your repository, follow only the README, run one command, and get the entire system running end-to-end — backend, frontend, and database — with zero prior context, and every required deliverable (diagrams, ERD, API docs, `.env.example`) present and accurate.

---

## Sub-feature 7.1 — Backend Dockerfile

**Goal:** Containerize the backend cleanly and efficiently.

Tasks:
- [ ] Write a multi-stage Dockerfile: a build stage (installs dependencies, compiles TypeScript) and a slim runtime stage (only production dependencies and compiled output) — this keeps the final image smaller and avoids shipping dev tooling/source maps unnecessarily.
- [ ] Ensure the container runs database migrations automatically on startup (or via a documented separate step) so a fresh environment doesn't require manual migration commands.
- [ ] Use a `.dockerignore` file to exclude `node_modules`, `.env`, logs, and test artifacts from the build context.
- [ ] Confirm the container respects environment variables for all config (DB connection, API keys, intervals) rather than baking any values in at build time.

**Acceptance criteria:** `docker build` succeeds, and the resulting container starts, connects to a database, and runs correctly when given the right environment variables.

---

## Sub-feature 7.2 — Frontend Dockerfile

**Goal:** Containerize the dashboard.

Tasks:
- [ ] Write a multi-stage Dockerfile for the Next.js/React app: build stage produces the production build, runtime stage serves it.
- [ ] Ensure the frontend's API base URL is configurable via environment variable at build or runtime (Next.js has specific handling for public env vars — confirm you're using the correct mechanism so this isn't accidentally baked in incorrectly).
- [ ] Add a `.dockerignore` for the frontend project too.

**Acceptance criteria:** `docker build` succeeds for the frontend, and the resulting container serves a working dashboard that correctly points at the backend URL provided via environment variable.

---

## Sub-feature 7.3 — Docker Compose Orchestration

**Goal:** Tie everything together into the single-command setup that's explicitly expected.

Tasks:
- [ ] Write `docker-compose.yml` defining: PostgreSQL service (with a named volume for data persistence), backend service (depends on Postgres being healthy, not just started), frontend service (depends on backend).
- [ ] Add healthchecks for Postgres and the backend so `depends_on` conditions actually wait for readiness, not just container start — a very common source of "works on my machine, fails in fresh clone" bugs.
- [ ] Wire all environment variables through from a root `.env` file (which the evaluator creates by copying `.env.example`).
- [ ] Expose only the necessary ports (backend API port, frontend port) — don't unnecessarily expose the Postgres port to the host unless useful for the evaluator to inspect data directly (arguably worth exposing it for exactly that reason — document the trade-off).
- [ ] Test the entire stack from a completely clean state: `docker compose down -v` (removing volumes) followed by `docker compose up --build`, confirming everything comes up correctly with no manual steps.

**Acceptance criteria:** A single `docker compose up` command (after copying `.env.example` to `.env`) brings up the entire working system from nothing.

---

## Sub-feature 7.4 — Final `.env.example` Consolidation

**Goal:** Make sure this file — assembled incrementally across every previous phase — is complete, accurate, and self-explanatory.

Tasks:
- [ ] Go through every phase's plan and cross-check that every environment variable introduced (DB connection, TronGrid API key, tatum webhook secret, monitored wallet address, USDT contract address, reconciliation/confirmation intervals, confirmation threshold, frontend API URL, CORS origin, rate limit config) is present.
- [ ] Add a short inline comment above each variable explaining what it's for and, where relevant, a sensible example/default value.
- [ ] Double-check no real secrets (actual API keys) are accidentally left in this file — only placeholders.
- [ ] Confirm this file is committed to the repo, while the real `.env` is git-ignored.

**Acceptance criteria:** `.env.example` alone is enough for someone to understand exactly what configuration the system needs and why, without reading source code.

---

## Sub-feature 7.5 — README

**Goal:** Write the single document an evaluator will read first and most closely — treat it as the front door to your entire submission.

Tasks:
- [ ] **Project overview**: 2–3 sentence plain-English summary of what the system does (borrow from your concept note's executive summary).
- [ ] **Architecture summary**: brief description of the hybrid webhook + polling design, with the architecture diagram embedded.
- [ ] **Setup instructions**: exact, copy-pasteable steps — clone repo, copy `.env.example` to `.env` (and fill in required values, listing which ones are truly required vs. optional/for the webhook enhancement), `docker compose up --build`, how to access the dashboard and the Swagger docs (with exact URLs/ports).
- [ ] **How to test it's working**: a short "smoke test" section — e.g., how to trigger a test transaction on Shasta testnet and where to watch it appear (logs, dashboard).
- [ ] **Design decisions & trade-offs**: a section explicitly walking through the key decisions made across all phases (numeric vs float, unique constraint dedup, hybrid webhook+polling, chosen intervals and why, confirmation threshold and why) — this doubles as your prep notes for the live technical discussion.
- [ ] **Known limitations / future improvements**: explicitly list things intentionally out of scope (single-wallet only, no outgoing transaction support) and how the design would extend to handle them (referencing the `monitoring_wallets` table's forward-looking design) — being upfront about scope boundaries reads as maturity, not weakness.
- [ ] **Testing**: how to run the automated test suites (backend and frontend).
- [ ] **Bonus features implemented**: an explicit checklist of which bonus items you completed (WalletConnect, background jobs, confirmation tracking, logging, unit/integration tests, CI/CD) so the evaluator doesn't have to hunt for them.

**Acceptance criteria:** A README that could be handed to someone with zero context and result in them successfully running the full system and understanding your key decisions, without needing to ask you anything first.

---

## Sub-feature 7.6 — Architecture Diagram (Final, Polished Version)

**Goal:** Produce a clean, presentation-quality version of the diagram sketched in your concept note.

Tasks:
- [ ] Recreate the architecture diagram using a proper diagramming tool (e.g., draw.io/diagrams.net, Excalidraw, or Mermaid if you want it to live as versioned text alongside your code) rather than leaving it as ASCII art.
- [ ] Ensure it clearly shows: TRON blockchain → TronGrid (polling) and QuickNode (webhook) → shared ingestion service → PostgreSQL → REST API → Dashboard, with the two background jobs (reconciliation, confirmation updater) clearly annotated with their intervals.
- [ ] Export as an image (PNG/SVG) and embed it directly in the README, plus save the source file in a `/docs` folder in case you need to edit it later.

**Acceptance criteria:** A single, clear, professional-looking diagram image that accurately reflects the real, final system — cross-checked against the actual code, not the original plan (things may have shifted slightly during implementation).

---

## Sub-feature 7.7 — ERD Finalization

**Goal:** Confirm the ERD produced in Phase 2 still accurately reflects the schema as it actually ended up.

Tasks:
- [ ] Re-generate or manually verify the ERD against the final, real migration files — schemas sometimes drift slightly during implementation (an added column, a renamed field); make sure the diagram reflects reality.
- [ ] Export as an image and embed/link it in the README and/or a `/docs` folder.

**Acceptance criteria:** The ERD, opened side-by-side with your actual database schema, matches exactly.

---

## Sub-feature 7.8 — API Documentation Finalization

**Goal:** Confirm the Swagger/OpenAPI docs (built in Phase 4) are complete and polished as a final deliverable.

Tasks:
- [ ] Do a final pass through `/docs`, checking every endpoint has a clear description, accurate example values, and documented error responses.
- [ ] Optionally export the raw OpenAPI JSON/YAML spec as a file in the repo (`/docs/openapi.json`) — some evaluators prefer reviewing a static file over needing to run the app first.
- [ ] Link directly to the Swagger UI URL from the README.

**Acceptance criteria:** Anyone can access complete, accurate, interactive API documentation within seconds of getting the system running.

---

## Sub-feature 7.9 — CI/CD Pipeline (Bonus)

**Goal:** Demonstrate automated quality gates, per the bonus feature list.

Tasks:
- [ ] Set up a GitHub Actions workflow that runs on every push/PR: install dependencies, run linter, run backend test suite, run frontend test suite, and attempt a Docker build.
- [ ] Keep it simple and reliable — a working, simple pipeline is far better than an ambitious one that's flaky or half-finished.
- [ ] Add a status badge to the top of the README so the evaluator sees at a glance that checks are passing.

**Acceptance criteria:** A green CI run visible in the repo's Actions tab, triggered by your actual commits, not a one-off manual run.

---

## Sub-feature 7.10 — Logging & Monitoring Finalization (Bonus)

**Goal:** Make sure the logging groundwork laid in Phase 3 reads as a deliberate, documented feature, not an incidental side effect.

Tasks:
- [ ] Confirm log levels and formats are consistent across the whole backend (jobs, ingestion, API, webhook).
- [ ] Ensure the `/api/health` endpoint (mentioned in your concept note) is actually implemented, returning basic status (DB connectivity, last successful job run times) — a small addition that meaningfully demonstrates production-mindedness.
- [ ] Briefly document, in the README, what's logged and where (stdout/container logs, viewable via `docker compose logs backend`).

**Acceptance criteria:** An evaluator running `docker compose logs -f backend` sees a clear, readable operational story of the system working.

---

## Sub-feature 7.11 — Code Quality Pass

**Goal:** A final, deliberate cleanup pass — this is explicitly graded ("Code Quality") and easy to under-invest in after the functional work feels "done."

Tasks:
- [ ] Run a linter/formatter (ESLint + Prettier) across the whole codebase and fix all warnings, not just errors.
- [ ] Remove dead code, leftover `console.log` debugging statements, commented-out old attempts, and any remaining references to the disposable Phase 1 PoC script.
- [ ] Confirm consistent naming conventions across backend and frontend (e.g., consistently `camelCase` in TS, consistent file/folder naming).
- [ ] Do a final read-through of the `IngestionService`, jobs, and webhook controller specifically — these are the pieces most likely to be scrutinized closely, so they deserve one more careful pass.
- [ ] Remove any test/temporary API keys, wallet addresses, or credentials from the codebase and git history if they were ever accidentally committed.

**Acceptance criteria:** A clean `git diff`-worthy codebase with no linter warnings, no dead code, and no leftover debugging artifacts.

---

## Sub-feature 7.12 — Security Review Pass

**Goal:** Walk through your own security checklist (from Phase 4 Sub-feature 4.9 and your concept note) one final time, holistically.

Tasks:
- [ ] Confirm no secrets exist anywhere in the committed codebase or git history.
- [ ] Confirm rate limiting, CORS, and security headers are active in the final Docker-run version (not just in local dev, where they might have been temporarily disabled for convenience).
- [ ] Confirm the webhook signature validation is genuinely enforced (not accidentally left in a "testing bypass" state from Phase 5 development).
- [ ] Confirm the database user used by the app doesn't have unnecessary superuser privileges in the Docker Compose Postgres setup.

**Acceptance criteria:** A short written confirmation, ideally with each item explicitly re-tested (not just visually inspected), that every security measure designed earlier is actually active in the final build.

---

## Sub-feature 7.13 — Fresh-Clone Test ("The Evaluator Experience")

**Goal:** The single most valuable thing you can do in this entire phase — actually simulate being the evaluator.

Tasks:
- [ ] Clone your own repository into a completely new, empty directory (or ideally, have a friend/colleague do this, since you have context they won't).
- [ ] Follow your own README exactly, doing nothing you "just happen to know" from having built it.
- [ ] Note every point of friction, ambiguity, or missing instruction, and fix them.
- [ ] Confirm the smoke test (sending a test transaction and watching it appear) works exactly as documented.

**Acceptance criteria:** A successful, friction-free run-through of your own setup instructions from a genuinely clean state, with any rough edges found and fixed.

---

## Sub-feature 7.14 — Technical Discussion Prep Document

**Goal:** Consolidate everything you'll need to speak to confidently in the live technical discussion, so you're not reconstructing your own reasoning under pressure.

Tasks:
- [ ] Compile a single prep document (can live in `/docs/technical-discussion-notes.md`, not necessarily shown to the evaluator) pulling together the "design rationale" and "anticipated discussion points" sections written across every phase's plan: schema decisions, hybrid architecture reasoning, interval choices, confirmation threshold reasoning, dedup/race-condition handling, security measures, and scalability story (multi-wallet extension via `monitoring_wallets`).
- [ ] Rehearse explaining each one out loud, briefly, as if asked cold.

**Acceptance criteria:** You can explain every non-obvious decision in the system fluently, without needing to re-read your own code first.

---

## Sub-feature 7.15 — Final Submission Checklist

**Goal:** One last pass against the assignment's literal deliverables list, to make sure nothing is missing.

Tasks:
- [ ] Source code — committed, pushed, repository access confirmed working (not private/inaccessible to the evaluator).
- [ ] README with setup instructions — present, tested via 7.13.
- [ ] Architecture diagram — present, accurate, embedded.
- [ ] ERD — present, accurate, embedded.
- [ ] API documentation — present, accessible, complete.
- [ ] Docker configuration — present, tested via 7.13.
- [ ] `.env.example` — present, complete, accurate.
- [ ] Bonus features actually implemented — listed clearly in the README, not just implied.

**Acceptance criteria:** Every single item on the assignment's original deliverables list is checked off, present, and verified working — not assumed.

---

## Consolidated Output of Phase 7 (Final Deliverable)

By the end of this phase, your repository is genuinely submission-ready:
1. Fully containerized, single-command setup, tested from a clean state
2. Complete `.env.example`
3. A README that stands entirely on its own
4. Polished, accurate architecture diagram and ERD
5. Complete, accessible API documentation
6. (Bonus) working CI/CD pipeline with visible passing status
7. (Bonus) demonstrable logging/monitoring
8. A clean, linted, dead-code-free codebase
9. A re-verified security checklist
10. Personal readiness for the live technical discussion

---

## Suggested Order to Tackle These Sub-features

7.1 → 7.2 → 7.3 → 7.4 → 7.13 (early fresh-clone test, to catch Docker/setup issues while still fresh) → 7.5 → 7.6 → 7.7 → 7.8 → 7.9 → 7.10 → 7.11 → 7.12 → 7.13 (again, final pass) → 7.14 → 7.15

Note the fresh-clone test (7.13) deliberately appears twice: once early, right after Docker Compose is working, to catch fundamental setup problems while you still have time to fix them — and once again at the very end, as the final quality gate before submission.
