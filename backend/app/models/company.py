"""
Company-related models and schemas.
Contains all company-related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

from .base import BasePublicList

if TYPE_CHECKING:
    from .user import User
    from .location import City
    from .branch import Branch
    from .industry_type import IndustryType
    from .category import Category


# Shared properties for Company
class CompanyBase(SQLModel):
    """Base company model with shared properties."""
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    industry_type_id: Optional[uuid.UUID] = Field(default=None, foreign_key="industry_type.id", description="Industry type reference")
    category_id: Optional[uuid.UUID] = Field(default=None, foreign_key="category.id", description="Company category reference")
    website: Optional[str] = Field(default=None, max_length=255)
    email: Optional[EmailStr] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    address: Optional[str] = Field(default=None, max_length=255)
    city_id: Optional[uuid.UUID] = Field(default=None, foreign_key="city.id", description="Location city reference")
    # Image fields for S3 storage
    logo_image_key: Optional[str] = Field(default=None, max_length=500, description="S3 key for company logo image")
    logo_image_url: Optional[str] = Field(default=None, max_length=1000, description="S3 URL for company logo image")
    is_active: bool = True


# Properties to receive on company creation
class CompanyCreate(CompanyBase):
    """Schema for company creation via API."""
    pass


# Properties to receive on company update
class CompanyUpdate(CompanyBase):
    """Schema for company updates via API."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)  # type: ignore
    industry_type_id: Optional[uuid.UUID] = Field(default=None)  # type: ignore
    # Exclude image fields from direct updates - they'll be handled by separate endpoints
    logo_image_key: Optional[str] = Field(default=None, exclude=True)  # type: ignore
    logo_image_url: Optional[str] = Field(default=None, exclude=True)  # type: ignore


# Database model, database table inferred from class name
class Company(CompanyBase, table=True):
    """Company database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    
    # Relationships
    creator: Optional["User"] = Relationship()
    location_city: Optional["City"] = Relationship(back_populates="companies")
    branches: List["Branch"] = Relationship(back_populates="company")
    industry_type: Optional["IndustryType"] = Relationship(back_populates="companies")
    category: Optional["Category"] = Relationship(back_populates="companies")


# Properties to return via API, id is always required
class CompanyPublic(CompanyBase):
    """Public company schema for API responses."""
    id: uuid.UUID
    created_by: uuid.UUID


# Enhanced company schema with location and industry details
class CompanyWithDetailsPublic(CompanyBase):
    """Company schema with location and industry information for API responses."""
    id: uuid.UUID
    created_by: uuid.UUID
    city_name: Optional[str] = None
    state_name: Optional[str] = None
    country_name: Optional[str] = None
    city_coordinates: Optional[dict] = None  # {"latitude": float, "longitude": float}
    industry_type_name: Optional[str] = None
    industry_type_code: Optional[str] = None


# Enhanced company schema with all details
class CompanyWithFullDetailsPublic(CompanyBase):
    """Company schema with complete information for API responses."""
    id: uuid.UUID
    created_by: uuid.UUID
    city_name: Optional[str] = None
    state_name: Optional[str] = None
    country_name: Optional[str] = None
    city_coordinates: Optional[dict] = None  # {"latitude": float, "longitude": float}
    industry_type_name: Optional[str] = None
    industry_type_code: Optional[str] = None
    category_name: Optional[str] = None
    category_code: Optional[str] = None
    category_requirements: Optional[dict] = None  # Document requirements based on category


# Legacy schema for backward compatibility
class CompanyWithLocationPublic(CompanyBase):
    """Company schema with location information for API responses."""
    id: uuid.UUID
    created_by: uuid.UUID
    city_name: Optional[str] = None
    state_name: Optional[str] = None
    country_name: Optional[str] = None
    city_coordinates: Optional[dict] = None  # {"latitude": float, "longitude": float}


class CompaniesPublic(BasePublicList):
    """Schema for paginated company list responses."""
    data: List[CompanyPublic]


class CompaniesWithLocationPublic(BasePublicList):
    """Schema for paginated company list responses with location information."""
    data: List[CompanyWithLocationPublic]


class CompaniesWithDetailsPublic(BasePublicList):
    """Schema for paginated company list responses with full details."""
    data: List[CompanyWithDetailsPublic]


class CompaniesWithFullDetailsPublic(BasePublicList):
    """Schema for paginated company list responses with complete details."""
    data: List[CompanyWithFullDetailsPublic]


# New schemas for company registration with user and branch
class CompanyRegistrationUser(SQLModel):
    """Schema for user creation during company registration."""
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: Optional[str] = Field(default=None, max_length=255)


class CompanyRegistrationBranch(SQLModel):
    """Schema for branch creation during company registration."""
    name: str = Field(min_length=1, max_length=255, description="Main branch name")
    code: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = Field(default=None, max_length=255)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    city_id: Optional[uuid.UUID] = Field(default=None, description="Location city reference")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = Field(default=None, max_length=255)
    manager_name: Optional[str] = Field(default=None, max_length=255)


class CompanyRegistrationRequest(SQLModel):
    """Schema for complete company registration with user and branch."""
    # Company information
    company: CompanyCreate
    # User (admin) information
    admin_user: CompanyRegistrationUser
    # Main branch information
    main_branch: CompanyRegistrationBranch
    # Additional metadata
    registration_notes: Optional[str] = Field(default=None, max_length=500)


class CompanyRegistrationStatus:
    """Company registration status enum values."""
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class CompanyRegistrationResponse(SQLModel):
    """Response schema for company registration."""
    company_id: uuid.UUID
    user_id: uuid.UUID
    branch_id: uuid.UUID
    registration_status: str = CompanyRegistrationStatus.PENDING_REVIEW
    message: str
    next_steps: str
