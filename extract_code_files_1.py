#!/usr/bin/env python3
"""
extract_files_from_compacted_input_file.py

Usage:
    extract_files_from_compacted_input_file.py <compacted_input_file.md>

This script parses a Markdown-like input file containing assembled code blocks,
extracts each code block into its original file (creating directories as needed),
and reports statistics on successes, overwrites, and failures.

Supported block formats:

1) Filename annotation before the code fence:
   # path/to/file.ext
   ```ext
   ... code ...
   ```

2) Filename annotation immediately after the opening fence:
   ```ext
   // path/to/file.ext
   ... code ...
   ```

Rules:
- Only blocks with both a valid filename marker AND a matching closing ``` fence are extracted.
- If the target file already exists, it will be overwritten; a warning is emitted.
- At the end, a summary lists total blocks found, extracted, overwritten, and rejected.
"""

import sys
import os
import re

def is_text_file(path, blocksize=512):
    """Return True if no null bytes found in the first block."""
    try:
        with open(path, 'rb') as f:
            data = f.read(blocksize)
            return b'\x00' not in data
    except Exception:
        return False

def extract_blocks(input_path):
    # Regex patterns
    fence_open_re  = re.compile(r'^```([^\s`]+)\s*$')
    fence_close_re = re.compile(r'^```\s*$')
    fname_before_re = re.compile(r'^\s*#\s*(.+)\s*$')
    fname_after_re  = re.compile(r'^\s*//\s*(.+)\s*$')
    strip_quotes = lambda s: s.strip().strip('\'"`')

    # Read input lines
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error: cannot read '{input_path}': {e}", file=sys.stderr)
        sys.exit(1)

    total_blocks = 0
    extracted = []
    overwritten = []
    rejected = []

    i = 0
    n = len(lines)
    while i < n:
        m_open = fence_open_re.match(lines[i])
        if not m_open:
            i += 1
            continue

        total_blocks += 1
        block_start = i
        filename = None
        skip_next = False

        # 1) Check preceding line for "# path/filename"
        if i > 0:
            m_pre = fname_before_re.match(lines[i - 1])
            if m_pre:
                filename = strip_quotes(m_pre.group(1))

        # 2) Else check next line for "// path/filename"
        if not filename and i + 1 < n:
            m_aft = fname_after_re.match(lines[i + 1])
            if m_aft:
                filename = strip_quotes(m_aft.group(1))
                skip_next = True

        # Collect content lines until closing ```
        content_lines = []
        j = i + 1
        while j < n and not fence_close_re.match(lines[j]):
            if skip_next and j == i + 1:
                # skip filename-after line
                j += 1
                continue
            content_lines.append(lines[j])
            j += 1

        # Evaluate block validity
        if filename is None:
            rejected.append((block_start + 1,
                             "no filename marker (`# ` or `// `)"))
            i += 1
            continue

        if j >= n:
            rejected.append((block_start + 1,
                             "missing closing ``` fence"))
            i = j
            continue

        # Ready to write out the file
        out_path = filename
        try:
            # Ensure directory exists
            parent = os.path.dirname(out_path)
            if parent and not os.path.isdir(parent):
                os.makedirs(parent, exist_ok=True)

            # Warn if overwriting
            if os.path.exists(out_path):
                print(f"[WARN] Overwriting existing file: '{out_path}'")
                overwritten.append(out_path)

            # Write content (overwrite)
            with open(out_path, 'w', encoding='utf-8') as outf:
                outf.writelines(content_lines)

            print(f"[OK] Extracted: '{out_path}' "
                  f"(lines {block_start+1}-{j+1})")
            extracted.append(out_path)
        except Exception as e:
            rejected.append((block_start + 1,
                             f"failed to write '{out_path}': {e}"))

        # Move past this block
        i = j + 1

    # Print summary
    print("\n=== Extraction Summary ===")
    print(f"Total code blocks found:    {total_blocks}")
    print(f"Successfully extracted:     {len(extracted)}")
    print(f"Files overwritten:          {len(overwritten)}")
    print(f"Rejected/skipped blocks:    {len(rejected)}")

    if overwritten:
        print("\nOverwritten files:")
        for p in overwritten:
            print(f"  - {p}")

    if rejected:
        print("\nDetails of rejected/skipped blocks:")
        for lineno, reason in rejected:
            print(f"  - Block at line {lineno}: {reason}")

def main():
    # 1) Parse command-line args or prompt
    if len(sys.argv) >= 2:
        input_file = sys.argv[1]
    else:
        input_file = input("Enter path to compacted input file: ").strip()

    # 2) Validate input file
    if not os.path.isfile(input_file):
        print(f"Error: '{input_file}' is not a file.", file=sys.stderr)
        sys.exit(1)
    if not is_text_file(input_file):
        print(f"Error: '{input_file}' is not a text file.", file=sys.stderr)
        sys.exit(1)

    # 3–8) Extract blocks and report
    extract_blocks(input_file)

if __name__ == "__main__":
    main()
