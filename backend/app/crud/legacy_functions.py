"""
Legacy function wrappers for backward compatibility.
These functions maintain the same interface as the original crud.py functions.
"""

import uuid
from typing import Any

from sqlmodel import Session

from app.models import (
    User, UserCreate, UserUpdate,
    Company, CompanyCreate, CompanyUpdate,
    Branch, BranchCreate, BranchUpdate,
    BranchUserLink,
)

from .crud_user import user as user_crud
from .crud_company import company as company_crud
from .crud_branch import branch as branch_crud
from .crud_branch_user import branch_user as branch_user_crud


# User functions
def create_user(*, session: Session, user_create: UserCreate) -> User:
    return user_crud.create(session=session, obj_in=user_create)


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    return user_crud.update(session=session, db_obj=db_user, obj_in=user_in)


def get_user_by_email(*, session: Session, email: str) -> User | None:
    return user_crud.get_by_email(session=session, email=email)


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    return user_crud.authenticate(session=session, email=email, password=password)


# Company functions
def create_company(*, session: Session, company_in: CompanyCreate, created_by: uuid.UUID) -> Company:
    return company_crud.create_with_owner(session=session, obj_in=company_in, created_by=created_by)


def update_company(*, session: Session, db_company: Company, company_in: CompanyUpdate) -> Company:
    return company_crud.update(session=session, db_obj=db_company, obj_in=company_in)


def get_company_by_id(*, session: Session, company_id: uuid.UUID) -> Company | None:
    return company_crud.get(session=session, id=company_id)


def delete_company(*, session: Session, company_id: uuid.UUID) -> bool:
    result = company_crud.remove(session=session, id=company_id)
    return result is not None


# Branch functions
def create_branch(*, session: Session, branch_in: BranchCreate, created_by: uuid.UUID) -> Branch:
    return branch_crud.create_with_owner(session=session, obj_in=branch_in, created_by=created_by)


def update_branch(*, session: Session, db_branch: Branch, branch_in: BranchUpdate) -> Branch:
    return branch_crud.update(session=session, db_obj=db_branch, obj_in=branch_in)


def get_branch_by_id(*, session: Session, branch_id: uuid.UUID) -> Branch | None:
    return branch_crud.get(session=session, id=branch_id)


def delete_branch(*, session: Session, branch_id: uuid.UUID) -> bool:
    result = branch_crud.remove(session=session, id=branch_id)
    return result is not None


# Branch User functions
def assign_user_to_branch(
    *, session: Session, branch_id: uuid.UUID, user_id: uuid.UUID, role: str, assigned_by: uuid.UUID
) -> BranchUserLink:
    return branch_user_crud.assign_user_to_branch(
        session=session, branch_id=branch_id, user_id=user_id, role=role, assigned_by=assigned_by
    )


def remove_user_from_branch(*, session: Session, branch_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    return branch_user_crud.remove_user_from_branch(
        session=session, branch_id=branch_id, user_id=user_id
    )


def get_branch_users(*, session: Session, branch_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[list[BranchUserLink], int]:
    return branch_user_crud.get_branch_users(
        session=session, branch_id=branch_id, skip=skip, limit=limit
    )


def get_user_branches(*, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> tuple[list[BranchUserLink], int]:
    return branch_user_crud.get_user_branches(
        session=session, user_id=user_id, skip=skip, limit=limit
    )


def get_branch_user_assignment(*, session: Session, branch_id: uuid.UUID, user_id: uuid.UUID) -> BranchUserLink | None:
    return branch_user_crud.get_assignment(
        session=session, branch_id=branch_id, user_id=user_id
    )


def user_has_branch_access(*, session: Session, user_id: uuid.UUID, branch_id: uuid.UUID) -> bool:
    return branch_user_crud.user_has_branch_access(
        session=session, user_id=user_id, branch_id=branch_id
    )


def get_user_accessible_branches(*, session: Session, user_id: uuid.UUID) -> list[uuid.UUID]:
    return branch_user_crud.get_user_accessible_branches(
        session=session, user_id=user_id
    )
