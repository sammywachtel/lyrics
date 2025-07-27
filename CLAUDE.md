# CLAUDE.md - Songwriting App Codebase Guide

This document provides a comprehensive guide for Claude instances working with the AI-assisted songwriting web application codebase.

## Project Overview

This is a full-stack web application for AI-assisted songwriting with the following architecture:

- **Frontend**: React 19 with TypeScript, Vite, and TailwindCSS
- **Backend**: Python FastAPI with Supabase integration
- **Database**: PostgreSQL via Supabase with Row-Level Security
- **Authentication**: Supabase GoTrue (email/password + OAuth)
- **Deployment**: Docker containers on Google Cloud Run
- **AI Integration**: Planned integration with OpenAI/Gemini APIs

## Project Structure

```
/Users/samwachtel/PycharmProjects/lyrics/
├── frontend/                    # React TypeScript frontend
│   ├── src/
│   │   ├── App.tsx             # Main React component
│   │   ├── main.tsx            # Entry point
│   │   └── assets/             # Static assets
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.ts          # Vite configuration
│   ├── tailwind.config.js      # TailwindCSS configuration
│   └── tsconfig.json           # TypeScript configuration
├── backend/                     # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # FastAPI application entry point
│   │   ├── config.py           # Application settings
│   │   └── __init__.py
│   └── requirements.txt        # Python dependencies
├── database-schema.sql          # Supabase PostgreSQL schema
├── docker-compose.yml           # Local development setup
├── Dockerfile.frontend          # Frontend Docker build
├── Dockerfile.backend           # Backend Docker build
├── nginx.conf                   # Nginx reverse proxy config
├── package.json                # Root package.json for scripts
└── requirements.md              # Comprehensive project requirements
```

## Development Environment Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose
- Supabase account and project

### Environment Variables

Create `.env` files in the backend directory:

```bash
# backend/.env
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_publishable_key_here
```

### Database Setup

1. **Supabase Project Setup**:
   - Create a new Supabase project
   - Run the SQL schema from `/Users/samwachtel/PycharmProjects/lyrics/database-schema.sql`
   - Configure Row-Level Security policies (already included in schema)

2. **Database Schema includes**:
   - `users` table (extends Supabase auth.users)
   - `songs` table for lyric storage
   - `test_records` table for infrastructure testing
   - RLS policies for data security
   - Automatic timestamp triggers

### Running the Development Environment

#### Method 1: Using Docker Compose (Recommended)

```bash
# From project root
docker-compose up --build
```

This starts:
- Frontend on http://localhost:80 (via nginx)
- Backend on http://localhost:8000
- API proxied through nginx at /api/

#### Method 2: Manual Development Setup

```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Root scripts (alternative)
npm run dev  # Runs both frontend and backend concurrently
```

#### Method 3: Using Root Package Scripts

```bash
# Install backend dependencies
npm run backend:install

# Run development environment (both frontend and backend)
npm run dev

# Build frontend only
npm run build

# Start production backend
npm start
```

### Available Scripts

From project root (`/Users/samwachtel/PycharmProjects/lyrics/package.json`):

- `npm run dev` - Start both frontend and backend in development mode
- `npm run frontend:dev` - Start frontend development server only
- `npm run backend:dev` - Start backend development server only
- `npm run build` - Build frontend for production
- `npm run backend:install` - Install Python backend dependencies
- `npm start` - Start production backend server

From frontend directory:

- `npm run dev` - Start Vite development server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technology Stack Details

### Frontend Stack

- **React 19.1.0** - Latest React with TypeScript
- **Vite 7.0.4** - Fast build tool and dev server
- **TailwindCSS 4.1.11** - Utility-first CSS framework
- **TypeScript** - Type safety and better developer experience

### Backend Stack

- **FastAPI 0.116.1** - Modern Python web framework (latest stable)
- **Uvicorn 0.35.0** - ASGI server for FastAPI
- **Pydantic 2.11.7** - Data validation and settings management
- **Pydantic Settings 2.10.1** - Environment-based configuration
- **Supabase Python Client 2.17.0** - Database and auth integration (latest)
- **HTTPX 0.28.1** - Async HTTP client for API calls
- **python-dotenv** - Environment variable management

### Infrastructure Stack

- **Supabase** - PostgreSQL database with built-in auth
- **Docker** - Containerization for consistent deployments
- **Nginx** - Reverse proxy and static file serving
- **Google Cloud Run** - Serverless container deployment

## Key Configuration Files

### Frontend Configuration

- **`/Users/samwachtel/PycharmProjects/lyrics/frontend/vite.config.ts`** - Vite build configuration
- **`/Users/samwachtel/PycharmProjects/lyrics/frontend/tailwind.config.js`** - TailwindCSS customization
- **`/Users/samwachtel/PycharmProjects/lyrics/frontend/tsconfig.json`** - TypeScript compiler options

### Backend Configuration

- **`/Users/samwachtel/PycharmProjects/lyrics/backend/app/config.py`** - Application settings using Pydantic Settings with modern SettingsConfigDict
- **`/Users/samwachtel/PycharmProjects/lyrics/backend/app/main.py`** - FastAPI app with CORS and Supabase client (updated for modern datetime handling)

### Docker Configuration

- **`/Users/samwachtel/PycharmProjects/lyrics/docker-compose.yml`** - Multi-service development environment
- **`/Users/samwachtel/PycharmProjects/lyrics/Dockerfile.frontend`** - Multi-stage build for React app
- **`/Users/samwachtel/PycharmProjects/lyrics/Dockerfile.backend`** - Python FastAPI container
- **`/Users/samwachtel/PycharmProjects/lyrics/nginx.conf`** - Reverse proxy configuration

## API Architecture

### Current API Endpoints

The backend currently provides basic infrastructure endpoints:

- `GET /` - Root endpoint with API information
- `GET /health` - Health check with database connectivity test
- `GET /api/test` - Test endpoint that writes to database

### Planned API Structure

Based on requirements.md, the full API will include:

- **Authentication**: `/auth/*` - Login, signup, OAuth
- **Users**: `/users/*` - Profile management
- **Songs**: `/songs/*` - CRUD operations for songs
- **Versions**: `/songs/{id}/versions/*` - Version control
- **AI**: `/ai/*` - AI-assisted editing and generation
- **Billing**: `/billing/*` - Subscription management (future)

## Database Schema

The current schema (`/Users/samwachtel/PycharmProjects/lyrics/database-schema.sql`) includes:

- **users** table extending Supabase auth
- **songs** table for lyric storage with metadata JSONB field
- **Row-Level Security** policies for data isolation
- **Automatic timestamps** via triggers
- **Performance indexes** on common query patterns

## Deployment

### Docker Deployment

The application is designed for containerized deployment:

1. **Frontend Container**: Multi-stage build with nginx serving static files
2. **Backend Container**: Python FastAPI with uvicorn server
3. **Networking**: Docker compose creates shared network for service communication

### Google Cloud Run Deployment

The app is configured for Google Cloud Run deployment:

- Frontend and backend as separate services
- Environment variables for Supabase configuration
- Health check endpoints for container orchestration

## Development Workflow

### Making Changes

1. **Frontend Changes**: Edit files in `/Users/samwachtel/PycharmProjects/lyrics/frontend/src/`
2. **Backend Changes**: Edit files in `/Users/samwachtel/PycharmProjects/lyrics/backend/app/`
3. **Database Changes**: Update schema in Supabase dashboard or via SQL migrations
4. **Docker Changes**: Modify Dockerfiles or docker-compose.yml as needed

### Testing

- **Backend Health Check**: http://localhost:8000/health
- **Frontend Development**: http://localhost:5173 (Vite dev server)
- **Full Stack**: http://localhost:80 (Docker compose)

## Current Implementation Status

### ✅ Implemented

- Basic FastAPI backend with Supabase integration
- React frontend with TypeScript and TailwindCSS
- Docker containerization for both services
- Database schema with RLS policies
- Development environment setup
- Health check endpoints

### 🚧 In Progress / Placeholder

- Frontend UI is currently the default Vite React template
- API endpoints are minimal (only health check and test endpoint)
- No authentication flow implemented yet
- No AI integration implemented yet

### 📋 Planned Features

Based on `/Users/samwachtel/PycharmProjects/lyrics/requirements.md`:

- User authentication and account management
- Song library with CRUD operations
- Rich-text lyrics editor with section tagging
- AI assistant integration for lyric generation
- Version control and diff highlighting
- Keyword and metaphor management
- Collaboration and sharing features
- Subscription and billing system

## Important Notes for Claude Instances

1. **Database Access**: Always use Supabase client through the FastAPI backend, never direct database connections
2. **Authentication**: Implement auth using Supabase GoTrue, not custom JWT handling
3. **Environment Variables**: All secrets should go in backend/.env, never commit these files
4. **CORS**: Already configured for development ports (3000, 5173), update for production
5. **File Paths**: All paths in this document are absolute paths starting from `/Users/samwachtel/PycharmProjects/lyrics/`
6. **API Design**: Follow REST conventions, use Pydantic models for request/response validation
7. **Frontend State**: Plan for Redux Toolkit or Zustand for state management as the app grows
8. **Mobile Support**: Design with responsive-first approach using TailwindCSS breakpoints
9. **Modern Python**: Code uses latest stable versions - datetime.now(timezone.utc) instead of datetime.utcnow(), SettingsConfigDict for Pydantic settings
10. **Supabase Keys**: Use publishable key (not legacy anon key) for SUPABASE_KEY environment variable

## Getting Help

- **Requirements**: See `/Users/samwachtel/PycharmProjects/lyrics/requirements.md` for comprehensive feature specifications
- **Frontend Docs**: React/Vite/TypeScript documentation
- **Backend Docs**: FastAPI documentation and Supabase Python client docs
- **Database**: Supabase PostgreSQL documentation for advanced queries
- **Deployment**: Docker and Google Cloud Run documentation

This codebase is set up for rapid development of a comprehensive AI-assisted songwriting application with proper separation of concerns, scalable architecture, and modern development practices.