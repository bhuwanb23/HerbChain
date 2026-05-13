"""
Inspect the current SQLite DB — list tables and row counts.

Usage:
    python scripts/inspect_db.py [path/to/herbchain.db]
"""
import sqlite3
import sys
from pathlib import Path


def main(argv: list[str]) -> int:
    if len(argv) > 1:
        db_path = Path(argv[1])
    else:
        # Try common locations
        candidates = [
            Path("instance/herbchain.db"),
            Path("herbchain.db"),
            Path(__file__).resolve().parent.parent / "instance" / "herbchain.db",
        ]
        db_path = next((c for c in candidates if c.exists()), None)
        if db_path is None:
            print("No DB found. Run `flask db upgrade` first or pass a path.")
            return 1

    print(f"Inspecting: {db_path}")
    with sqlite3.connect(db_path) as conn:
        tables = [
            r[0]
            for r in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            )
        ]
        if not tables:
            print("(no tables)")
            return 0
        for name in tables:
            try:
                count = conn.execute(f"SELECT COUNT(*) FROM {name}").fetchone()[0]
            except sqlite3.Error as exc:
                count = f"err: {exc}"
            print(f"  {name:<24} rows={count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
