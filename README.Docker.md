# Deployment Guide for Songwriting App

This guide explains how to deploy the Songwriting App using both local Docker development and Google Cloud Run production environments.

## Prerequisites

### For Local Development
- Docker Engine (20.10+)
- Docker Compose (2.0+)
- Git

### For Google Cloud Run Deployment
- Google Cloud CLI (`gcloud`)
- Docker Engine (20.10+)
- Active Google Cloud Project with billing enabled
- Environment variables: `GOOGLE_CLOUD_PROJECT`, `SUPABASE_URL`, `SUPABASE_KEY`

## Local Development Environment

The local development environment uses Docker Compose for a containerized development experience with hot-reloading.

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd songwriting-app
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file**
   ```env
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_KEY=your_supabase_publishable_key_here
   ```

4. **Start development environment**
   ```bash
   npm run docker:dev
   ```

### Available Development Commands

```bash
# Start development containers
npm run docker:dev

# Build development containers
npm run docker:dev:build

# Start containers in detached mode
npm run docker:dev:up

# Stop and remove containers
npm run docker:dev:down

# View logs
npm run docker:dev:logs

# Clean up everything (containers, volumes, images)
npm run docker:dev:clean
```

### Accessing the Development Environment

- **Frontend**: http://localhost:5173 (Vite dev server with hot module replacement)
- **Backend API**: http://localhost:8001 (with auto-reloading on code changes)

## Google Cloud Run Production Deployment

The production deployment uses Google Cloud Run for serverless, scalable container hosting.

### Initial Setup

1. **Install Google Cloud CLI**
   ```bash
   # macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate and set up project**
   ```bash
   gcloud auth login
   export GOOGLE_CLOUD_PROJECT=your-project-id
   gcloud config set project $GOOGLE_CLOUD_PROJECT
   ```

3. **Set environment variables**
   ```bash
   export SUPABASE_URL=your_supabase_url_here
   export SUPABASE_KEY=your_supabase_publishable_key_here
   ```

4. **Run setup and deployment**
   ```bash
   # Automated setup and deployment
   ./scripts/deploy-to-gcp.sh
   
   # Or step-by-step:
   npm run gcp:setup
   npm run deploy
   ```

### Available Production Commands

```bash
# Setup Google Cloud services and authentication
npm run gcp:setup

# Deploy both frontend and backend
npm run deploy
npm run gcp:deploy

# Deploy individual services
npm run gcp:deploy:frontend
npm run gcp:deploy:backend

# Build container images
npm run gcp:build
npm run gcp:build:frontend
npm run gcp:build:backend

# View service status
npm run gcp:status

# View logs
npm run gcp:logs:frontend
npm run gcp:logs:backend
```

### Deployment Architecture

The production deployment consists of:

- **Frontend Service**: React app served by Nginx on Cloud Run
  - Port: 80
  - Memory: 512Mi
  - CPU: 1 vCPU
  - Auto-scaling: 0-10 instances

- **Backend Service**: FastAPI Python app on Cloud Run
  - Port: 8001
  - Memory: 1Gi
  - CPU: 1 vCPU
  - Auto-scaling: 0-10 instances

Both services use:
- **Artifact Registry** for container image storage
- **Secret Manager** for secure credential storage
- **Cloud Build** for automated image building and deployment

### Configuration Files

#### Google Cloud Configuration
- `cloudbuild.frontend.yaml`: Cloud Build configuration for frontend
- `cloudbuild.backend.yaml`: Cloud Build configuration for backend
- `cloud-run-services.yaml`: Declarative service configurations
- `scripts/deploy-to-gcp.sh`: Automated deployment script

#### Docker Configuration
- `docker-compose.dev.yml`: Development environment configuration
- `Dockerfile.frontend`: Production frontend container
- `Dockerfile.backend`: Production backend container
- `Dockerfile.dev.frontend`: Development frontend container
- `Dockerfile.dev.backend`: Development backend container

## Environment Variables

### Required for Production
```bash
# Google Cloud
GOOGLE_CLOUD_PROJECT=your-gcp-project-id

# Supabase (stored in Secret Manager for production)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_publishable_key
```

### Optional Configuration
```bash
# Deployment region (default: us-central1)
GCP_REGION=us-central1

# Container registry repository (default: lyrics-app)
GCP_REPOSITORY=lyrics-app
```

## Troubleshooting

### Local Development Issues

1. **Port conflicts**: Ports 5173 and 8001 must be available
   ```bash
   # Check what's using the ports
   lsof -i :5173
   lsof -i :8001
   ```

2. **Container health check failures**
   ```bash
   # Check container logs
   npm run docker:dev:logs
   
   # Check container status
   docker ps
   ```

3. **Volume permission issues**
   ```bash
   # Reset volumes if needed
   npm run docker:dev:clean
   npm run docker:dev:build
   ```

### Google Cloud Run Issues

1. **Authentication errors**
   ```bash
   # Re-authenticate
   gcloud auth login
   gcloud auth application-default login
   ```

2. **Permission errors**
   ```bash
   # Ensure required APIs are enabled
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

3. **Deployment failures**
   ```bash
   # Check build logs in Cloud Console
   # Or view recent builds
   gcloud builds list --limit=5
   
   # View specific build logs
   gcloud builds log BUILD_ID
   ```

4. **Service not responding**
   ```bash
   # Check service status
   npm run gcp:status
   
   # View service logs
   npm run gcp:logs:frontend
   npm run gcp:logs:backend
   ```

### Common Solutions

- **Cold starts**: Cloud Run services may take 10-15 seconds to start from zero instances
- **Environment variables**: Ensure all required variables are set in Secret Manager
- **Container memory**: Increase memory allocation if services are running out of memory
- **Network connectivity**: Verify Supabase URLs are accessible from Cloud Run

## Security Best Practices

### Production Security
- Credentials stored in Google Secret Manager (never in code)
- HTTPS enforced automatically by Cloud Run
- Container images scanned for vulnerabilities
- IAM roles follow principle of least privilege
- VPC connector available for private network access (if needed)

### Development Security
- Environment variables in `.env` file (not committed to git)
- Local containers run with non-root users
- Development database separate from production

## Monitoring and Logging

### Built-in Monitoring
- **Cloud Run**: Automatic request metrics, error rates, latency
- **Cloud Build**: Build success/failure notifications
- **Container Registry**: Vulnerability scanning

### Accessing Logs
```bash
# Real-time logs
npm run gcp:logs:frontend
npm run gcp:logs:backend

# Or in Cloud Console:
# https://console.cloud.google.com/run
```

## Scaling and Performance

### Automatic Scaling
- Scales to zero when not in use (cost-effective)
- Automatically scales up based on request volume
- Configured limits prevent runaway costs

### Performance Optimization
- Multi-stage Docker builds for smaller images
- Nginx for efficient static file serving
- Container image caching for faster deployments
- CDN integration available via Cloud Load Balancer (optional)

## CI/CD Integration

The deployment is designed to integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}
      - run: npm run deploy
```

For complete CI/CD setup, see the `.github/workflows/` directory (if present).