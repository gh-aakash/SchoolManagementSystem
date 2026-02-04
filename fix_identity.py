import json
import os

identity_pkg = {
    "name": "identity",
    "version": "1.0.0",
    "main": "index.ts",
    "scripts": {
        "dev": "nodemon index.ts",
        "start": "ts-node index.ts"
    },
    "dependencies": {
        "cors": "^2.8.5",
        "dotenv": "^16.4.7",
        "express": "^4.21.2",
        "shared": "*"
    },
    "devDependencies": {
        "nodemon": "^3.1.9",
        "ts-node": "^10.9.1",
        "typescript": "^5.7.3",
        "@types/express": "^5.0.0",
        "@types/cors": "^2.8.17",
        "@types/node": "^22.13.1"
    }
}

with open("services/identity/package.json", "w", encoding="utf-8") as f:
    json.dump(identity_pkg, f, indent=4)
print("Manually restored services/identity/package.json with UTF-8 encoding")
