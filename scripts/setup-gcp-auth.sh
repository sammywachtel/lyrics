#!/bin/bash

# Google Cloud Setup Script for GitHub Actions Workload Identity Federation
# This script sets up proper authentication for the songwriting app deployment

set -e

# Configuration - Update these values for your setup
PROJECT_ID="lyrics-467218"
POOL_ID="github-actions-pool"
PROVIDER_ID="github-actions-provider"
SA_NAME="github-actions-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
GITHUB_REPO="sammywachtel/lyrics"  # Update with your actual GitHub repo

echo "🚀 Setting up Google Cloud authentication for GitHub Actions..."
echo "Project ID: $PROJECT_ID"
echo "Service Account: $SA_EMAIL"
echo "GitHub Repository: $GITHUB_REPO"

# Enable required APIs
echo "📡 Enabling required Google Cloud APIs..."
gcloud services enable \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project=$PROJECT_ID

# Create service account if it doesn't exist
echo "👤 Creating/updating service account..."
gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID &>/dev/null || \
gcloud iam service-accounts create $SA_NAME \
  --display-name="GitHub Actions Service Account" \
  --description="Service account for GitHub Actions CI/CD pipeline" \
  --project=$PROJECT_ID

# Grant necessary IAM roles to the service account
echo "🔐 Granting IAM roles to service account..."
ROLES=(
  "roles/artifactregistry.admin"
  "roles/run.admin"
  "roles/storage.admin"
  "roles/iam.serviceAccountTokenCreator"
  "roles/iam.serviceAccountUser"
  "roles/cloudbuild.builds.builder"
)

for role in "${ROLES[@]}"; do
  echo "  Adding role: $role"
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$role" \
    --quiet
done

# Create Workload Identity Pool
echo "🏊 Creating Workload Identity Pool..."
gcloud iam workload-identity-pools describe $POOL_ID \
  --location="global" \
  --project=$PROJECT_ID &>/dev/null || \
gcloud iam workload-identity-pools create $POOL_ID \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  --description="Pool for GitHub Actions authentication" \
  --project=$PROJECT_ID

# Create Workload Identity Provider for GitHub
echo "🔧 Creating Workload Identity Provider..."
gcloud iam workload-identity-pools providers describe $PROVIDER_ID \
  --workload-identity-pool=$POOL_ID \
  --location="global" \
  --project=$PROJECT_ID &>/dev/null || \
gcloud iam workload-identity-pools providers create-oidc $PROVIDER_ID \
  --workload-identity-pool=$POOL_ID \
  --location="global" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$GITHUB_REPO'" \
  --project=$PROJECT_ID

# Allow GitHub Actions to impersonate the service account
echo "🤝 Binding service account to Workload Identity Pool..."
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/$POOL_ID/attribute.repository/$GITHUB_REPO" \
  --project=$PROJECT_ID

# Get Workload Identity Provider resource name
WIF_PROVIDER="projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/$POOL_ID/providers/$PROVIDER_ID"

echo ""
echo "✅ Setup complete! Add these secrets to your GitHub repository:"
echo ""
echo "🔑 GitHub Secrets to add:"
echo "WIF_PROVIDER: $WIF_PROVIDER"
echo "WIF_SERVICE_ACCOUNT: $SA_EMAIL"
echo ""
echo "📋 To add secrets via GitHub CLI:"
echo "gh secret set WIF_PROVIDER --body '$WIF_PROVIDER'"
echo "gh secret set WIF_SERVICE_ACCOUNT --body '$SA_EMAIL'"
echo ""
echo "🌐 Or add them manually at:"
echo "https://github.com/$GITHUB_REPO/settings/secrets/actions"
echo ""
echo "🎉 Your GitHub Actions should now be able to authenticate to Google Cloud!"
