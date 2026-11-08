# AGENTS.md — Hijab ul Munnazah Growth System

## Context
- Brand: Hijab ul Munnazah — abaya & hijab store, Pakistan. Sales happen only on Instagram DM / WhatsApp. The website NEVER takes orders or payments.
- Source of truth: docs/PLAN_Social-Growth-System.md (what to build) and docs/ANTIGRAVITY_PLAYBOOK.md (how/order). Progress log: docs/PROGRESS.md.
- Owner writes in Roman Urdu. Customer-facing copy: Roman Urdu + English. Code, comments and commit messages: English.

## Hard rules (never break)
1. Official APIs only: Meta Graph API (Instagram, Messenger, Pages), WhatsApp Cloud API, TikTok Content Posting API. Never scrape social sites, never automate a logged-in browser on Facebook/Instagram/TikTok, never use bot-detection evasion (e.g. --disable-blink-features=AutomationControlled), never send unsolicited DMs, never collect phone numbers or emails from people who did not give them to us.
2. Messaging windows: reply only inside the platform's allowed windows (24-hour messaging window; one private reply per comment within 7 days). Outside them, do nothing and alert the owner.
3. Secrets: never hardcode API keys, passwords, PINs or TOTP secrets in code, HTML or committed files. Read them from env (.dev.vars, Wrangler secrets, Supabase secrets). Never print secrets in logs, artifacts or screenshots. Never open or read any matarial_*.txt file.
4. Data: Supabase RLS on every table. Anonymous users may only INSERT into contacts (with consent fields). No anonymous SELECT on personal data. Admin login = Supabase Auth with MFA, enforced server-side.
5. Human approval: nothing is published, posted, messaged or emailed to the public unless the owner approved it in the admin UI. During development use only test/tester accounts.
6. Email: never send outreach or marketing from a personal Gmail. Enforce the warm-up caps, spacing, suppression list and auto-pause thresholds in plan section B2.
7. AI images: keep the product's real colour, fabric and design (change only background/scene/model); follow modesty guidelines (loose fit, proper hijab, faceless option); mark realistic AI images with the platform's AI label; never use real people's or celebrities' faces.
8. Scope: do not touch the ERBE-LegacyOfTime folder unless the task explicitly says ERBE. Do not delete files; move retired code to an archive/ folder.

## How to work
- Planning mode: write an Implementation Plan first and wait for the owner's review.
- One git branch per phase, small clear commits. Never run git push unless the owner says so.
- Website stays plain HTML/CSS/JS (no framework migration). Engine: TypeScript on Cloudflare Workers + Supabase.
- Mobile-first: test at 375px and 1280px with the browser agent and attach screenshots to the Walkthrough.
- If a platform rule or API detail is unclear, read the official docs; do not guess.
- At the end of every task append to docs/PROGRESS.md: what was done, files changed, how to test, what is left, what the owner must do manually.

## Claude API notes (engine)
- SDK: @anthropic-ai/sdk. Model comes from config: claude-opus-5-5 (default) or claude-haiku-5-5 (cheap option).
- claude-opus-5-5: thinking cannot be disabled; control cost with output_config.effort ("low" for chat). Do not send budget_tokens, temperature, an assistant prefill, or tool_choice "any"/"tool" — they return 400.
- Enable refusal fallback on Opus: betas ["server-side-fallback-2026-07-01"] + fallbacks: "default". Always check stop_reason (e.g. "refusal") before reading content.
- Lead cards and captions: structured output via output_config.format (JSON schema). Cache the brand/catalog system prompt with cache_control.
