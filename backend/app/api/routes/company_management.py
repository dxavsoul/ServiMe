"""
Company Management API endpoints.
Handles company-level user access management and hierarchical permissions.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.models import (
    BranchUserAssign,
    BranchUserLink,
    BranchUserLinksPublic,
    Message,
    Company,
    Branch
)
from app.crud import crud_branch_user, crud_company

router = APIRouter(prefix="/company-management", tags=["company-management"])


@router.post(
    "/{company_id}/assign-owner",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=BranchUserLink,
)
def assign_company_owner(
    company_id: uuid.UUID,
    assignment: BranchUserAssign,
    session: SessionDep,
    current_user: CurrentUser,
) -> BranchUserLink:
    """
    Assign a user as company owner with access to all branches.
    
    Only superusers can assign company owners.
    Company owners automatically get access to all branches within the company.
    """
    # Verify company exists
    company = crud_company.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Assign company ownership
    try:
        return crud_branch_user.assign_company_owner(
            session=session,
            company_id=company_id,
            user_id=assignment.user_id,
            company_role=assignment.company_role or "owner",
            company_access_level=assignment.company_access_level or "all_branches",
            assigned_by=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/{company_id}/remove-owner/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
def remove_company_owner(
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    """
    Remove company ownership from a user.
    
    Only superusers can remove company owners.
    This removes company-level access but preserves any direct branch assignments.
    """
    # Verify company exists
    company = crud_company.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    success = crud_branch_user.remove_company_ownership(
        session=session,
        company_id=company_id,
        user_id=user_id,
    )
    
    if not success:
        raise HTTPException(
            status_code=404, 
            detail="Company ownership not found for this user"
        )
    
    return Message(message="Company ownership removed successfully")


@router.get(
    "/{company_id}/owners",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=BranchUserLinksPublic,
)
def get_company_owners(
    company_id: uuid.UUID,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> BranchUserLinksPublic:
    """
    Get all company owners for a specific company.
    
    Only superusers can view company owners list.
    Returns users who have company-level access to all branches.
    """
    # Verify company exists
    company = crud_company.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    owners, count = crud_branch_user.get_company_owners(
        session=session,
        company_id=company_id,
        skip=skip,
        limit=limit,
    )
    
    return BranchUserLinksPublic(data=owners, count=count)


@router.get(
    "/{company_id}/user-access/{user_id}",
    response_model=dict,
)
def check_user_company_access(
    company_id: uuid.UUID,
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> dict:
    """
    Check a user's access level for a specific company.
    
    Returns information about company-level access and accessible branches.
    Users can check their own access, or superusers can check any user's access.
    """
    # Permission check - users can check their own access, superusers can check anyone's
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, 
            detail="Not enough permissions to check this user's access"
        )
    
    # Verify company exists
    company = crud_company.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Get company access info
    company_access = crud_branch_user.get_user_company_access_info(
        session=session,
        user_id=user_id,
        company_id=company_id,
    )
    
    # Get all accessible branches for this user
    accessible_branches = crud_branch_user.get_user_accessible_branches(
        session=session,
        user_id=user_id,
    )
    
    # Filter branches that belong to this company
    from sqlmodel import select
    company_branches_statement = select(Branch.id).where(Branch.company_id == company_id)
    company_branch_ids = set(session.exec(company_branches_statement).all())
    
    user_company_branches = [
        branch_id for branch_id in accessible_branches 
        if branch_id in company_branch_ids
    ]
    
    return {
        "user_id": user_id,
        "company_id": company_id,
        "has_company_access": company_access is not None,
        "company_role": company_access.company_role if company_access else None,
        "company_access_level": company_access.company_access_level if company_access else None,
        "is_company_owner": company_access.is_company_owner if company_access else False,
        "accessible_branches_in_company": user_company_branches,
        "total_accessible_branches": len(user_company_branches),
    }


@router.get(
    "/user/{user_id}/companies",
    response_model=list[dict],
)
def get_user_company_access_summary(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> list[dict]:
    """
    Get summary of all companies where user has access.
    
    Returns company-level access information across all companies.
    Users can check their own access, or superusers can check any user's access.
    """
    # Permission check - users can check their own access, superusers can check anyone's
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, 
            detail="Not enough permissions to check this user's access"
        )
    
    # Get all branch links for the user
    from sqlmodel import select
    user_links_statement = select(BranchUserLink).where(BranchUserLink.user_id == user_id)
    user_links = session.exec(user_links_statement).all()
    
    # Group by company and build summary
    company_access_summary = {}
    
    for link in user_links:
        # Get branch and company info
        branch = session.get(Branch, link.branch_id)
        if not branch:
            continue
            
        company = session.get(Company, branch.company_id)
        if not company:
            continue
        
        company_id = str(branch.company_id)
        
        if company_id not in company_access_summary:
            company_access_summary[company_id] = {
                "company_id": branch.company_id,
                "company_name": company.name,
                "is_company_owner": False,
                "company_role": None,
                "company_access_level": None,
                "accessible_branches": [],
                "total_branches_in_company": len(company.branches),
            }
        
        # Update company-level access info
        if link.is_company_owner:
            company_access_summary[company_id]["is_company_owner"] = True
            company_access_summary[company_id]["company_role"] = link.company_role
            company_access_summary[company_id]["company_access_level"] = link.company_access_level
        
        # Add branch to accessible list
        if link.branch_id not in company_access_summary[company_id]["accessible_branches"]:
            company_access_summary[company_id]["accessible_branches"].append(link.branch_id)
    
    return list(company_access_summary.values())
