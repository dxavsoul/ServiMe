import uuid
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
import sqlalchemy as sa


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    branch_assignments: list["BranchUserLink"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[BranchUserLink.user_id]", "cascade": "all, delete-orphan"}
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# Shared properties for Company
class CompanyBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    industry: str | None = Field(default=None, max_length=100)
    website: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    is_active: bool = True


# Properties to receive on company creation
class CompanyCreate(CompanyBase):
    pass


# Properties to receive on company update
class CompanyUpdate(CompanyBase):
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Company(CompanyBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    creator: User | None = Relationship()


# Properties to return via API, id is always required
class CompanyPublic(CompanyBase):
    id: uuid.UUID
    created_by: uuid.UUID


class CompaniesPublic(SQLModel):
    data: list[CompanyPublic]
    count: int


# Shared properties for Branch
class BranchBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    code: str | None = Field(default=None, max_length=50)
    address: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = Field(default=None, max_length=255)
    manager_name: str | None = Field(default=None, max_length=255)
    is_active: bool = True


# Properties to receive on branch creation
class BranchCreate(BranchBase):
    company_id: uuid.UUID


# Properties to receive on branch update
class BranchUpdate(BranchBase):
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    company_id: uuid.UUID | None = None


# Database model, database table inferred from class name
class Branch(BranchBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    company_id: uuid.UUID = Field(
        foreign_key="company.id", nullable=False, ondelete="CASCADE"
    )
    created_by: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    company: Company | None = Relationship()
    creator: User | None = Relationship()
    user_assignments: list["BranchUserLink"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[BranchUserLink.branch_id]", "cascade": "all, delete-orphan"}
    )


# Properties to return via API, id is always required
class BranchPublic(BranchBase):
    id: uuid.UUID
    company_id: uuid.UUID
    created_by: uuid.UUID


# Properties to return via API with company information
class BranchWithCompanyPublic(BranchBase):
    id: uuid.UUID
    company_id: uuid.UUID
    created_by: uuid.UUID
    company_name: str


class BranchesPublic(SQLModel):
    data: list[BranchPublic]
    count: int


# Response model for branches with company information
class BranchesWithCompanyPublic(SQLModel):
    data: list[BranchWithCompanyPublic]
    count: int


# Branch User Association Table
class BranchUserLink(SQLModel, table=True):
    branch_id: uuid.UUID = Field(foreign_key="branch.id", primary_key=True, ondelete="CASCADE")
    user_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
    role: str = Field(default="employee", max_length=50)  # employee, manager, admin
    assigned_by: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    assigned_at: str = Field(default_factory=lambda: datetime.now().isoformat())  # Fixed to use proper ISO timestamp


# Properties for assigning user to branch
class BranchUserAssign(SQLModel):
    user_id: uuid.UUID
    role: str = Field(default="employee", max_length=50)


# Properties for updating branch user role
class BranchUserUpdate(SQLModel):
    role: str = Field(max_length=50)


# Properties to return branch user assignments
class BranchUserPublic(SQLModel):
    user_id: uuid.UUID
    branch_id: uuid.UUID
    role: str
    assigned_by: uuid.UUID
    user: UserPublic | None = None


class BranchUsersPublic(SQLModel):
    data: list[BranchUserPublic]
    count: int


# Properties to return user's branch assignments
class UserBranchPublic(SQLModel):
    user_id: uuid.UUID
    branch_id: uuid.UUID
    role: str
    assigned_by: uuid.UUID
    branch: BranchPublic | None = None


class UserBranchesPublic(SQLModel):
    data: list[UserBranchPublic]
    count: int
