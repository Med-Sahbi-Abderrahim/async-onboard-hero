#!/usr/bin/env python3
"""
Search repository files for:
  1) .delete()
  2) .update(...) with deleted_at
  3) .eq('organization_id' ... ) used in combination with .delete() or .update()

Outputs: file path, line number, and the code snippet (with a few context lines).
"""

import os
import re
import sys

# file extensions to scan (add more if needed)
EXTS = ('.js', '.ts', '.tsx', '.jsx', '.py', '.go', '.rb', '.php', '.java', '.rs', '.cs', '.swift')

# directories to skip
SKIP_DIRS = {'.git', 'node_modules', 'venv', '__pycache__', '.venv', '.next', 'dist', 'build'}

# regex patterns
re_delete = re.compile(r"\.delete\s*\(", re.M)
re_update_deleted = re.compile(r"\.update\s*\((?:[^)]|\n)*?deleted_at", re.M|re.S)
re_eq_org = re.compile(r"\.eq\s*\(\s*['\"]organization_id['\"]\s*\)", re.M)

# helper to print context around a line index
def print_snippet(lines, start_idx, end_idx):
    start = max(0, start_idx)
    end = min(len(lines), end_idx)
    return ''.join(lines[start:end])

def scan_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()
    except Exception:
        return []  # skip unreadable files

    results = []

    # For line-based context, split once
    lines = text.splitlines(keepends=True)

    # 1) .delete occurrences
    for m in re_delete.finditer(text):
        # compute line number
        lineno = text[:m.start()].count('\n') + 1
        snippet = print_snippet(lines, lineno-2, lineno+2)
        results.append(('delete', path, lineno, snippet))

    # 2) .update(...) with deleted_at
    for m in re_update_deleted.finditer(text):
        lineno = text[:m.start()].count('\n') + 1
        # try to capture full parentheses block for clarity (naive)
        snippet = print_snippet(lines, lineno-3, lineno+6)
        results.append(('update_with_deleted_at', path, lineno, snippet))

    # 3) .eq('organization_id' used with .delete or .update
    for m in re_eq_org.finditer(text):
        start = m.start()
        lineno = text[:start].count('\n') + 1
        # look ahead up to N characters for .delete or .update (multi-line)
        lookahead_span = text[start:start+800]  # adjust if chained calls are longer
        if re.search(r"\.delete\s*\(", lookahead_span) or re.search(r"\.update\s*\(", lookahead_span):
            snippet = print_snippet(lines, lineno-3, lineno+6)
            results.append(('eq_org_with_delete_or_update', path, lineno, snippet))

    return results

def should_scan_file(path):
    if not path.lower().endswith(EXTS):
        return False
    # skip binary-ish files
    return True

def walk_and_scan(root='.'):
    all_results = []
    for dirpath, dirnames, filenames in os.walk(root):
        # prune skip dirs
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.pytest_cache')]
        for fname in filenames:
            fpath = os.path.join(dirpath, fname)
            if should_scan_file(fpath):
                res = scan_file(fpath)
                all_results.extend(res)
    return all_results

def main():
    root = '.'
    results = walk_and_scan(root)
    if not results:
        print("No matches found for the three patterns.")
        return 0

    # Print structured output
    for typ, path, lineno, snippet in sorted(results, key=lambda x: (x[1], x[2])):
        print("----")
        print("TYPE:", typ)
        print("FILE:", path)
        print("LINE:", lineno)
        print("SNIPPET:")
        print(snippet)
    print("----")
    print(f"Found {len(results)} matches.")
    return 0

if __name__ == '__main__':
    sys.exit(main())