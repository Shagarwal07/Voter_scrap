<div align="center">

# ⚡ Smart Voter Search & Field Operations Platform
### High-Concurrency Polling Booth Lookup & Household Mobilization Engine

[![Built by IWS](https://img.shields.io/badge/Built_by-Imposter_World_Services-1E2A42?style=for-the-badge)](https://github.com/shubham70231)
[![Next.js 16](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Centralized_RBAC-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![SQLite WAL](https://img.shields.io/badge/SQLite3-Readonly_WAL_Engine-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![NextAuth v4](https://img.shields.io/badge/NextAuth_v4-Edge_Protected-green?style=for-the-badge&logo=auth0&logoColor=white)](https://next-auth.js.org)
[![GCP Compute Engine](https://img.shields.io/badge/GCP_Compute-e2--micro_PM2-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://cloud.google.com)
[![Vercel Failover](https://img.shields.io/badge/Vercel-Hot_Standby_DR-black?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<p align="center">
  <b>Sub-200ms Electoral Roll Queries • Dual Database Architecture • Zero-Friction Hindi Transliteration</b>
</p>

</div>

---

## 📌 Executive Overview

`nextjs-search-app` is the high-performance search and volunteer mobilization web application powering the **Voter Scrap** ecosystem. Built on Next.js 16 App Router, it transforms static electoral roll records into instant, bilingual field intelligence for campaign volunteers, booth-level agents, and citizens on election day.

### 🌟 Key Performance Proofs
* **Search Latency**: `< 200 ms` cold / `< 35 ms` indexed SQLite WAL queries.
* **Concurrency**: Handled peak 23 concurrent booth workers on an `e2-micro` GCP VM without dropping a single packet.
* **Field Adoption**: 495+ live event queries logged across 35+ active ground workers on Ward 5 election morning.

---

## 🏛️ System Architecture & Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Volunteer as Field Volunteer / Booth Worker
    participant Middleware as Edge Middleware (middleware.ts)
    participant Engine as Search Route (/api/voters)
    participant Postgres as PostgreSQL (users & public_limits)
    participant SQLite as Read-Only SQLite Engine (voters.db)
    participant GCS as Google Cloud Storage (PDF Reports)

    Volunteer->>Middleware: Request /api/voters?q=शर्मा&ward=5&election=vidhan_sabha
    Middleware->>Middleware: Edge JWT Token Check (NextAuth)
    alt Admin Route Access Unauthorized
        Middleware-->>Volunteer: HTTP 403 Forbidden (JSON)
    else Search Route Allowed
        Middleware->>Engine: Forward Scoped Request
        Engine->>Postgres: Verify 24h Quota (public_limits) & Beat Clearance
        alt Quota Exceeded (HTTP 429)
            Engine-->>Volunteer: 429 Rate Limit Exceeded
        else Clearance Verified
            Engine->>SQLite: Query B-Tree Index with Schema PRAGMA (Read-Only)
            SQLite-->>Engine: Stream Matching Records (< 2ms)
            Engine-->>Volunteer: 200 OK (Paginated JSON Results)
        end
    end

    opt Voter Slips & PDF Download
        Volunteer->>Engine: GET /api/reports/download?file=slip_01.pdf
        Engine->>GCS: Generate V4 15-Minute Signed URL
        GCS-->>Volunteer: Direct High-Speed Cloud Stream
    end
```

---

## 🔐 Role-Based Access Control (RBAC) Matrix

Access permissions are enforced consistently via `src/utils/auth.ts` (`checkSuperUser`) across all API routes, server actions, and client layouts:

```mermaid
flowchart TD
    REQ["Incoming Search (/api/voters)"] --> STRIP["Strip SQL Wildcards (% and _)"]
    STRIP --> ROLE_CHECK{"User Authentication Tier"}

    ROLE_CHECK -->|Public Unauthenticated| T1["Rule 1: Voter ID (EPIC) Search ONLY<br/>Rule 2: Quota Capped at 2/24h<br/>Rule 3: Mask Voter ID (RJ/***345)"]
    ROLE_CHECK -->|Free Logged-In User| T2["Rule 1: Name & EPIC Lookup Allowed<br/>Rule 2: Quota Capped at 4/24h<br/>Rule 3: Hard Deep Pagination Cap (page <= 4)"]
    ROLE_CHECK -->|Paid Field Worker| T3["Rule 1: Scoped to Assigned Wards & Galis<br/>Rule 2: In-Memory 30 req/min Bot Guard<br/>Rule 3: Download Master PDF Slips"]
    ROLE_CHECK -->|Superuser / Admin| T4["Zero Quotas, Zero Throttling, Full Multi-Ward Clearance"]

    T1 --> EXEC["Execute Parameterized SQLite B-Tree Query"]
    T2 --> EXEC
    T3 --> EXEC
    T4 --> EXEC
```

| Role | Access Tier | Allowed Scope | Daily Search Quota | PDF Report Downloads | Admin Panel (`/admin`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`developer`** | Superuser Tier 0 | All Wards & All Galis | **Unlimited** (Zero Throttling) | Full Direct Access | Full CRUD Access |
| **`admin`** | Campaign Manager | All Wards & All Galis | **Unlimited** (Zero Throttling) | Full Direct Access | Manage Users (No Dev Delete) |
| **`paid`** | Field Booth Worker | Assigned `allowed_wards` & `galis` | **Unlimited** (30 req/min guard) | Assigned Beat Only | Denied (`403`) |
| **`user` (Free)**| Logged-in Citizen | Global Name & EPIC Lookup | **4 Searches / 24 Hours** | Summary Slips Only | Denied (`403`) |
| **Public** | Unauthenticated | EPIC / Voter ID Search Only | **2 Searches / 24 Hours** | Masked Public Summary | Denied (`403`) |

---

## 🚀 Core Production Features

### 1. Bilingual Multi-Parameter Voter Search (`/`)
- Phonetic English-to-Hindi Devanagari transliteration via `react-transliterate`.
- Instant lookup by **EPIC / Voter ID** (e.g., `SSB1234567`), **Voter Name**, **Father/Husband Name**, **House Number**, or **Serial Number**.
- Strict SQL parameterization with wildcard sanitization preventing SQL injection and memory exhaustion.

### 2. Gali & Household Mobilizer (`/house`)
- Groups voters by physical street corridors (`Gali 1`, `Gali 2`, etc.) and polling slips for door-to-door canvassing.
- Prevents cross-lane data leakage by verifying volunteer permissions against `allowed_galis` before streaming records.
- Single-click household slip generation for on-the-ground volunteer distribution.

### 3. Dual Election Jurisdiction Switcher
- Dynamically toggles between **Balotra Municipal Council (`nagar_parishad`)** (55 Wards) and **137-Pachpadra Legislative Assembly (`vidhan_sabha`)** (Parts 92, 95).
- Automatically adapts table columns (`ward` vs `part_no`, `gali` vs `slip_label`) via runtime schema queries.

```mermaid
flowchart LR
    TOGGLE{"Election Mode Selector"}
    
    subgraph Municipal["Nagar Parishad (Balotra)"]
        NP_W["55 Municipal Wards"]
        NP_B["Unit: Block (A, B, Kamla Pol, etc.)"]
        NP_G["Unit: Gali (Street Lane)"]
        NP_C["Active Column: ward"]
    end

    subgraph Assembly["Vidhan Sabha (137-Pachpadra)"]
        VS_P["Polling Station Parts (92, 95)"]
        VS_S["Unit: Part Number"]
        VS_B["Unit: Polling Slip (Slip 01, 02)"]
        VS_C["Active Column: part_no"]
    end

    TOGGLE -->|Nagar Parishad| Municipal
    TOGGLE -->|Vidhan Sabha| Assembly
```

---

## 🛠️ Tech Stack (Source of Truth: `package.json`)

- **Framework**: Next.js `16.3.0` (App Router, Turbopack, Server Actions)
- **Runtime & UI**: React `19.2.8` + TypeScript `^5`
- **Styling**: Tailwind CSS `^4` (`@tailwindcss/postcss`)
- **Electoral Database**: `sqlite3` `5.1.7` + `sqlite` `^5.1.1` (opened with `OPEN_READONLY`)
- **State & Quota Database**: `pg` `^8.23.1` (PostgreSQL with Google DNS fallback)
- **Authentication**: `next-auth` `^4.24.15` (Google OAuth + JWT sessions)
- **Cloud & Analytics**: `@google-cloud/storage` `^8.0.1`, `@next/third-parties` (GA4 `G-PWQQS0JTP2`)

---

## 💻 Terminal Execution Protocol

All commands must be executed within the `nextjs-search-app/` directory:

```bash
# 1. Enter Subsystem Directory
cd "D:\IWS PROJECT\Voter_scrap\nextjs-search-app"

# 2. Install Exact Dependencies
npm install

# 3. Configure Local Environment
cp .env.example .env.local

# 4. Initialize Cloud PostgreSQL Auth Database
node scripts/init_auth_db.js

# 5. Run Development Server (Explicitly on Port 3001)
npm run dev
# Expected output: Ready in ~1200ms on http://localhost:3001

# 6. Production Build & Verification
npm run build
# Expected output: Compiled successfully (0 TypeScript/ESLint errors)

# 7. Start Production Server (Local / VM)
npm run start
```

---

<div align="center">
  <sub>Engineered to 1Cr Senior-Developer Standards by <a href="https://github.com/shubham70231">Imposter World Services</a>. Built for resilient, election-day reliability.</sub>
</div>
