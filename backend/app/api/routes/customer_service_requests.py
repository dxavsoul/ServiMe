"""
Customer service request routes for web interface.
These endpoints provide web-compatible responses while maintaining compatibility with mobile endpoints.
For mobile apps, use /api/v1/mobile/service-requests/* endpoints.
"""

import uuid
from typing import Any, Annotated

from fastapi import APIRouter, Depends, HTTPException

from app import crud
from app.api.deps import SessionDep, get_current_customer
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


router = APIRouter(prefix="/service-requests", tags=["customer-service-requests-web"])


@router.post("/", response_model=ServiceRequestPublic)
def create_service_request_web(
    *,
    session: SessionDep,
    service_request_in: ServiceRequestCreate,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Create new service request for current customer (Web interface).
    Note: Mobile apps should use /api/v1/mobile/service-requests
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
def read_my_service_requests_web(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get all service requests for current customer (Web interface).
    Note: Mobile apps should use /api/v1/mobile/service-requests
    """
    requests = crud.crud_service_request.get_by_customer(
        session, customer_id=current_customer.id, skip=skip, limit=limit
    )
    return ServiceRequestsPublic(data=requests, count=len(requests))


@router.get("/{request_id}", response_model=ServiceRequestPublic)
def read_service_request_web(
    request_id: uuid.UUID,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Get specific service request by ID (Web interface).
    Note: Mobile apps should use /api/v1/mobile/service-requests/{id}
    """
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if service_request.customer_id != current_customer.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return service_request


@router.patch("/{request_id}", response_model=ServiceRequestPublic)
def update_service_request_web(
    *,
    session: SessionDep,
    request_id: uuid.UUID,
    service_request_in: ServiceRequestUpdate,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Update service request (Web interface).
    Note: Mobile apps should use their own update logic or cancellation endpoint.
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
def cancel_service_request_web(
    request_id: uuid.UUID,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Message:
    """
    Cancel service request (Web interface).
    Note: Mobile apps should use PATCH /api/v1/mobile/service-requests/{id}/cancel
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
