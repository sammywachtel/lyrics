import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from .models import UserContext

logger = logging.getLogger(__name__)
security = HTTPBearer()


class AuthService:
    """Authentication service for handling Supabase auth."""

    def __init__(self, supabase_client: Optional[Client]):
        self.supabase = supabase_client

    async def get_current_user(
        self, credentials: HTTPAuthorizationCredentials = Depends(security)
    ) -> UserContext:
        """Extract user context from JWT token."""
        if not self.supabase:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable",
            )

        try:
            token = credentials.credentials

            # For development, allow a test token
            if token == "test-token":
                # Create a test user in the users table if it doesn't exist
                test_user_id = (
                    "550e8400-e29b-41d4-a716-446655440000"  # Valid UUID format
                )
                try:
                    # Check if test user exists
                    user_response = (
                        self.supabase.table("users")
                        .select("*")
                        .eq("id", test_user_id)
                        .execute()
                    )
                    if not user_response.data:
                        # Create test user (bypassing RLS for this operation)
                        self.supabase.table("users").insert(
                            {
                                "id": test_user_id,
                                "email": "test@example.com",
                                "display_name": "Test User",
                            }
                        ).execute()
                except Exception as e:
                    logger.warning(f"Could not create test user: {e}")

                return UserContext(
                    user_id=test_user_id,
                    email="test@example.com",
                    is_authenticated=True,
                )

            # Verify JWT token with Supabase
            try:
                response = self.supabase.auth.get_user(token)

                if not response.user:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid authentication token",
                    )
            except Exception as jwt_error:
                # Handle JWT expiration and other auth errors
                error_msg = str(jwt_error)
                logger.warning(f"JWT verification failed: {error_msg}")

                if (
                    "JWT expired" in error_msg
                    or "PGRST301" in error_msg
                    or "403" in error_msg
                    or "Forbidden" in error_msg
                ):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Session expired",
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication failed",
                    )

            # Ensure user exists in our users table
            user_id = response.user.id
            user_email = response.user.email

            try:
                # Set the JWT token on the existing client for this request
                # This approach avoids the headers error while maintaining proper auth context
                self.supabase.postgrest.auth(token)

                # Check if user exists in our users table
                user_check = (
                    self.supabase.table("users").select("*").eq("id", user_id).execute()
                )

                if not user_check.data:
                    # Create user record in our users table
                    logger.info(f"Creating user record for {user_email}")

                    # Insert the user record - RLS should allow this since auth.uid() = user_id
                    insert_result = (
                        self.supabase.table("users")
                        .insert(
                            {
                                "id": user_id,
                                "email": user_email,
                                "display_name": user_email.split("@")[
                                    0
                                ],  # Use email prefix as display name
                            }
                        )
                        .execute()
                    )

                    logger.info(f"User record created successfully for {user_email}")
                    logger.debug(f"Insert result: {insert_result.data}")

            except Exception as e:
                logger.error(f"Error ensuring user record exists: {e}")
                # Log more detailed error information
                error_details = getattr(e, "details", str(e))
                error_msg = str(e)
                logger.error(f"Detailed error: {error_details}")

                # Check if this is also a JWT expiration issue
                if "JWT expired" in error_msg or "PGRST301" in error_msg:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Session expired",
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to initialize user record",
                    )

            return UserContext(user_id=user_id, email=user_email, is_authenticated=True)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed"
            )


def create_auth_dependency(supabase_client: Optional[Client]):
    """Create authentication dependency with Supabase client."""
    auth_service = AuthService(supabase_client)
    return auth_service.get_current_user
