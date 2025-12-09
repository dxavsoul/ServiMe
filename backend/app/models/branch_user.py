"""
Branch-User relationship models and schemas.
Contains models for managing user assignments to branches and related functionality.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

from .base import BasePublicList

if TYPE_CHECKING:
    from .user import UserPublic, User
    from .branch import BranchPublic, Branch


# Shared properties for branch-user links
class BranchUserLinkBase(SQLModel):
    """Base schema for branch-user relationships."""
    branch_id: uuid.UUID 
    user_id: uuid.UUID 
    role: str = Field(default="employee", max_length=50)
    assigned_by: uuid.UUID
    assigned_at: str
    # Company-level access fields
    is_company_owner: bool = Field(default=False, description="Whether user is owner of the company")
    company_role: Optional[str] = Field(default=None, max_length=50, description="Company-level role (owner, manager, supervisor, etc.)")
    company_access_level: Optional[str] = Field(default=None, max_length=50, description="Level of company access (all_branches, regional, specific)")


# Properties to receive via API on creation
class BranchUserLinkCreate(BranchUserLinkBase):
    """Schema for creating branch-user relationships."""
    pass


# Properties to receive via API on update
class BranchUserLinkUpdate(SQLModel):
    """Schema for updating branch-user relationships."""
    role: Optional[str] = Field(default=None, max_length=50)


# Database model for branch-user association
class BranchUserLink(BranchUserLinkBase, table=True):
    """Association table for branch-user relationships."""
    # Composite primary key as defined in the database migration
    branch_id: uuid.UUID = Field(foreign_key="branch.id", ondelete="CASCADE", primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE", primary_key=True)
    
    # Relationships
    user: "User" = Relationship(back_populates="branch_assignments")
    branch: "Branch" = Relationship(back_populates="user_assignments")


# Properties to return via API
class BranchUserLinkPublic(BranchUserLinkBase):
    """Public schema for branch-user relationships."""
    pass


class BranchUserLinksPublic(BasePublicList):
    """Schema for paginated branch-user link list responses."""
    data: List[BranchUserLinkPublic]


# Legacy models for backward compatibility
class BranchUserAssign(SQLModel):
    """Schema for assigning users to branches."""
    user_id: uuid.UUID
    role: str = Field(default="employee", max_length=50)
    # Company-level access fields for assignment
    is_company_owner: bool = Field(default=False, description="Whether user is owner of the company")
    company_role: Optional[str] = Field(default=None, max_length=50, description="Company-level role (owner, manager, supervisor, etc.)")
    company_access_level: Optional[str] = Field(default=None, max_length=50, description="Level of company access (all_branches, regional, specific)")


class BranchUserUpdate(SQLModel):
    """Schema for updating user roles in branches."""
    role: Optional[str] = Field(default=None, max_length=50)
    is_company_owner: Optional[bool] = Field(default=None, description="Whether user is owner of the company")
    company_role: Optional[str] = Field(default=None, max_length=50, description="Company-level role (owner, manager, supervisor, etc.)")
    company_access_level: Optional[str] = Field(default=None, max_length=50, description="Level of company access (all_branches, regional, specific)")


class BranchUserPublic(SQLModel):
    """Public schema for branch-user assignments."""
    user_id: uuid.UUID
    branch_id: uuid.UUID
    role: str
    assigned_by: uuid.UUID
    assigned_at: str
    user: Optional[dict] = None


class BranchUsersPublic(BasePublicList):
    """Schema for paginated branch-user list responses."""
    data: List[BranchUserPublic]


class UserBranchPublic(SQLModel):
    """Public schema for user-branch assignments."""
    user_id: uuid.UUID
    branch_id: uuid.UUID
    role: str
    assigned_by: uuid.UUID
    assigned_at: str
    branch: Optional[dict] = None


class UserBranchesPublic(BasePublicList):
    """Schema for paginated user-branch list responses."""
    data: List[UserBranchPublic]
