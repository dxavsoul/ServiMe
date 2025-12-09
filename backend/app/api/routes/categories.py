"""
Category API routes.
Provides CRUD operations for categories used to classify companies.
Categories determine document requirements based on company type (individual, organization, etc.).
"""

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep, CurrentApprovedUser
from app.crud.crud_category import category
from app.models.category import (
    Category,
    CategoryCreate,
    CategoryUpdate,
    CategoryPublic,
    CategoriesPublic,
    CategoryWithStatsPublic,
    CategoriesWithStatsPublic,
)
from app.models import Message, Company

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=CategoriesPublic)
def read_categories(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = Query(default=True, description="Filter only active categories"),
    search: str = Query(default=None, description="Search by name"),
    with_stats: bool = Query(default=False, description="Include company count statistics"),
) -> Any:
    """
    Retrieve categories with optional filtering and search.
    This endpoint is public and does not require authentication.
    """
    if with_stats:
        items, count = category.get_with_stats(
            session=session, skip=skip, limit=limit
        )
        return CategoriesWithStatsPublic(data=items, count=count)
    elif search:
        items, count = category.search_by_name(
            session=session, name=search, skip=skip, limit=limit
        )
    elif active_only:
        items, count = category.get_active(
            session=session, skip=skip, limit=limit
        )
    else:
        # For public access, default to active only even if active_only=False
        items, count = category.get_active(
            session=session, skip=skip, limit=limit
        )

    return CategoriesPublic(data=items, count=count)


@router.get("/{category_id}", response_model=CategoryPublic)
def read_category(
    session: SessionDep, category_id: uuid.UUID
) -> Any:
    """
    Get category by ID. This endpoint is public and does not require authentication.
    Only active categories are returned.
    """
    category_obj = category.get(session=session, id=category_id)
    if not category_obj:
        raise HTTPException(status_code=404, detail="Category not found")

    # Only return active categories for public access
    if not category_obj.is_active:
        raise HTTPException(status_code=404, detail="Category not found")

    return category_obj


@router.get("/{category_id}/requirements")
def get_category_requirements(
    session: SessionDep, category_id: uuid.UUID
) -> Any:
    """
    Get document requirements for a specific category.
    This endpoint is public and does not require authentication.
    """
    requirements = category.get_document_requirements(
        session=session, category_id=category_id
    )
    if not requirements:
        raise HTTPException(status_code=404, detail="Category not found")

    return {
        "category_id": str(category_id),
        "requirements": requirements
    }


@router.post("/", response_model=CategoryPublic)
def create_category(
    *, session: SessionDep, current_user: CurrentApprovedUser, category_in: CategoryCreate
) -> Any:
    """
    Create new category.
    Only approved users can create categories.
    """
    # Check if category with same name already exists
    if category_in.name:
        existing_name = category.get_by_name(session=session, name=category_in.name)
        if existing_name:
            raise HTTPException(
                status_code=400,
                detail="A category with this name already exists"
            )

    # Check if category with same code already exists
    if category_in.code:
        existing_code = category.get_by_code(session=session, code=category_in.code)
        if existing_code:
            raise HTTPException(
                status_code=400,
                detail="A category with this code already exists"
            )

    category_obj = category.create(session=session, obj_in=category_in)
    return category_obj


@router.put("/{category_id}", response_model=CategoryPublic)
def update_category(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    category_id: uuid.UUID,
    category_in: CategoryUpdate,
) -> Any:
    """
    Update a category.
    Only approved users can update categories.
    """
    category_obj = category.get(session=session, id=category_id)
    if not category_obj:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if updating name would create a duplicate
    if category_in.name and category_in.name != category_obj.name:
        existing_name = category.get_by_name(session=session, name=category_in.name)
        if existing_name and existing_name.id != category_id:
            raise HTTPException(
                status_code=400,
                detail="A category with this name already exists"
            )

    # Check if updating code would create a duplicate
    if category_in.code and category_in.code != category_obj.code:
        existing_code = category.get_by_code(session=session, code=category_in.code)
        if existing_code and existing_code.id != category_id:
            raise HTTPException(
                status_code=400,
                detail="A category with this code already exists"
            )

    category_obj = category.update(
        session=session, db_obj=category_obj, obj_in=category_in
    )
    return category_obj


@router.delete("/{category_id}", response_model=Message)
def delete_category(
    session: SessionDep, current_user: CurrentApprovedUser, category_id: uuid.UUID
) -> Any:
    """
    Delete a category.
    Only approved users can delete categories.
    """
    category_obj = category.get(session=session, id=category_id)
    if not category_obj:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if category is being used by any companies
    companies_using_category = session.exec(
        select(Company).where(Company.category_id == category_id)
    ).all()

    if companies_using_category:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category. It is being used by {len(companies_using_category)} company(ies)."
        )

    category.remove(session=session, id=category_id)
    return Message(message="Category deleted successfully")
