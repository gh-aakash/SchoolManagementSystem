import os
import re

def cleanup_corrupted_params():
    root_dir = "c:/projects/SchoolManagementSystem/src/app"
    
    # Target corrupted pattern:
    # const { id } = await params; {
    # const supabase = await createClient()
    # const { id } = params
    
    corrupted_pattern = r'const \{ id \} = await params;\s*\{\s*const supabase = await createClient\(\)\s*const \{ id \} = params'
    fix = r'const { id } = await params\n    const supabase = await createClient()'
    
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(".tsx"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = re.sub(corrupted_pattern, fix, content)
                
                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Cleaned up {filepath}")

if __name__ == "__main__":
    cleanup_corrupted_params()
