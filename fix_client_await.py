import os

def fix_client_await():
    root_dir = "c:/projects/SchoolManagementSystem/src"
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith((".ts", ".tsx")):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                
                if "'use client'" in content or '"use client"' in content:
                    # Remove 'await' before createClient() in client components
                    new_content = content.replace("await createClient()", "createClient()")
                    if new_content != content:
                        with open(filepath, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        print(f"Removed await from client component: {filepath}")

if __name__ == "__main__":
    fix_client_await()
