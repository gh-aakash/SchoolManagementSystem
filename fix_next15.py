import os
import re

def fix_files():
    root_dir = "c:/projects/SchoolManagementSystem/src"
    
    # 1. Fix createClient calls
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".ts", ".tsx")):
                filepath = os.path.join(root, file)
                # Skip the file where createClient is defined
                if "lib/supabase/server.ts" in filepath.replace("\\", "/"):
                    continue
                    
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Replace createClient() with await createClient()
                # But only if it's not already awaited
                new_content = re.sub(r'(?<!await\s)createClient\(', 'await createClient(', content)
                
                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Updated createClient in {filepath}")

    # 2. Fix dynamic route params (Next.js 15)
    # Search forPage({ params }: { params: { id: string } })
    # Replace with Page({ params }: { params: Promise<{ id: string }> })
    # And add await params
    
    pattern = r'async function\s+(\w+)\s*\(\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*id\s*:\s*string\s*\}\s*\}\)'
    replacement = r'async function \1({ params }: { params: Promise<{ id: string }> }) {\n    const { id } = await params;'

    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".tsx"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = re.sub(pattern, replacement, content)
                
                # Also handle searchParams if present
                sp_pattern = r'async function\s+(\w+)\s*\(\{\s*params\s*,\s*searchParams\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*id\s*:\s*string\s*\}\s*,\s*searchParams\s*:\s*.*\s*\}\)'
                # This is more complex, let's just do common ones manually if needed or improve regex
                
                if new_content != content:
                    # After adding await params, we need to make sure we don't use params.id anymore
                    new_content = new_content.replace('params.id', 'id')
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Updated params in {filepath}")

if __name__ == "__main__":
    fix_files()
