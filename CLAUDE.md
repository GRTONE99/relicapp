# Project: Relic Roster

Relic Roster is a premium sports memorabilia platform designed for collectors to:

* Catalog and organize their collection
* Track real-time market value using sold comps
* Store authentication and provenance data
* Scan items using AI for auto-population

Primary audience:

* Sports collectors (35+)
* Value trust, security, and accuracy

Brand principles:

* Premium (black & gold aesthetic)
* Trust-first (data accuracy and provenance)
* Clean, modern UX
* No clutter, no gimmicks

---

# Tech Stack (STRICT)

Frontend:

* Next.js (App Router)
* TypeScript
* Tailwind CSS

Backend:

* Supabase (Postgres, Auth, Storage, RLS enabled)

APIs:

* Apify (eBay sold listings scraping)
* OpenAI (image recognition + text extraction)

Hosting:

* Vercel

Other Services:

* Stripe (subscriptions / payments)
* Resend (transactional email)

DO NOT introduce new frameworks or services without asking.

---

# Core Product Architecture

## Data Model: Collection Item

Every item MUST support the following fields:

* id
* user_id
* item_name
* player
* team
* year
* sport
* category
* condition
* authentication_company (PSA, JSA, Beckett, etc.)
* certification_number
* purchase_price
* purchase_date
* estimated_value
* storage_location
* notes
* created_at

Optional (future):

* images[]
* provenance_history[]
* tags[]

---

# Key Features & Rules

## 1. Pricing / Market Value (CRITICAL FEATURE)

* Must pull from eBay SOLD listings via Apify
* Always show:

  * Last 5–10 sold comps
  * Average price
  * Most recent sale
* Never show active listings as comps
* Must handle outliers (ignore extreme values if needed)

## 2. AI Item Scanning

* Use OpenAI to:

  * Identify item type
  * Extract player/team/year if possible
* Always allow user override/edit
* Never auto-save without user confirmation

## 3. Data Integrity

* Never overwrite user-entered data without confirmation
* Authentication fields must be preserved with high priority
* All writes must respect Supabase RLS policies

---

# Folder Structure Rules

* /app → routes and pages
* /components → UI components
* /lib → business logic, API clients, utilities
* /services → external integrations (Apify, OpenAI)
* /types → TypeScript types

Rules:

* UI components must NOT call APIs directly
* All API logic must live in /services or /lib
* Reuse existing clients (do NOT duplicate)

---

# Coding Standards

* Use TypeScript only (no JavaScript files)
* Use functional React components only
* Prefer server components where possible
* Use async/await (no .then chains)
* Keep components under 200 lines
* Extract reusable logic into hooks or /lib

Naming:

* camelCase for variables/functions
* PascalCase for components
* snake_case for database fields

---

# Supabase Rules (VERY IMPORTANT)

* RLS (Row Level Security) must ALWAYS be respected
* Never bypass auth for convenience
* Use a single shared Supabase client from /lib/supabase.ts
* Do not expose service role keys on frontend

Public data:

* Explicitly define policies for public read if needed

---

# API & Security Rules

* NEVER hardcode API keys
* Use environment variables via Vercel
* Validate all external data before using
* Handle API failures gracefully (no crashes)

Apify:

* Only fetch SOLD listings
* Normalize pricing before calculations

OpenAI:

* Optimize for cost efficiency
* Avoid unnecessary repeated calls

---

# UI / UX Rules

* Mobile-first design
* Clean, premium layout (no clutter)
* Prioritize readability of:

  * Item details
  * Price insights
  * Authentication data

Avoid:

* Overuse of modals
* Complex navigation
* Unnecessary animations

---

# Performance Rules

* Minimize API calls
* Cache pricing data where appropriate
* Lazy load images
* Avoid blocking UI on external APIs

---

# What NOT to do

* Do NOT introduce mock data in production code
* Do NOT duplicate logic across files
* Do NOT add new dependencies without explanation
* Do NOT bypass Supabase or security rules
* Do NOT build features outside defined scope without asking

---

# Claude Behavior Instructions

When working on this project:

1. Always follow the defined tech stack
2. Reuse existing patterns and files before creating new ones
3. Explain architectural decisions clearly
4. Ask for clarification if requirements are ambiguous
5. Provide clean, production-ready code (no placeholders)
6. Suggest improvements when appropriate, but do not overcomplicate

When implementing features:

* First explain approach briefly
* Then provide code
* Keep solutions simple and scalable

---

# Product Direction (IMPORTANT CONTEXT)

Relic Roster is NOT:

* A social network (for now)
* A marketplace
* A trading platform

Relic Roster IS:

* A collector's vault
* A value tracking tool
* A provenance system

Focus on:

* Trust
* Accuracy
* Simplicity
* Long-term collector value

---

# Future Considerations (DO NOT BUILD YET)

* Social sharing
* Marketplace features
* Advanced AI pricing predictions
* Community collections

Only build when explicitly requested.
