import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep, CurrentApprovedUser
from app.crud.crud_branch import branch_crud
from app.crud.crud_company import company_crud
from app.crud.crud_branch_user import branch_user_crud
from app.crud.crud_branch_rating import branch_rating_crud
from app.models import (
    Branch,
    BranchCreate,
    BranchPublic,
    BranchesPublic,
    BranchWithCompanyPublic,
    BranchesWithCompanyPublic,
    BranchWithLocationPublic,
    BranchesWithLocationPublic,
    BranchWithDetailsPublic,
    BranchesWithDetailsPublic,
    BranchUpdate,
    Message,
)
from app.models.branch_rating import (
    BranchRatingStats, 
    BranchWithRatingStatsPublic,
    BranchRatingAdminResponse
)

router = APIRouter(prefix="/branches", tags=["branches"])


@router.get("/", response_model=BranchesWithCompanyPublic)
def read_branches(
    session: SessionDep, current_user: CurrentApprovedUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve branches accessible to the current user.
    SuperAdmin users can see all branches, regular users only see assigned branches.
    """
    branches, count = branch_crud.get_accessible_branches(
        session=session, user=current_user, skip=skip, limit=limit
    )
    
    # Convert to branches with company info for response
    branches_with_company = []
    for branch in branches:
        branch_dict = branch.model_dump()
        # Get company name
        company = company_crud.get(session=session, id=branch.company_id)
        branch_dict["company_name"] = company.name if company else "Unknown"
        branches_with_company.append(BranchWithCompanyPublic(**branch_dict))
    
    return BranchesWithCompanyPublic(data=branches_with_company, count=count)


@router.get("/{branch_id}", response_model=BranchPublic)
def read_branch(
    session: SessionDep, current_user: CurrentApprovedUser, branch_id: uuid.UUID
) -> Any:
    """
    Get branch by ID (only if user has access).
    """
    # Check if user has access to this branch
    if not branch_crud.can_access_branch(session=session, user=current_user, branch_id=branch_id):
        raise HTTPException(
            status_code=403, 
            detail="You don't have access to this branch's information"
        )
    
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    return branch


@router.post("/", response_model=BranchPublic)
def create_branch_endpoint(
    *, session: SessionDep, current_user: CurrentUser, branch_in: BranchCreate
) -> Any:
    """
    Create new branch.
    """
    # Verify that the company exists
    company = company_crud.get(session=session, id=branch_in.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if user is superuser or the creator of the company
    if not current_user.is_superuser and company.created_by != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions to create branch for this company")
    
    branch = branch_crud.create_with_owner(
        session=session, obj_in=branch_in, created_by=current_user.id
    )
    return branch


@router.put("/{branch_id}", response_model=BranchPublic)
def update_branch_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    branch_id: uuid.UUID,
    branch_in: BranchUpdate,
) -> Any:
    """
    Update a branch.
    """
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check if user is superuser or the creator of the branch
    if not current_user.is_superuser and branch.created_by != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    # If company_id is being updated, verify the new company exists and user has permission
    if branch_in.company_id is not None:
        company = company_crud.get(session=session, id=branch_in.company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        if not current_user.is_superuser and company.created_by != current_user.id:
            raise HTTPException(status_code=400, detail="Not enough permissions to assign branch to this company")
    
    branch = branch_crud.update(session=session, db_obj=branch, obj_in=branch_in)
    return branch


@router.delete("/{branch_id}")
def delete_branch_endpoint(
    session: SessionDep, current_user: CurrentUser, branch_id: uuid.UUID
) -> Message:
    """
    Delete a branch.
    """
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check if user is superuser or the creator of the branch
    if not current_user.is_superuser and branch.created_by != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    success = branch_crud.remove(session=session, id=branch_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete branch")
    
    return Message(message="Branch deleted successfully")


@router.get("/company/{company_id}", response_model=BranchesPublic)
def read_branches_by_company(
    session: SessionDep,
    current_user: CurrentUser,
    company_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve branches for a specific company.
    """
    # Verify that the company exists
    company = company_crud.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    count_statement = (
        select(func.count())
        .select_from(Branch)
        .where(Branch.company_id == company_id)
    )
    count = session.exec(count_statement).one()
    
    statement = (
        select(Branch)
        .where(Branch.company_id == company_id)
        .offset(skip)
        .limit(limit)
    )
    branches = session.exec(statement).all()

    return BranchesPublic(data=branches, count=count)


@router.get("/my/branches", response_model=BranchesPublic)
def read_my_branches(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve branches created by the current user.
    """
    count_statement = (
        select(func.count())
        .select_from(Branch)
        .where(Branch.created_by == current_user.id)
    )
    count = session.exec(count_statement).one()
    
    statement = (
        select(Branch)
        .where(Branch.created_by == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    branches = session.exec(statement).all()

    return BranchesPublic(data=branches, count=count)


@router.get("/with-locations/", response_model=BranchesWithLocationPublic)
def read_branches_with_locations(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve branches with location information. Non-superusers only see branches they have access to.
    """
    if current_user.is_superuser:
        # Superusers can see all branches with location info
        branches, count = branch_crud.get_with_location_info(session=session, skip=skip, limit=limit)
        
        branches_with_location = []
        for branch in branches:
            # Refresh to load relationships
            session.refresh(branch)
            branch_dict = branch.model_dump()
            if branch.location_city:
                branch_dict["location_city"] = branch.location_city.model_dump()
            branches_with_location.append(BranchWithLocationPublic(**branch_dict))
    else:
        # Regular users only see branches they have access to or created
        accessible_branch_ids = branch_user_crud.get_user_accessible_branches(session=session, user_id=current_user.id)
        
        branches, count = branch_crud.get_accessible_with_location_info(
            session=session, 
            accessible_branch_ids=accessible_branch_ids, 
            user_id=current_user.id, 
            skip=skip, 
            limit=limit
        )
        
        branches_with_location = []
        for branch in branches:
            # Refresh to load relationships
            session.refresh(branch)
            branch_dict = branch.model_dump()
            if branch.location_city:
                branch_dict["location_city"] = branch.location_city.model_dump()
            branches_with_location.append(BranchWithLocationPublic(**branch_dict))

    return BranchesWithLocationPublic(data=branches_with_location, count=count)


@router.get("/with-details/", response_model=BranchesWithDetailsPublic)
def read_branches_with_details(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve branches with both company and location information. Non-superusers only see branches they have access to.
    """
    if current_user.is_superuser:
        # Superusers can see all branches with full details
        results, count = branch_crud.get_with_full_details(session=session, skip=skip, limit=limit)
        
        branches_with_details = []
        for branch, company_name in results:
            # Refresh to load relationships
            session.refresh(branch)
            branch_dict = branch.model_dump()
            branch_dict["company_name"] = company_name
            if branch.location_city:
                branch_dict["location_city"] = branch.location_city.model_dump()
            branches_with_details.append(BranchWithDetailsPublic(**branch_dict))
    else:
        # Regular users only see branches they have access to or created
        accessible_branch_ids = branch_user_crud.get_user_accessible_branches(session=session, user_id=current_user.id)
        
        results, count = branch_crud.get_accessible_with_company_info(
            session=session, 
            accessible_branch_ids=accessible_branch_ids, 
            user_id=current_user.id, 
            skip=skip, 
            limit=limit
        )
        
        branches_with_details = []
        for branch, company_name in results:
            # Refresh to load relationships
            session.refresh(branch)
            branch_dict = branch.model_dump()
            branch_dict["company_name"] = company_name
            if branch.location_city:
                branch_dict["location_city"] = branch.location_city.model_dump()
            branches_with_details.append(BranchWithDetailsPublic(**branch_dict))

    return BranchesWithDetailsPublic(data=branches_with_details, count=count)


@router.get("/{branch_id}/with-location", response_model=BranchWithLocationPublic)
def read_branch_with_location(
    session: SessionDep, current_user: CurrentUser, branch_id: uuid.UUID
) -> Any:
    """
    Get branch by ID with location information. Users can only access branches they are assigned to or created.
    """
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check access permissions
    if not (
        current_user.is_superuser 
        or branch.created_by == current_user.id
        or branch_user_crud.check_branch_access(session=session, user_id=current_user.id, branch_id=branch_id)
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions to access this branch")
    
    # Refresh to load relationships
    session.refresh(branch)
    branch_dict = branch.model_dump()
    if branch.location_city:
        branch_dict["location_city"] = branch.location_city.model_dump()
    
    return BranchWithLocationPublic(**branch_dict)


@router.get("/{branch_id}/with-details", response_model=BranchWithDetailsPublic)
def read_branch_with_details(
    session: SessionDep, current_user: CurrentUser, branch_id: uuid.UUID
) -> Any:
    """
    Get branch by ID with both company and location information. Users can only access branches they are assigned to or created.
    """
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check access permissions
    if not (
        current_user.is_superuser 
        or branch.created_by == current_user.id
        or branch_user_crud.check_branch_access(session=session, user_id=current_user.id, branch_id=branch_id)
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions to access this branch")
    
    # Get company information
    company = company_crud.get(session=session, id=branch.company_id)
    company_name = company.name if company else "Unknown Company"
    
    # Refresh to load relationships
    session.refresh(branch)
    branch_dict = branch.model_dump()
    branch_dict["company_name"] = company_name
    if branch.location_city:
        branch_dict["location_city"] = branch.location_city.model_dump()
    
    return BranchWithDetailsPublic(**branch_dict)


@router.get("/{branch_id}/with-ratings", response_model=Any)
def read_branch_with_rating_stats(
    branch_id: uuid.UUID, session: SessionDep, current_user: CurrentApprovedUser
) -> Any:
    """
    Get a branch with comprehensive rating statistics.
    SuperAdmin users can access any branch, regular users only assigned branches.
    """
    # Get the branch
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check access permissions
    if not (
        current_user.is_superuser
        or branch_user_crud.check_branch_access(session=session, user_id=current_user.id, branch_id=branch_id)
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions to access this branch")
    
    # Get company information
    company = company_crud.get(session=session, id=branch.company_id)
    company_name = company.name if company else "Unknown Company"
    
    # Get rating statistics
    rating_stats = branch_rating_crud.get_rating_stats(session=session, branch_id=branch_id)
    
    return {
        "id": branch.id,
        "name": branch.name,
        "code": branch.code,
        "address": branch.address,
        "city_id": branch.city_id,
        "postal_code": branch.postal_code,
        "phone": branch.phone,
        "email": branch.email,
        "manager_name": branch.manager_name,
        "latitude": branch.latitude,
        "longitude": branch.longitude,
        "is_active": branch.is_active,
        "company_id": branch.company_id,
        "company_name": company_name,
        "created_by": branch.created_by,
        "rating_stats": BranchRatingStats(**rating_stats)
    }


@router.get("/{branch_id}/ratings", response_model=dict)
def read_branch_ratings_admin(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    branch_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve all ratings for a branch (Admin view).
    Branch users can view ratings for their assigned branches.
    SuperAdmin and Admin can view ratings for any branch.
    """
    # Check access permissions
    if not current_user.is_superuser:
        # Check if user has access to this branch
        user_branches = branch_user_crud.get_user_branches(session=session, user_id=current_user.id)
        accessible_branch_ids = [branch.id for branch in user_branches]
        
        if branch_id not in accessible_branch_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions to view ratings for this branch")
    
    # Get branch to verify it exists
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Get ratings with detailed information
    ratings, total = branch_rating_crud.get_ratings_for_branch_admin(
        session=session, branch_id=branch_id, skip=skip, limit=limit
    )
    
    return {
        "data": ratings,
        "count": total
    }


@router.post("/{branch_id}/ratings/{rating_id}/respond", response_model=dict)
def respond_to_rating(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    branch_id: uuid.UUID,
    rating_id: uuid.UUID,
    response_data: BranchRatingAdminResponse
) -> Any:
    """
    Add an admin response to a branch rating.
    Branch users can respond to ratings for their assigned branches.
    SuperAdmin and Admin can respond to any rating.
    """
    # Check access permissions
    if not current_user.is_superuser:
        # Check if user has access to this branch
        user_branches = branch_user_crud.get_user_branches(session=session, user_id=current_user.id)
        accessible_branch_ids = [branch.id for branch in user_branches]
        
        if branch_id not in accessible_branch_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions to respond to ratings for this branch")
    
    # Verify the rating exists and belongs to this branch
    rating = branch_rating_crud.get(session=session, id=rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    if rating.branch_id != branch_id:
        raise HTTPException(status_code=400, detail="Rating does not belong to this branch")
    
    # Get admin response text from request
    admin_response = response_data.admin_response.strip()
    if not admin_response:
        raise HTTPException(status_code=400, detail="Admin response cannot be empty")
    
    # Add the response
    updated_rating = branch_rating_crud.add_admin_response(
        session=session,
        rating_id=rating_id,
        admin_response=admin_response,
        admin_user_id=current_user.id
    )
    
    if not updated_rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    return {"message": "Response added successfully", "rating_id": rating_id}


@router.delete("/{branch_id}/ratings/{rating_id}", response_model=Message)
def delete_branch_rating_admin(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    branch_id: uuid.UUID,
    rating_id: uuid.UUID
) -> Any:
    """
    Delete a branch rating (SuperAdmin and Admin only).
    Only SuperAdmin and Admin users can delete ratings.
    Regular branch users cannot delete ratings.
    """
    # Only superadmin and admin can delete ratings
    if not current_user.is_superuser:
        # Check if user has admin role in any branch (this would require additional role checking logic)
        # For now, we'll allow only superusers to delete
        raise HTTPException(status_code=403, detail="Only SuperAdmin can delete ratings")
    
    # Verify the rating exists and belongs to this branch
    rating = branch_rating_crud.get(session=session, id=rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    if rating.branch_id != branch_id:
        raise HTTPException(status_code=400, detail="Rating does not belong to this branch")
    
    # Delete the rating
    branch_rating_crud.remove(session=session, id=rating_id)
    
    return Message(message="Rating deleted successfully")
