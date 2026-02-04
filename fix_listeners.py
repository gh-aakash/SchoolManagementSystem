import os

services = [
    "gateway/index.ts",
    "services/identity/index.ts",
    "services/sis/index.ts",
    "services/finance/index.ts",
    "services/engagement/index.ts",
    "services/academic/index.ts"
]

for service_path in services:
    full_path = f"c:/projects/SchoolManagementSystem/{service_path}"
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace app.listen(PORT, ...) with app.listen(PORT, '0.0.0.0', ...)
        # Also ensure PORT is parsed as a number if it comes from env
        # Pattern: app.listen(PORT, () => {
        new_content = content.replace("app.listen(PORT,", "app.listen(Number(PORT), '0.0.0.0',")
        
        if new_content != content:
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {service_path} to listen on 0.0.0.0")
