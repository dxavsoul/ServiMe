"""
Customer related models and schemas.
Contains all customer-related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

from .base import BasePublicList

if TYPE_CHECKING:
    from .service_request import ServiceRequest


# Shared properties for Customer
class CustomerBase(SQLModel):
    """Base customer model with shared properties."""
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    full_name: str = Field(min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Customer latitude coordinate (-90 to 90)")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Customer longitude coordinate (-180 to 180)")
    is_active: bool = True


# Properties to receive on customer registration
class CustomerRegister(SQLModel):
    """Schema for customer registration."""
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str = Field(min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)


# Properties to receive on customer creation by admin
class CustomerCreate(CustomerBase):
    """Schema for customer creation via API."""
    password: str = Field(min_length=8, max_length=40)


# Properties to receive on customer update
class CustomerUpdate(CustomerBase):
    """Schema for customer updates via API."""
    email: Optional[EmailStr] = Field(default=None, max_length=255)  # type: ignore
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)  # type: ignore
    password: Optional[str] = Field(default=None, min_length=8, max_length=40)


# Properties for customer to update their own profile
class CustomerUpdateMe(SQLModel):
    """Schema for customers to update their own profile."""
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)


# Database model, database table inferred from class name
class Customer(CustomerBase, table=True):
    """Customer database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    service_requests: List["ServiceRequest"] = Relationship(back_populates="customer")


# Properties to return via API, id is always required
class CustomerPublic(CustomerBase):
    """Public customer schema for API responses."""
    id: uuid.UUID


class CustomersPublic(BasePublicList):
    """Schema for paginated customer list responses."""
    data: List[CustomerPublic]
