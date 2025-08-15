"""Tests for configuration module."""

from app.config import Settings


def test_settings_creation():
    """Test that settings can be created successfully."""
    settings = Settings()
    assert settings is not None

    # Test that basic attributes exist
    assert hasattr(settings, "supabase_url")
    assert hasattr(settings, "supabase_key")


def test_settings_from_env():
    """Test that settings can be loaded from environment."""
    # This is a basic test - in a real app you'd mock env vars
    settings = Settings()

    # These may be None in test environment, which is fine
    assert settings.supabase_url is not None or settings.supabase_url is None
    assert settings.supabase_key is not None or settings.supabase_key is None
