"""
Customer management routes.
Handles customer profile management and customer-related operations.
"""

import uuid
from typing import Any, Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select, or_, func

from app import crud
from app.api.deps import SessionDep, get_current_customer, CurrentUser
from app.models.customer import (
    Customer,
    CustomerPublic, 
    CustomersPublic, 
    CustomerUpdate, 
    CustomerUpdateMe,
    CustomerCreate
)
from app.models import Message


router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/me", response_model=CustomerPublic)
def read_customer_me(current_customer: Annotated[Customer, Depends(get_current_customer)]) -> Any:
    """
    Get current customer profile.
    """
    return current_customer


@router.patch("/me", response_model=CustomerPublic)
def update_customer_me(
    *,
    session: SessionDep,
    customer_in: CustomerUpdateMe,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Update current customer profile.
    """
    customer_data = customer_in.model_dump(exclude_unset=True)
    current_customer = crud.crud_customer.update(session, db_obj=current_customer, obj_in=customer_data)
    return current_customer


@router.delete("/me", response_model=Message)
def delete_customer_me(
    session: SessionDep, 
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Message:
    """
    Delete current customer account.
    """
    crud.crud_customer.remove(session, id=current_customer.id)
    return Message(message="Customer account deleted successfully")


# Admin routes for customer management
@router.get("/", response_model=CustomersPublic)
def read_customers(
    session: SessionDep, 
    current_user: CurrentUser, 
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    Retrieve customers. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    customers = crud.crud_customer.get_multi(session, skip=skip, limit=limit)
    count = crud.crud_customer.count(session)
    return CustomersPublic(data=customers, count=count)


@router.post("/", response_model=CustomerPublic)
def create_customer(
    *, 
    session: SessionDep, 
    current_user: CurrentUser, 
    customer_in: CustomerCreate
) -> Any:
    """
    Create new customer. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if customer already exists
    customer = crud.crud_customer.get_by_email(session, email=customer_in.email)
    if customer:
        raise HTTPException(
            status_code=400,
            detail="A customer with this email already exists"
        )
    
    customer = crud.crud_customer.create(session, obj_in=customer_in)
    return customer


@router.get("/{customer_id}", response_model=CustomerPublic)
def read_customer_by_id(
    customer_id: uuid.UUID, 
    session: SessionDep, 
    current_user: CurrentUser
) -> Any:
    """
    Get customer by ID. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    customer = crud.crud_customer.get(session, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.patch("/{customer_id}", response_model=CustomerPublic)
def update_customer(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    customer_id: uuid.UUID,
    customer_in: CustomerUpdate,
) -> Any:
    """
    Update customer. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    customer = crud.crud_customer.get(session, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer = crud.crud_customer.update(session, db_obj=customer, obj_in=customer_in)
    return customer


@router.delete("/{customer_id}", response_model=Message)
def delete_customer(
    session: SessionDep, 
    current_user: CurrentUser, 
    customer_id: uuid.UUID
) -> Message:
    """
    Delete customer. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    customer = crud.crud_customer.get(session, id=customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    crud.crud_customer.remove(session, id=customer_id)
    return Message(message="Customer deleted successfully")


@router.get("/location/nearby", response_model=CustomersPublic)
def get_customers_near_location(
    session: SessionDep,
    current_user: CurrentUser,
    latitude: float,
    longitude: float,
    radius_km: float = 10.0,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get customers near a specific location. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    customers = crud.crud_customer.get_customers_near_location(
        session, 
        latitude=latitude, 
        longitude=longitude, 
        radius_km=radius_km, 
        skip=skip, 
        limit=limit
    )
    return CustomersPublic(data=customers, count=len(customers))


@router.get("/search", response_model=CustomersPublic)
def search_customers(
    session: SessionDep,
    current_user: CurrentUser,
    q: str = "",
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Search customers by name, email, or phone. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    customers = crud.crud_customer.search_customers(
        session, query=q, skip=skip, limit=limit
    )
    count = crud.crud_customer.count_search_results(session, query=q)
    
    return CustomersPublic(data=customers, count=count)


@router.patch("/me/password", response_model=Message)
def update_customer_password(
    *,
    session: SessionDep,
    current_password: str,
    new_password: str,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Message:
    """
    Update current customer password.
    """
    from app.core.security import verify_password, get_password_hash
    
    # Verify current password
    if not verify_password(current_password, current_customer.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    # Update password
    current_customer.hashed_password = get_password_hash(new_password)
    session.add(current_customer)
    session.commit()
    
    return Message(message="Password updated successfully")


@router.get("/stats", response_model=dict)
def get_customer_stats(
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """
    Get customer statistics. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    from sqlmodel import select, func
    
    total_customers = session.exec(select(func.count(Customer.id))).first()
    active_customers = session.exec(
        select(func.count(Customer.id)).where(Customer.is_active == True)
    ).first()
    
    # Customers with location data
    customers_with_location = session.exec(
        select(func.count(Customer.id)).where(
            Customer.latitude.is_not(None),
            Customer.longitude.is_not(None)
        )
    ).first()
    
    return {
        "total_customers": total_customers,
        "active_customers": active_customers,
        "inactive_customers": total_customers - active_customers,
        "customers_with_location": customers_with_location,
    }
