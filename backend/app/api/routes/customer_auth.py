"""
Customer authentication routes.
Handles customer login, registration, and token management for mobile app.
"""

from datetime import timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app import crud
from app.api.deps import SessionDep, get_current_customer
from app.core import security
from app.core.config import settings
from app.models import Token, Message
from app.models.customer import CustomerRegister, CustomerPublic


router = APIRouter(prefix="/customers", tags=["customer-auth"])


@router.post("/register", response_model=CustomerPublic)
def register_customer(session: SessionDep, customer_in: CustomerRegister) -> Any:
    """
    Register new customer for mobile app access.
    """
    # Check if customer already exists
    customer = crud.crud_customer.get_by_email(session, email=customer_in.email)
    if customer:
        raise HTTPException(
            status_code=400,
            detail="A customer with this email already exists"
        )
    
    # Create customer
    customer = crud.crud_customer.create(session, obj_in=customer_in)
    return customer


@router.post("/login", response_model=Token)
def login_customer(
    session: SessionDep, 
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login for customers.
    Get an access token for future mobile app requests.
    """
    customer = crud.crud_customer.authenticate(
        db=session,
        email=form_data.username,
        password=form_data.password
    )
    if not customer:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not crud.crud_customer.is_active(customer):
        raise HTTPException(status_code=400, detail="Inactive customer")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            customer.id, expires_delta=access_token_expires
        )
    )


@router.post("/test-token", response_model=CustomerPublic)
def test_customer_token(current_customer: Annotated[Any, Depends(get_current_customer)]) -> Any:
    """
    Test customer access token.
    """
    return current_customer


@router.post("/password-recovery/{email}", response_model=Message)
def recover_customer_password(email: str, session: SessionDep) -> Message:
    """
    Password Recovery for customers.
    """
    customer = crud.crud_customer.get_by_email(session, email=email)
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="A customer with this email does not exist"
        )
    
    # In a real implementation, you would send a password recovery email
    # For now, we'll just return a success message
    return Message(message="Password recovery email sent")


@router.post("/reset-password/", response_model=Message)
def reset_customer_password(
    session: SessionDep,
    token: str,
    new_password: str
) -> Message:
    """
    Reset customer password.
    """
    # In a real implementation, you would verify the reset token
    # and update the customer's password
    # For now, we'll just return a success message
    return Message(message="Password updated successfully")
