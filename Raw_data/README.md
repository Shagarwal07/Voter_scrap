<div align="center">

# 📁 Raw Electoral Data Repository (`Raw_data/`)

### *Staging Directory for Source PDFs & Electoral Rolls*

</div>

---

## 📖 Purpose

The **`Raw_data/`** directory is the staging area for official, unparsed Indian Electoral Roll PDFs. It is partitioned by election jurisdiction:

```
Raw_data/
├── vidhan_sabha/              # Legislative Assembly Constituency (AC)
│   └── raw_pdf_rolls/         # Digital text PDFs (AC-137-Part-088.pdf .. AC-137-Part-148.pdf)
│
└── Nagar_parishad/            # Urban Local Body (Municipal Council)
    └── (Wards 1–55 PDFs)      # Scanned / raster ward rolls
```

---

## 🏷️ Canonical File Naming Standards

To enable automatic jurisdiction and part/ward detection in the extraction engine, follow these naming standards when dropping new files:

| Election Jurisdiction | Folder Location | Canonical Naming Pattern | Example Filename |
| :--- | :--- | :--- | :--- |
| **Vidhan Sabha (Assembly)** | `Raw_data/vidhan_sabha/raw_pdf_rolls/` | `AC-{ac_no}-Part-{part_no:03d}.pdf` | `AC-137-Part-092.pdf` |
| **Nagar Parishad (Municipal)**| `Raw_data/Nagar_parishad/` | `NP-Ward-{ward_no:03d}.pdf` | `NP-Ward-005.pdf` |

---

## 🚀 How to Process These Files

Processing logic is centralized in **[`core/`](file:///d:/IWS%20PROJECT/Voter_scrap/core)**:

```bash
# Process all Vidhan Sabha assembly rolls:
python core/local/extractor.py --election-type vidhan_sabha

# Process all Nagar Parishad municipal rolls:
python core/local/extractor.py --election-type nagar_parishad
```

> For full CLI options, custom path overrides, and cloud pipeline instructions, refer to **[`core/README.md`](file:///d:/IWS%20PROJECT/Voter_scrap/core/README.md)**.

---

## 🔒 Security & Privacy Notice

> [!IMPORTANT]
> - Ensure all `.pdf` binary files in this directory remain ignored by `.gitignore` before committing or pushing to public repositories.
> - Official voter lists without photographs are public domain statutory disclosures, but large binary PDFs should never bloat the git history.
