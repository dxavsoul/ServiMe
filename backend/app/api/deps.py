from collections.abc import Generator
from typing import Annotated
import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import TokenPayload, User
from app.models.customer import Customer

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

# Customer OAuth2 for mobile app
customer_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/customers/login"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_customer(session: SessionDep, token: Annotated[str, Depends(customer_oauth2)]) -> Customer:
    """Get current customer from JWT token for mobile app authentication."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    customer = session.get(Customer, token_data.sub)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if not customer.is_active:
        raise HTTPException(status_code=400, detail="Inactive customer")
    return customer


CurrentCustomer = Annotated[Customer, Depends(get_current_customer)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_approved_user(current_user: CurrentUser, session: SessionDep) -> User:
    """Get current user if they are approved (assigned to at least one branch) or superuser"""
    from app.crud.crud_user import user as user_crud
    
    if user_crud.is_superuser(current_user):
        return current_user
    
    if user_crud.is_pending_approval(session, current_user):
        raise HTTPException(
            status_code=403, 
            detail="Your account is pending approval. Please wait for an administrator to assign you to a company and branch."
        )
    
    return current_user


def get_company_access_validator(company_id: uuid.UUID):
    """Factory function to create a dependency that validates company access"""
    def validate_company_access(current_user: CurrentUser, session: SessionDep) -> User:
        from app.crud.crud_user import user as user_crud
        
        if not user_crud.has_company_access(session, current_user, company_id):
            raise HTTPException(
                status_code=403, 
                detail="You don't have access to this company's information"
            )
        return current_user
    
    return validate_company_access


def get_branch_access_validator(branch_id: uuid.UUID):
    """Factory function to create a dependency that validates branch access"""
    def validate_branch_access(current_user: CurrentUser, session: SessionDep) -> User:
        from app.crud.crud_user import user as user_crud
        
        if not user_crud.has_branch_access(session, current_user, branch_id):
            raise HTTPException(
                status_code=403, 
                detail="You don't have access to this branch's information"
            )
        return current_user
    
    return validate_branch_access


def get_current_branch_user(current_user: CurrentUser, session: SessionDep) -> User:
    """Get current user if they are assigned to at least one branch (branch user)"""
    from app.crud.crud_user import user as user_crud
    
    if user_crud.is_superuser(current_user):
        return current_user
    
    if user_crud.is_pending_approval(session, current_user):
        raise HTTPException(
            status_code=403, 
            detail="Your account is pending approval. Please wait for an administrator to assign you to a company and branch."
        )
    
    # Check if user is assigned to at least one branch
    from app.crud.crud_branch_user import branch_user_crud
    user_branches = branch_user_crud.get_user_branches(session, user_id=current_user.id)
    
    if not user_branches:
        raise HTTPException(
            status_code=403, 
            detail="You are not assigned to any branch"
        )
    
    return current_user


def get_branch_user_for_request(current_user: CurrentUser, session: SessionDep, request_id: uuid.UUID = None) -> User:
    """Validate branch user access to a service request"""
    from app.crud.crud_user import user as user_crud
    from app.crud.crud_branch_user import branch_user_crud
    from app import crud
    
    if user_crud.is_superuser(current_user):
        return current_user
    
    if not request_id:
        raise HTTPException(status_code=400, detail="Request ID is required")
    
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
    
    return current_user


# Dependency for users who are approved (assigned to branches) or superusers
CurrentApprovedUser = Annotated[User, Depends(get_current_approved_user)]

# Dependency for branch users
CurrentBranchUser = Annotated[User, Depends(get_current_branch_user)]
