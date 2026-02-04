import os
import re

def fix_broken_search_params():
    root_dir = "c:/projects/SchoolManagementSystem/src/app"
    
    # Target corrupted pattern (found in student page and fee collect page)
    # export default async function StudentsPage({
    #     searchParams,
    # }: {
    #     const filters = await searchParams
    #     searchParams: Promise<{ [key: string]: string | string[] | undefined }>
    # }) {
    
    corrupted_pattern = r'export\s+default\s+async\s+function\s+(\w+)\s*\(\{\s*searchParams,\s*\}\s*:\s*\{\s*const\s+filters\s+=\s+await\s+searchParams\s+searchParams:\s+Promise<[^>]+>\s*\}\)\s*\{'
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".tsx"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Check for the specific mess I made
                if "const filters = await searchParams" in content and "}: {" in content:
                    # Let's use a simpler string replacement for the known broken files
                    
                    # 1. Fix the type block
                    content = content.replace("const filters = await searchParams", "")
                    
                    # 2. Add the await inside the function
                    # Find functional start
                    func_regex = r'export\s+default\s+async\s+function\s+(\w+)\s*\(\{\s*searchParams,?\s*\}\s*:\s*\{[^}]*\}\)\s*\{'
                    match = re.search(func_regex, content)
                    if match:
                        body_start = match.end()
                        if "const filters = await searchParams" not in content[body_start:body_start+100]:
                            content = content[:body_start] + "\n    const filters = await searchParams" + content[body_start:]
                    
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Repaired {filepath}")

if __name__ == "__main__":
    fix_broken_search_params()
