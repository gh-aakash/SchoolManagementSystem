import json
import os

services = [
    "gateway",
    "services/identity",
    "services/sis",
    "services/finance",
    "services/engagement",
    "services/academic",
    "shared"
]

for service in services:
    pkg_path = os.path.join(service, "package.json")
    if os.path.exists(pkg_path):
        with open(pkg_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read().strip()
            # Remove any BOM or weird characters at start
            if content.startswith('\ufeff'):
                content = content[1:]
            try:
                data = json.loads(content)
                with open(pkg_path, "w", encoding="utf-8") as wf:
                    json.dump(data, wf, indent=4)
                print(f"Fixed {pkg_path}")
            except Exception as e:
                print(f"Failed to parse {pkg_path}: {e}")
