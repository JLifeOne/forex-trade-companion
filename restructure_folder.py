#!/usr/bin/env python3
"""
restructure_folder.py

Cleans and reorganizes your local `forex-trade-companion` folder in-place.
Usage: place this script next to your `forex-trade-companion/` folder and run:
    python restructure_folder.py
"""

import os
import shutil
import re
from pathlib import Path

# 1) Locate your project folder (must be next to this script)
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT    = SCRIPT_DIR / "C:/Users/User/Documents/GitHub/forex-trade-companion"

if not PROJECT.exists() or not PROJECT.is_dir():
    raise SystemExit(f"❌ Folder '{PROJECT}' not found. Make sure you're running this next to that folder.")

# 2) Remove the accidental '-p' folder if present
bad_p = PROJECT / "-p"
if bad_p.exists():
    shutil.rmtree(bad_p)
    print("- Removed empty '-p' folder")

# 3) Consolidate `backend/functions` → `functions/`
backend_fn = PROJECT / "backend" / "functions"
root_fn    = PROJECT / "functions"

if backend_fn.exists():
    # delete a stray root-level if already there
    if root_fn.exists():
        shutil.rmtree(root_fn)
        print("- Deleted existing 'functions/'")
    # move it
    shutil.move(str(backend_fn), str(root_fn))
    print("- Moved 'backend/functions/' → 'functions/'")
    # remove now-empty backend folder if applicable
    backend_root = PROJECT / "backend"
    if not any(backend_root.iterdir()):
        shutil.rmtree(backend_root)
        print("- Removed empty 'backend/' folder")

# 4) Gather all `.env*` files into the project root
for env_file in PROJECT.rglob(".env*"):
    if env_file.parent != PROJECT:
        target = PROJECT / env_file.name
        shutil.move(str(env_file), str(target))
        print(f"- Moved '{env_file.relative_to(SCRIPT_DIR)}' → '{target.name}'")

# 5) Update `.gitignore` to ignore build artifacts
gitignore = PROJECT / ".gitignore"
existing = gitignore.read_text().splitlines() if gitignore.exists() else []
to_add   = ["dist/", "functions/lib/"]

with open(gitignore, "a") as gi:
    for line in to_add:
        if line not in existing:
            gi.write(f"\n{line}")
            print(f"- Added '{line}' to .gitignore")

# 6) Remove generated output folders
for build_dir in ["dist", "functions/lib"]:
    path = PROJECT / build_dir
    if path.exists():
        shutil.rmtree(path)
        print(f"- Removed build folder '{build_dir}'")

# 7) Fix imports and replace `: any` in your source files
import_pattern = re.compile(r"""from\s+['"]\.\./backend/functions""")

for file in PROJECT.rglob("*"):
    # only target your code files, skip deps and temp folders
    if file.is_file() and file.suffix in {".ts", ".tsx", ".js", ".jsx"}:
        if "node_modules" in file.parts or "ftc_work" in file.parts:
            continue

        text = file.read_text(encoding="utf8")
        new  = import_pattern.sub('from "./functions', text)
        new  = new.replace(": any", ": unknown")

        if new != text:
            file.write_text(new, encoding="utf8")
            print(f"- Updated imports/types in '{file.relative_to(PROJECT)}'")

print("✅ Restructure complete! Your 'forex-trade-companion' folder is now cleaned and reorganized.")
