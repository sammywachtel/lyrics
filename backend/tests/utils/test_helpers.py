"""
Shared test helper functions and utilities for backend tests
Use these helpers across all Python tests for consistency
"""

from datetime import datetime, timezone
from typing import Any, Dict
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient


class MockSupabaseClient:
    """Mock Supabase client for testing"""

    def __init__(self):
        self.table = MagicMock()
        self.auth = MagicMock()
        self.storage = MagicMock()

    def table(self, table_name: str):
        """Mock table method"""
        mock_table = MagicMock()
        mock_table.select.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.update.return_value = mock_table
        mock_table.delete.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.execute.return_value = MagicMock(data=[])
        return mock_table


def create_mock_song(overrides: Dict[str, Any] = None) -> Dict[str, Any]:
    """Factory function to create mock song data"""
    mock_song = {
        "id": "test-song-id",
        "title": "Test Song",
        "content": "[Verse 1]\nTest lyrics here",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "user_id": "test-user-id",
        "metadata": {},
    }

    if overrides:
        mock_song.update(overrides)

    return mock_song


def create_mock_user(overrides: Dict[str, Any] = None) -> Dict[str, Any]:
    """Factory function to create mock user data"""
    mock_user = {
        "id": "test-user-id",
        "email": "test@example.com",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if overrides:
        mock_user.update(overrides)

    return mock_user


class ApiTestClient:
    """Enhanced test client with helper methods"""

    def __init__(self, client: TestClient):
        self.client = client

    def get_json(self, url: str, **kwargs) -> Dict[str, Any]:
        """GET request that returns JSON data"""
        response = self.client.get(url, **kwargs)
        return response.json()

    def post_json(
        self, url: str, json_data: Dict[str, Any], **kwargs
    ) -> Dict[str, Any]:
        """POST request with JSON data"""
        response = self.client.post(url, json=json_data, **kwargs)
        return response.json()

    def assert_status(self, response, expected_status: int):
        """Assert response status with helpful error message"""
        assert (
            response.status_code == expected_status
        ), f"Expected status {expected_status}, got {response.status_code}. Response: {response.text}"

    def assert_json_contains(
        self, response_data: Dict[str, Any], expected_fields: Dict[str, Any]
    ):
        """Assert that JSON response contains expected fields"""
        for field, expected_value in expected_fields.items():
            assert field in response_data, f"Field '{field}' not found in response"
            assert (
                response_data[field] == expected_value
            ), f"Field '{field}' has value {response_data[field]}, expected {expected_value}"


@pytest.fixture
def mock_supabase():
    """Pytest fixture for mock Supabase client"""
    return MockSupabaseClient()


@pytest.fixture
def mock_song():
    """Pytest fixture for mock song data"""
    return create_mock_song()


@pytest.fixture
def mock_user():
    """Pytest fixture for mock user data"""
    return create_mock_user()


def mock_async_context_manager(return_value=None):
    """Helper to create async context manager mocks"""
    mock = AsyncMock()
    mock.__aenter__.return_value = return_value
    mock.__aexit__.return_value = None
    return mock


def assert_datetime_format(date_string: str):
    """Assert that string is in correct ISO datetime format"""
    try:
        datetime.fromisoformat(date_string.replace("Z", "+00:00"))
    except ValueError:
        pytest.fail(f"'{date_string}' is not in valid ISO datetime format")


def assert_valid_uuid(uuid_string: str):
    """Assert that string is a valid UUID"""
    import uuid

    try:
        uuid.UUID(uuid_string)
    except ValueError:
        pytest.fail(f"'{uuid_string}' is not a valid UUID")


class DatabaseTestHelper:
    """Helper class for database-related test operations"""

    @staticmethod
    def create_test_tables():
        """Create test database tables"""
        # Implementation depends on test database setup
        pass

    @staticmethod
    def cleanup_test_data():
        """Clean up test data from database"""
        # Implementation depends on test database setup
        pass


def parametrize_test_cases(test_cases: list):
    """Decorator to parametrize test cases with descriptive names"""

    def decorator(func):
        return pytest.mark.parametrize(
            "test_input,expected",
            test_cases,
            ids=[case.get("id", f"case_{i}") for i, case in enumerate(test_cases)],
        )(func)

    return decorator
