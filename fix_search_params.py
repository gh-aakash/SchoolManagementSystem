import os
import re

def fix_search_params():
    root_dir = "c:/projects/SchoolManagementSystem/src/app"
    
    # Pattern to match async function with searchParams prop
    pattern = r'async function\s+(\w+)\s*\(\{\s*searchParams\s*\}\s*:\s*\{\s*searchParams\s*:\s*\{[^}]*\}\s*\}\)(\s*\{)'
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".tsx"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                if "searchParams" in content and "async function" in content:
                    # Update prop type to Promise
                    new_content = re.sub(
                        r'searchParams\s*:\s*\{\s*\[key:\s*string\]:\s*string\s*\|\s*string\[\]\s*\|\s*undefined\s*\}',
                        'searchParams: Promise<{ [key: string]: string | string[] | undefined }>',
                        content
                    )
                    
                    if new_content != content:
                        # Add await searchParams at the top of the function
                        # Find the first line after { in the function
                        func_match = re.search(r'export default async function\s+(\w+)\s*\(\{', new_content)
                        if func_match:
                            func_start = new_content.find('{', func_match.end()) + 1
                            new_content = new_content[:func_start] + '\n    const filters = await searchParams' + new_content[func_start:]
                            
                            # Replace searchParams.xxx with filters.xxx
                            new_content = new_content.replace('searchParams.', 'filters.')
                            
                        with open(filepath, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        print(f"Updated searchParams in {filepath}")

if __name__ == "__main__":
    fix_search_params()
