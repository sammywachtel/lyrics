import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client, create_client

from .auth import create_auth_dependency
from .config import settings
from .dictionary import (
    analyze_contextual_stress,
    get_cmu_dictionary,
    lookup_stress_pattern,
)
from .songs import create_songs_router
from .stress_analysis import (
    analyze_stress,
    get_stress_analyzer,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client with error handling
supabase: Optional[Client] = None
supabase_available = False


def initialize_supabase() -> Optional[Client]:
    """Initialize Supabase client with proper error handling."""
    global supabase_available

    try:
        # Get credentials from environment or settings
        supabase_url = os.getenv("SUPABASE_URL") or settings.supabase_url
        supabase_key = os.getenv("SUPABASE_KEY") or settings.supabase_key

        if not supabase_url or not supabase_key:
            logger.warning(
                "Supabase credentials not provided. Running without database connection."
            )
            return None

        # Test the credentials by creating a client
        client = create_client(supabase_url, supabase_key)

        # Test connection with a simple query
        try:
            # This will validate the client can connect
            _ = client.table("users").select("count").limit(1).execute()  # noqa: F841
            supabase_available = True
            logger.info("Supabase client initialized successfully")
            return client
        except Exception as test_error:
            logger.warning(
                f"Supabase client created but connection test failed: {test_error}"
            )
            # Return client anyway as it might work for other operations
            supabase_available = False
            return client

    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        supabase_available = False
        return None


# Initialize Supabase
supabase = initialize_supabase()

# Initialize authentication
get_current_user = create_auth_dependency(supabase)

# Include routers
songs_router = create_songs_router(supabase, get_current_user)
app.include_router(songs_router)


@app.get("/")
async def root() -> Dict[str, Any]:
    """Root endpoint."""
    return {
        "message": "Songwriting App API",
        "version": "1.0.0",
        "status": "running",
        "framework": "FastAPI",
    }


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint with database connectivity test."""
    timestamp = datetime.now(timezone.utc).isoformat()

    if supabase is None:
        return {
            "status": "healthy",
            "timestamp": timestamp,
            "database": "not_configured",
            "framework": "FastAPI",
            "message": "API is running without database connection",
        }

    try:
        # Test database connection by querying users table
        _ = supabase.table("users").select("count").limit(1).execute()  # noqa: F841

        return {
            "status": "healthy",
            "timestamp": timestamp,
            "database": "connected",
            "framework": "FastAPI",
        }
    except Exception as e:
        return {
            "status": "degraded",
            "timestamp": timestamp,
            "database": "disconnected",
            "error": str(e),
            "framework": "FastAPI",
            "message": "API is running but database is unavailable",
        }


# Dictionary API endpoints
@app.get("/api/dictionary/stress/{word}")
async def get_word_stress(word: str) -> Dict[str, Any]:
    """Get stress pattern for a word from CMU dictionary."""
    try:
        pattern = lookup_stress_pattern(word)

        if pattern is None:
            return {
                "word": word,
                "found": False,
                "message": "Word not found in CMU dictionary",
            }

        return {
            "word": word,
            "found": True,
            "syllables": pattern.syllables,
            "stress_pattern": pattern.stress_pattern,
            "phonemes": pattern.phonemes,
            "confidence": pattern.confidence,
        }

    except Exception as e:
        logger.error(f"Dictionary lookup error for '{word}': {e}")
        raise HTTPException(
            status_code=500, detail=f"Dictionary lookup failed: {str(e)}"
        )


@app.get("/api/dictionary/stats")
async def get_dictionary_stats() -> Dict[str, Any]:
    """Get CMU dictionary statistics."""
    try:
        dict_service = get_cmu_dictionary()
        stats = dict_service.get_stats()

        return {
            "status": "loaded",
            "statistics": stats,
            "message": "CMU Pronouncing Dictionary ready",
        }

    except Exception as e:
        logger.error(f"Dictionary stats error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Dictionary stats failed: {str(e)}"
        )


@app.post("/api/dictionary/contextual-stress")
async def analyze_word_in_context(request: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze contextual stress for a word based on its sentence context."""
    try:
        word = request.get("word", "").strip()
        context = request.get("context", "").strip()
        position = request.get("position", 0)

        if not word or not context:
            raise HTTPException(
                status_code=400,
                detail="Both 'word' and 'context' are required",
            )

        stress_result = analyze_contextual_stress(word, context, position)

        if stress_result is None:
            return {
                "word": word,
                "context": context,
                "is_contextual": False,
                "message": f"'{word}' is not a contextual word",
            }

        return {
            "word": word,
            "context": context,
            "is_contextual": True,
            "stressed": stress_result,
            "explanation": "Determined by grammatical function analysis",
            "confidence": 0.8,  # Good confidence for rule-based analysis
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Contextual analysis error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Contextual analysis failed: {str(e)}"
        )


# --- Comprehensive Stress Analysis Endpoints ---


@app.post("/api/stress/analyze")
async def analyze_text_stress(request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Comprehensive stress analysis for lyrics using spaCy POS tagging,
    CMU dictionary lookup, and G2P fallback.

    Request body:
    {
        "text": "I don't know where there are going to be problems",
        "context": "lyrical"  # Optional: "lyrical" or "conversational"
    }
    """
    try:
        text = request.get("text", "").strip()
        context = request.get("context", "lyrical")

        if not text:
            raise HTTPException(status_code=400, detail="Text is required")

        # Perform comprehensive analysis
        result = analyze_stress(text, context)

        # Convert to API response format
        return {
            "text": result.text,
            "total_syllables": result.total_syllables,
            "stressed_syllables": result.stressed_syllables,
            "processing_time_ms": result.processing_time_ms,
            "words": [
                {
                    "word": word.word,
                    "pos": word.pos,
                    "syllables": word.syllables,
                    "stress_pattern": word.stress_pattern,
                    "reasoning": word.reasoning,
                    "char_positions": word.char_positions,
                    "confidence": word.confidence,
                }
                for word in result.words
            ],
        }

    except Exception as e:
        logger.error(f"Comprehensive stress analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Stress analysis failed: {str(e)}")


@app.post("/api/stress/analyze-batch")
async def analyze_batch_stress(request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Batch stress analysis for multiple lines of lyrics.

    Request body:
    {
        "lines": ["Walking down the street", "Feeling so complete"],
        "context": "lyrical"
    }
    """
    try:
        lines = request.get("lines", [])
        context = request.get("context", "lyrical")

        if not lines or not isinstance(lines, list):
            raise HTTPException(status_code=400, detail="Lines array is required")

        results = []
        total_processing_time = 0

        for line_number, text in enumerate(lines, 1):
            if not text.strip():
                continue

            result = analyze_stress(text.strip(), context)
            total_processing_time += result.processing_time_ms

            results.append(
                {
                    "line_number": line_number,
                    "text": result.text,
                    "total_syllables": result.total_syllables,
                    "stressed_syllables": result.stressed_syllables,
                    "processing_time_ms": result.processing_time_ms,
                    "words": [
                        {
                            "word": word.word,
                            "pos": word.pos,
                            "syllables": word.syllables,
                            "stress_pattern": word.stress_pattern,
                            "reasoning": word.reasoning,
                            "char_positions": word.char_positions,
                            "confidence": word.confidence,
                        }
                        for word in result.words
                    ],
                }
            )

        return {
            "total_lines": len(results),
            "total_processing_time_ms": total_processing_time,
            "lines": results,
        }

    except Exception as e:
        logger.error(f"Batch stress analysis error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Batch stress analysis failed: {str(e)}"
        )


@app.get("/api/stress/analyzer-status")
async def get_analyzer_status() -> Dict[str, Any]:
    """Get status of the comprehensive stress analyzer components."""
    try:
        from .nlp_setup import get_nlp_status_message, verify_nlp_dependencies

        # Check NLP dependencies first
        nlp_status = verify_nlp_dependencies()
        all_nlp_ready = all(nlp_status.values())

        if not all_nlp_ready:
            return {
                "status": "error",
                "message": get_nlp_status_message(nlp_status),
                "components": nlp_status,
                "analyzer_loaded": False,
            }

        # Try to initialize analyzer if NLP components are ready
        analyzer = get_stress_analyzer()

        # Test components
        components = {
            **nlp_status,  # Include NLP dependency status
            "total_words": len(analyzer.cmu_dict._dictionary),
            "cache_size": analyzer.get_phonemes.cache_info().currsize,
            "cache_hits": analyzer.get_phonemes.cache_info().hits,
            "cache_misses": analyzer.get_phonemes.cache_info().misses,
        }

        return {
            "status": "ready",
            "components": components,
            "message": "Comprehensive stress analyzer fully loaded",
            "analyzer_loaded": True,
        }

    except Exception as e:
        logger.error(f"Analyzer status error: {e}")
        return {
            "status": "error",
            "message": f"Analyzer initialization failed: {str(e)}",
            "components": {},
            "analyzer_loaded": False,
        }


# --- Test Endpoints ---


@app.get("/api/test")
async def test_endpoint() -> Dict[str, Any]:
    """Test endpoint that adds a record to the database."""
    if supabase is None:
        return {
            "message": "Test endpoint accessible but database not configured",
            "framework": "FastAPI",
            "database": "not_configured",
        }

    try:
        # Insert a test record
        response = (
            supabase.table("test_records")
            .insert(
                {
                    "message": "Hello from Google Cloud with FastAPI!",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .execute()
        )

        return {
            "message": "Test successful - record added to database",
            "data": response.data,
            "framework": "FastAPI",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Test failed",
                "details": str(e),
                "framework": "FastAPI",
            },
        )


@app.post("/api/test-songs")
async def test_songs_endpoint() -> Dict[str, Any]:
    """Test endpoint for songs table without RLS."""
    if supabase is None:
        return {"message": "Database not configured", "framework": "FastAPI"}

    try:
        # Test song creation
        song_data = {
            "id": str(__import__("uuid").uuid4()),
            "user_id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Test Song",
            "content": "Test lyrics content",
            "metadata": {
                "artist": "Test Artist",
                "tags": ["test"],
                "status": "draft",
            },
            "is_archived": False,
        }

        response = supabase.table("songs").insert(song_data).execute()

        return {
            "message": "Test song created successfully",
            "data": response.data,
            "framework": "FastAPI",
        }
    except Exception as e:
        return {
            "error": "Failed to create test song",
            "details": str(e),
            "framework": "FastAPI",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
