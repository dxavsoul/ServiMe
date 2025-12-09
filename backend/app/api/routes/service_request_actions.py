"""
Service request action routes for branch users.
Handles service request status transitions and timeline management.
"""

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import SessionDep, CurrentBranchUser
from app.models import (
    Message,
    ServiceRequestPublic,
    ServiceRequestAccept,
    ServiceRequestStart,
    ServiceRequestComplete,
    ServiceRequestReschedule,
    ServiceRequestCancel,
    ServiceRequestTimelinePublic,
    ServiceRequestTimelinesPublic,
)


router = APIRouter(prefix="/service-requests", tags=["service-request-actions"])


def validate_branch_user_access(session: SessionDep, request_id: uuid.UUID, current_user: CurrentBranchUser) -> None:
    """Validate that the current user has access to the service request through their branch assignment."""
    from app.crud.crud_branch_user import branch_user_crud
    
    if current_user.is_superuser:
        return  # Superusers have access to everything
    
    # Get the service request
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if not service_request.branch_id:
        raise HTTPException(status_code=400, detail="Service request is not assigned to any branch")
    
    # Check if user is assigned to the branch that has this service request
    user_branches = branch_user_crud.get_user_branches(session, user_id=current_user.id)
    branch_ids = [branch.id for branch in user_branches]
    
    if service_request.branch_id not in branch_ids:
        raise HTTPException(
            status_code=403, 
            detail="You don't have access to this service request"
        )


@router.post("/{request_id}/accept", response_model=ServiceRequestPublic)
def accept_service_request(
    *,
    session: SessionDep,
    request_id: uuid.UUID,
    action_data: ServiceRequestAccept,
    current_user: CurrentBranchUser
) -> Any:
    """
    Accept a service request assigned to your branch.
    Prerequisites: Request must be 'pending' or 'assigned' status.
    """
    validate_branch_user_access(session, request_id, current_user)
    
    try:
        service_request = crud.crud_service_request.accept_request(
            session,
            request_id=request_id,
            branch_user_id=current_user.id,
            notes=action_data.notes
        )
        if not service_request:
            raise HTTPException(status_code=404, detail="Service request not found")
        
        return service_request
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{request_id}/start", response_model=ServiceRequestPublic)
def start_service_request(
    *,
    session: SessionDep,
    request_id: uuid.UUID,
    action_data: ServiceRequestStart,
    current_user: CurrentBranchUser
) -> Any:
    """
    Start working on an accepted service request.
    Prerequisites: Request must be 'accepted' status.
    """
    validate_branch_user_access(session, request_id, current_user)
    
    try:
        service_request = crud.crud_service_request.start_request(
            session,
            request_id=request_id,
            branch_user_id=current_user.id,
            notes=action_data.notes
        )
        if not service_request:
            raise HTTPException(status_code=404, detail="Service request not found")
        
        return service_request
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{request_id}/complete", response_model=ServiceRequestPublic)
def complete_service_request(
    *,
    session: SessionDep,
    request_id: uuid.UUID,
    action_data: ServiceRequestComplete,
    current_user: CurrentBranchUser
) -> Any:
    """
    Mark a service request as completed.
    Prerequisites: Request must be 'in_progress' status.
    """
    validate_branch_user_access(session, request_id, current_user)
    
    try:
        service_request = crud.crud_service_request.complete_request(
            session,
            request_id=request_id,
            branch_user_id=current_user.id,
            notes=action_data.notes
        )
        if not service_request:
            raise HTTPException(status_code=404, detail="Service request not found")
        
        return service_request
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{request_id}/reschedule", response_model=ServiceRequestPublic)
def reschedule_service_request(
    *,
    session: SessionDep,
    request_id: uuid.UUID,
    action_data: ServiceRequestReschedule,
    current_user: CurrentBranchUser
) -> Any:
    """
    Reschedule a service request to a new date/time.
    Prerequisites: Request must not be 'completed' or 'cancelled'.
    """
    validate_branch_user_access(session, request_id, current_user)
    
    try:
        service_request = crud.crud_service_request.reschedule_request(
            session,
            request_id=request_id,
            new_date=action_data.new_date,
            new_time=action_data.new_time,
            branch_user_id=current_user.id,
            notes=action_data.notes
        )
        if not service_request:
            raise HTTPException(status_code=404, detail="Service request not found")
        
        return service_request
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{request_id}/cancel", response_model=Message)
def cancel_service_request_branch(
    *,
    session: SessionDep,
    request_id: uuid.UUID,
    action_data: ServiceRequestCancel,
    current_user: CurrentBranchUser
) -> Message:
    """
    Cancel a service request from the branch side.
    """
    validate_branch_user_access(session, request_id, current_user)
    
    try:
        service_request = crud.crud_service_request.cancel_request(
            session,
            request_id=request_id,
            user_id=current_user.id,
            user_type="branch_user",
            reason=action_data.reason or action_data.notes
        )
        if not service_request:
            raise HTTPException(status_code=404, detail="Service request not found")
        
        return Message(message="Service request cancelled successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{request_id}/timeline", response_model=ServiceRequestTimelinesPublic)
def get_service_request_timeline(
    *,
    session: SessionDep,
    request_id: uuid.UUID,
    current_user: CurrentBranchUser,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get the timeline history for a service request.
    Shows all status changes and actions taken.
    """
    validate_branch_user_access(session, request_id, current_user)
    
    timeline_entries = crud.crud_service_request_timeline.get_by_service_request(
        session,
        service_request_id=request_id,
        skip=skip,
        limit=limit
    )
    
    total_entries = crud.crud_service_request_timeline.get_by_service_request(
        session, service_request_id=request_id
    )
    
    return ServiceRequestTimelinesPublic(data=timeline_entries, count=len(total_entries))


@router.get("/assigned-to-me", response_model=list[ServiceRequestPublic])
def get_my_assigned_requests(
    session: SessionDep,
    current_user: CurrentBranchUser,
    skip: int = 0,
    limit: int = 100,
    status: str = None
) -> Any:
    """
    Get service requests assigned to branches where current user works.
    Optionally filter by status.
    """
    from app.crud.crud_branch_user import branch_user_crud
    
    # Get all branches where the user is assigned
    user_branches = branch_user_crud.get_user_branches(session, user_id=current_user.id)
    
    if not user_branches:
        return []
    
    # Get service requests for these branches
    all_requests = []
    for branch in user_branches:
        if status:
            # Get requests by branch and status
            requests = [
                req for req in crud.crud_service_request.get_by_branch(
                    session, branch_id=branch.id, skip=0, limit=1000
                ) if req.status == status
            ]
        else:
            requests = crud.crud_service_request.get_by_branch(
                session,
                branch_id=branch.id,
                skip=0,
                limit=1000
            )
        all_requests.extend(requests)
    
    # Sort by created_at desc and apply pagination
    all_requests.sort(key=lambda x: x.created_at or "", reverse=True)
    return all_requests[skip:skip + limit]
