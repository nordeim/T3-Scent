import sys
import os
import re

def is_text_file(file_path):
    """Check if file is a valid text file (no NULL bytes)"""
    try:
        with open(file_path, 'rb') as f:
            if b'\x00' in f.read(1024):
                return False
        return True
    except Exception as e:
        print(f"Error checking {file_path}: {e}")
        return False

def main():
    # Rule 1: Parse command-line args
    if len(sys.argv) < 2:
        input_file = input("Please enter the input compacted file path: ").strip()
    else:
        input_file = sys.argv[1].strip()

    # Rule 2: Validate input file
    if not os.path.isfile(input_file):
        print(f"Input file '{input_file}' does not exist or is not a file.")
        return

    if not is_text_file(input_file):
        print(f"Input file '{input_file}' is not a text file.")
        return

    try:
        with open(input_file, 'r', newline='', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading input file: {e}")
        return

    # Rule 4: Use regex to find code fences
    code_blocks = []
    i = 0
    while i < len(lines):
        line = lines[i]
        match = re.match(r'^```(\w*)$', line.strip())
        if match:
            ext = match.group(1)
            j = i + 1
            while j < len(lines):
                if lines[j].strip() == '```':
                    break
                j += 1
            if j < len(lines):
                code_blocks.append((i, j, ext))  # (start, end, ext)
                i = j + 1
            else:
                print(f"Rejected: Missing closing fence for block starting at line {i}")
                i += 1
        else:
            i += 1

    processed = []
    rejected = []
    written_files = set()
    ext_pattern = re.compile(r'^```(\w*)$')
    comment_pattern = re.compile(r'^//\s*(.+)$')

    # Rule 5 & 6: Process each code block
    for start, end, ext in code_blocks:
        filename = None

        # Rule 5a: Try preceding line for `# path/filename`
        if start > 0:
            prev_line = lines[start - 1].strip()
            if prev_line.startswith('#'):
                filename = prev_line[1:].strip()

        # Rule 5b: Else try first line inside block for `// path/filename`
        if not filename and start + 1 < end:
            first_line = lines[start + 1].strip()
            match = comment_pattern.match(first_line)
            if match:
                filename = match.group(1)

        # Rule 5c: Reject if no filename
        if not filename:
            rejected.append((None, "No valid filename marker found"))
            print(f"Rejected: No valid filename marker found in block starting at line {start}")
            continue

        # Rule 5d: Scan forward for closing fence already ensured in block detection

        # Rule 6a: Normalize and strip quotes/backticks
        if any(c.isspace() for c in filename):
            if not ((filename.startswith('"') and filename.endswith('"')) or
                    (filename.startswith("'") and filename.endswith("'")) or
                    (filename.startswith('`') and filename.endswith('`'))):
                rejected.append((filename, "Whitespace in filename not enclosed in quotes/backticks"))
                print(f"Rejected: '{filename}' - Whitespace not enclosed in quotes/backticks")
                continue
            else:
                filename = filename[1:-1].strip()

        # Rule 6b: Create parent directories
        dirname = os.path.dirname(filename)
        if dirname and not os.path.exists(dirname):
            try:
                os.makedirs(dirname)
            except Exception as e:
                rejected.append((filename, f"Error creating directory: {e}"))
                print(f"Failed to create directory for '{filename}': {e}")
                continue

        # Rule 6c: Extract content lines (excluding filename lines)
        if prev_line and prev_line.startswith('#'):
            content_start = start + 1
        else:
            content_start = start + 2
        content_lines = lines[content_start:end]

        content = ''.join(content_lines)

        # Rule 9: Overwrite existing files with warning
        if filename in written_files:
            print(f"Warning: Overwriting previously extracted file '{filename}'")

        try:
            with open(filename, 'w', newline='') as f:
                f.write(content)
            written_files.add(filename)
            processed.append(filename)
            print(f"Created file: {filename}")
        except Exception as e:
            rejected.append((filename, f"Error writing file: {e}"))
            print(f"Failed to create '{filename}': {e}")

    # Rule 7: Final statistics
    print("\n=== Extraction Statistics ===")
    print(f"Total code blocks found: {len(code_blocks)}")
    print(f"Total files extracted: {len(processed)}")
    print(f"Total files rejected: {len(rejected)}")
    if rejected:
        print("\nRejected files:")
        for path, reason in rejected:
            print(f"{path or 'N/A'} - {reason}")

if __name__ == "__main__":
    main()
