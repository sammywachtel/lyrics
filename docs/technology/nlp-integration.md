# NLP Integration Architecture

## Overview

The songwriting application integrates multiple Natural Language Processing (NLP) libraries and datasets to provide sophisticated linguistic analysis. This document details the integration architecture, dependencies, and deployment strategies for the NLP stack.

## Technology Stack

### Core NLP Libraries

#### 1. spaCy (3.7.0+)
- **Purpose**: Part-of-speech tagging, dependency parsing, tokenization
- **Model**: `en_core_web_sm` (Small English model, 13MB)
- **Features**:
  - Token-level POS tagging (NOUN, VERB, ADJ, etc.)
  - Dependency parsing for grammatical relationships
  - Named entity recognition
  - Lemmatization and morphological analysis

#### 2. CMU Pronouncing Dictionary (0.7b)
- **Source**: Carnegie Mellon University
- **Content**: 125,067 English words with phonetic transcriptions
- **Format**: ARPAbet phonemes with stress markers (0, 1, 2)
- **Integration**: Custom `CMUDictionary` service class
- **Location**: `backend/dictionary/cmu_raw/cmudict-0.7b`

#### 3. G2P-en (2.1.0)
- **Purpose**: Grapheme-to-phoneme conversion for unknown words
- **Model**: Neural network trained on English phonological patterns
- **Coverage**: Names, slang, neologisms, technical terms
- **Fallback**: Primary fallback when CMU dictionary lacks entries

#### 4. Pronouncing (0.2.0)
- **Purpose**: Pythonic wrapper for CMU Pronouncing Dictionary
- **Features**: Rhyme detection, meter analysis utilities
- **Integration**: Used for rhyme scheme analysis (planned feature)

## Integration Architecture

### Dependency Verification System

#### NLP Setup Module (`nlp_setup.py`)
```python
def verify_nlp_dependencies() -> dict:
    """Comprehensive NLP component health check."""
    status = {
        "spacy": False,           # spaCy library installed
        "spacy_model": False,     # en_core_web_sm model available
        "g2p_en": False,          # G2P conversion working
        "pronouncing": False,     # CMU wrapper functional
        "cmu_dictionary": False,  # Raw CMU data files present
    }
    # ... verification logic
    return status
```

#### Automatic Model Installation
```python
def ensure_spacy_model_installed(model_name: str = "en_core_web_sm") -> bool:
    """Auto-download spaCy model if missing."""
    try:
        nlp = spacy.load(model_name)
        return True
    except OSError:
        # Attempt automatic download
        subprocess.check_call([
            sys.executable, "-m", "spacy", "download", model_name
        ])
        return spacy.load(model_name) is not None
```

### Component Initialization

#### Stress Analyzer Initialization
```python
class ComprehensiveStressAnalyzer:
    def __init__(self):
        # Load NLP components with error handling
        self.nlp = self._load_spacy_model()
        self.g2p = G2p()
        self.cmu_dict = get_cmu_dictionary()

        # Initialize phoneme mappings and rules
        self._setup_phoneme_mappings()
        self._setup_pos_rules()
```

#### Global Instance Management
```python
# Singleton pattern for expensive NLP components
_stress_analyzer: Optional[ComprehensiveStressAnalyzer] = None

def get_stress_analyzer() -> ComprehensiveStressAnalyzer:
    """Get or create global analyzer instance."""
    global _stress_analyzer
    if _stress_analyzer is None:
        _stress_analyzer = ComprehensiveStressAnalyzer()
    return _stress_analyzer
```

## Data Pipeline Architecture

### Phoneme Resolution Pipeline
```
Word Input → CMU Dictionary → G2P Fallback → Phoneme String
     ↓              ↓              ↓              ↓
"beautiful"  →  Found: B Y UW1... → Skip G2P → "B Y UW1 T AH0 F AH0 L"
"Samantha"   →  Not Found → G2P → "S AH0 M AE1 N TH AH0"
```

### Stress Pattern Extraction
```python
def extract_stress_digits(self, phonemes_str: str) -> List[int]:
    """Extract stress pattern from ARPAbet phonemes."""
    stress_digits = []
    for phoneme in phonemes_str.split():
        match = re.match(r"([A-Z]+)([0-2]?)", phoneme)
        if match:
            base, stress_digit = match.groups()
            if base in self.VOWELS:  # Only vowels carry stress
                stress_digits.append(int(stress_digit) if stress_digit else 0)
    return stress_digits
```

### Character Position Mapping
```python
def map_syllables_to_chars(self, word: str, n_syllables: int) -> List[int]:
    """Map phonetic syllables to orthographic positions."""
    # Find vowel positions for stress mark placement
    vowel_positions = [i for i, char in enumerate(word) if char.lower() in "aeiouy"]

    # Handle orthographic-phonetic mismatches
    if len(vowel_positions) != n_syllables:
        return self._adjust_vowel_mapping(vowel_positions, n_syllables)

    return vowel_positions
```

## Performance Optimization

### Caching Strategies

#### LRU Cache for Phonemes
```python
@lru_cache(maxsize=1000)
def get_phonemes(self, word: str) -> str:
    """Cached phoneme lookup with CMU -> G2P fallback."""
    # Cache prevents repeated expensive G2P calls
    cmu_result = self.cmu_dict.lookup(word.lower())
    return " ".join(cmu_result.phonemes) if cmu_result else self._g2p_fallback(word)
```

#### Dictionary Service Caching
```python
class CMUDictionary:
    def __init__(self):
        self._dictionary: Dict[str, StressPattern] = {}
        self._stats_cache: Optional[Dict] = None

    @lru_cache(maxsize=500)
    def lookup(self, word: str) -> Optional[StressPattern]:
        """Cached dictionary lookup."""
        return self._dictionary.get(word.lower())
```

### Memory Management

#### Lazy Loading
```python
# Models loaded on first use, not at import time
def get_stress_analyzer() -> ComprehensiveStressAnalyzer:
    global _stress_analyzer
    if _stress_analyzer is None:
        logger.info("Initializing NLP components (one-time setup)...")
        _stress_analyzer = ComprehensiveStressAnalyzer()
    return _stress_analyzer
```

#### Resource Monitoring
```python
def get_analyzer_status() -> Dict[str, Any]:
    """Monitor NLP component resource usage."""
    return {
        "cache_size": analyzer.get_phonemes.cache_info().currsize,
        "cache_hits": analyzer.get_phonemes.cache_info().hits,
        "cache_misses": analyzer.get_phonemes.cache_info().misses,
        "memory_usage_mb": self._get_memory_usage(),
    }
```

## Deployment Configuration

### Docker Integration

#### Model Download During Build
```dockerfile
# Install spaCy and download model in Docker build
RUN pip install spacy>=3.7.0
RUN python -m spacy download en_core_web_sm

# Verify model installation
RUN python -c "import spacy; spacy.load('en_core_web_sm')"
```

#### Multi-stage Build Optimization
```dockerfile
# Stage 1: Download and cache models
FROM python:3.11-slim as model-stage
RUN pip install spacy g2p-en
RUN python -m spacy download en_core_web_sm

# Stage 2: Production image with pre-downloaded models
FROM python:3.11-slim
COPY --from=model-stage /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
```

### Environment Configuration

#### Development Setup
```bash
#!/bin/bash
# setup-nlp-dev.sh

echo "Setting up NLP development environment..."

# Install Python dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Verify installation
python -c "
from backend.app.nlp_setup import verify_nlp_dependencies
status = verify_nlp_dependencies()
print('✅ All NLP components ready' if all(status.values()) else '❌ Some components missing')
"
```

#### Production Health Checks
```python
# Health check endpoint for k8s/Cloud Run
@app.get("/api/stress/analyzer-status")
async def get_analyzer_status():
    """NLP component health check for orchestration."""
    try:
        status = verify_nlp_dependencies()
        all_ready = all(status.values())

        return {
            "status": "ready" if all_ready else "degraded",
            "components": status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "ready_for_traffic": all_ready
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "ready_for_traffic": False
        }
```

## Error Handling & Fallbacks

### Graceful Degradation Strategy

#### Component Failure Handling
```python
def analyze_stress_with_fallback(text: str) -> StressAnalysisResult:
    """Stress analysis with graceful fallback."""
    try:
        # Attempt full NLP analysis
        return get_stress_analyzer().analyze_text(text)
    except Exception as nlp_error:
        logger.warning(f"NLP analysis failed: {nlp_error}")

        # Fall back to basic pattern matching
        return BasicStressAnalyzer().analyze_text(text)
```

#### Partial Component Availability
```python
def get_available_analyzer() -> Union[ComprehensiveStressAnalyzer, BasicStressAnalyzer]:
    """Return best available analyzer based on component status."""
    status = verify_nlp_dependencies()

    if all(status.values()):
        return ComprehensiveStressAnalyzer()
    elif status.get("spacy", False):
        return PartialStressAnalyzer()  # spaCy only
    else:
        return BasicStressAnalyzer()    # Pattern matching fallback
```

### Error Messages & Diagnostics

#### User-Friendly Error Reporting
```python
def get_nlp_status_message(status: dict) -> str:
    """Generate helpful error messages for missing components."""
    if all(status.values()):
        return "✅ All NLP components ready"

    missing = [k for k, v in status.items() if not v]
    message = f"⚠️ Missing: {', '.join(missing)}\n\n"

    if "spacy_model" in missing:
        message += "Fix: python -m spacy download en_core_web_sm\n"
    if "g2p_en" in missing:
        message += "Fix: pip install g2p-en==2.1.0\n"

    return message
```

## Integration Testing

### Component Testing Strategy
```python
class TestNLPIntegration:
    def test_spacy_model_loading(self):
        """Test spaCy model loads correctly."""
        nlp = spacy.load("en_core_web_sm")
        doc = nlp("beautiful")
        assert len(doc) == 1
        assert doc[0].pos_ == "ADJ"

    def test_cmu_dictionary_lookup(self):
        """Test CMU dictionary integration."""
        cmu_dict = get_cmu_dictionary()
        result = cmu_dict.lookup("beautiful")
        assert result is not None
        assert result.stress_pattern == [1, 0, 0]

    def test_g2p_fallback(self):
        """Test G2P handles unknown words."""
        g2p = G2p()
        phonemes = g2p("Samantha")  # Name not in CMU
        assert len(phonemes) > 0
```

### Integration Benchmarks
```python
def benchmark_nlp_performance():
    """Performance benchmarks for NLP components."""
    analyzer = get_stress_analyzer()

    # Single word analysis
    start = time.time()
    analyzer.analyze_text("beautiful")
    single_word_ms = (time.time() - start) * 1000

    # Batch processing
    start = time.time()
    for word in ["beautiful", "computer", "analyze", "system"]:
        analyzer.analyze_text(word)
    batch_ms = (time.time() - start) * 1000

    return {
        "single_word_ms": single_word_ms,
        "batch_processing_ms": batch_ms,
        "cache_efficiency": analyzer.get_phonemes.cache_info()
    }
```

## Future Enhancements

### Planned NLP Improvements
- **Advanced Models**: Fine-tuned spaCy models on lyrical text
- **Multi-language Support**: Spanish/French G2P models
- **Context Enhancement**: Sentence-level prosody analysis
- **Custom Training**: Domain-specific stress pattern learning

### Performance Optimizations
- **Model Quantization**: Compressed spaCy models for faster loading
- **Batch Processing**: Vectorized analysis for large texts
- **GPU Support**: CUDA-enabled spaCy models for high-throughput scenarios
- **Distributed Caching**: Redis-backed phoneme cache for scaling

This NLP integration provides the linguistic foundation for accurate prosody analysis in the AI-assisted songwriting platform.
