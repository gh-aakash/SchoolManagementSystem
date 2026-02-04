# AWS Deployment Guide: SchoolOS Microservices

This guide details two ways to deploy the SchoolOS platform: the **Automated Terraform way** (Recommended) and the Manual way.

## Phase 1: Infrastructure Setup (Automated)
Use this to set up your entire AWS network and server in 60 seconds.

### Step 1: Install Terraform & AWS CLI
1. Download Terraform from [terraform.io](https://www.terraform.io/downloads).
2. Download AWS CLI from [aws.amazon.com/cli](https://aws.amazon.com/cli/).
3. Add both to your system PATH.

### Step 2: AWS Authentication
Run this in PowerShell:
```powershell
aws configure
```
Enter your Access Key ID, Secret Access Key, and Region (e.g., `us-east-1`).

### Step 3: Provision with Terraform
1. Open terminal in the `terraform/` folder.
2. Run `terraform init`.
3. Create `terraform.tfvars` with your key name:
   ```hcl
   key_name = "your-key-name"
   ```
4. Run `terraform apply`.

---

## Phase 2: Server Configuration (Via Terminal)

### Step 3: Connect to EC2
1.  Open PowerShell on your Windows.
2.  **Fix PEM Permissions (Windows only)**: Run these commands if you get a "bad permissions" error:
    ```powershell
    icacls.exe "SchoolOS-Key.pem" /reset
    icacls.exe "SchoolOS-Key.pem" /grant:r "$($env:username):(R)"
    icacls.exe "SchoolOS-Key.pem" /inheritance:r
    ```
3.  Run: `ssh -i "SchoolOS-Key.pem" ubuntu@<your-ec2-public-ip>`.

### Step 4: Install Docker & Docker Compose
(Terraform handles this automatically, but if doing manually):
1.  Update packages: `sudo apt-get update`.
2.  Install Docker: `sudo apt-get install docker.io docker-compose-v2 -y`.
3.  Add user to docker group: `sudo usermod -aG docker ubuntu`. (Re-login to apply).

---

## Phase 3: Code Deployment

### Step 5: Clone and Setup
1.  Generate SSH Key on EC2: `ssh-keygen -t ed25519 -C "aws-server"` (Press Enter for all).
2.  Add the key to your GitHub Settings > Deploy Keys.
3.  Clone repo: `git clone git@github.com:gh-aakash/SchoolManagementSystem.git`.
4.  Enter folder: `cd SchoolManagementSystem`.
5.  **Switch to Microservices branch**: `git checkout v2-development`.

### Step 6: Create Production Environment
1.  Create file: `nano .env`.
2.  Paste the consolidated `.env` content including Supabase, Razorpay, and Service URLs.

### Step 7: Launch! 🚀
```bash
sudo docker compose up -d --build
```

### Step 8: Verify
- Check containers: `sudo docker ps`.
- Check health: `curl http://localhost:8000/api/identity/health`.
- Access Web: `http://<your-ip>:3000`.
