"""
Branch-related models and schemas.
Contains all branch-related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
import sqlalchemy as sa

from .base import BasePublicList

if TYPE_CHECKING:
    from .company import Company
    from .user import User
    from .branch_user import BranchUserLink
    from .location import City


# Shared properties for Branch
class BranchBase(SQLModel):
    """Base branch model with shared properties."""
    name: str = Field(min_length=1, max_length=255)
    code: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = Field(default=None, max_length=255)
    postal_code: Optional[str] = Field(default=None, max_length=20)
    city_id: Optional[uuid.UUID] = Field(default=None, foreign_key="city.id", description="Location city reference")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Specific latitude coordinate (if different from city center)")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Specific longitude coordinate (if different from city center)")
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = Field(default=None, max_length=255)
    manager_name: Optional[str] = Field(default=None, max_length=255)
    is_active: bool = True


# Properties to receive on branch creation
class BranchCreate(BranchBase):
    """Schema for branch creation via API."""
    company_id: uuid.UUID


# Properties to receive on branch update
class BranchUpdate(BranchBase):
    """Schema for branch updates via API."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)  # type: ignore
    company_id: Optional[uuid.UUID] = None


# Database model, database table inferred from class name
class Branch(BranchBase, table=True):
    """Branch database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(
        foreign_key="company.id", nullable=False, ondelete="CASCADE"
    )
    created_by: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    
    # Relationships
    company: Optional["Company"] = Relationship(back_populates="branches")
    creator: Optional["User"] = Relationship()
    location_city: Optional["City"] = Relationship(back_populates="branches")
    user_assignments: List["BranchUserLink"] = Relationship(back_populates="branch")


# Properties to return via API, id is always required
class BranchPublic(BranchBase):
    """Public branch schema for API responses."""
    id: uuid.UUID
    company_id: uuid.UUID
    created_by: uuid.UUID


# Properties to return via API with company information
class BranchWithCompanyPublic(BranchBase):
    """Branch schema with company information for API responses."""
    id: uuid.UUID
    company_id: uuid.UUID
    created_by: uuid.UUID
    company_name: str


# Properties to return via API with location information
class BranchWithLocationPublic(BranchBase):
    """Branch schema with location information for API responses."""
    id: uuid.UUID
    company_id: uuid.UUID
    created_by: uuid.UUID
    location_city: Optional[dict] = None  # Will contain CityPublic data


# Properties to return via API with both company and location information
class BranchWithDetailsPublic(BranchBase):
    """Branch schema with full details for API responses."""
    id: uuid.UUID
    company_id: uuid.UUID
    created_by: uuid.UUID
    company_name: str
    location_city: Optional[dict] = None  # Will contain CityPublic data


class BranchesPublic(BasePublicList):
    """Schema for paginated branch list responses."""
    data: List[BranchPublic]


# Response model for branches with company information
class BranchesWithCompanyPublic(BasePublicList):
    """Schema for paginated branch list responses with company information."""
    data: List[BranchWithCompanyPublic]


# Response model for branches with location information
class BranchesWithLocationPublic(BasePublicList):
    """Schema for paginated branch list responses with location information."""
    data: List[BranchWithLocationPublic]


# Response model for branches with full details
class BranchesWithDetailsPublic(BasePublicList):
    """Schema for paginated branch list responses with full details."""
    data: List[BranchWithDetailsPublic]
