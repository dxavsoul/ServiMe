"""
Base models and common schemas for the application.
Contains shared components, utility models, and common response schemas.
"""

from typing import Optional
from sqlmodel import SQLModel


# Generic message
class Message(SQLModel):
    """Generic message response model."""
    message: str


# Base response model for paginated results
class BasePublicList(SQLModel):
    """Base model for paginated list responses."""
    count: int
