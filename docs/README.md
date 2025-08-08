# Documentation Directory

This directory contains all project documentation organized by category for easy navigation and maintenance.

## Directory Structure

### 📋 Project Management
- **[requirements.md](../requirements.md)** - Master requirements document (kept at root for Claude access)
- **[development-plan.md](project/development-plan.md)** - Phased implementation roadmap

### 🎨 Design & UX
- **[specifications.md](design/specifications.md)** - UI/UX design specifications and component details

### 🚀 Deployment & Infrastructure
- **[docker.md](deployment/docker.md)** - Local Docker development setup
- **[cloud-run.md](deployment/cloud-run.md)** - Google Cloud Run deployment and CI/CD pipeline

### 🛠 Development
- **[CLAUDE.md](../CLAUDE.md)** - Comprehensive codebase guide for Claude instances (kept at root)

## Quick Navigation

### For Developers
1. Start with [CLAUDE.md](../CLAUDE.md) for complete codebase overview
2. Review [requirements.md](../requirements.md) for current implementation status
3. Check [development-plan.md](project/development-plan.md) for upcoming features

### For Designers
1. Reference [specifications.md](design/specifications.md) for UI/UX requirements
2. Check [requirements.md](../requirements.md) for feature priorities

### For DevOps
1. Use [docker.md](deployment/docker.md) for local development setup
2. Reference [cloud-run.md](deployment/cloud-run.md) for production deployment

## Maintenance Notes

- **Critical files remain at root**: `CLAUDE.md` and `requirements.md` stay at project root for Claude instance access
- **Documentation updates**: Update corresponding docs when implementing features
- **Cross-references**: Files reference each other using relative paths for stability