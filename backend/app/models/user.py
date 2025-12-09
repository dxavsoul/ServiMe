import uuid
from typing import Optional, List, TYPE_CHECKING
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
import sqlalchemy as sa

from .base import BasePublicList

if TYPE_CHECKING:
    from .branch_user import BranchUserLink


# Shared properties
class UserBase(SQLModel):
    """Base user model with shared properties."""
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = Field(default=None, max_length=255)
    # Company registration fields
    company_registration_status: Optional[str] = Field(default=None, max_length=50, description="Status of company registration (pending_review, approved, rejected)")
    is_company_admin: bool = Field(default=False, description="Whether user is a company administrator")
    approved_by: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id", description="SuperAdmin who approved the company registration")
    approved_at: Optional[str] = Field(default=None, description="Timestamp when company was approved")


# Properties to receive via API on creation
class UserCreate(UserBase):
    """Schema for user creation via API."""
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    """Schema for user registration."""
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: Optional[str] = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    """Schema for user updates via API."""
    email: Optional[EmailStr] = Field(default=None, max_length=255)  # type: ignore
    password: Optional[str] = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    """Schema for users to update their own profile."""
    full_name: Optional[str] = Field(default=None, max_length=255)
    email: Optional[EmailStr] = Field(default=None, max_length=255)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    """User database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    branch_assignments: List["BranchUserLink"] = Relationship(back_populates="user")


# Properties to return via API, id is always required
class UserPublic(UserBase):
    """Public user schema for API responses."""
    id: uuid.UUID


class UsersPublic(BasePublicList):
    """Schema for paginated user list responses."""
    data: List[UserPublic]


class UserApprovalStatus(SQLModel):
    """Schema for user approval status response."""
    approved: bool
    is_superuser: bool
    message: str
    assigned_companies: List[uuid.UUID]
    assigned_branches: List[uuid.UUID]
