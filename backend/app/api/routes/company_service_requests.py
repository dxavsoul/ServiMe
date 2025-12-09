"""
Company/Branch user service request routes.
Handles operations for company and branch users to view and manage requests assigned to their branches.
"""

import uuid
from typing import Any, List

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import SessionDep, CurrentUser
from app.models import (
    ServiceRequestPublic,
    ServiceRequestsPublic,
    ServiceRequestWithDetailsPublic,
    ServiceRequestsWithDetailsPublic
)

router = APIRouter(prefix="/service-requests", tags=["company-service-requests"])


@router.get("/", response_model=ServiceRequestsPublic)
def read_company_service_requests(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    status: str = None
) -> Any:
    """
    Get service requests for branches assigned to current company user.
    Company owners see all requests for their company branches.
    Branch users see only requests for their assigned branches.
    """
    # Super admin sees everything (handled in admin routes)
    if current_user.is_superuser:
        raise HTTPException(
            status_code=400, 
            detail="Super admin should use /admin/service-requests/ endpoints"
        )
    
    # Get user's assigned branches
    from app.crud.crud_branch_user import branch_user_crud
    user_branches = branch_user_crud.get_user_branches(session, user_id=current_user.id)
    
    if not user_branches:
        return ServiceRequestsPublic(data=[], count=0)
    
    branch_ids = [branch.id for branch in user_branches]
    
    # Get service requests for these branches
    requests = crud.crud_service_request.get_by_branches(
        session, 
        branch_ids=branch_ids, 
        status=status,
        skip=skip, 
        limit=limit
    )
    
    return ServiceRequestsPublic(data=requests, count=len(requests))


@router.get("/detailed", response_model=ServiceRequestsWithDetailsPublic)
def read_company_service_requests_with_details(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    status: str = None
) -> Any:
    """
    Get detailed service requests for branches assigned to current company user.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=400, 
            detail="Super admin should use /admin/service-requests/ endpoints"
        )
    
    # Get user's assigned branches
    from app.crud.crud_branch_user import branch_user_crud
    user_branches = branch_user_crud.get_user_branches(session, user_id=current_user.id)
    
    if not user_branches:
        return ServiceRequestsWithDetailsPublic(data=[], count=0)
    
    branch_ids = [branch.id for branch in user_branches]
    
    # Get detailed service requests for these branches
    requests = crud.crud_service_request.get_by_branches_with_details(
        session, 
        branch_ids=branch_ids, 
        status=status,
        skip=skip, 
        limit=limit
    )
    
    return ServiceRequestsWithDetailsPublic(data=requests, count=len(requests))


@router.get("/{request_id}", response_model=ServiceRequestPublic)
def read_company_service_request(
    request_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """
    Get specific service request if it's assigned to user's branches.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=400, 
            detail="Super admin should use /admin/service-requests/ endpoints"
        )
    
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Check if request is assigned to any of user's branches
    if not service_request.branch_id:
        raise HTTPException(
            status_code=403, 
            detail="Service request not assigned to any branch"
        )
    
    # Get user's assigned branches
    from app.crud.crud_branch_user import branch_user_crud
    user_branches = branch_user_crud.get_user_branches(session, user_id=current_user.id)
    branch_ids = [branch.id for branch in user_branches]
    
    if service_request.branch_id not in branch_ids:
        raise HTTPException(
            status_code=403, 
            detail="Access denied: Service request not assigned to your branches"
        )
    
    return service_request


@router.get("/{request_id}/detailed", response_model=ServiceRequestWithDetailsPublic)
def read_company_service_request_detailed(
    request_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """
    Get detailed service request if it's assigned to user's branches.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=400, 
            detail="Super admin should use /admin/service-requests/ endpoints"
        )
    
    service_request = crud.crud_service_request.get_with_details(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Check if request is assigned to any of user's branches
    if not service_request.branch_id:
        raise HTTPException(
            status_code=403, 
            detail="Service request not assigned to any branch"
        )
    
    # Get user's assigned branches
    from app.crud.crud_branch_user import branch_user_crud
    user_branches = branch_user_crud.get_user_branches(session, user_id=current_user.id)
    branch_ids = [branch.id for branch in user_branches]
    
    if service_request.branch_id not in branch_ids:
        raise HTTPException(
            status_code=403, 
            detail="Access denied: Service request not assigned to your branches"
        )
    
    return service_request
