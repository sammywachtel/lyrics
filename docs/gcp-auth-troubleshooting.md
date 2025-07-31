# Google Cloud Authentication Troubleshooting Guide

## Common Authentication Errors and Solutions

### 1. Permission 'iam.serviceAccounts.getAccessToken' denied

**Error Message:**
```
ERROR: (gcloud.artifacts.repositories.describe) There was a problem refreshing your current auth tokens: ('Unable to acquire impersonated credentials', '{"error": {"code": 403, "message": "Permission 'iam.serviceAccounts.getAccessToken' denied on resource (or it may not exist).", "status": "PERMISSION_DENIED"}}')
```

**Root Cause:** Service account lacks the `Service Account Token Creator` role.

**Solution:**
1. Run the setup script: `./scripts/setup-gcp-auth.sh`
2. Or manually add the role:
   ```bash
   gcloud projects add-iam-policy-binding lyrics-467218 \
     --member="serviceAccount:github-actions-sa@lyrics-467218.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountTokenCreator"
   ```

### 2. Workload Identity Federation Issues

**Error Message:**
```
Error: google-github-actions/auth failed with: failed to generate access token for service account: googleapi: Error 403: Permission denied
```

**Root Cause:** Workload Identity Pool not properly configured or GitHub repository not bound correctly.

**Solution:**
1. Verify the WIF provider resource name:
   ```bash
   gcloud iam workload-identity-pools providers describe github-actions-provider \
     --workload-identity-pool=github-actions-pool \
     --location=global \
     --project=lyrics-467218
   ```

2. Check the principal binding:
   ```bash
   gcloud iam service-accounts get-iam-policy github-actions-sa@lyrics-467218.iam.gserviceaccount.com
   ```

3. Re-run the setup script to fix configuration.

### 3. GitHub Secrets Configuration

**Required GitHub Secrets:**
- `WIF_PROVIDER`: Full resource name from Google Cloud
- `WIF_SERVICE_ACCOUNT`: Service account email
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/publishable key

**Verification:**
Check that secrets are set in GitHub repository settings at:
`https://github.com/YOUR_USERNAME/lyrics/settings/secrets/actions`

### 4. Service Account Roles

**Required IAM Roles:**
- `roles/artifactregistry.admin` - For Docker image management
- `roles/run.admin` - For Cloud Run deployments
- `roles/storage.admin` - For bucket operations
- `roles/iam.serviceAccountTokenCreator` - For token generation
- `roles/iam.serviceAccountUser` - For service account usage
- `roles/cloudbuild.builds.builder` - For build operations (if using Cloud Build)

**Verification:**
```bash
gcloud projects get-iam-policy lyrics-467218 \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:github-actions-sa@lyrics-467218.iam.gserviceaccount.com"
```

### 5. GitHub Actions Workflow Issues

**Common Problems:**
1. **Token Conflicts**: Don't use both WIF and service account key authentication
2. **Token Lifetime**: Set appropriate token lifetime for long deployments
3. **Permission Scopes**: Ensure GitHub Actions has `id-token: write` permission

**Best Practices:**
```yaml
permissions:
  contents: read
  id-token: write    # Required for WIF
  security-events: write

- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
    service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
    token_format: 'access_token'
    access_token_lifetime: '3600s'  # 1 hour for longer deployments
```

## Debugging Commands

### Check Authentication Status
```bash
gcloud auth list
gcloud config list account
```

### Verify Service Account Permissions
```bash
gcloud projects get-iam-policy lyrics-467218 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions-sa@lyrics-467218.iam.gserviceaccount.com"
```

### Test Token Generation
```bash
gcloud auth print-access-token
```

### Verify Workload Identity Configuration
```bash
# List pools
gcloud iam workload-identity-pools list --location=global

# List providers
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool=github-actions-pool \
  --location=global
```

## Manual Fallback (Service Account Key)

If Workload Identity Federation continues to fail, you can temporarily use a service account key:

1. **Create and download key:**
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions-sa@lyrics-467218.iam.gserviceaccount.com
   ```

2. **Add to GitHub Secrets:**
   - Secret name: `GCP_SA_KEY`
   - Value: Contents of `key.json` file

3. **Update workflow:**
   ```yaml
   - name: Authenticate to Google Cloud
     uses: google-github-actions/auth@v2
     with:
       credentials_json: ${{ secrets.GCP_SA_KEY }}
   ```

**⚠️ Security Note:** Service account keys are less secure than WIF. Remove them after fixing WIF.

## Contact and Support

If issues persist:
1. Check Google Cloud Console IAM & Admin sections
2. Review GitHub Actions logs for detailed error messages
3. Verify all environment variables and secrets are correctly set
4. Test authentication locally using `gcloud auth` commands