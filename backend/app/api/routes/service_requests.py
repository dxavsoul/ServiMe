"""
Customer service request routes.
Handles service request operations for customers to request services and manage their own requests.
"""

import uuid
from typing import Any, Annotated

from fastapi import APIRouter, Depends, HTTPException

from app import crud
from app.api.deps import SessionDep, get_current_customer, CurrentUser
from app.models.customer import Customer
from app.models.service_request import (
    ServiceRequest,
    ServiceRequestCreate,
    ServiceRequestUpdate,
    ServiceRequestPublic,
    ServiceRequestsPublic,
    ServiceRequestWithDetailsPublic,
    ServiceRequestsWithDetailsPublic
)
from app.models import Message


router = APIRouter(prefix="/service-requests", tags=["service-requests"])


@router.post("/", response_model=ServiceRequestPublic)
def create_service_request(
    *,
    session: SessionDep,
    service_request_in: ServiceRequestCreate,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Create new service request for current customer.
    """
    # Verify service exists
    service = crud.service.get(session, id=service_request_in.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Create service request
    service_request = crud.crud_service_request.create_with_customer(
        session, 
        obj_in=service_request_in, 
        customer_id=current_customer.id
    )
    return service_request


@router.get("/my-requests", response_model=ServiceRequestsPublic)
def read_my_service_requests(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get all service requests for current customer.
    """
    requests = crud.crud_service_request.get_by_customer(
        session, 
        customer_id=current_customer.id, 
        skip=skip, 
        limit=limit
    )
    # Count total requests for this customer
    total_requests = crud.crud_service_request.get_by_customer(session, customer_id=current_customer.id)
    return ServiceRequestsPublic(data=requests, count=len(total_requests))


@router.get("/{request_id}", response_model=ServiceRequestPublic)
def read_service_request(
    request_id: uuid.UUID,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Get specific service request by ID (only if it belongs to current customer).
    """
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if service_request.customer_id != current_customer.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return service_request


@router.patch("/{request_id}", response_model=ServiceRequestPublic)
def update_service_request(
    *,
    session: SessionDep,
    request_id: uuid.UUID,
    service_request_in: ServiceRequestUpdate,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Update service request (only if it belongs to current customer).
    """
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if service_request.customer_id != current_customer.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Customer can only update certain fields
    allowed_updates = {
        "description": service_request_in.description,
        "preferred_date": service_request_in.preferred_date,
        "preferred_time": service_request_in.preferred_time,
        "urgent": service_request_in.urgent,
        "customer_latitude": service_request_in.customer_latitude,
        "customer_longitude": service_request_in.customer_longitude
    }
    
    # Remove None values
    update_data = {k: v for k, v in allowed_updates.items() if v is not None}
    
    service_request = crud.crud_service_request.update(
        session, 
        db_obj=service_request, 
        obj_in=update_data
    )
    return service_request


@router.delete("/{request_id}", response_model=Message)
def cancel_service_request(
    request_id: uuid.UUID,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Message:
    """
    Cancel service request (only if it belongs to current customer and is pending).
    """
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if service_request.customer_id != current_customer.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if service_request.status not in ["PENDING"]:
        raise HTTPException(
            status_code=400, 
            detail="Cannot cancel service request with current status"
        )
    
    # Update status to cancelled with timeline tracking
    crud.crud_service_request.cancel_request(
        session,
        request_id=request_id,
        user_id=current_customer.id,
        user_type="customer",
        reason="Cancelled by customer"
    )
    return Message(message="Service request cancelled successfully")


@router.get("/location/nearby", response_model=ServiceRequestsPublic)
def get_nearby_service_requests(
    session: SessionDep,
    latitude: float,
    longitude: float,
    radius_km: float = 10.0,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get service requests near a location (public endpoint for location-based services).
    """
    requests = crud.crud_service_request.get_nearby(
        session,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        skip=skip,
        limit=limit
    )
    return ServiceRequestsPublic(data=requests, count=len(requests))


# Admin routes for service request management
@router.get("/", response_model=ServiceRequestsPublic)
def read_service_requests(
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
    Get service requests with optional filters. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
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
        requests = crud.crud_service_request.get_multi(session, skip=skip, limit=limit)
    
    count = crud.crud_service_request.count(session)
    return ServiceRequestsPublic(data=requests, count=count)


@router.patch("/admin/{request_id}", response_model=ServiceRequestPublic)
def admin_update_service_request(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    request_id: uuid.UUID,
    service_request_in: ServiceRequestUpdate
) -> Any:
    """
    Admin update service request (can update any field including status).
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    service_request = crud.crud_service_request.update(
        session, 
        db_obj=service_request, 
        obj_in=service_request_in
    )
    return service_request


@router.post("/admin/{request_id}/assign-branch", response_model=ServiceRequestPublic)
def assign_service_request_to_branch(
    request_id: uuid.UUID,
    branch_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """
    Assign service request to a branch. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify branch exists
    branch = crud.branch.get(session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    service_request = crud.crud_service_request.assign_to_branch(
        session, 
        request_id=request_id, 
        branch_id=branch_id
    )
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    return service_request


@router.get("/location/nearby", response_model=ServiceRequestsPublic)
def get_service_requests_near_location(
    session: SessionDep,
    current_user: CurrentUser,
    latitude: float,
    longitude: float,
    radius_km: float = 10.0,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get service requests near a specific location. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    requests = crud.crud_service_request.get_near_location(
        session,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        skip=skip,
        limit=limit
    )
    return ServiceRequestsPublic(data=requests, count=len(requests))
