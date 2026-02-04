# CI/CD Automation Guide: GitHub Actions & Argo CD

This guide outlines the professional path to automate your SchoolOS deployment using **GitHub Actions** (CI) and **Argo CD** (CD) via a **GitOps** workflow.

> [!NOTE]
> **Important Distinction**: Argo CD is designed specifically for **Kubernetes**. To use it, we would move from Docker Compose (single EC2) to **AWS EKS** (Elastic Kubernetes Service).

---

## High-Level Workflow
1. **Developer**: Pushes code to `v2-development`.
2. **CI (GitHub Actions)**: Automatically builds Docker images for all 7 services and pushes them to **AWS ECR** (Elastic Container Registry).
3. **Manifest Update**: GitHub Actions updates a separate **GitOps Repository** with the new image tags.
4. **CD (Argo CD)**: Detects the change in the GitOps repo and synchronized (deploys) the new versions to the cluster.

---

## Step-by-Step Implementation

### Phase 1: Continuous Integration (CI)
*Goal: Automate image building and registry storage.*

1.  **Create AWS ECR Repositories**: Create 7 repositories in AWS (one for each service: `sis`, `identity`, `gateway`, etc.).
2.  **Setup GitHub Secrets**: In your main repo, add:
    - `AWS_ACCESS_KEY_ID`
    - `AWS_SECRET_ACCESS_KEY`
    - `AWS_REGION`
3.  **Create GitHub Action Workflow**: Create `.github/workflows/ci.yml`:
    - Use `aws-actions/amazon-ecr-login` to authenticate.
    - Use a strategy matrix to build all 7 Dockerfiles.
    - Tag images with the commit SHA (e.g., `sis:v1.2.0-abc123`).
    - Push to ECR.

### Phase 2: The GitOps Repository
*Goal: Separate your code from your deployment configurations.*

1.  **Create a New Repo**: Name it something like `schoolos-gitops`.
2.  **Define Kubernetes Manifests**: Inside this repo, create folders for each service containing:
    - `deployment.yaml` (Defines how to run the container).
    - `service.yaml` (Defines networking/load balancing).
    - `ingress.yaml` (Defines the URL).
3.  **Kustomize**: Use Kustomize to manage environment-specific tags (Dev vs Prod).

### Phase 3: Continuous Delivery (Argo CD)
*Goal: Automatically sync the server to the GitOps repo.*

1.  **Install Argo CD**: Install the Argo CD operator on your Kubernetes cluster.
2.  **Connect GitOps Repo**: Link Argo CD to your `schoolos-gitops` repository.
3.  **Create "Application"**: Tell Argo CD which folder in the GitOps repo defines which service.
4.  **Auto-Sync**: Enable "Automatic Pruning" and "Self-Healing".
    - *Now, anytime the GitOps repo changes, the server updates itself instantly.*

---

## Phase 4: Final Automation (The Glue)

1.  **The "Image Updater"**: Update your **CI pipeline** (Step 1) to execute a final step:
    - It clones the `schoolos-gitops` repo.
    - It runs `kustomize edit set image ...` to use the new ECR image tag.
    - It commits and pushes back to the GitOps repo.
2.  **The Result**: You just push code, and 5 minutes later, the live cluster is updated without you ever touching a terminal.

---

## Comparison: Current vs Future

| Feature | Current (Docker Compose) | Future (Argo CD + K8s) |
| :--- | :--- | :--- |
| **Scaling** | Manual (Vertical) | Automatic (Horizontal) |
| **Updates** | Manual `git pull` & `up` | Automatic GitOps Sync |
| **Self-Healing** | basic Docker restart | Advanced K8s Re-scheduling |
| **Monitoring** | `docker logs` | Argo CD UI + Prometheus/Grafana |

---

### Which one should you pick?
If you want to keep costs low and stay on a single EC2, we can skip Argo CD and use a simpler **GitHub Action + SSH** script. If you want a production-grade enterprise setup, go the **Argo CD** route!
