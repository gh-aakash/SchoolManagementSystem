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
        
        # Update node version
        new_content = content.replace("FROM node:18-alpine", "FROM node:20-alpine")
        
        if new_content != content:
            with open(df, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {df}")
