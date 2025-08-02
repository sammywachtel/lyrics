#!/bin/bash

# Deploy Lyrics App to Google Cloud Run
# Usage: ./scripts/deploy-to-gcp.sh [environment]
# Environment: dev, staging, prod (default: prod)

set -e

# Configuration
ENVIRONMENT=${1:-prod}
PROJECT_ID=${GOOGLE_CLOUD_PROJECT}
REGION="us-central1"
REPOSITORY="lyrics-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if [ -z "$PROJECT_ID" ]; then
        log_error "GOOGLE_CLOUD_PROJECT environment variable is not set."
        log_info "Set it with: export GOOGLE_CLOUD_PROJECT=your-project-id"
        exit 1
    fi
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "You are not authenticated with gcloud."
        log_info "Run: gcloud auth login"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup Google Cloud services
setup_gcp_services() {
    log_info "Setting up Google Cloud services..."
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    log_info "Enabling required APIs..."
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    
    # Create Artifact Registry repository if it doesn't exist
    if ! gcloud artifacts repositories describe $REPOSITORY --location=$REGION &> /dev/null; then
        log_info "Creating Artifact Registry repository..."
        gcloud artifacts repositories create $REPOSITORY \
            --repository-format=docker \
            --location=$REGION \
            --description="Docker repository for Lyrics App"
    fi
    
    # Configure Docker authentication
    gcloud auth configure-docker ${REGION}-docker.pkg.dev
    
    log_success "Google Cloud services setup complete"
}

# Create secrets
create_secrets() {
    log_info "Setting up secrets..."
    
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
        log_warning "SUPABASE_URL and SUPABASE_KEY environment variables not set."
        log_info "Secrets will need to be created manually in Google Secret Manager:"
        log_info "  - supabase-url"
        log_info "  - supabase-key"
        return
    fi
    
    # Create secrets if they don't exist
    if ! gcloud secrets describe supabase-url &> /dev/null; then
        echo -n "$SUPABASE_URL" | gcloud secrets create supabase-url --data-file=-
        log_success "Created supabase-url secret"
    fi
    
    if ! gcloud secrets describe supabase-key &> /dev/null; then
        echo -n "$SUPABASE_KEY" | gcloud secrets create supabase-key --data-file=-
        log_success "Created supabase-key secret"
    fi
}

# Deploy services
deploy_services() {
    log_info "Deploying services to Cloud Run..."
    
    # Deploy backend
    log_info "Deploying backend service..."
    gcloud run deploy lyrics-backend \
        --source . \
        --region $REGION \
        --allow-unauthenticated \
        --port 8001 \
        --cpu 1 \
        --memory 1Gi \
        --min-instances 0 \
        --max-instances 10 \
        --set-env-vars NODE_ENV=production \
        --set-secrets SUPABASE_URL=supabase-url:latest,SUPABASE_KEY=supabase-key:latest \
        --timeout 300 \
        --concurrency 80
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe lyrics-backend --region $REGION --format 'value(status.url)')
    log_success "Backend deployed at: $BACKEND_URL"
    
    # Deploy frontend
    log_info "Deploying frontend service..."
    gcloud run deploy lyrics-frontend \
        --source . \
        --region $REGION \
        --allow-unauthenticated \
        --port 8080 \
        --cpu 1 \
        --memory 512Mi \
        --min-instances 0 \
        --max-instances 10 \
        --set-env-vars NODE_ENV=production,VITE_BACKEND_URL=$BACKEND_URL \
        --timeout 300 \
        --concurrency 80
    
    # Get frontend URL
    FRONTEND_URL=$(gcloud run services describe lyrics-frontend --region $REGION --format 'value(status.url)')
    log_success "Frontend deployed at: $FRONTEND_URL"
}

# Display deployment information
show_deployment_info() {
    log_info "Deployment Summary:"
    echo "=================="
    echo "Environment: $ENVIRONMENT"
    echo "Project ID: $PROJECT_ID"
    echo "Region: $REGION"
    echo ""
    
    # Get service URLs
    BACKEND_URL=$(gcloud run services describe lyrics-backend --region $REGION --format 'value(status.url)' 2>/dev/null || echo "Not deployed")
    FRONTEND_URL=$(gcloud run services describe lyrics-frontend --region $REGION --format 'value(status.url)' 2>/dev/null || echo "Not deployed")
    
    echo "Services:"
    echo "  Frontend: $FRONTEND_URL"
    echo "  Backend:  $BACKEND_URL"
    echo ""
    
    echo "Useful commands:"
    echo "  View logs: npm run gcp:logs:frontend or npm run gcp:logs:backend"
    echo "  Check status: npm run gcp:status"
    echo "  Redeploy: npm run deploy"
}

# Main execution
main() {
    log_info "Starting deployment to Google Cloud Run..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Project: $PROJECT_ID"
    
    check_prerequisites
    setup_gcp_services
    create_secrets
    deploy_services
    show_deployment_info
    
    log_success "Deployment completed successfully! 🎉"
}

# Run main function
main "$@"