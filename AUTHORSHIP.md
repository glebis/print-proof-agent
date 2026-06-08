# Authorship

*Last updated: 2026-06-08*

## Human Author

**Gleb Kalinin** (Berlin, Germany) — Architecture, design, product decisions, and creative direction.
Contact: glebis@gmail.com

All architectural decisions, data models, API interfaces, component hierarchies, UX patterns, design system, and system integration choices are human-authored. This includes:

- Technology stack selection (Next.js 15, TypeScript, SQLite, Claude Agent SDK, Vercel AI SDK)
- Application architecture and module boundaries — the **B-lite cascade** (normalize → estimate → rule-pass → llm-pass → vision-pass → resolver → human review) chosen over a parallel-subagent design after an external architecture audit
- The core product principle: **optimize for the reviewing human, not for co-authoring** — every edit carries provenance (which module produced it, on what basis, with what confidence), and every action explains its consequences before the click
- Database schema and query patterns (better-sqlite3 for embedded simplicity)
- The immutable-revision span model and cursor-based export (edits anchor to one base revision; never re-applied one-by-one with offset recomputation)
- snap-to-text bbox refinement using the PDF text layer's exact geometry instead of trusting vision-model coordinates
- Role-based access control hierarchy (admin/manager/client/designer) and capability scoping
- Client profiles as deterministic rules + style prompt + few-shot examples, editable both via chat and direct form
- UI/UX design (Tufte-inspired: EB Garamond, Monaspace for figures, thin rules, provenance tooltips)
- All product and feature decisions, and the JTBD framing behind them

## AI Implementation

Code implementation was assisted by **Claude** (Anthropic) and reviewed with **Codex** (OpenAI). The AI generated syntax, function bodies, and boilerplate under human architectural direction and iterative review.

The human author provided:
- Architectural specifications before code generation (design doc in `docs/`, JTBD brief)
- Codebase constraints that shaped all output (`AGENTS.md`, design-system rules, the reviewing-human UX principle)
- Iterative review, rejection, and refinement of AI-generated UX, interactions, and code
- All debugging and integration decisions, and the test-driven-development discipline that gates every feature

Development session logs (Claude Code and Codex transcripts) are retained locally as contemporaneous evidence of the creative direction process.

## Copyright Notice

Architecture and design copyright (c) 2026-present Gleb Kalinin.
Implementation was assisted by Claude (Anthropic) and reviewed with Codex (OpenAI) under human direction, review, and integration. Provider output terms are not treated as a substitute for source provenance, license compatibility review, or human authorship documentation.

## AI Provider Output Terms

PrintProof's release posture does not rely on provider terms alone, but the project records the relevant output-rights claims for transparency:

- Anthropic states that its Commercial Terms let customers `"retain ownership rights"` over generated outputs: https://www.anthropic.com/news/expanded-legal-protections-api-improvements
- OpenAI states that, as between the user and OpenAI and to the extent permitted by law, users `"own the Output"`: https://openai.com/policies/row-terms-of-use/

These terms support commercial use of assisted implementation output, but they do not eliminate the need for human authorship, provenance review, dependency-license review, or checks for copied public code.

## Cloud API Providers

This application connects to Anthropic's Claude (via the Claude Agent SDK) for the LLM and vision proofreading passes. The pilot runs the SDK under a Claude Code subscription with `ANTHROPIC_API_KEY` unset; a production deployment would use an API key. No customer text leaves the machine except to Anthropic for the proofreading passes.

## Why This File Exists

Copyright protection for AI-assisted works depends on human authorship and jurisdiction-specific originality standards. This file documents the human creative process behind PrintProof so that the project can distinguish human architecture, selection, arrangement, and review from machine-assisted implementation details.
