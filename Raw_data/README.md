<div align="center">

# 📁 Raw Electoral Data Repository (`Raw_data/`)

**Source PDFs & Initial Documents Partitioned by Election Jurisdiction**

</div>

---

## 📖 Ingestion Architecture & Data Routing

The **`Raw_data/`** directory is the staging ground for raw, unparsed Indian Electoral Roll PDFs and initial baseline documents:

```mermaid
flowchart TD
    RAW["Raw Electoral Roll PDF Source"] --> ROUTE{"Election Jurisdiction Router"}
    
    subgraph Municipal["Raw_data/Nagar_parishad/"]
        NP_PDF["Ward No-{000}-Part No-{000}.pdf (Wards 1–55)"]
        NP_CSV["excel_csv/ (Street Surveys & Mapping)"]
    end

    subgraph Assembly["Raw_data/vidhan_sabha/"]
        VS_PDF["Part-{000}.pdf (Polling Stations 92, 95, etc.)"]
        VS_JSON["json/ (Baseline DB Records)"]
    end

    ROUTE -->|Municipal Council| Municipal
    ROUTE -->|Legislative Assembly| Assembly

    Municipal --> EXT_NP["extractor.py --ward {w}"]
    Assembly --> EXT_VS["extractor.py --ward {part} --election vidhan_sabha"]

    EXT_NP --> OUT_NP[("nextjs-search-app/data/nagar_parishad/voters.db")]
    EXT_VS --> OUT_VS[("nextjs-search-app/data/vidhan_sabha/vidhansabha.db")]
```

---

## 📂 Directory Layout

```
Raw_data/
├── Nagar_parishad/            # Urban Local Body (Municipal Council / Wards)
│   └── excel_csv/             # Baseline street & block surveys for municipal wards
│
└── vidhan_sabha/              # Legislative Assembly (Constituency Polling Stations)
    └── json/                  # Baseline electoral databases (Part 92, Part 95)
```

---

## 🏷️ Standard Naming Conventions

When adding new official electoral roll PDFs for processing, follow these standard naming conventions to enable automatic ward/part detection in `core/local/extractor.py`:

| Election Tier | Recommended File Pattern | Example | Destination DB |
| :--- | :--- | :--- | :--- |
| **Municipal / Nagar Parishad** | `Ward No-{000}-Part No-{000}.pdf` | `Ward No-005-Part No-001.pdf` | `data/nagar_parishad/voters.db` |
| **Vidhan Sabha / Assembly** | `AC-{Constituency}-Part-{PartNo}.pdf` | `AC-137-Part-092.pdf` | `data/vidhan_sabha/vidhansabha.db` |

---

## 🔒 Security & Privacy Notice

> [!IMPORTANT]
> - Raw electoral rolls contain public voter information. **Never commit scanned PDFs with personal photos** into public repositories.
> - Official voter roll PDFs without photographs are indexed under public domain statutory election disclosures.
> - Ensure `.gitignore` ignores all large binary PDFs (`*.pdf`) in this folder before pushing to GitHub.

---

## 🔄 Extraction Flow

To process any PDF in this directory into structured records:
```bash
# Extract Municipal Ward
python core/local/extractor.py "Raw_data/Nagar_parishad/Ward No-005-Part No-001.pdf" --ward 5

# Process Legislative Assembly Part
python core/local/extractor.py "Raw_data/vidhan_sabha/Part-092.pdf" --ward 92
```
Extracted records are automatically structured into SQLite and exported into [`outputs/`](file:///d:/IWS%20PROJECT/Voter_scrap/outputs).

---

<div align="center">
  <sub>Maintained to 1Cr Senior-Engineer Standards by <a href="https://github.com/shubham70231">IWS Engineering</a>.</sub>
</div>
