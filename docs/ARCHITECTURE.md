# 🏛️ System Architecture & Infrastructure Specification

> **Organization**: Imposter World Services (IWS)  
> **System**: Voter Scrap (Electoral Roll Digitization & Volunteer Field Engine)  
> **Standard**: 1Cr Senior-Engineer Architecture Specification

---

## 1. High-Level Subsystem Topology

The system is organized into decoupled, single-responsibility layers connecting data ingestion to field volunteer mobile interfaces:

```mermaid
flowchart TD
    subgraph Ingestion["1. Ingestion Layer (Raw_data/)"]
        A1["Municipal PDFs (Ward 1–55)"] --> B1["core/cloud/auto_pipeline.py"]
        A2["Assembly PDFs (Part 92, 95)"] --> B2["core/local/extractor.py"]
    end

    subgraph OCR["2. AI OCR & Verification Engine (core/)"]
        B1 & B2 --> C["Gemini 2.5 Flash Multimodal Vision"]
        C --> D["Unicode NFC Normalizer & Matra Guard"]
        D --> E["core/local/recheck.py (6-Point Audit)"]
        E -->|Flagged Gaps| F["core/local/rescan_faulty_page.py"]
        F -->|Atomic DB Update| E
    end

    subgraph Persistence["3. Hybrid Database Architecture"]
        subgraph ReadOnly_SQLite["Electoral Datasets (SQLite Read-Only)"]
            DB_NP[("voters.db & houses.db (Nagar Parishad)")]
            DB_VS[("vidhansabha.db & vidhansabha_house.db")]
        end
        subgraph Cloud_Postgres["Security & Quotas (PostgreSQL)"]
            PG_USERS[("users: RBAC, allowed_wards, allowed_galis")]
            PG_LIMITS[("public_limits: 24h Quota Tracker")]
            DNS_RESOLVER["Custom DNS Resolver (8.8.8.8 / 1.1.1.1)"]
        end
    end

    subgraph Serving["4. Dual-Tier Application Layer"]
        ReadOnly_SQLite --> APP_SEARCH["nextjs-search-app :3001 (Volunteer Engine)"]
        Cloud_Postgres <--> DNS_RESOLVER <--> APP_SEARCH
        E --> GCS_BUCKET["Google Cloud Storage (PDF Slips)"]
        GCS_BUCKET --> APP_CIVIC["voter-portal-frontend :3000 (Civic Portal)"]
        GCS_BUCKET --> APP_SEARCH
    end

    E -->|Export Structured Data| ReadOnly_SQLite
```

---

## 2. Hybrid Dual-Database Storage Architecture

To achieve both **ultra-low search latency (< 2ms)** and **secure multi-instance state synchronization**, the system employs a hybrid storage strategy:

```mermaid
flowchart LR
    subgraph ClientReq["Incoming Request"]
        REQ["Search / Field Query"]
    end

    subgraph AuthLayer["PostgreSQL State Engine"]
        JWT["NextAuth JWT Session"]
        PG_POOL["pg Connection Pool (Max 10)"]
        PG_TABLES["users (RBAC) & public_limits (IP/Email Quotas)"]
    end

    subgraph DataLayer["SQLite Read-Only Engine"]
        SQLITE_RO["sqlite3.OPEN_READONLY Connection"]
        BTREE["B-Tree Indexed Queries"]
        DATA_FILES["voters.db / vidhansabha.db"]
    end

    REQ --> JWT --> PG_POOL --> PG_TABLES
    REQ --> SQLITE_RO --> BTREE --> DATA_FILES
```

### A. Electoral Data Engine (SQLite Read-Only WAL)
* **Locations**: 
  - `nextjs-search-app/data/nagar_parishad/voters.db` & `houses.db`
  - `nextjs-search-app/data/vidhan_sabha/vidhansabha.db` & `vidhansabha_house.db`
* **Concurrency Pattern**: Thread-safe singleton initialized via `openReadonlyDb()` in `src/utils/dbPath.ts`.
* **Pragmas**:
  ```sql
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA synchronous = NORMAL;
  PRAGMA cache_size = -64000; -- 64MB In-Memory Cache
  ```
* **Why Read-Only SQLite?**: Eliminates all database locking. Hundreds of concurrent booth workers can execute read queries in parallel directly off the SSD with zero network hops.

### B. Security & Rate-Limiting Engine (PostgreSQL)
* **Location**: Centralized Cloud PostgreSQL (Neon / Supabase / Cloud SQL) configured in `src/lib/db.ts`.
* **Resilient DNS Fallback**: Direct integration of `dns.Resolver` pointed to Google Public DNS (`8.8.8.8`, `1.1.1.1`) bypassing local Windows or ISP DNS resolution drops for cloud connection strings.
* **Tables**:
  - `users`: Manages Google OAuth logins, assigned role (`developer`, `admin`, `paid`, `user`), and assigned beats (`allowed_wards`, `allowed_galis`).
  - `public_limits`: Tracks persistent 24-hour quota sliding windows by IP (`ip:x.x.x.x`) or user email (`user:email@domain.com`).

---

## 3. Dual Election Roll Architecture

The platform supports two independent electoral jurisdictions switchable on the fly via `ElectionContext`:

```mermaid
sequenceDiagram
    autonumber
    actor Volunteer as Field Worker
    participant Context as ElectionContext (React)
    participant API as /api/voters & /api/houses
    participant SQLite as SQLite Database Resolver
    
    Volunteer->>Context: Select Election Mode (Nagar Parishad vs Vidhan Sabha)
    Context->>Context: Save preference in localStorage ('voter_election_mode')
    Context->>API: GET /api/voters?election=vidhan_sabha&q=Ramesh
    API->>API: Inspect schema via PRAGMA table_info(voters)
    alt Vidhan Sabha Mode
        API->>SQLite: Query vidhansabha.db using column 'part_no'
    else Nagar Parishad Mode
        API->>SQLite: Query voters.db using column 'ward'
    end
    SQLite-->>API: Stream records (< 2ms)
    API-->>Volunteer: Standardized JSON payload with normalized ward/part
```

---

## 4. Anti-Scraping & Privacy Defense Tier

To prevent unauthorized mass harvesting of voter data by automated bots:

```mermaid
flowchart TD
    REQ["Incoming Search Request (/api/voters)"] --> SANITIZE["Strip SQL Wildcards (% and _)"]
    SANITIZE --> TIER_CHECK{"Inspect User Tier"}

    TIER_CHECK -->|Public Unauthenticated| PUBLIC_GATE["Rule 1: Voter ID (EPIC) Search ONLY<br/>Rule 2: Quota Capped at 2/day<br/>Rule 3: Mask Voter ID (RJ/***345)"]
    TIER_CHECK -->|Free Logged-in User| FREE_GATE["Rule 1: Name + EPIC Lookup Allowed<br/>Rule 2: Quota Capped at 4/day<br/>Rule 3: Deep Pagination Capped (page <= 4)"]
    TIER_CHECK -->|Paid Field Worker| PAID_GATE["Rule 1: Beat Clearance (allowed_wards, allowed_galis)<br/>Rule 2: In-Memory 30 req/min Bot Guard<br/>Rule 3: Full Voter ID Access"]
    TIER_CHECK -->|Superuser / Admin| ADMIN_GATE["Zero Quotas, Zero Throttling, Full Multi-Ward Access"]

    PUBLIC_GATE --> DB_QUERY["Execute Paginated SQLite Query"]
    FREE_GATE --> DB_QUERY
    PAID_GATE --> DB_QUERY
    ADMIN_GATE --> DB_QUERY
```

---

## 5. Dual-Cloud Disaster Recovery Sequence

To ensure 100% operational uptime on election day, the serving architecture implements dual-cloud hot standby:

```mermaid
sequenceDiagram
    autonumber
    actor Volunteer as Field Volunteer / Worker
    participant DNS as DNS Gateway (nip.io / Cloudflare)
    participant Primary as Primary GCP VM (e2-micro + PM2 :3001)
    participant Standby as Hot-Standby Vercel Cloud (Edge DR)
    participant Storage as Google Cloud Storage (PDF Reports)

    Volunteer->>DNS: Request search.yourdomain.com
    alt GCP VM Healthy (Primary 99.9% Route)
        DNS->>Primary: Proxy to PM2 Daemon (Port 3001)
        Primary->>Primary: Query Local SQLite WAL (< 200ms)
        Primary-->>Volunteer: HTTP 200 JSON Response
    else GCP Hardware / Network Outage (Disaster Failover)
        DNS->>Standby: Automatic DNS Switch to Serverless Edge
        Standby->>Storage: Stream Verified Public Roll via Signed URLs
        Standby-->>Volunteer: Immediate Standby Verification UI
    end
```

---

## 6. Port & Local Development Topology

To guarantee zero port drift and eliminate OAuth callback mismatches:

| Subsystem | Local Dev Port | Production Binding | Role |
| :--- | :--- | :--- | :--- |
| **`voter-portal-frontend`** | `http://localhost:3000` | Vercel Edge CDN | Public Citizen Portal (GIS Map, Turnout, Candidates) |
| **`nextjs-search-app`** | `http://localhost:3001` | GCP VM (PM2 :3001) | Volunteer Field Search & Gali Mobilization Engine |

---

<div align="center">
  <sub>Maintained by <a href="https://github.com/shubham70231">IWS Engineering</a>. Standard Operating Architecture.</sub>
</div>
