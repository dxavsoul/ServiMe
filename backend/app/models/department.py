"""
Department-related models and schemas.
Contains all department-related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List
from sqlmodel import Field, Relationship, SQLModel
import sqlalchemy as sa

from .base import BasePublicList


# Shared properties for Department
class DepartmentBase(SQLModel):
    """Base department model with shared properties."""
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    is_active: bool = True


# Properties to receive on department creation
class DepartmentCreate(DepartmentBase):
    """Schema for department creation via API."""
    branch_id: uuid.UUID


# Properties to receive on department update
class DepartmentUpdate(DepartmentBase):
    """Schema for department updates via API."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)  # type: ignore
    branch_id: Optional[uuid.UUID] = None


# Database model, database table inferred from class name
class Department(DepartmentBase, table=True):
    """Department database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    branch_id: uuid.UUID = Field(
        foreign_key="branch.id", nullable=False, ondelete="CASCADE"
    )
    created_by: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    
    # Relationships
    branch: Optional["Branch"] = Relationship()
    creator: Optional["User"] = Relationship()
    services: List["Service"] = Relationship(back_populates="department")
    hours: List["DepartmentHours"] = Relationship(back_populates="department")


# Properties to return via API, id is always required
class DepartmentPublic(DepartmentBase):
    """Public department schema for API responses."""
    id: uuid.UUID
    branch_id: uuid.UUID
    created_by: uuid.UUID


# Properties to return via API with branch information
class DepartmentWithBranchPublic(DepartmentBase):
    """Department schema with branch information for API responses."""
    id: uuid.UUID
    branch_id: uuid.UUID
    created_by: uuid.UUID
    branch_name: str


# Properties to return via API with hours information
class DepartmentWithHoursPublic(DepartmentBase):
    """Department schema with hours information for API responses."""
    id: uuid.UUID
    branch_id: uuid.UUID
    created_by: uuid.UUID
    hours: List[dict]  # Will contain DepartmentHoursPublic data


# Properties to return via API with both branch and hours information
class DepartmentWithBranchAndHoursPublic(DepartmentBase):
    """Department schema with branch and hours information for API responses."""
    id: uuid.UUID
    branch_id: uuid.UUID
    created_by: uuid.UUID
    branch_name: str
    hours: List[dict]  # Will contain DepartmentHoursPublic data


class DepartmentsPublic(BasePublicList):
    """Schema for paginated department list responses."""
    data: List[DepartmentPublic]


# Response model for departments with branch information
class DepartmentsWithBranchPublic(BasePublicList):
    """Schema for paginated department list responses with branch information."""
    data: List[DepartmentWithBranchPublic]


# Response model for departments with hours information
class DepartmentsWithHoursPublic(BasePublicList):
    """Schema for paginated department list responses with hours information."""
    data: List[DepartmentWithHoursPublic]


# Response model for departments with branch and hours information
class DepartmentsWithBranchAndHoursPublic(BasePublicList):
    """Schema for paginated department list responses with branch and hours information."""
    data: List[DepartmentWithBranchAndHoursPublic]
