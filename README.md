# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Mandatory development workflow (2026-11-09)

Read **[AGENTS.md](AGENTS.md)** and the official **[Integrated PR and isolated staging policy](docs/DEVELOPMENT_WORKFLOW.md)** before changing code. Each PR must extend the complete existing app, be synchronized with current `main`, and use a separate testing environment for all writes, Auth, databases and external side effects. A preview that writes to production is **not safe for functional testing**. Test old and new authenticated/mobile/desktop flows together, maintain an append-only SU log, and obtain owner approval before merging. This documentation records the target process; it does **not** claim staging has been provisioned.

**Feature architecture:** [purpose, ownership, independence and dependency register](docs/FEATURE_ARCHITECTURE.md). Unreviewed entries remain SOURCE-AUDIT-PENDING.
