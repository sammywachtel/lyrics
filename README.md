# 🎵 AI-Assisted Songwriting Platform

A comprehensive web application for AI-assisted songwriting with **professional-grade linguistic analysis** and prosody tools. Built with React 19, FastAPI, and advanced NLP processing for accurate stress detection and rhythm analysis.

## ✨ Key Features

### 🧠 **Comprehensive Stress Analysis System**
- **spaCy POS Tagging**: Grammatical context-aware stress detection
- **CMU Dictionary Integration**: 125,067 words with accurate stress patterns
- **G2P Fallback**: Grapheme-to-phoneme conversion for unknown words (names, slang)
- **Contextual Analysis**: "there is" (unstressed) vs "over there" (stressed)
- **Contraction Processing**: Proper handling of 's, 're, 've, 'll, n't

### 📝 **Rich Text Editor**
- **Lexical.js Framework**: Professional-grade rich text editing
- **Section Tagging**: Verse, Chorus, Bridge detection and formatting
- **Real-time Analysis**: Live syllable counting and stress marking
- **WYSIWYG Interface**: Visual feedback with prosody indicators

### 🎼 **Prosody & Rhythm Tools**
- **Syllable Counting**: Accurate syllable detection with stress patterns
- **Rhyme Analysis**: Automatic rhyme scheme detection
- **Meter Analysis**: Rhythm and timing insights
- **Stress Mark Placement**: Visual stress indicators over vowels

### 🤖 **AI Integration Ready**
- **API Architecture**: Built for OpenAI/Gemini integration
- **Structured Data**: Lyrics stored as structured JSON for AI processing
- **Export Formats**: LLM-friendly text export for AI analysis
- **Constraint System**: AI behavior controls to assist, not replace, creativity

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Python 3.11+**
- **Docker and Docker Compose** (recommended)
- **Supabase Account** for database

### 🐳 **Option 1: Docker Compose (Recommended)**

```bash
# Clone the repository
git clone https://github.com/sammywachtel/lyrics.git
cd lyrics

# Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials

# Start the development environment
docker-compose up --build
```

**Services Available:**
- **Frontend**: http://localhost:80 (via nginx)
- **Backend API**: http://localhost:8001
- **Health Check**: http://localhost:8001/health

### ⚡ **Option 2: Local Development**

```bash
# Install and run backend
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm  # Required for stress analysis
uvicorn app.main:app --reload --port 8001

# Install and run frontend (new terminal)
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173

# Or use root scripts
npm run dev  # Runs both frontend and backend
```

---

## 🏗️ Architecture

### **Frontend (React 19 + TypeScript)**
```
frontend/
├── src/
│   ├── components/lexical/          # Rich text editor components
│   │   ├── plugins/                 # Lexical plugins for prosody analysis
│   │   ├── nodes/                   # Custom Lexical nodes (sections, stress marks)
│   │   └── ui/                      # UI components for editor
│   ├── services/stressAnalysis.ts   # Backend API communication
│   ├── utils/prosodyAnalysis.ts     # Client-side prosody utilities
│   └── styles/prosody.css           # Prosody visualization styles
```

### **Backend (FastAPI + Python)**
```
backend/
├── app/
│   ├── main.py                      # FastAPI application + API endpoints
│   ├── stress_analysis.py           # Comprehensive stress analysis service
│   ├── dictionary.py                # CMU dictionary integration
│   ├── nlp_setup.py                # NLP dependency verification
│   ├── models.py                    # Pydantic data models
│   └── songs.py                     # Song CRUD operations
└── dictionary/cmu_raw/              # CMU Pronouncing Dictionary (125K words)
```

### **Key API Endpoints**
- **`POST /api/stress/analyze`**: Single text stress analysis
- **`POST /api/stress/analyze-batch`**: Batch analysis for multiple lines
- **`GET /api/stress/analyzer-status`**: NLP component health check
- **`GET /api/dictionary/stress/{word}`**: CMU dictionary lookup
- **`POST /api/songs/`**: Song CRUD operations

---

## 🧪 Testing

### **Frontend Testing (Jest + React Testing Library)**
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

**Test Coverage:**
- ✅ 46 tests covering stress analysis utilities
- ✅ Component behavior and user interactions
- ✅ Edge cases and boundary conditions
- ✅ API integration and error handling

### **Backend Testing**
```bash
cd backend

# Run health check
curl http://localhost:8001/health

# Test stress analysis API
curl -X POST http://localhost:8001/api/stress/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I dont know where there are going to be problems"}'

# Check NLP component status
curl http://localhost:8001/api/stress/analyzer-status
```

---

## 📚 Documentation

### **Main Documentation**
- **[Development Guide](DEVELOPMENT.md)** - Setup, workflow, testing
- **[Requirements Specification](requirements.md)** - Complete feature specifications
- **[Architecture Overview](docs/architecture/)** - Scalability and design decisions

### **Specialized Documentation**
- **[Design Specifications](docs/design/specifications.md)** - UI/UX implementation details
- **[Deployment Guides](docs/deployment/)** - Docker and Cloud Run setup
- **[Project Planning](docs/project/development-plan.md)** - Implementation roadmap
- **[Stress Analysis System](docs/technology/stress-analysis.md)** - Comprehensive linguistic analysis documentation
- **[NLP Integration](docs/technology/nlp-integration.md)** - spaCy, CMU dictionary, and G2P integration details

### **Developer Resources**
- **[API Documentation](backend/SONG_SETTINGS_API.md)** - Backend API reference
- **[Rich Text Design Spec](frontend/RICH_TEXT_DESIGN_SPEC.md)** - Editor implementation
- **[Claude AI Instructions](CLAUDE.md)** - AI development context

---

## 🔬 Linguistic Technology

### **Stress Analysis Pipeline**
```
Input Text → spaCy POS Tagging → CMU Dictionary Lookup → G2P Fallback → Stress Pattern
     ↓              ↓                    ↓                    ↓             ↓
"beautiful" → ADJ → B Y UW1 T AH0 F AH0 L → [1,0,0] → BEAUtiful (visual marks)
```

### **3-Tier Detection System**
1. **Monosyllables**: POS-based rules (NOUN/VERB=stressed, DET/ADP=unstressed)
2. **Multisyllables**: CMU dictionary stress patterns (125,067 words)
3. **Unknown Words**: G2P (Grapheme-to-Phoneme) conversion fallback

### **Advanced Features**
- **Contextual Analysis**: Grammatical context affects stress patterns
- **Prosodic Smoothing**: Prevents awkward stress clusters
- **Character Position Mapping**: Accurate stress mark placement
- **Confidence Scoring**: 0.95 for CMU data, 0.8 for G2P fallback

---

## 🚀 Deployment

### **Development Environment**
```bash
# Quick setup script
./setup-dev.sh

# Manual setup
npm run dev                    # Start both frontend and backend
npm run backend:install        # Install Python dependencies
npm run test                   # Run all tests
```

### **Production Deployment (Google Cloud Run)**
```bash
# Deploy backend
gcloud builds submit --config cloudbuild.backend.yaml

# Deploy frontend
gcloud builds submit --config cloudbuild.frontend.yaml

# Health checks
curl https://your-backend-url/api/stress/analyzer-status
```

**Production Features:**
- ✅ **Automatic spaCy model installation** during Docker build
- ✅ **Comprehensive health monitoring** and diagnostics
- ✅ **Graceful fallback** when NLP components unavailable
- ✅ **Performance monitoring** with processing time tracking

---

## 💻 Technology Stack

### **Frontend**
- **React 19** with TypeScript and Vite
- **Lexical.js** for rich text editing
- **TailwindCSS** for styling
- **Jest + React Testing Library** for testing

### **Backend**
- **FastAPI** with Python 3.11
- **spaCy 3.7+** for NLP and POS tagging
- **CMU Pronouncing Dictionary** (125,067 words)
- **g2p_en** for grapheme-to-phoneme conversion
- **Supabase** for database and authentication

### **Infrastructure**
- **Docker** for containerization
- **Google Cloud Run** for serverless deployment
- **Nginx** for reverse proxy and static files
- **PostgreSQL** via Supabase with Row-Level Security

---

## 🔧 Configuration

### **Environment Variables**

**Backend (`backend/.env`):**
```bash
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_publishable_key_here
```

**Frontend (`frontend/.env.local`):**
```bash
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_URL=http://localhost:8001
```

### **Database Setup**
1. Create a Supabase project
2. Run the SQL schema from `database-schema.sql`
3. Configure Row-Level Security policies (included in schema)

---

## 🤝 Contributing

### **Development Workflow**
1. **Check Requirements**: Consult `requirements.md` for specifications
2. **Create Feature Branch**: `git checkout -b feature/your-feature`
3. **Write Tests**: All new functionality requires comprehensive tests
4. **Run Quality Gates**: `npm test` and `npm run lint` must pass
5. **Update Documentation**: Keep docs/ and README.md current
6. **Create Pull Request**: Include detailed testing instructions

### **Quality Standards**
- ✅ **Test Coverage**: All new features must include tests
- ✅ **TypeScript**: Strict typing for frontend code
- ✅ **Python Standards**: Black formatting, isort, type hints
- ✅ **Pre-commit Hooks**: Automated quality checks
- ✅ **Documentation**: Keep specifications and guides updated

---

## 📈 Performance

### **Stress Analysis Benchmarks**
- **Single word analysis**: ~5-15ms
- **Batch analysis (5 lines)**: ~25-100ms
- **CMU dictionary lookup**: ~1-2ms (cached)
- **G2P fallback processing**: ~10-30ms
- **Frontend rendering**: <100ms for typical lyrics

### **Scalability**
- **Current capacity**: ~1,000 concurrent users
- **With optimizations**: ~10,000 concurrent users
- **Database performance**: Optimized JSONB indexing
- **Caching strategy**: LRU cache for phoneme lookups

---

## 📞 Support

### **Documentation**
- **[Development Guide](DEVELOPMENT.md)** for setup and workflow
- **[Architecture Docs](docs/)** for system design
- **[API Reference](backend/)** for backend integration

### **Troubleshooting**
- **Stress analyzer not ready**: Check `/api/stress/analyzer-status`
- **spaCy model missing**: Run `python -m spacy download en_core_web_sm`
- **Build failures**: Ensure Node 18+ and Python 3.11+
- **Test failures**: Check test environment setup

### **Health Checks**
- **Backend**: `GET /health` - Database connectivity
- **NLP Status**: `GET /api/stress/analyzer-status` - Component health
- **Frontend**: Browser console for API connection issues

---

## 📄 License

This project is proprietary software for AI-assisted songwriting research and development.

---

**Built with ❤️ for songwriters, musicians, and language enthusiasts who appreciate the intersection of technology and creativity.**
