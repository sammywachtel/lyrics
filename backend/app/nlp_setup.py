"""
NLP setup and verification module.
Ensures spaCy models are properly installed and provides helpful error messages.
"""

import logging
import subprocess
import sys

logger = logging.getLogger(__name__)


def ensure_spacy_model_installed(model_name: str = "en_core_web_sm") -> bool:
    """
    Ensure the spaCy model is installed, attempting to download if missing.

    Args:
        model_name: Name of the spaCy model to check/install

    Returns:
        True if model is available, False otherwise
    """
    try:
        import spacy

        # Try to load the model
        try:
            nlp = spacy.load(model_name)
            logger.info(f"✅ spaCy model '{model_name}' loaded successfully")
            return True
        except OSError:
            logger.warning(
                f"⚠️ spaCy model '{model_name}' not found, attempting to download..."
            )

            # Try to download the model
            try:
                subprocess.check_call(
                    [sys.executable, "-m", "spacy", "download", model_name],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )

                # Try loading again after download
                nlp = spacy.load(model_name)
                logger.info(
                    f"✅ spaCy model '{model_name}' downloaded and loaded successfully"
                )
                return True

            except subprocess.CalledProcessError:
                logger.error(
                    f"❌ Failed to download spaCy model '{model_name}'. "
                    f"In production, ensure the Docker image includes: "
                    f"RUN python -m spacy download {model_name}"
                )
                return False
            except Exception as e:
                logger.error(f"❌ Error downloading spaCy model: {e}")
                return False

    except ImportError:
        logger.error(
            "❌ spaCy is not installed. Add 'spacy>=3.7.0' to requirements.txt"
        )
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error checking spaCy model: {e}")
        return False


def verify_nlp_dependencies() -> dict:
    """
    Verify all NLP dependencies are properly installed.

    Returns:
        Dictionary with status of each component
    """
    status = {
        "spacy": False,
        "spacy_model": False,
        "g2p_en": False,
        "pronouncing": False,
        "cmu_dictionary": False,
    }

    # Check spaCy
    try:
        import spacy

        status["spacy"] = True
        logger.info("✅ spaCy library installed")
    except ImportError:
        logger.error("❌ spaCy library not installed")

    # Check spaCy model
    if status["spacy"]:
        status["spacy_model"] = ensure_spacy_model_installed()

    # Check g2p_en
    try:
        from g2p_en import G2p

        g2p = G2p()
        test_result = g2p("hello")
        status["g2p_en"] = len(test_result) > 0
        logger.info("✅ g2p_en installed and working")
    except ImportError:
        logger.error("❌ g2p_en not installed")
    except Exception as e:
        logger.error(f"❌ g2p_en error: {e}")

    # Check pronouncing
    try:
        import pronouncing

        test_phones = pronouncing.phones_for_word("hello")
        status["pronouncing"] = test_phones is not None
        logger.info("✅ pronouncing library installed")
    except ImportError:
        logger.error("❌ pronouncing library not installed")
    except Exception as e:
        logger.error(f"❌ pronouncing error: {e}")

    # Check CMU dictionary file
    try:
        from pathlib import Path

        cmu_path = (
            Path(__file__).parent.parent / "dictionary" / "cmu_raw" / "cmudict-0.7b"
        )
        status["cmu_dictionary"] = cmu_path.exists()
        if status["cmu_dictionary"]:
            logger.info(f"✅ CMU dictionary found at {cmu_path}")
        else:
            logger.error(f"❌ CMU dictionary not found at {cmu_path}")
    except Exception as e:
        logger.error(f"❌ Error checking CMU dictionary: {e}")

    return status


def get_nlp_status_message(status: dict) -> str:
    """
    Generate a human-readable status message for NLP components.

    Args:
        status: Dictionary from verify_nlp_dependencies()

    Returns:
        Status message string
    """
    all_ok = all(status.values())

    if all_ok:
        return "✅ All NLP components ready for comprehensive stress analysis"

    missing = [k for k, v in status.items() if not v]
    message = f"⚠️ NLP components missing: {', '.join(missing)}\n"

    if "spacy_model" in missing:
        message += "\nTo fix in development:\n"
        message += "  python -m spacy download en_core_web_sm\n"
        message += "\nTo fix in Docker:\n"
        message += "  Add to Dockerfile: RUN python -m spacy download en_core_web_sm\n"

    if "g2p_en" in missing:
        message += "\nTo fix: Add 'g2p-en==2.1.0' to requirements.txt\n"

    if "pronouncing" in missing:
        message += "\nTo fix: Add 'pronouncing==0.2.0' to requirements.txt\n"

    return message


# Run verification on module import
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    status = verify_nlp_dependencies()
    print("\nNLP Dependencies Status:")
    print("-" * 40)
    for component, ok in status.items():
        icon = "✅" if ok else "❌"
        print(f"{icon} {component}: {'Ready' if ok else 'Missing'}")
    print("-" * 40)
    print(get_nlp_status_message(status))
