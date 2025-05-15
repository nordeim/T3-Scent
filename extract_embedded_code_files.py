import os
import re

def extract_code_blocks(input_file):
    """Parse the input file and extract code blocks with their filenames."""
    code_blocks = []
    
    try:
        with open(input_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
    except Exception as e:
        print(f"Error reading file: {e}")
        return []
    
    i = 0
    while i < len(lines):
        line = lines[i].rstrip('\n')
        
        # Check if this line starts a code block
        code_block_match = re.match(r'^```(ts|py|sql|php|typescript|markdown|tsx|prisma|js)', line.strip())
        
        if code_block_match:
            # Move to the next line which should contain the filename
            i += 1
            if i >= len(lines):
                print("Warning: Unexpected end of file after code block marker.")
                break
            
            filename_line = lines[i].rstrip('\n')
            
            # Check if the line starts with "// " to extract the filename
            if not filename_line.startswith("// "):
                print(f"Warning: Expected filename comment, but found: {filename_line}")
                i += 1
                continue
            
            filename = filename_line[3:].strip()
            
            # Collect all lines until we reach the closing ```
            content_lines = [filename_line]  # Include the filename line
            i += 1
            
            while i < len(lines):
                current_line = lines[i].rstrip('\n')
                if current_line.strip() == "```":
                    break
                content_lines.append(current_line)
                i += 1
            
            # Check if we reached the end of the file without finding a closing marker
            if i >= len(lines):
                print(f"Warning: Code block for {filename} doesn't have a closing marker.")
            else:
                # Skip the closing ```
                i += 1
            
            # Add the code block to our list
            code_blocks.append((filename, '\n'.join(content_lines)))
        else:
            i += 1
    
    return code_blocks

def save_code_blocks(code_blocks):
    """Save the extracted code blocks to their respective files."""
    for filename, content in code_blocks:
        # Create directory structure
        directory = os.path.dirname(filename)
        if directory and not os.path.exists(directory):
            try:
                os.makedirs(directory)
                print(f"Created directory: {directory}")
            except Exception as e:
                print(f"Error creating directory '{directory}': {e}")
                continue
        
        # Write content to file
        try:
            with open(filename, 'w', encoding='utf-8') as output_file:
                output_file.write(content)
            print(f"Successfully wrote to file: {filename}")
        except Exception as e:
            print(f"Error writing to file '{filename}': {e}")

def process_file(input_file):
    """Main function to process the input file."""
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found.")
        return
    
    try:
        code_blocks = extract_code_blocks(input_file)
        
        if not code_blocks:
            print("No code blocks found in the file.")
            return
        
        save_code_blocks(code_blocks)
    except Exception as e:
        print(f"Error processing file: {e}")

def main():
    """Main function to handle user interaction."""
    input_file = input("Enter the path to the input file: ")
    process_file(input_file)

if __name__ == "__main__":
    main()
