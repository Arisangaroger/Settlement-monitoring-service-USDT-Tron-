# Implementation Plan — Phase 1: Blockchain Integration (Proof of Concept)

## Purpose of This Phase

Before writing any database code, API code, or frontend code, this phase exists purely to answer one question with certainty: **"What does real TRON/TRC20 transaction data actually look like, and how do I reliably fetch it?"**

Everything downstream (schema design, dedup logic, confirmation tracking) depends on facts discovered here, not assumptions. Nothing built in this phase is meant to be production code — it's disposable, throwaway scripts whose only output is *knowledge* and a few saved sample JSON responses you'll refer back to later.

**Definition of done for this whole phase:** you can run a script that, given a TRON wallet address, prints a clean list of real incoming USDT (TRC20) transfers with correct amounts, hashes, timestamps, block numbers, and confirmation counts — and you understand every field in that output.

---

## Sub-feature 1.1 — Environment & Account Setup

**Goal:** Get access to TRON network data before writing any logic.

Tasks:
- [ ] Decide: mainnet vs. testnet ( Nile) for experimentation. Recommendation: use **Nile testnet** for the PoC — free test TRX/USDT-equivalent tokens, no real money at risk, and you can generate your own test transactions on demand instead of waiting for real activity on a mainnet address.
- [ ] Create a TronGrid account and generate an API key (needed to avoid aggressive public rate limits).
- [ ] Create a QuickNode account as well (since Phase 5 will need it) — free tier is enough for now, just to note the endpoint URL for later.
- [ ] Initialize a throwaway Node.js + TypeScript project (`poc/` folder, separate from the eventual real backend) with a simple `tsconfig.json` and `ts-node` for quick iteration.
- [ ] Install `axios` (or native `fetch`) for HTTP calls. Decide whether to also try the `tronweb` library later for comparison — start with raw HTTP first so you *see* the raw shape of the data, unfiltered by any library's abstractions.
- [ ] Store API keys in a `.env` file in this throwaway project too (good habit to start immediately, even for scratch code).

**Acceptance criteria:** You can make one successful authenticated request to TronGrid and get back *any* valid JSON response (e.g., latest block info) without errors.

---

## Sub-feature 1.2 — Fetch Account/Wallet Activity

**Goal:** Confirm you can query a specific wallet address and get its transaction history.

Tasks:
- [ ] Pick or create a test wallet address on Nile testnet.
- [ ] Send yourself a small amount of test USDT (or the testnet's TRC20 test token) to that address using a TRON testnet faucet + wallet (e.g., TronLink browser extension in testnet mode), so you have at least one real transaction to detect.
- [ ] Call TronGrid's endpoint for TRC20 transaction history for that address (the "get TRC20 transactions by account address" endpoint).
- [ ] Print the raw, unmodified JSON response to console and save one example response to a file (e.g., `sample-responses/trc20-transfer-raw.json`) — this becomes your reference document for schema design later.

**Acceptance criteria:** You have a saved real JSON sample of at least one actual TRC20 transfer response.

---

## Sub-feature 1.3 — Understand & Document Every Field

**Goal:** Don't just see the data — understand it precisely enough to design a database schema around it.

Tasks:
- [ ] Identify which field is the transaction hash.
- [ ] Identify sender and recipient address fields, and confirm their format (TRON base58 "T..." format vs. hex format — TronGrid sometimes returns both; decide which one you'll standardize on for storage).
- [ ] Identify the raw token amount field and the token's `decimals` value — TRC20 amounts are returned as raw integers (e.g., `1000000` might mean `1.000000` USDT if decimals = 6). Write a small conversion function and verify it produces the correct human-readable amount by cross-checking against a block explorer (e.g., Tronscan) for the same transaction.
- [ ] Identify the block number field.
- [ ] Identify the timestamp field and confirm its unit (milliseconds vs. seconds) and timezone (should be UTC) by cross-checking against Tronscan's displayed time for the same transaction.
- [ ] Identify the token contract address field, and confirm how you'd distinguish "real USDT" from other TRC20 tokens (matching against the known official USDT-TRC20 contract address, since anyone can create a token that copies the "USDT" symbol — this is actually a security-relevant finding worth writing down).
- [ ] Determine whether the response tells you confirmation status directly, or whether you need to compute it yourself.

**Acceptance criteria:** You have a short written glossary (a markdown table is fine) mapping every raw field name to its meaning, unit, and format — this becomes direct input into your ERD in Phase 2.

---

## Sub-feature 1.4 — Confirmation Counting Logic

**Goal:** Work out exactly how "confirmations" will be computed and when a transaction should flip from pending to confirmed.

Tasks:
- [ ] Fetch the current "latest block number" from TronGrid (a separate, simple endpoint).
- [ ] Compute `confirmations = latest_block_number - transaction_block_number`.
- [ ] Research (via TRON docs or reputable sources) what confirmation count is generally treated as "final" for TRON — note this as a documented assumption with reasoning (e.g., "TRON's DPoS consensus finalizes quickly; N confirmations is commonly used as a safe threshold because...").
- [ ] Write a tiny script that, given a transaction hash, prints its current confirmation count live, and re-run it a few times over a couple of minutes to *watch* the number increase — this builds real intuition rather than just theoretical understanding.

**Acceptance criteria:** You can explain, with a concrete example from your own testing, exactly how a transaction's confirmation count is derived and at what count you'd mark it "confirmed."

---

## Sub-feature 1.5 — Handling Pagination & Incremental Fetching

**Goal:** Understand how to avoid re-fetching the same old transactions every time you poll (relevant directly to your Phase 3 reconciliation job).

Tasks:
- [ ] Check whether TronGrid's response includes a pagination cursor/fingerprint or a "next page" mechanism.
- [ ] Test fetching "transactions after block X" or "transactions after timestamp Y" — confirm which filtering parameters the API actually supports.
- [ ] Decide on your incremental-fetch strategy for later: e.g., "store the last-seen block number per wallet, and each poll only asks for transactions after that block."

**Acceptance criteria:** You've documented (in a short note) exactly which query parameters you'll use in Phase 3 to fetch only new transactions, not the entire history every time.

---

## Sub-feature 1.6 — Rate Limits & Error Handling Discovery

**Goal:** Know the failure modes now, not while debugging production code later.

Tasks:
- [ ] Deliberately send a burst of rapid requests and observe what TronGrid returns when rate-limited (status code, error body shape).
- [ ] Test an invalid/malformed wallet address and observe the error response shape.
- [ ] Note the rate limit numbers for your API key tier (requests/second or /day) — this directly justifies your 5-minute reconciliation interval decision (you can literally calculate "at this interval, we use X% of our rate limit budget").

**Acceptance criteria:** A short written note listing: rate limit numbers, one example rate-limit error response, and one example invalid-input error response.

---

## Sub-feature 1.7 — Webhook Payload Shape (Prep for Phase 5)

**Goal:** While you're already deep in TronGrid/QuickNode docs, capture what a webhook payload will look like, even though you won't build the receiver until Phase 5.

Tasks:
- [ ] In the QuickNode dashboard, set up a test webhook (using their guided wizard) pointed at a temporary testing URL (e.g., webhook.site) rather than your own server.
- [ ] Trigger a test transaction on your Nile wallet and observe the actual payload QuickNode delivers.
- [ ] Save this sample payload alongside your TronGrid sample from 1.2, for comparison later.

**Acceptance criteria:** You have a saved real webhook payload sample, so Phase 5 starts from real data instead of guesses too.

---

## Consolidated Output of Phase 1 (what you carry forward)

By the end of this phase you should have, sitting in your `poc/` folder:
1. `sample-responses/trc20-transfer-raw.json` — real TronGrid transaction response
2. `sample-responses/webhook-payload-raw.json` — real QuickNode webhook payload
3. A field glossary (markdown table) mapping raw fields → meaning/format — direct input to Phase 2's schema
4. Written notes on: confirmation-counting method, chosen "final" threshold with reasoning, pagination/incremental-fetch strategy, rate limit numbers, and error response shapes
5. A working (but disposable) script that: fetches TRC20 transfers for an address, correctly converts amounts using decimals, computes confirmations, and prints a clean structured summary

This consolidated output is what actually gets referenced when you write the real ingestion service in Phase 3 — so treat these notes as a real deliverable, not scratch work to throw away.

---

## Suggested Order to Tackle These Sub-features

1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7

This order matters: you need basic access (1.1) before you can fetch anything (1.2), you need to see real data (1.2) before you can understand its fields (1.3), and confirmation logic (1.4) and pagination (1.5) both depend on knowing the field shapes from 1.3. Rate limits (1.6) and webhook payload capture (1.7) are lowest-dependency and can be done last, even in parallel with starting Phase 2 if you're ahead of schedule.
