#!/usr/bin/env python3
"""
assemble_code_files_from_given_list_as_input.py

Usage:
    assemble_code_files_from_given_list_as_input.py <list_of_files.txt> <output_assembled_file.txt>
If arguments are missing, the script will prompt for them.
"""

import sys
import os

def is_text_file(path, blocksize=512):
    """
    Read first block of the file in binary.
    If a null byte is found, treat as binary; otherwise text.
    """
    try:
        with open(path, 'rb') as f:
            chunk = f.read(blocksize)
            if b'\x00' in chunk:
                return False
        return True
    except Exception:
        return False

def assemble_files(list_path, output_path):
    processed = []
    rejected = []
    total = 0

    # Read list of files
    try:
        with open(list_path, 'r', encoding='utf-8') as lf:
            lines = lf.readlines()
    except Exception as e:
        print(f"Error: Cannot open list file '{list_path}': {e}", file=sys.stderr)
        sys.exit(1)

    # Open output for writing
    try:
        out = open(output_path, 'w', encoding='utf-8')
    except Exception as e:
        print(f"Error: Cannot open output file '{output_path}': {e}", file=sys.stderr)
        sys.exit(1)

    for raw in lines:
        total += 1
        path = raw.strip()
        if not path:
            continue

        print(f"Processing '{path}'...", end=' ')
        if not os.path.isfile(path):
            print("SKIPPED (not a file)")
            rejected.append(path + " [not exists/isn't a file]")
            continue

        if not is_text_file(path):
            print("REJECTED (binary or non-text)")
            rejected.append(path + " [binary/non-text]")
            continue

        # Read entire text content
        try:
            with open(path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception as e:
            print(f"ERROR reading: {e}")
            rejected.append(path + f" [read error: {e}]")
            continue

        # Derive extension for code fence
        ext = os.path.splitext(path)[1].lstrip('.')
        ext = ext if ext else 'txt'

        # Write to output
        out.write(f"# {path}\n")
        out.write(f"```{ext}\n")
        out.write(content.rstrip('\n') + "\n")
        out.write("```\n\n")

        print("OK")
        processed.append(path)

    out.close()

    # Summary
    print("\n=== Summary ===")
    print(f"Total entries in list: {total}")
    print(f"Successfully processed: {len(processed)}")
    print(f"Rejected/skipped: {len(rejected)}")
    if rejected:
        print("List of rejected/skipped files:")
        for r in rejected:
            print("  -", r)

def main():
    # Grab or prompt for arguments
    if len(sys.argv) >= 3:
        list_file = sys.argv[1]
        output_file = sys.argv[2]
    else:
        list_file = input("Enter path to list-of-files text file: ").strip()
        output_file = input("Enter desired output-assembled-file path: ").strip()

    assemble_files(list_file, output_file)

if __name__ == "__main__":
    main()
