"""
Admin service request routes.
Handles admin-only operations for service request management.
"""

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import SessionDep, CurrentUser
from app.models import (
    Message,
    ServiceRequestPublic,
    ServiceRequestsPublic,
    ServiceRequestUpdate,
)

router = APIRouter(prefix="/service-requests", tags=["admin-service-requests"])


@router.get("/", response_model=ServiceRequestsPublic)
def read_all_service_requests(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    customer_id: uuid.UUID = None,
    service_id: uuid.UUID = None,
    branch_id: uuid.UUID = None
) -> Any:
    """
    Get all service requests with optional filters. Super admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    if status:
        requests = crud.crud_service_request.get_by_status(
            session, status=status, skip=skip, limit=limit
        )
    elif customer_id:
        requests = crud.crud_service_request.get_by_customer(
            session, customer_id=customer_id, skip=skip, limit=limit
        )
    elif service_id:
        requests = crud.crud_service_request.get_by_service(
            session, service_id=service_id, skip=skip, limit=limit
        )
    elif branch_id:
        requests = crud.crud_service_request.get_by_branch(
            session, branch_id=branch_id, skip=skip, limit=limit
        )
    else:
        requests = crud.crud_service_request.get_multi(
            session, skip=skip, limit=limit
        )
    
    return ServiceRequestsPublic(data=requests, count=len(requests))


@router.patch("/{request_id}", response_model=ServiceRequestPublic)
def admin_update_service_request(
    request_id: uuid.UUID,
    service_request_in: ServiceRequestUpdate,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """
    Update any service request. Super admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    service_request = crud.crud_service_request.update(
        session, 
        db_obj=service_request, 
        obj_in=service_request_in
    )
    return service_request


@router.post("/{request_id}/assign-branch", response_model=ServiceRequestPublic)
def assign_service_request_to_branch(
    request_id: uuid.UUID,
    branch_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """
    Assign service request to a branch. Super admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    # Verify branch exists
    branch = crud.branch.get(session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    service_request = crud.crud_service_request.assign_to_branch(
        session,
        request_id=request_id,
        branch_id=branch_id,
        assigned_by_user_id=current_user.id,
        assigned_by_user_type="admin"
    )
    
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    return service_request


@router.delete("/{request_id}", response_model=Message)
def admin_delete_service_request(
    request_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser
) -> Message:
    """
    Delete service request. Super admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Super admin access required")
    
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    crud.crud_service_request.remove(session, id=request_id)
    return Message(message="Service request deleted successfully")
