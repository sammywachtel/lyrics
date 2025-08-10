from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env", case_sensitive=False, extra="ignore"
    )

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8001
    debug: bool = False

    # Supabase settings
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None

    # API settings
    api_title: str = "Songwriting App API"
    api_version: str = "1.0.0"
    api_description: str = "FastAPI backend for AI-assisted songwriting application"

    # CORS settings
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5175",
    ]


settings = Settings()
