"""
Authentication and security related models.
Contains token, password, and authentication-related schemas.
"""

from typing import Optional
from sqlmodel import Field, SQLModel


# JSON payload containing access token
class Token(SQLModel):
    """Authentication token response model."""
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    """JWT token payload structure."""
    sub: Optional[str] = None


class NewPassword(SQLModel):
    """Model for password reset requests."""
    token: str
    new_password: str = Field(min_length=8, max_length=40)


class UpdatePassword(SQLModel):
    """Model for password update requests."""
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)
