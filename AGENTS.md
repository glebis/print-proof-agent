# AGENTS.md — PrintProof

Guidance for AI coding agents working in this repository.

## What this is

PrintProof is a proofreading agent for a print shop, built on the Claude Agent SDK. It optimizes for the **reviewing human**, not for co-authoring: every edit carries provenance, every action explains its consequences before the click, nothing reaches print without explicit manager acceptance. Read `README.md` for the full picture and `docs/` for the design doc.

## Architecture invariants (do not break)

- **Cascade order:** normalize → estimate → rule-pass → llm-pass → vision-pass → resolver → human review → export. Each pass is isolated; categories live in data (`edits.category`), not as runtime subagents.
- **Immutable spans.** All edit `span_start/end` are coordinates in one immutable base revision. Export assembles the final text with a cursor over sorted accepted edits (`src/lib/export.ts`). NEVER apply edits one-by-one with offset recomputation.
- **LLM never computes offsets.** `llm-pass` returns the fragment + context; `parseAndLocate` finds the position in code. Hallucinated fragments are dropped.
- **Vision gives `block_hint`, not pixel-exact coordinates.** For PDFs, bbox is refined via `pdf-anchors.ts` (snap-to-text on the text layer). Page numbers are set authoritatively in code, not trusted from the model.
- **Subscription, not API key.** Agent SDK calls strip `ANTHROPIC_API_KEY` from env (`cleanEnv`) so they use the Claude Code subscription.
- **Guardrails.** Export is blocked (HTTP 409) until every edit is decided; only `accepted` edits apply; `original` is verified against the base text before export.

## Where things live

- `src/agent/` — cascade logic (rules, proofread, layout-inspect, resolver, auto-accept, pdf-anchors, check) + profile-chat agent
- `src/lib/` — pure, unit-tested business logic. Prefer adding a tested function here over inlining logic in a route.
- `src/app/api/` — thin route handlers; enforce ACL via `lib/auth.ts` (`getCurrentUser` + `can`)
- `scripts/run-check.ts` — cascade worker (spawned so SDK calls don't block the Next.js event loop)

## Working style

- **TDD.** Every feature: write a failing test in `tests/`, implement the pure function in `src/lib/`, then wire it in. Run `npm test` (vitest) from the app directory.
- **Verify in the browser.** Use the `browser-mate`/agent-browser flow against http://localhost:3742; confirm zero JS console errors.
- **Russian UI.** All user-facing copy is Russian. Code identifiers and comments may be either, matching surrounding code.
- **Tufte design tokens.** Warm `#fffff8`, EB Garamond for text, Monaspace Argon for figures, thin rules, no dark slabs. Edit suggestions use `#c45a28`; accept green `#2a7a3a`, reject/important red `#a02a2a`, pending amber `#c89000`.

## Don't

- Don't add API-key handling to the cascade — it's subscription-based by design.
- Don't let a route mutate edits without going through `lib/` helpers (`applySuggestionChange`, `resolveEdits`, `applyAcceptedEdits`).
- Don't trust vision page numbers or bbox coordinates without the snap-to-text path for PDFs.
