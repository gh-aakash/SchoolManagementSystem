# 🏆 GitHub Actions Master Setup Guide: SchoolOS

This guide provides the **exact microsteps** to connect your GitHub repository to your AWS EC2 instance for "Butter Smooth" 🧈 automated deployments.

---

## 🏗️ Phase 1: Prepare your AWS EC2 Instance

Before GitHub can talk to your server, your server needs to be ready.

### 1.1 Find your Public IP Address
1.  Log in to the **AWS Management Console**.
2.  Search for **EC2** and click "Instances (running)".
3.  Click on your instance (likely named `SchoolOS-Server`).
4.  In the **Details** tab, look for **Public IPv4 address**.
    *   **Action**: Copy this IP (e.g., `44.223.84.14`).

### 1.2 Open Firewall (Security Groups)
GitHub Actions needs to connect via **SSH (Port 22)**.
1.  In the same EC2 instance page, click the **Security** tab.
2.  Click the link under **Security Groups** (e.g., `sg-0abc123...`).
3.  Click **Edit inbound rules**.
4.  Ensure there is a rule for:
    *   **Type**: SSH
    *   **Protocol**: TCP
    *   **Port Range**: 22
    *   **Source**: `0.0.0.0/0` (or restricted to GitHub IP ranges for max security).

---

## 🔐 Phase 2: Set up GitHub Secrets

GitHub needs your "ID and Password" (SSH Key) to log into AWS. We store these as **Secrets**.

### 2.1 Navigate to Secrets
1.  Open your repository on GitHub.
2.  Click the **Settings** tab (top right menu).
3.  On the left sidebar, scroll down to **Secrets and variables** → click **Actions**.

### 2.2 Add the 3 Essential Secrets
Click the green button **"New repository secret"** for each of these:

| Secret Name | Microsteps |
| :--- | :--- |
| **`SERVER_IP`** | Paste the IP address you copied in Step 1.1. |
| **`SERVER_USER`** | Type `ubuntu` (this is the default for AWS Ubuntu instances). |
| **`SSH_PRIVATE_KEY`** | Open your `.pem` file (e.g., `schoolos.pem`) in Notepad. **Copy EVERYTHING** (even the `-----BEGIN...` and `-----END...` lines) and paste it here. |

---

## 📄 Phase 3: The Automation Workflow

I have already created the configuration file for you in the codebase at `.github/workflows/deploy.yml`. 

### 3.1 Verify the trigger
Ensure your code is on the **`v2-development`** branch. The automation is set to run **only** when you push to this specific branch.

```yaml
on:
  push:
    branches:
      - v2-development
```

---

## 🚀 Phase 4: Your First Automated Deployment

### 4.1 Push your changes
Run these commands in your local terminal:
```bash
git add .
git commit -m "chore: trigger first butter-smooth deployment"
git push origin v2-development
```

### 4.2 Watch the Magic Happen
1.  Go to your GitHub repository.
2.  Click the **Actions** tab.
3.  You will see a live workflow named **"Deploy SchoolOS"**.
4.  Click on it to see the logs. If it turns **Green**, your server has been updated! 🥳

---

## 🛠️ Troubleshooting (If it turns Red 🔴)

| Issue | Solution |
| :--- | :--- |
| **Permission Denied** | Ensure the `SSH_PRIVATE_KEY` in GitHub Secrets includes the header and footer lines. |
| **Connection Timeout** | Double-check Step 1.2 (Security Groups). Port 22 must be open. |
| **Directory not found** | Ensure the project is cloned at `~/SchoolManagementSystem` on the server. If it's elsewhere, update line 20 in `.github/workflows/deploy.yml`. |

---

> [!TIP]
> **Pro Tip**: You can check the health of your services after deployment by visiting `http://your-ip:3000/dashboard/health`. This ensures the Docker build was 100% successful! 🧈🚀
