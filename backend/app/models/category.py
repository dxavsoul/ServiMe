"""
Category models and schemas.
Contains all category related database models, API schemas, and related functionality.
Categories are used to classify companies (e.g., individual professional, company organization)
and determine required documents based on the category type.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

from .base import BasePublicList

if TYPE_CHECKING:
    from .company import Company


# Shared properties for Category
class CategoryBase(SQLModel):
    """Base category model with shared properties."""
    name: str = Field(min_length=1, max_length=100, unique=True)
    description: Optional[str] = Field(default=None, max_length=500)
    code: Optional[str] = Field(default=None, max_length=20, unique=True)
    is_active: bool = True
    # Document requirements configuration
    requires_business_license: bool = False
    requires_tax_id: bool = False
    requires_professional_license: bool = False
    requires_incorporation_docs: bool = False
    requires_personal_id: bool = False
    # Additional metadata
    min_employees: Optional[int] = Field(default=None, description="Minimum number of employees for this category")
    max_employees: Optional[int] = Field(default=None, description="Maximum number of employees for this category")
    sort_order: int = Field(default=0, description="Display order in UI")


# Properties to receive on category creation
class CategoryCreate(CategoryBase):
    """Schema for category creation via API."""
    pass


# Properties to receive on category update
class CategoryUpdate(SQLModel):
    """Schema for category updates via API."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    code: Optional[str] = Field(default=None, max_length=20)
    is_active: Optional[bool] = None
    requires_business_license: Optional[bool] = None
    requires_tax_id: Optional[bool] = None
    requires_professional_license: Optional[bool] = None
    requires_incorporation_docs: Optional[bool] = None
    requires_personal_id: Optional[bool] = None
    min_employees: Optional[int] = None
    max_employees: Optional[int] = None
    sort_order: Optional[int] = None


# Database model, database table inferred from class name
class Category(CategoryBase, table=True):
    """Category database model."""
    __tablename__ = "category"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Relationships
    companies: List["Company"] = Relationship(back_populates="category")


# Properties to return via API, id is always required
class CategoryPublic(CategoryBase):
    """Public category schema for API responses."""
    id: uuid.UUID


# Enhanced category schema with statistics
class CategoryWithStatsPublic(CategoryBase):
    """Category schema with usage statistics for API responses."""
    id: uuid.UUID
    company_count: int = 0  # Number of companies using this category


class CategoriesPublic(BasePublicList):
    """Schema for paginated category list responses."""
    data: List[CategoryPublic]


class CategoriesWithStatsPublic(BasePublicList):
    """Schema for paginated category list responses with statistics."""
    data: List[CategoryWithStatsPublic]
