# Zero-Cost CI/CD Guide (GitHub Actions + SSH) 🚀

This guide outlines how to set up a fully automated deployment pipeline for **SchoolOS** without spending a single penny on extra services (like ECR, ArgoCD, or paid runners).

## 🛠️ Architecture
- **CI**: GitHub Actions (Free tier - 2,000 mins/month)
- **CD**: Direct SSH Deployment to your existing AWS EC2 instance.
- **Process**: Code Push → GitHub Action runs → SSH into EC2 → Git Pull → Docker Build → Docker Up.

---

## Step 1: Prepare GitHub Secrets 🔐

Go to your GitHub Repository → **Settings** → **Secrets and variables** → **Actions** and add the following **New repository secrets**:

| Secret Name | Value |
| :--- | :--- |
| `SERVER_IP` | `44.223.84.14` |
| `SERVER_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | Paste the entire content of your `.pem` file |

---

## Step 2: Create the Workflow File 📄

Create a file at `.github/workflows/deploy.yml` with the following content:

```yaml
name: Deploy SchoolOS

on:
  push:
    branches:
      - v2-development

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to AWS EC2 via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/SchoolManagementSystem
            
            # 1. Update Code
            git fetch origin
            git reset --hard origin/v2-development
            
            # 2. Build and Restart Containers
            # We use --build to ensure code changes are picked up
            sudo docker compose down
            sudo docker compose up -d --build
            
            # 3. Cleanup unused images to save disk space
            sudo docker image prune -f
```

---

## Step 3: Trigger the First Deployment 🚀

1.  **Commit and Push**:
    ```bash
    git add .github/workflows/deploy.yml
    git commit -m "feat: add zero-cost ci/cd via github actions"
    git push origin v2-development
    ```
2.  **Monitor**: Go to the **Actions** tab in your GitHub repository. You will see the "Deploy SchoolOS" workflow running.

---

## Why this is "Free"? 💰
1.  **GitHub Actions**: 2,000 minutes/month are included for free. Building on your own server (via SSH) consumes almost zero GitHub minutes (only the few seconds it takes to send the SSH commands).
2.  **No ECR**: We build the images *on the server itself* instead of paying for a Container Registry.
3.  **No ArgoCD**: We skip the overhead of a Kubernetes/GitOps stack which would require a larger (paid) EC2 instance.

---

## Pro Tip: Disk Space 💾
Since we are building on the server, Docker images can eat up disk space quickly. The `docker image prune -f` command in the script ensures that old, unused images are deleted after every successful deployment.
