"""
Industry Type API routes.
Provides CRUD operations for industry types.
"""

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import Session

from app.api.deps import CurrentUser, SessionDep, CurrentApprovedUser
from app.crud.crud_industry_type import industry_type
from app.models.industry_type import (
    IndustryType,
    IndustryTypeCreate,
    IndustryTypeUpdate,
    IndustryTypePublic,
    IndustryTypesPublic,
)
from app.models import Message

router = APIRouter(prefix="/industry-types", tags=["industry-types"])


@router.get("/", response_model=IndustryTypesPublic)
def read_industry_types(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = Query(default=True, description="Filter only active industry types"),
    search: str = Query(default=None, description="Search by name"),
) -> Any:
    """
    Retrieve industry types with optional filtering and search.
    This endpoint is public and does not require authentication.
    """
    if search:
        items, count = industry_type.search_by_name(
            session=session, name=search, skip=skip, limit=limit
        )
    elif active_only:
        items, count = industry_type.get_active(
            session=session, skip=skip, limit=limit
        )
    else:
        # For public access, default to active only even if active_only=False
        items, count = industry_type.get_active(
            session=session, skip=skip, limit=limit
        )

    return IndustryTypesPublic(data=items, count=count)


@router.get("/{industry_type_id}", response_model=IndustryTypePublic)
def read_industry_type(
    session: SessionDep, industry_type_id: uuid.UUID
) -> Any:
    """
    Get industry type by ID. This endpoint is public and does not require authentication.
    Only active industry types are returned.
    """
    industry_type_obj = industry_type.get(session=session, id=industry_type_id)
    if not industry_type_obj:
        raise HTTPException(status_code=404, detail="Industry type not found")

    # Only return active industry types for public access
    if not industry_type_obj.is_active:
        raise HTTPException(status_code=404, detail="Industry type not found")

    return industry_type_obj


@router.post("/", response_model=IndustryTypePublic)
def create_industry_type(
    *, session: SessionDep, current_user: CurrentApprovedUser, industry_type_in: IndustryTypeCreate
) -> Any:
    """
    Create new industry type.
    Only approved users can create industry types.
    """
    # Check if industry type with same name already exists
    if industry_type_in.name:
        existing_name = industry_type.get_by_name(session=session, name=industry_type_in.name)
        if existing_name:
            raise HTTPException(
                status_code=400,
                detail="An industry type with this name already exists"
            )

    # Check if industry type with same code already exists
    if industry_type_in.code:
        existing_code = industry_type.get_by_code(session=session, code=industry_type_in.code)
        if existing_code:
            raise HTTPException(
                status_code=400,
                detail="An industry type with this code already exists"
            )

    industry_type_obj = industry_type.create(session=session, obj_in=industry_type_in)
    return industry_type_obj


@router.put("/{industry_type_id}", response_model=IndustryTypePublic)
def update_industry_type(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    industry_type_id: uuid.UUID,
    industry_type_in: IndustryTypeUpdate,
) -> Any:
    """
    Update an industry type.
    Only approved users can update industry types.
    """
    industry_type_obj = industry_type.get(session=session, id=industry_type_id)
    if not industry_type_obj:
        raise HTTPException(status_code=404, detail="Industry type not found")

    # Check if updating name would create a duplicate
    if industry_type_in.name and industry_type_in.name != industry_type_obj.name:
        existing_name = industry_type.get_by_name(session=session, name=industry_type_in.name)
        if existing_name and existing_name.id != industry_type_id:
            raise HTTPException(
                status_code=400,
                detail="An industry type with this name already exists"
            )

    # Check if updating code would create a duplicate
    if industry_type_in.code and industry_type_in.code != industry_type_obj.code:
        existing_code = industry_type.get_by_code(session=session, code=industry_type_in.code)
        if existing_code and existing_code.id != industry_type_id:
            raise HTTPException(
                status_code=400,
                detail="An industry type with this code already exists"
            )

    industry_type_obj = industry_type.update(
        session=session, db_obj=industry_type_obj, obj_in=industry_type_in
    )
    return industry_type_obj


@router.delete("/{industry_type_id}", response_model=Message)
def delete_industry_type(
    session: SessionDep, current_user: CurrentApprovedUser, industry_type_id: uuid.UUID
) -> Any:
    """
    Delete an industry type.
    Only approved users can delete industry types.
    """
    industry_type_obj = industry_type.get(session=session, id=industry_type_id)
    if not industry_type_obj:
        raise HTTPException(status_code=404, detail="Industry type not found")

    # Check if industry type is being used by any companies
    from app.crud.crud_company import company_crud
    companies_using_type = company_crud.get_by_industry_type(
        session=session, industry_type_id=industry_type_id
    )
    if companies_using_type:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete industry type. It is being used by {len(companies_using_type)} company(ies)."
        )

    industry_type.remove(session=session, id=industry_type_id)
    return Message(message="Industry type deleted successfully")
