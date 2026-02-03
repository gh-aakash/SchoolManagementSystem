# Ultra-Micro Step Deployment Guide: SchoolOS on AWS

Follow these steps exactly to deploy your microservices architecture to AWS using EC2 and Docker Compose.

## Prerequisites
1.  **AWS Account**: Active account with administrative access.
2.  **GitHub Repo**: Your code must be pushed to a repository (Private is recommended).
3.  **Supabase & Razorpay**: Credentials from your root `.env` file.

---

## Phase 1: Infrastructure Setup (AWS Console)

### Step 1: Launch EC2 Instance
1.  Log in to [AWS Console](https://console.aws.amazon.com/).
2.  Navigate to **EC2** > **Instances** > **Launch Instance**.
3.  **Name**: `SchoolOS-Microservices`.
4.  **AMI**: Choose `Ubuntu Server 22.04 LTS`.
5.  **Instance Type**: Select `t3.medium` (minimum 4GB RAM recommended for 6 containers).
6.  **Key Pair**: Create or select an existing `.pem` key pair. **Download and save it safely.**
7.  **Network Settings**: 
    - [x] Allow SSH traffic (Port 22).
    - [x] Allow HTTPS traffic (Port 443).
    - [x] Allow HTTP traffic (Port 80).
8.  Click **Launch Instance**.

### Step 2: Configure Security Group (Open Ports)
1.  Go to **EC2** > **Security Groups**.
2.  Select the one created for your instance.
3.  Go to **Inbound Rules** > **Edit inbound rules**.
4.  Add a rule: **Custom TCP**, Port `8000` (Gateway), Source: `0.0.0.0/0`.
5.  Add a rule: **Custom TCP**, Port `3000` (Next.js), Source: `0.0.0.0/0`.
6.  **Save Rules**.

---

## Phase 2: Server Configuration (Via Terminal)

### Step 3: Connect to EC2
1.  Open PowerShell on your Windows 10.
2.  Run: `ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>`.

### Step 4: Install Docker & Docker Compose
1.  Update packages: `sudo apt-get update`.
2.  Install Docker: `sudo apt-get install docker.io -y`.
3.  Install Docker Compose: `sudo apt-get install docker-compose-v2 -y`.
4.  Add user to docker group: `sudo usermod -aG docker $USER`.
5.  **Exit and Re-connect** via SSH for group changes to take effect.

---

## Phase 3: Code Deployment

### Step 5: Clone and Setup
1.  Generate SSH Key on EC2: `ssh-keygen -t rsa -b 4096`.
2.  Add the key to your GitHub Settings > SSH Keys.
3.  Clone repo: `git clone <your-repo-ssh-url>`.
4.  Enter folder: `cd SchoolManagementSystem`.

### Step 6: Create Production Environment
1.  Create file: `nano .env`.
2.  **Copy-paste** your local `.env` values (Supabase, Razorpay, etc.).
3.  Save and Exit: `Ctrl+O`, `Enter`, `Ctrl+X`.

### Step 7: Launch System
1.  Build and run: `docker compose up -d --build`.
2.  Verify containers are running: `docker ps`.

---

## Phase 4: CI/CD Flow (GitHub Actions)

### Step 8: Setup GitHub Secrets
1.  Go to your GitHub Repo > **Settings** > **Secrets and variables** > **Actions**.
2.  Add `EC2_SSH_KEY`: Paste the contents of your `.pem` file.
3.  Add `EC2_HOST`: Your EC2 Public IP.
4.  Add `EC2_USER`: `ubuntu`.

### Step 9: Create Workflow File
1.  Create locally: `.github/workflows/deploy.yml`.
2.  Add logic to SSH into EC2 and run `git pull && docker compose up -d --build`.

---

## Phase 5: Domain & SSL (Optional but Recommended)
1.  Point your domain to the EC2 Public IP using an **A Record**.
2.  Install **Nginx** and **Certbot** on EC2 to handle Port 80 -> 3000/8000 mapping and SSL.
