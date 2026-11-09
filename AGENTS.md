# forex-trade-companion — repository coding-agent instructions

> **MANDATORY per-feature documentation and code-comment rule (2026-11-09):** Read `docs/FEATURE_ARCHITECTURE.md` before touching a feature. Document its purpose, independent owner/boundaries, exact inbound and outbound dependencies, UI/API/database/state integrations, security contracts, tests, known limitations and safe handoff. Comment public/non-obvious code interfaces (why, contract, units, side effects and errors). Update impacted feature entries and downstream dependents **in the same PR**; missing/stale feature docs block merge. Never claim code is takeover-ready without a source audit. This supplements `docs/DEVELOPMENT_WORKFLOW.md`.


**Mandatory owner directive, November 9, 2026.** Read `docs/DEVELOPMENT_WORKFLOW.md` before any code change. This file and the project-specific source, diagrams, security/UX rules, open PRs, official docs and verified release state are required context.

1. Start from a verified working `main` (or explicitly stated stacked PR dependency). Never replace working app features with disconnected mock screens or a fresh rebuild.
2. Put every implementation on its own feature/fix branch and PR, linked to original code. Synchronize current `main` **into** the PR as needed; never push experimental code directly to production `main`.
3. The PR preview must operate as the **complete existing app plus changed features**, preserving navigation, auth, roles, shared components, browser/device responsiveness, data ownership and other established contracts.
4. **Hard staging isolation:** preview writes, test users, Auth, database, storage, Realtime, APIs/functions, billing, external messaging and background tasks use independent test environments/sandboxes where applicable. Never let a preview write production. If staging is missing, disable mutating preview actions and mark the PR blocked.
5. Run relevant source tests, build, lint/typecheck, RLS/permissions and integration tests, then verify real deployed authenticated flows and UI at phone/tablet/desktop widths. Test old and new features together. Record passing/failing/unverified checks separately.
6. Keep feature flags server-enforced, migrations additive/reversible, secrets private, personal data out of staging, and logs/audits truthful.
7. Update the existing project handoff and an **append-only chronological SU/issue/fix log**. If no log exists, create `docs/SU_LOG.md` and append entries, never erase history. Record branch, PR, preview URL/SHA, verified results, blockers and next task.
8. Do not merge until the owner approves the integrated preview and required checks. Retain a rollback path and verify after any eventual production deploy.

This document does **not** assert that staging infrastructure already exists. The mandatory detailed checklist and stop conditions are in `docs/DEVELOPMENT_WORKFLOW.md`.
