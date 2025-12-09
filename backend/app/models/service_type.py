"""
Service Type-related models and schemas.
Contains all service type-related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel

from .base import BasePublicList


# Shared properties for Service Type
class ServiceTypeBase(SQLModel):
    """Base service type model with shared properties."""
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    picture_url: Optional[str] = Field(default=None, max_length=500)
    is_active: bool = True


# Properties to receive on service type creation
class ServiceTypeCreate(ServiceTypeBase):
    """Schema for service type creation via API."""
    pass


# Properties to receive on service type update
class ServiceTypeUpdate(ServiceTypeBase):
    """Schema for service type updates via API."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class ServiceType(ServiceTypeBase, table=True):
    """Service Type database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    
    # Relationships
    creator: Optional["User"] = Relationship()
    services: List["Service"] = Relationship(back_populates="service_type")


# Properties to return via API, id is always required
class ServiceTypePublic(ServiceTypeBase):
    """Public service type schema for API responses."""
    id: uuid.UUID
    created_by: uuid.UUID


class ServiceTypesPublic(BasePublicList):
    """Schema for paginated service type list responses."""
    data: List[ServiceTypePublic]
