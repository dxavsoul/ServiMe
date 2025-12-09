"""
Service-related models and schemas.
Contains all service-related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List
from decimal import Decimal
from sqlmodel import Field, Relationship, SQLModel
import sqlalchemy as sa

from .base import BasePublicList


# Shared properties for Service
class ServiceBase(SQLModel):
    """Base service model with shared properties."""
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    picture_url: Optional[str] = Field(default=None, max_length=500)
    price: Optional[Decimal] = Field(default=None, max_digits=10, decimal_places=2)
    duration_minutes: Optional[int] = Field(default=None, ge=0)
    is_active: bool = True
    # Promotion fields
    has_promotion: bool = False
    promotion_description: Optional[str] = Field(default=None, max_length=500)
    promotion_discount_percentage: Optional[Decimal] = Field(
        default=None, ge=0, le=100, max_digits=5, decimal_places=2
    )
    promotion_start_date: Optional[str] = Field(default=None)  # ISO date string
    promotion_end_date: Optional[str] = Field(default=None)  # ISO date string


# Properties to receive on service creation
class ServiceCreate(ServiceBase):
    """Schema for service creation via API."""
    department_id: uuid.UUID
    service_type_id: uuid.UUID


# Properties to receive on service update
class ServiceUpdate(ServiceBase):
    """Schema for service updates via API."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)  # type: ignore
    department_id: Optional[uuid.UUID] = None
    service_type_id: Optional[uuid.UUID] = None


# Database model, database table inferred from class name
class Service(ServiceBase, table=True):
    """Service database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    department_id: uuid.UUID = Field(
        foreign_key="department.id", nullable=False, ondelete="CASCADE"
    )
    service_type_id: uuid.UUID = Field(
        foreign_key="servicetype.id", nullable=False, ondelete="CASCADE"
    )
    created_by: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    
    # Relationships
    department: Optional["Department"] = Relationship(back_populates="services")
    service_type: Optional["ServiceType"] = Relationship(back_populates="services")
    creator: Optional["User"] = Relationship()


# Properties to return via API, id is always required
class ServicePublic(ServiceBase):
    """Public service schema for API responses."""
    id: uuid.UUID
    department_id: uuid.UUID
    service_type_id: uuid.UUID
    created_by: uuid.UUID


# Properties to return via API with related information
class ServiceWithDetailsPublic(ServiceBase):
    """Service schema with department and service type information for API responses."""
    id: uuid.UUID
    department_id: uuid.UUID
    service_type_id: uuid.UUID
    created_by: uuid.UUID
    department_name: str
    service_type_name: str


class ServicesPublic(BasePublicList):
    """Schema for paginated service list responses."""
    data: List[ServicePublic]


# Response model for services with detailed information
class ServicesWithDetailsPublic(BasePublicList):
    """Schema for paginated service list responses with detailed information."""
    data: List[ServiceWithDetailsPublic]
