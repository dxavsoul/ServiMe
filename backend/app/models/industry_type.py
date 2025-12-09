"""
Industry Type models and schemas.
Contains all industry type related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

from .base import BasePublicList

if TYPE_CHECKING:
    from .company import Company


# Shared properties for IndustryType
class IndustryTypeBase(SQLModel):
    """Base industry type model with shared properties."""
    name: str = Field(min_length=1, max_length=100, unique=True)
    description: Optional[str] = Field(default=None, max_length=500)
    code: Optional[str] = Field(default=None, max_length=20, unique=True)
    is_active: bool = True


# Properties to receive on industry type creation
class IndustryTypeCreate(IndustryTypeBase):
    """Schema for industry type creation via API."""
    pass


# Properties to receive on industry type update
class IndustryTypeUpdate(SQLModel):
    """Schema for industry type updates via API."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    code: Optional[str] = Field(default=None, max_length=20)
    is_active: Optional[bool] = None


# Database model, database table inferred from class name
class IndustryType(IndustryTypeBase, table=True):
    """Industry Type database model."""
    __tablename__ = "industry_type"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    companies: List["Company"] = Relationship(back_populates="industry_type")


# Properties to return via API, id is always required
class IndustryTypePublic(IndustryTypeBase):
    """Public industry type schema for API responses."""
    id: uuid.UUID


class IndustryTypesPublic(BasePublicList):
    """Schema for paginated industry type list responses."""
    data: List[IndustryTypePublic]
