#!/usr/bin/env python3
"""
Hindi Devanagari Text Normalizer & Typography Refiner.

Solves statutory ECI PDF typographic & OCR issues:
1. Visual-order short-i (chhoti-ee matra):
   ECI PDFs often store '\u093f' before the consonant instead of after.
   Converts: 'िजतेंद्र' -> 'जितेंद्र', 'िवनोद' -> 'विनोद', 'गोिवन्द्राम' -> 'गोविन्द्राम', 'नंदिकशोर' -> 'नंदकिशोर'
2. Split-word linebreaks inside names:
   Converts: 'राके श' -> 'राकेश', 'सुरे श' -> 'सुरेश', 'दिने श' -> 'दिनेश'
3. Detached Kumar / Kumari:
   Converts: 'दीपककु मार' -> 'दीपक कुमार', 'कु मार' -> 'कुमार', 'कु मारी' -> 'कुमारी'
4. Inverted Reph (ra-virama at end of syllable):
   Converts: 'वषार्' -> 'वर्षा'
"""

import re
import sqlite3
import unicodedata
from pathlib import Path

def clean_hindi(text: str) -> str:
    """Normalizes corrupted Devanagari text into canonical Unicode logical order."""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)

    # 1. Fix visual-order short-i (\u093f followed by a consonant or cluster)
    text = re.sub(
        r'\u093f((?:[\u0915-\u0939]\u094d)*[\u0915-\u0939])',
        lambda m: m.group(1) + '\u093f',
        text
    )

    # 2. Fix inverted reph (ra-virama at end of syllable instead of before it)
    text = re.sub(
        r'([\u0915-\u0939][\u093e\u0940\u0942\u0947\u0948\u094b\u094c]*)ार\u094d',
        lambda m: '\u0930\u094d' + m.group(1),
        text
    )
    text = re.sub(
        r'([\u0915-\u0939][\u093e\u0940\u0942\u0947\u0948\u094b\u094c]*)ा\u0930\u094d',
        lambda m: '\u0930\u094d' + m.group(1),
        text
    )

    # 3. Fix broken 'कु मार' / 'कु मारी'
    text = re.sub(r'कु\s+मार\b', 'कुमार', text)
    text = re.sub(r'कु\s+मारी\b', 'कुमारी', text)
    text = re.sub(r'([क-ह])\s*कुमार\b', r'\1 कुमार', text)
    text = re.sub(r'([क-ह])\s*कुमारी\b', r'\1 कुमारी', text)

    # 4. Fix split syllable linebreaks (e.g. 'राके श' -> 'राकेश', 'सुरे श' -> 'सुरेश')
    text = re.sub(
        r'([\u0915-\u0939][\u0947])\s+([\u0915-\u0939][\u093e\u093f\u0940\u0941\u0942\u0947\u0948\u094b\u094c]*)\b',
        r'\1\2',
        text
    )

    # 5. Clean up multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def normalize_database_table(db_path: Path, table_name: str, columns: list):
    """Batch normalizes Hindi text in an SQLite database table."""
    if not db_path.exists():
        print(f"[WARN] Database not found: {db_path}")
        return 0

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    col_select = ", ".join(["id"] + columns)
    rows = cur.execute(f"SELECT {col_select} FROM {table_name}").fetchall()

    updates = []
    for row in rows:
        row_id = row[0]
        cleaned_vals = [clean_hindi(v) for v in row[1:]]
        if list(cleaned_vals) != list(row[1:]):
            updates.append(tuple(cleaned_vals + [row_id]))

    if updates:
        set_clause = ", ".join([f"{col} = ?" for col in columns])
        cur.executemany(f"UPDATE {table_name} SET {set_clause} WHERE id = ?", updates)
        conn.commit()

    conn.close()
    return len(updates)

if __name__ == "__main__":
    import sys
    base_dir = Path(__file__).resolve().parent.parent.parent
    db_dir = base_dir / "nextjs-search-app" / "data" / "vidhan_sabha"

    v_db = db_dir / "vidhansabha.db"
    h_db = db_dir / "vidhansabha_house.db"

    print("=" * 65)
    print("RUNNING HINDI TEXT REFINEMENT PIPELINE")
    print("=" * 65)

    if v_db.exists():
        c_v = normalize_database_table(v_db, "voters", ["name_hi", "relative_name_hi"])
        print(f"vidhansabha.db (voters): {c_v:,} rows normalized.")

    if h_db.exists():
        c_h = normalize_database_table(h_db, "house_members", ["name", "relative_name"])
        print(f"vidhansabha_house.db (house_members): {c_h:,} rows normalized.")

    print("Normalization complete.")
