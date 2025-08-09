"""
CMU Pronouncing Dictionary service for stress pattern lookup.
Provides accurate syllable and stress information for multi-syllable words.
"""

import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from functools import lru_cache

@dataclass
class StressPattern:
    """Represents stress pattern information for a word."""
    word: str
    syllables: List[str]
    stress_pattern: List[int]  # 0=unstressed, 1=primary stress, 2=secondary stress
    phonemes: List[str]
    confidence: float = 1.0  # CMU dictionary entries have high confidence

class CMUDictionary:
    """CMU Pronouncing Dictionary parser and lookup service."""
    
    def __init__(self, dict_path: Optional[str] = None):
        if dict_path is None:
            # Default path relative to backend root
            dict_path = Path(__file__).parent.parent / "dictionary" / "cmu_raw" / "cmudict-0.7b"
        
        self.dict_path = Path(dict_path)
        self._dictionary: Dict[str, StressPattern] = {}
        self._load_dictionary()
    
    def _load_dictionary(self) -> None:
        """Load and parse the CMU dictionary file."""
        print(f"Loading CMU dictionary from {self.dict_path}")
        
        if not self.dict_path.exists():
            raise FileNotFoundError(f"CMU dictionary not found at {self.dict_path}")
        
        entries_loaded = 0
        
        with open(self.dict_path, 'r', encoding='latin-1') as file:
            for line in file:
                line = line.strip()
                
                # Skip comments and empty lines
                if not line or line.startswith(';;;'):
                    continue
                
                # Parse dictionary entry: WORD  PHONEME1 PHONEME2 ...
                parts = line.split()
                if len(parts) < 2:
                    continue
                
                word = parts[0]
                phonemes = parts[1:]
                
                # Skip variant pronunciations (e.g., WORD(1), WORD(2))
                if '(' in word:
                    continue
                
                # Convert to lowercase for consistent lookup
                word_key = word.lower()
                
                # Extract stress pattern and syllables from phonemes
                stress_pattern = self._extract_stress_pattern(phonemes)
                syllables = self._phonemes_to_syllables(word_key, phonemes)
                
                self._dictionary[word_key] = StressPattern(
                    word=word_key,
                    syllables=syllables,
                    stress_pattern=stress_pattern,
                    phonemes=phonemes
                )
                
                entries_loaded += 1
        
        print(f"Loaded {entries_loaded} dictionary entries")
    
    def _extract_stress_pattern(self, phonemes: List[str]) -> List[int]:
        """Extract stress pattern from phonemes (0, 1, 2 for unstressed, primary, secondary)."""
        stress_pattern = []
        
        for phoneme in phonemes:
            # Check if phoneme ends with stress marker (0, 1, 2)
            if phoneme[-1].isdigit():
                stress_level = int(phoneme[-1])
                stress_pattern.append(stress_level)
        
        return stress_pattern
    
    def _phonemes_to_syllables(self, word: str, phonemes: List[str]) -> List[str]:
        """Convert phonemes back to approximate syllables for the word."""
        # Count vowel sounds (phonemes ending with stress markers)
        vowel_count = sum(1 for p in phonemes if p[-1].isdigit())
        
        if vowel_count <= 1:
            return [word]
        
        # Simple syllable approximation: divide word by vowel count
        word_length = len(word)
        syllable_length = word_length / vowel_count
        
        syllables = []
        for i in range(vowel_count):
            start = int(i * syllable_length)
            end = int((i + 1) * syllable_length) if i < vowel_count - 1 else word_length
            syllables.append(word[start:end])
        
        return syllables
    
    @lru_cache(maxsize=10000)
    def lookup(self, word: str) -> Optional[StressPattern]:
        """Look up stress pattern for a word."""
        word_key = word.lower().strip()
        return self._dictionary.get(word_key)
    
    def get_stress_pattern(self, word: str) -> Optional[List[int]]:
        """Get just the stress pattern for a word."""
        pattern = self.lookup(word)
        return pattern.stress_pattern if pattern else None
    
    def has_word(self, word: str) -> bool:
        """Check if word exists in dictionary."""
        return word.lower().strip() in self._dictionary
    
    def get_stats(self) -> Dict[str, int]:
        """Get dictionary statistics."""
        return {
            "total_words": len(self._dictionary),
            "words_with_stress": sum(1 for p in self._dictionary.values() if any(s > 0 for s in p.stress_pattern))
        }

# Global dictionary instance
_cmu_dict: Optional[CMUDictionary] = None

def get_cmu_dictionary() -> CMUDictionary:
    """Get or create the global CMU dictionary instance."""
    global _cmu_dict
    if _cmu_dict is None:
        _cmu_dict = CMUDictionary()
    return _cmu_dict

def lookup_stress_pattern(word: str) -> Optional[StressPattern]:
    """Convenience function to lookup stress pattern."""
    return get_cmu_dictionary().lookup(word)