import os

dockerfiles = [
    "gateway/Dockerfile",
    "services/identity/Dockerfile",
    "services/sis/Dockerfile",
    "services/finance/Dockerfile",
    "services/engagement/Dockerfile",
    "services/academic/Dockerfile",
    "Dockerfile.frontend",
    "Dockerfile.service"
]

for df in dockerfiles:
    if os.path.exists(df):
        with open(df, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace npm install with npm install --legacy-peer-deps
        new_content = content.replace("RUN npm install", "RUN npm install --legacy-peer-deps")
        
        if new_content != content:
            with open(df, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {df} with --legacy-peer-deps")

# Also check for any service package.json that might have the wrong resolver version if I copied it there
for root, dirs, files in os.walk("services"):
    if "package.json" in files:
        pkg_path = os.path.join(root, "package.json")
        with open(pkg_path, "r", encoding="utf-8") as f:
            content = f.read()
        if '"@hookform/resolvers": "^1.9.2"' in content:
            new_content = content.replace('"@hookform/resolvers": "^1.9.2"', '"@hookform/resolvers": "^3.9.2"')
            with open(pkg_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Fixed @hookform/resolvers in {pkg_path}")
