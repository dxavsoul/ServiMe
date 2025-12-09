"""
Mobile API routes.
Handles mobile-specific endpoints for service discovery, location-based features,
customer management, JSON objects, and mobile authentication.
"""

import uuid
import math
from datetime import datetime, timedelta
from typing import Any, Annotated, List, Optional
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app import crud
from app.api.deps import SessionDep, get_current_customer
from app.core import security
from app.core.config import settings
from app.models import Token, Message
from app.models.customer import Customer, CustomerRegister, CustomerPublic
from app.models.service_request import ServiceRequest, ServiceRequestCreate
from app.models.service import Service, ServiceWithDetailsPublic, ServicesWithDetailsPublic
from app.models.branch import Branch, BranchPublic
from app.models.company import Company, CompanyPublic
from app.models.department import Department
from app.models.branch_rating import (
    BranchRating, BranchRatingCreate, BranchRatingUpdate, BranchRatingPublic, 
    BranchRatingsPublic, BranchRatingWithDetailsPublic, BranchRatingsWithDetailsPublic,
    BranchRatingStats
)
from app.crud.crud_branch_rating import branch_rating_crud


class LocationUpdate(BaseModel):
    """Model for location update request."""
    latitude: float
    longitude: float


class MobileCustomerRegister(BaseModel):
    """Enhanced mobile customer registration with device and app info."""
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # Mobile-specific fields
    device_info: Optional[dict] = None
    app_version: Optional[str] = None
    platform: Optional[str] = None  # iOS, Android, Web
    push_token: Optional[str] = None
    preferences: Optional[dict] = None


class MobileLoginRequest(BaseModel):
    """Mobile login request with device info."""
    email: EmailStr
    password: str
    device_info: Optional[dict] = None
    app_version: Optional[str] = None
    platform: Optional[str] = None
    push_token: Optional[str] = None
    remember_me: Optional[bool] = False


class MobileLoginResponse(BaseModel):
    """Mobile login response with customer data and token."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    customer: CustomerPublic
    session_info: dict
    initial_data: Optional[dict] = None


class TokenValidationResponse(BaseModel):
    """Token validation response with customer information."""
    token_valid: bool
    customer: CustomerPublic
    permissions: dict
    access_info: dict
    mobile_flags: dict
    session_info: Optional[dict] = None


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) using the Haversine formula.
    Returns distance in kilometers.
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r


router = APIRouter(prefix="/mobile", tags=["mobile"])


# ===== MOBILE AUTHENTICATION ENDPOINTS =====

@router.post("/auth/register", response_model=Any)
def mobile_register_customer(
    session: SessionDep,
    registration_data: MobileCustomerRegister
) -> Any:
    """
    Register new customer through mobile app with enhanced device tracking.
    """
    # Check if customer already exists
    existing_customer = crud.crud_customer.get_by_email(session, email=registration_data.email)
    if existing_customer:
        raise HTTPException(
            status_code=400,
            detail="A customer with this email already exists"
        )
    
    # Validate password strength
    if len(registration_data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long"
        )
    
    # Create customer registration object
    customer_create = CustomerRegister(
        email=registration_data.email,
        password=registration_data.password,
        full_name=registration_data.full_name,
        phone=registration_data.phone,
        address=registration_data.address,
        city=registration_data.city,
        state=registration_data.state,
        country=registration_data.country,
        postal_code=registration_data.postal_code,
        latitude=registration_data.latitude,
        longitude=registration_data.longitude
    )
    
    # Create customer
    customer = crud.crud_customer.create(session, obj_in=customer_create)
    
    # Store mobile-specific data in JSON objects
    customer_key = f"customer_{customer.id}"
    if customer_key not in _json_storage:
        _json_storage[customer_key] = {}
    
    # Store registration metadata
    registration_metadata = {
        "id": str(uuid.uuid4()),
        "key": "registration_info",
        "data": {
            "device_info": registration_data.device_info or {},
            "app_version": registration_data.app_version,
            "platform": registration_data.platform,
            "push_token": registration_data.push_token,
            "registration_date": datetime.utcnow().isoformat(),
            "initial_preferences": registration_data.preferences or {}
        },
        "metadata": {
            "created_by": "mobile_registration",
            "source": "mobile_app",
            "version": "1.0"
        },
        "tags": ["registration", "device_info", "mobile"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "customer_id": str(customer.id),
        "ttl_seconds": None
    }
    
    _json_storage[customer_key]["registration_info"] = registration_metadata
    
    # Store initial preferences if provided
    if registration_data.preferences:
        preferences_obj = {
            "id": str(uuid.uuid4()),
            "key": "user_preferences",
            "data": registration_data.preferences,
            "metadata": {
                "created_by": "mobile_registration",
                "source": "initial_setup"
            },
            "tags": ["preferences", "initial", "mobile"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "customer_id": str(customer.id),
            "ttl_seconds": None
        }
        _json_storage[customer_key]["user_preferences"] = preferences_obj
    
    # Generate welcome token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        customer.id, expires_delta=access_token_expires
    )
    
    return {
        "message": "Customer registered successfully",
        "customer": {
            "id": customer.id,
            "email": customer.email,
            "full_name": customer.full_name,
            "phone": customer.phone,
            "city": customer.city,
            "is_active": customer.is_active
        },
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "registration_metadata": {
            "platform": registration_data.platform,
            "app_version": registration_data.app_version,
            "has_location": registration_data.latitude is not None and registration_data.longitude is not None,
            "has_preferences": registration_data.preferences is not None
        },
        "next_steps": [
            "Complete profile setup",
            "Set location preferences",
            "Explore nearby services",
            "Set notification preferences"
        ]
    }


@router.post("/auth/login", response_model=Any)
def mobile_login_customer(
    session: SessionDep,
    login_data: MobileLoginRequest
) -> Any:
    """
    Mobile customer login with enhanced session management and device tracking.
    """
    # Authenticate customer
    customer = crud.crud_customer.authenticate(
        db=session,
        email=login_data.email,
        password=login_data.password
    )
    
    if not customer:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not crud.crud_customer.is_active(customer):
        raise HTTPException(status_code=400, detail="Inactive customer account")
    
    # Generate access token
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES * (30 if login_data.remember_me else 1)
    )
    access_token = security.create_access_token(
        customer.id, expires_delta=access_token_expires
    )
    
    # Update session info in JSON storage
    customer_key = f"customer_{customer.id}"
    if customer_key not in _json_storage:
        _json_storage[customer_key] = {}
    
    # Store login session data
    session_id = str(uuid.uuid4())
    login_session = {
        "id": str(uuid.uuid4()),
        "key": f"login_session_{session_id}",
        "data": {
            "session_id": session_id,
            "login_time": datetime.utcnow().isoformat(),
            "device_info": login_data.device_info or {},
            "app_version": login_data.app_version,
            "platform": login_data.platform,
            "push_token": login_data.push_token,
            "remember_me": login_data.remember_me,
            "ip_address": "mobile_app",  # In production, get from request
            "user_agent": f"{login_data.platform} {login_data.app_version}"
        },
        "metadata": {
            "created_by": "mobile_login",
            "session_type": "mobile",
            "login_method": "email_password"
        },
        "tags": ["session", "login", "mobile", login_data.platform or "unknown"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "customer_id": str(customer.id),
        "ttl_seconds": access_token_expires.total_seconds()
    }
    
    _json_storage[customer_key][f"login_session_{session_id}"] = login_session
    
    # Update push token if provided
    if login_data.push_token:
        push_token_obj = {
            "id": str(uuid.uuid4()),
            "key": "push_token",
            "data": {
                "token": login_data.push_token,
                "platform": login_data.platform,
                "updated_at": datetime.utcnow().isoformat(),
                "device_info": login_data.device_info or {}
            },
            "metadata": {
                "updated_by": "mobile_login",
                "token_type": "push_notification"
            },
            "tags": ["push_token", "notifications", "mobile"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "customer_id": str(customer.id),
            "ttl_seconds": None
        }
        _json_storage[customer_key]["push_token"] = push_token_obj
    
    # Get customer analytics for initial data
    recent_requests = crud.crud_service_request.get_by_customer(
        session, customer_id=customer.id, skip=0, limit=5
    )
    
    # Get nearby services count if location available
    nearby_services_count = 0
    if customer.latitude and customer.longitude:
        query = select(Service).where(Service.is_active == True).limit(50)
        services = session.exec(query).all()
        
        for service in services:
            try:
                department = crud.department_crud.get(session, id=service.department_id)
                if not department:
                    continue
                
                # Get the branch first, then the company
                branch = crud.branch_crud.get(session, id=department.branch_id)
                if not branch:
                    continue
                
                company = crud.company_crud.get(session, id=branch.company_id)
                if not company or not company.is_active:
                    continue
                
                company_branches = crud.branch_crud.get_by_company(session, company_id=company.id)
                
                for branch in company_branches:
                    if branch.latitude and branch.longitude and branch.is_active:
                        distance_km = calculate_distance(
                            customer.latitude, customer.longitude,
                            branch.latitude, branch.longitude
                        )
                        if distance_km <= 25.0:
                            nearby_services_count += 1
                            break
            except Exception:
                continue
    
    # Prepare initial data for mobile app
    initial_data = {
        "user_stats": {
            "total_requests": len(recent_requests),
            "nearby_services": nearby_services_count,
            "has_location": customer.latitude is not None and customer.longitude is not None
        },
        "recent_activity": [
            {
                "id": req.id,
                "status": req.status,
                "created_at": req.created_at,
                "service_name": crud.service_crud.get(session, id=req.service_id).name if crud.service_crud.get(session, id=req.service_id) else "Unknown"
            }
            for req in recent_requests[:3]
        ],
        "app_config": {
            "api_version": "2.0",
            "features_enabled": {
                "location_services": True,
                "push_notifications": True,
                "json_storage": True,
                "analytics": True
            }
        }
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": int(access_token_expires.total_seconds()),
        "customer": {
            "id": customer.id,
            "email": customer.email,
            "full_name": customer.full_name,
            "phone": customer.phone,
            "address": customer.address,
            "city": customer.city,
            "state": customer.state,
            "country": customer.country,
            "latitude": customer.latitude,
            "longitude": customer.longitude,
            "is_active": customer.is_active
        },
        "session_info": {
            "session_id": session_id,
            "login_time": datetime.utcnow().isoformat(),
            "platform": login_data.platform,
            "app_version": login_data.app_version,
            "remember_me": login_data.remember_me
        },
        "initial_data": initial_data
    }


@router.post("/auth/logout", response_model=Any)
def mobile_logout_customer(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    session_id: Optional[str] = None,
    clear_all_sessions: bool = False
) -> Any:
    """
    Mobile customer logout with session management.
    """
    customer_key = f"customer_{current_customer.id}"
    customer_objects = _json_storage.get(customer_key, {})
    
    logout_count = 0
    
    if clear_all_sessions:
        # Clear all login sessions
        sessions_to_remove = [
            key for key in customer_objects.keys() 
            if key.startswith("login_session_")
        ]
        
        for session_key in sessions_to_remove:
            customer_objects.pop(session_key, None)
            logout_count += 1
    
    elif session_id:
        # Clear specific session
        session_key = f"login_session_{session_id}"
        if session_key in customer_objects:
            customer_objects.pop(session_key)
            logout_count = 1
    
    else:
        # Clear the most recent session (fallback)
        session_keys = [
            key for key in customer_objects.keys() 
            if key.startswith("login_session_")
        ]
        if session_keys:
            # Remove the most recent session (last created)
            most_recent = max(
                session_keys,
                key=lambda k: customer_objects[k].get("created_at", "")
            )
            customer_objects.pop(most_recent, None)
            logout_count = 1
    
    # Store logout event
    logout_event = {
        "id": str(uuid.uuid4()),
        "key": f"logout_event_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "data": {
            "logout_time": datetime.utcnow().isoformat(),
            "session_id": session_id,
            "clear_all_sessions": clear_all_sessions,
            "sessions_cleared": logout_count
        },
        "metadata": {
            "created_by": "mobile_logout",
            "event_type": "logout"
        },
        "tags": ["logout", "session", "mobile"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "customer_id": str(current_customer.id),
        "ttl_seconds": 86400 * 30  # Keep logout events for 30 days
    }
    
    _json_storage[customer_key][logout_event["key"]] = logout_event
    
    return {
        "message": "Successfully logged out",
        "sessions_cleared": logout_count,
        "clear_all_sessions": clear_all_sessions,
        "logout_time": datetime.utcnow().isoformat()
    }


@router.post("/auth/refresh-token", response_model=Any)
def mobile_refresh_token(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    session_id: Optional[str] = None
) -> Any:
    """
    Refresh access token for mobile customer.
    """
    # Generate new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = security.create_access_token(
        current_customer.id, expires_delta=access_token_expires
    )
    
    # Update session if session_id provided
    if session_id:
        customer_key = f"customer_{current_customer.id}"
        customer_objects = _json_storage.get(customer_key, {})
        session_key = f"login_session_{session_id}"
        
        if session_key in customer_objects:
            customer_objects[session_key]["data"]["last_refresh"] = datetime.utcnow().isoformat()
            customer_objects[session_key]["updated_at"] = datetime.utcnow().isoformat()
            customer_objects[session_key]["ttl_seconds"] = access_token_expires.total_seconds()
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": int(access_token_expires.total_seconds()),
        "refresh_time": datetime.utcnow().isoformat(),
        "session_id": session_id
    }


@router.get("/auth/sessions", response_model=Any)
def get_mobile_sessions(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Get all active mobile sessions for the current customer.
    """
    customer_key = f"customer_{current_customer.id}"
    customer_objects = _json_storage.get(customer_key, {})
    
    # Get all login sessions
    sessions = []
    for key, obj in customer_objects.items():
        if key.startswith("login_session_"):
            session_data = obj["data"]
            sessions.append({
                "session_id": session_data.get("session_id"),
                "login_time": session_data.get("login_time"),
                "platform": session_data.get("platform"),
                "app_version": session_data.get("app_version"),
                "device_info": session_data.get("device_info", {}),
                "remember_me": session_data.get("remember_me", False),
                "last_refresh": session_data.get("last_refresh"),
                "is_current": True  # In production, compare with current session
            })
    
    # Sort by login time (most recent first)
    sessions.sort(key=lambda x: x["login_time"] or "", reverse=True)
    
    return {
        "sessions": sessions,
        "total_sessions": len(sessions),
        "customer_id": current_customer.id
    }


@router.delete("/auth/sessions/{session_id}", response_model=Any)
def revoke_mobile_session(
    session_id: str,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Revoke a specific mobile session.
    """
    customer_key = f"customer_{current_customer.id}"
    customer_objects = _json_storage.get(customer_key, {})
    session_key = f"login_session_{session_id}"
    
    if session_key not in customer_objects:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Remove the session
    session_data = customer_objects.pop(session_key)
    
    return {
        "message": "Session revoked successfully",
        "revoked_session_id": session_id,
        "login_time": session_data["data"].get("login_time"),
        "platform": session_data["data"].get("platform"),
        "revoked_at": datetime.utcnow().isoformat()
    }


@router.get("/auth/validate-token", response_model=TokenValidationResponse)
def validate_token_and_get_customer(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> TokenValidationResponse:
    """
    Validate JWT token and return comprehensive customer information.
    
    This endpoint validates the provided JWT token and returns:
    - Token validation status
    - Complete customer information
    - Customer permissions and access levels
    - Mobile-specific access flags
    - Session information if available
    """
    try:
        # Get customer JSON objects
        customer_key = f"customer_{current_customer.id}"
        customer_objects = _json_storage.get(customer_key, {})
        
        # Find active session information
        session_info = None
        active_sessions = [
            obj for obj in customer_objects.values() 
            if isinstance(obj, dict) and obj.get("key", "").startswith("login_session_")
        ]
        
        if active_sessions:
            # Get the most recent session
            latest_session = max(active_sessions, key=lambda x: x.get("data", {}).get("login_time", ""))
            session_info = {
                "session_id": latest_session.get("data", {}).get("session_id"),
                "login_time": latest_session.get("data", {}).get("login_time"),
                "platform": latest_session.get("data", {}).get("platform"),
                "app_version": latest_session.get("data", {}).get("app_version"),
                "device_info": latest_session.get("data", {}).get("device_info", {}),
                "remember_me": latest_session.get("data", {}).get("remember_me", False)
            }
        
        # Get customer's service requests count
        service_requests_count = len([
            obj for obj in customer_objects.values()
            if isinstance(obj, dict) and obj.get("key") == "service_request"
        ])
        
        # Get customer's location if available
        customer_location = None
        location_objects = [
            obj for obj in customer_objects.values()
            if isinstance(obj, dict) and obj.get("key") == "location_update"
        ]
        if location_objects:
            latest_location = max(location_objects, key=lambda x: x.get("data", {}).get("timestamp", ""))
            customer_location = {
                "latitude": latest_location.get("data", {}).get("latitude"),
                "longitude": latest_location.get("data", {}).get("longitude"),
                "updated_at": latest_location.get("data", {}).get("timestamp")
            }
        
        # Build comprehensive response
        try:
            customer_public = CustomerPublic(
                id=current_customer.id,
                email=current_customer.email,
                full_name=current_customer.full_name,
                phone=current_customer.phone,
                address=current_customer.address,
                city=current_customer.city,
                state=current_customer.state,
                country=current_customer.country,
                postal_code=current_customer.postal_code,
                latitude=current_customer.latitude,
                longitude=current_customer.longitude,
                is_active=current_customer.is_active
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating customer public data: {str(e)}"
            )
        
        try:
            response = TokenValidationResponse(
                token_valid=True,
                customer=customer_public,
                permissions={
                    "can_request_services": current_customer.is_active,
                    "can_view_services": current_customer.is_active,
                    "can_update_profile": current_customer.is_active,
                    "can_view_history": current_customer.is_active,
                    "is_verified": current_customer.is_active,  # You can add email verification later
                    "account_status": "active" if current_customer.is_active else "inactive"
                },
                access_info={
                    "customer_id": str(current_customer.id),
                    "email": current_customer.email,
                    "full_name": current_customer.full_name,
                    "account_created": None,  # Customer model doesn't have created_at field
                    "last_updated": None,     # Customer model doesn't have updated_at field
                    "service_requests_count": service_requests_count,
                    "has_location": customer_location is not None,
                    "current_location": customer_location
                },
                mobile_flags={
                    "show_services_tab": current_customer.is_active,
                    "show_profile_tab": True,
                    "show_history_tab": current_customer.is_active,
                    "enable_service_requests": current_customer.is_active,
                    "enable_location_services": True,
                    "show_welcome_message": service_requests_count == 0,
                    "enable_notifications": current_customer.is_active,
                    "show_account_verification": not current_customer.is_active  # If you add email verification
                },
                session_info=session_info
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating token validation response: {str(e)}"
            )
        
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating token and retrieving customer information: {str(e)}"
        )


@router.get("/services/discover", response_model=ServicesWithDetailsPublic)
def discover_services_by_location(
    session: SessionDep,
    latitude: float,
    longitude: float,
    radius_km: float = 25.0,
    skip: int = 0,
    limit: int = 50,
    service_type_id: Optional[uuid.UUID] = None
) -> Any:
    """
    Discover services available near customer's location.
    Returns services from companies that have branches within the specified radius.
    """
    # Get all active services
    query = select(Service).where(Service.is_active == True)
    
    if service_type_id:
        query = query.where(Service.service_type_id == service_type_id)
    
    services = session.exec(query.offset(skip).limit(limit)).all()
    
    # Filter services by location - find services from companies with nearby branches
    nearby_services = []
    
    for service in services:
        try:
            # Get the department and then the company through the branch
            department = crud.department_crud.get(session, id=service.department_id)
            if not department:
                continue
                
            # Get the branch first, then the company
            branch = crud.branch_crud.get(session, id=department.branch_id)
            if not branch:
                continue
                
            company = crud.company_crud.get(session, id=branch.company_id)
            if not company or not company.is_active:
                continue
            
            # Get branches for this company
            company_branches = crud.branch_crud.get_by_company(session, company_id=company.id)
            
            # Check if any branch is within radius
            branch_nearby = False
            for branch in company_branches:
                if branch.latitude and branch.longitude and branch.is_active:
                    # Use proper distance calculation
                    distance_km = calculate_distance(latitude, longitude, branch.latitude, branch.longitude)
                    if distance_km <= radius_km:
                        branch_nearby = True
                        break
            
            if branch_nearby:
                # Create detailed service info
                service_type = crud.service_type_crud.get(session, id=service.service_type_id)
                service_with_details = ServiceWithDetailsPublic(
                    id=service.id,
                    name=service.name,
                    description=service.description,
                    picture_url=service.picture_url,
                    price=service.price,
                    duration_minutes=service.duration_minutes,
                    is_active=service.is_active,
                    has_promotion=service.has_promotion,
                    promotion_description=service.promotion_description,
                    promotion_discount_percentage=service.promotion_discount_percentage,
                    promotion_start_date=service.promotion_start_date,
                    promotion_end_date=service.promotion_end_date,
                    department_id=service.department_id,
                    service_type_id=service.service_type_id,
                    created_by=service.created_by,
                    department_name=department.name,
                    service_type_name=service_type.name if service_type else "Unknown"
                )
                nearby_services.append(service_with_details)
        except Exception as e:
            # Log the error and continue with the next service
            print(f"Error processing service {service.id}: {str(e)}")
            continue
    
    return ServicesWithDetailsPublic(data=nearby_services, count=len(nearby_services))


@router.get("/services/search", response_model=ServicesWithDetailsPublic)
def search_services(
    session: SessionDep,
    search_term: str,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: float = 25.0,
    skip: int = 0,
    limit: int = 50
) -> Any:
    """
    Search services by name or description, optionally filtered by location.
    """
    # Search services by name or description
    query = select(Service).where(
        Service.is_active == True,
        Service.name.ilike(f"%{search_term}%") | Service.description.ilike(f"%{search_term}%")
    )
    
    services = session.exec(query.offset(skip).limit(limit)).all()
    
    # If location is provided, filter by proximity
    if latitude is not None and longitude is not None:
        nearby_services = []
        
        for service in services:
            department = crud.department_crud.get(session, id=service.department_id)
            if not department:
                continue
                
            # Get the branch first, then the company
            branch = crud.branch_crud.get(session, id=department.branch_id)
            if not branch:
                continue
                
            company = crud.company_crud.get(session, id=branch.company_id)
            if not company or not company.is_active:
                continue
            
            # Get branches for this company
            company_branches = crud.branch_crud.get_by_company(session, company_id=company.id)
            
            # Check if any branch is within radius
            branch_nearby = False
            for branch in company_branches:
                if branch.latitude and branch.longitude and branch.is_active:
                    distance_km = calculate_distance(latitude, longitude, branch.latitude, branch.longitude)
                    if distance_km <= radius_km:
                        branch_nearby = True
                        break
            
            if branch_nearby:
                # Create detailed service info
                service_type = crud.service_type_crud.get(session, id=service.service_type_id)
                service_with_details = ServiceWithDetailsPublic(
                    id=service.id,
                    name=service.name,
                    description=service.description,
                    picture_url=service.picture_url,
                    price=service.price,
                    duration_minutes=service.duration_minutes,
                    is_active=service.is_active,
                    has_promotion=service.has_promotion,
                    promotion_description=service.promotion_description,
                    promotion_discount_percentage=service.promotion_discount_percentage,
                    promotion_start_date=service.promotion_start_date,
                    promotion_end_date=service.promotion_end_date,
                    department_id=service.department_id,
                    service_type_id=service.service_type_id,
                    created_by=service.created_by,
                    department_name=department.name,
                    service_type_name=service_type.name if service_type else "Unknown"
                )
                nearby_services.append(service_with_details)
        
        return ServicesWithDetailsPublic(data=nearby_services, count=len(nearby_services))
    
    else:
        # Return all matching services without location filter
        detailed_services = []
        for service in services:
            department = crud.department_crud.get(session, id=service.department_id)
            service_type = crud.service_type_crud.get(session, id=service.service_type_id)
            
            service_with_details = ServiceWithDetailsPublic(
                id=service.id,
                name=service.name,
                description=service.description,
                picture_url=service.picture_url,
                price=service.price,
                duration_minutes=service.duration_minutes,
                is_active=service.is_active,
                has_promotion=service.has_promotion,
                promotion_description=service.promotion_description,
                promotion_discount_percentage=service.promotion_discount_percentage,
                promotion_start_date=service.promotion_start_date,
                promotion_end_date=service.promotion_end_date,
                department_id=service.department_id,
                service_type_id=service.service_type_id,
                created_by=service.created_by,
                department_name=department.name if department else "Unknown",
                service_type_name=service_type.name if service_type else "Unknown"
            )
            detailed_services.append(service_with_details)
        
        return ServicesWithDetailsPublic(data=detailed_services, count=len(detailed_services))


@router.get("/service-types", response_model=Any)
def get_service_types(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get all available service types for filtering services.
    """
    service_types, count = crud.service_type_crud.get_multi(session, skip=skip, limit=limit)
    
    return {
        "data": [
            {
                "id": st.id,
                "name": st.name,
                "description": st.description,
                "picture_url": st.picture_url,
                "is_active": st.is_active
            }
            for st in service_types if st.is_active
        ],
        "count": len([st for st in service_types if st.is_active])
    }


@router.get("/service-types/nearby", response_model=Any)
def get_service_types_by_location(
    session: SessionDep,
    latitude: float,
    longitude: float,
    radius_km: float = 25.0,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get service types available near a specific location.
    Returns service types that have active services from branches within the specified radius.
    Each service type includes detailed branch information with their respective company details.
    """
    # Get all active service types
    service_types, _ = crud.service_type_crud.get_multi(session, skip=0, limit=1000)
    
    nearby_service_types = []
    
    for service_type in service_types:
        if not service_type.is_active:
            continue
            
        # Get all services of this type
        services_query = select(Service).where(
            Service.service_type_id == service_type.id,
            Service.is_active == True
        )
        services = session.exec(services_query).all()
        
        # Check if any service of this type is available near the location
        has_nearby_service = False
        nearby_branches = []
        total_services_count = 0
        
        for service in services:
            try:
                # Get the department
                department = crud.department_crud.get(session, id=service.department_id)
                if not department:
                    continue
                
                # Get the branch from department
                branch = crud.branch_crud.get(session, id=department.branch_id)
                if not branch or not branch.is_active:
                    continue
                    
                # Get the company from branch
                company = crud.company_crud.get(session, id=branch.company_id)
                if not company or not company.is_active:
                    continue
                
                # Check if this branch is within radius
                if branch.latitude and branch.longitude:
                    distance_km = calculate_distance(latitude, longitude, branch.latitude, branch.longitude)
                    if distance_km <= radius_km:
                        has_nearby_service = True
                        
                        # Check if we already have this branch in our list
                        branch_exists = any(b.id == branch.id for b in nearby_branches)
                        if not branch_exists:
                            nearby_branches.append({
                                "id": branch.id,
                                "name": branch.name,
                                "address": branch.address,
                                "city_id": branch.city_id,
                                "phone": branch.phone,
                                "email": branch.email,
                                "latitude": branch.latitude,
                                "longitude": branch.longitude,
                                "distance_km": round(distance_km, 2),
                                "company": {
                                    "id": company.id,
                                    "name": company.name,
                                    "description": company.description,
                                    "logo_image_url": company.logo_image_url,
                                    "website": company.website,
                                    "phone": company.phone,
                                    "email": company.email
                                },
                                "services_count": 1
                            })
                            total_services_count += 1
                        else:
                            # Update existing branch
                            for b in nearby_branches:
                                if b["id"] == branch.id:
                                    b["services_count"] += 1
                                    total_services_count += 1
                                    if distance_km < b["distance_km"]:
                                        b["distance_km"] = round(distance_km, 2)
                                    break
                        
            except Exception as e:
                # Log the error and continue with the next service
                print(f"Error processing service {service.id}: {str(e)}")
                continue
        
        # If this service type has nearby services, add it to results
        if has_nearby_service:
            # Sort branches by distance
            nearby_branches.sort(key=lambda x: x["distance_km"])
            
            service_type_info = {
                "id": service_type.id,
                "name": service_type.name,
                "description": service_type.description,
                "picture_url": service_type.picture_url,
                "is_active": service_type.is_active,
                "nearby_services_count": total_services_count,
                "nearby_branches_count": len(nearby_branches),
                "nearest_distance_km": min([b["distance_km"] for b in nearby_branches]) if nearby_branches else None,
                "branches": nearby_branches[:10]  # Limit to top 10 closest branches
            }
            nearby_service_types.append(service_type_info)
    
    # Sort service types by nearest distance
    nearby_service_types.sort(key=lambda x: x["nearest_distance_km"] or float('inf'))
    
    # Apply pagination
    paginated_service_types = nearby_service_types[skip:skip + limit]
    
    return {
        "data": paginated_service_types,
        "count": len(nearby_service_types),
        "radius_km": radius_km,
        "location": {
            "latitude": latitude,
            "longitude": longitude
        }
    }


@router.get("/branches/{branch_id}/services", response_model=ServicesWithDetailsPublic)
def get_services_by_branch(
    branch_id: uuid.UUID,
    session: SessionDep,
    skip: int = 0,
    limit: int = 50,
    include_inactive: bool = False
) -> Any:
    """
    Get all services offered by departments within a specific branch.
    
    Args:
        branch_id: UUID of the branch
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        include_inactive: Whether to include inactive services (default: False)
    
    Returns:
        List of services with detailed information from the specified branch
    """
    # Verify the branch exists
    branch = crud.branch_crud.get(session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check if branch is active
    if not branch.is_active:
        raise HTTPException(status_code=400, detail="Branch is not active")
    
    # Get all departments for this branch
    departments, _ = crud.department_crud.get_by_branch(session, branch_id=branch_id)
    
    if not departments:
        # Return empty result if no departments found
        return ServicesWithDetailsPublic(data=[], count=0)
    
    # Get all services from these departments
    all_services = []
    for department in departments:
        # Get services for this department
        dept_services, _ = crud.service_crud.get_by_department_with_count(session, department_id=department.id)
        
        for service in dept_services:
            # Filter by active status unless include_inactive is True
            if not include_inactive and not service.is_active:
                continue
                
            # Get service type information
            service_type = crud.service_type_crud.get(session, id=service.service_type_id)
            
            # Create detailed service info
            service_with_details = ServiceWithDetailsPublic(
                id=service.id,
                name=service.name,
                description=service.description,
                picture_url=service.picture_url,
                price=service.price,
                duration_minutes=service.duration_minutes,
                is_active=service.is_active,
                has_promotion=service.has_promotion,
                promotion_description=service.promotion_description,
                promotion_discount_percentage=service.promotion_discount_percentage,
                promotion_start_date=service.promotion_start_date,
                promotion_end_date=service.promotion_end_date,
                department_id=service.department_id,
                service_type_id=service.service_type_id,
                created_by=service.created_by,
                department_name=department.name,
                service_type_name=service_type.name if service_type else "Unknown"
            )
            all_services.append(service_with_details)
    
    # Sort services by name for consistent ordering
    all_services.sort(key=lambda x: x.name.lower())
    
    # Apply pagination
    paginated_services = all_services[skip:skip + limit]
    
    return ServicesWithDetailsPublic(data=paginated_services, count=len(all_services))


@router.get("/branches/{branch_id}/services/by-type/{service_type_id}", response_model=ServicesWithDetailsPublic)
def get_services_by_branch_and_type(
    branch_id: uuid.UUID,
    service_type_id: uuid.UUID,
    session: SessionDep,
    skip: int = 0,
    limit: int = 50,
    include_inactive: bool = False
) -> Any:
    """
    Get services offered by departments within a specific branch, filtered by service type.
    
    Args:
        branch_id: UUID of the branch
        service_type_id: UUID of the service type to filter by
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        include_inactive: Whether to include inactive services (default: False)
    
    Returns:
        List of services with detailed information from the specified branch and service type
    """
    # Verify the branch exists
    branch = crud.branch_crud.get(session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check if branch is active
    if not branch.is_active:
        raise HTTPException(status_code=400, detail="Branch is not active")
    
    # Verify the service type exists
    service_type = crud.service_type_crud.get(session, id=service_type_id)
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    # Check if service type is active
    if not service_type.is_active:
        raise HTTPException(status_code=400, detail="Service type is not active")
    
    # Get all departments for this branch
    departments, _ = crud.department_crud.get_by_branch(session, branch_id=branch_id)
    
    if not departments:
        # Return empty result if no departments found
        return ServicesWithDetailsPublic(data=[], count=0)
    
    # Get all services from these departments filtered by service type
    filtered_services = []
    for department in departments:
        # Get services for this department
        dept_services, _ = crud.service_crud.get_by_department_with_count(session, department_id=department.id)
        
        for service in dept_services:
            # Filter by service type
            if service.service_type_id != service_type_id:
                continue
                
            # Filter by active status unless include_inactive is True
            if not include_inactive and not service.is_active:
                continue
            
            # Create detailed service info
            service_with_details = ServiceWithDetailsPublic(
                id=service.id,
                name=service.name,
                description=service.description,
                picture_url=service.picture_url,
                price=service.price,
                duration_minutes=service.duration_minutes,
                is_active=service.is_active,
                has_promotion=service.has_promotion,
                promotion_description=service.promotion_description,
                promotion_discount_percentage=service.promotion_discount_percentage,
                promotion_start_date=service.promotion_start_date,
                promotion_end_date=service.promotion_end_date,
                department_id=service.department_id,
                service_type_id=service.service_type_id,
                created_by=service.created_by,
                department_name=department.name,
                service_type_name=service_type.name if service_type else "Unknown"
            )
            filtered_services.append(service_with_details)
    
    # Sort services by name for consistent ordering
    filtered_services.sort(key=lambda x: x.name.lower())
    
    # Apply pagination
    paginated_services = filtered_services[skip:skip + limit]
    
    return ServicesWithDetailsPublic(data=paginated_services, count=len(filtered_services))


@router.get("/profile", response_model=Any)
def get_mobile_profile(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Get customer profile with additional mobile-specific information.
    """
    # Get customer's recent service requests
    recent_requests = crud.crud_service_request.get_by_customer(
        session, customer_id=current_customer.id, skip=0, limit=5
    )
    
    # Get customer's favorite services (based on service requests)
    favorite_services = []
    service_counts = {}
    
    for request in recent_requests:
        service_id = str(request.service_id)
        service_counts[service_id] = service_counts.get(service_id, 0) + 1
    
    # Get top 3 most requested services
    top_services = sorted(service_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    
    for service_id, count in top_services:
        service = crud.service_crud.get(session, id=uuid.UUID(service_id))
        if service:
            favorite_services.append({
                "id": service.id,
                "name": service.name,
                "description": service.description,
                "request_count": count
            })
    
    return {
        "customer": {
            "id": current_customer.id,
            "email": current_customer.email,
            "full_name": current_customer.full_name,
            "phone": current_customer.phone,
            "address": current_customer.address,
            "city": current_customer.city,
            "state": current_customer.state,
            "country": current_customer.country,
            "latitude": current_customer.latitude,
            "longitude": current_customer.longitude,
            "is_active": current_customer.is_active
        },
        "statistics": {
            "total_service_requests": len(recent_requests),
            "favorite_services_count": len(favorite_services)
        },
        "recent_requests": [
            {
                "id": req.id,
                "status": req.status,
                "created_at": req.created_at,
                "service_name": crud.service_crud.get(session, id=req.service_id).name if crud.service_crud.get(session, id=req.service_id) else "Unknown"
            }
            for req in recent_requests
        ],
        "favorite_services": favorite_services
    }


@router.get("/services/{service_id}/details", response_model=Any)
def get_service_details_for_mobile(
    service_id: uuid.UUID,
    session: SessionDep,
    latitude: float = None,
    longitude: float = None
) -> Any:
    """
    Get detailed service information including nearby branches offering this service.
    """
    service = crud.service_crud.get(session, id=service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get department and company info
    department = crud.department_crud.get(session, id=service.department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Get the branch first, then the company
    branch = crud.branch_crud.get(session, id=department.branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    company = crud.company_crud.get(session, id=branch.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    service_type = crud.service_type_crud.get(session, id=service.service_type_id)
    
    # Get company branches
    all_branches = crud.branch_crud.get_by_company(session, company_id=company.id)
    
    # If location provided, calculate distances and sort by proximity
    branches_info = []
    for branch in all_branches:
        if branch.is_active:
            branch_info = {
                "id": branch.id,
                "name": branch.name,
                "address": branch.address,
                "city": branch.city,
                "state": branch.state,
                "country": branch.country,
                "phone": branch.phone,
                "email": branch.email,
                "latitude": branch.latitude,
                "longitude": branch.longitude,
                "is_active": branch.is_active
            }
            
            # Calculate distance if customer location provided
            if latitude and longitude and branch.latitude and branch.longitude:
                distance_km = calculate_distance(latitude, longitude, branch.latitude, branch.longitude)
                branch_info["distance_km"] = round(distance_km, 2)
            
            branches_info.append(branch_info)
    
    # Sort by distance if location provided
    if latitude and longitude:
        branches_info.sort(key=lambda x: x.get("distance_km", float('inf')))
    
    return {
        "service": {
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "picture_url": service.picture_url,
            "price": service.price,
            "duration_minutes": service.duration_minutes,
            "is_active": service.is_active,
            "has_promotion": service.has_promotion,
            "promotion_description": service.promotion_description,
            "promotion_discount_percentage": service.promotion_discount_percentage,
            "promotion_start_date": service.promotion_start_date,
            "promotion_end_date": service.promotion_end_date
        },
        "department": {
            "id": department.id,
            "name": department.name,
            "description": department.description
        },
        "company": {
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "website": company.website,
            "phone": company.phone,
            "email": company.email,
            "logo_image_url": company.logo_image_url
        },
        "service_type": {
            "id": service_type.id,
            "name": service_type.name,
            "description": service_type.description,
            "picture_url": service_type.picture_url
        } if service_type else None,
        "available_branches": branches_info,
        "total_branches": len(branches_info)
    }


@router.get("/dashboard", response_model=Any)
def get_mobile_dashboard(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    latitude: float = None,
    longitude: float = None
) -> Any:
    """
    Get mobile dashboard with personalized content for the customer.
    """
    # Get recent service requests
    recent_requests = crud.crud_service_request.get_by_customer(
        session, customer_id=current_customer.id, skip=0, limit=3
    )
    
    # Get trending services (most requested services recently)
    # This is a simplified implementation - in production you'd want proper analytics
    all_recent_requests, _ = crud.crud_service_request.get_multi(session, skip=0, limit=100)
    service_popularity = {}
    
    for request in all_recent_requests:
        service_id = str(request.service_id)
        service_popularity[service_id] = service_popularity.get(service_id, 0) + 1
    
    trending_services = []
    top_service_ids = sorted(service_popularity.items(), key=lambda x: x[1], reverse=True)[:5]
    
    for service_id, count in top_service_ids:
        service = crud.service_crud.get(session, id=uuid.UUID(service_id))
        if service and service.is_active:
            department = crud.department_crud.get(session, id=service.department_id)
            trending_services.append({
                "id": service.id,
                "name": service.name,
                "description": service.description,
                "price": service.price,
                "department_name": department.name if department else "Unknown",
                "request_count": count
            })
    
    # Get promoted services
    promoted_services = []
    query = select(Service).where(
        Service.is_active == True,
        Service.has_promotion == True
    ).limit(5)
    
    promo_services = session.exec(query).all()
    for service in promo_services:
        department = crud.department_crud.get(session, id=service.department_id)
        promoted_services.append({
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "price": service.price,
            "promotion_description": service.promotion_description,
            "promotion_discount_percentage": service.promotion_discount_percentage,
            "department_name": department.name if department else "Unknown"
        })
    
    # Get nearby companies count if location provided
    nearby_companies_count = 0
    if latitude and longitude:
        companies, _ = crud.company_crud.get_multi(session, skip=0, limit=200)
        
        for company in companies:
            if not company.is_active:
                continue
            
            company_branches = crud.branch_crud.get_by_company(session, company_id=company.id)
            
            for branch in company_branches:
                if branch.latitude and branch.longitude and branch.is_active:
                    distance_km = calculate_distance(latitude, longitude, branch.latitude, branch.longitude)
                    if distance_km <= 25.0:  # 25km radius
                        nearby_companies_count += 1
                        break
    
    return {
        "customer_summary": {
            "name": current_customer.full_name,
            "total_requests": len(recent_requests),
            "has_location": current_customer.latitude is not None and current_customer.longitude is not None
        },
        "recent_requests": [
            {
                "id": req.id,
                "status": req.status,
                "created_at": req.created_at,
                "service_name": crud.service_crud.get(session, id=req.service_id).name if crud.service_crud.get(session, id=req.service_id) else "Unknown"
            }
            for req in recent_requests
        ],
        "trending_services": trending_services,
        "promoted_services": promoted_services,
        "location_stats": {
            "nearby_companies_count": nearby_companies_count,
            "location_provided": latitude is not None and longitude is not None
        },
        "quick_actions": [
            {"action": "discover_services", "label": "Discover Services"},
            {"action": "search_services", "label": "Search Services"},
            {"action": "view_requests", "label": "My Requests"},
            {"action": "nearby_companies", "label": "Nearby Companies"}
        ]
    }


@router.post("/location/update", response_model=Any)
def update_customer_location(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    location_data: LocationUpdate
) -> Any:
    """
    Update customer's current location for better service discovery.
    """
    latitude = location_data.latitude
    longitude = location_data.longitude
    
    # Validate coordinates
    if not (-90.0 <= latitude <= 90.0):
        raise HTTPException(status_code=400, detail="Invalid latitude. Must be between -90 and 90")
    
    if not (-180.0 <= longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Invalid longitude. Must be between -180 and 180")
    
    # Update customer location
    current_customer.latitude = latitude
    current_customer.longitude = longitude
    session.add(current_customer)
    session.commit()
    session.refresh(current_customer)
    
    # Get nearby services count as confirmation
    nearby_services_count = 0
    try:
        query = select(Service).where(Service.is_active == True).limit(100)
        services = session.exec(query).all()
        
        for service in services:
            try:
                department = crud.department_crud.get(session, id=service.department_id)
                if not department:
                    continue
                
                # Get the branch first, then the company
                branch = crud.branch_crud.get(session, id=department.branch_id)
                if not branch:
                    continue
                
                company = crud.company_crud.get(session, id=branch.company_id)
                if not company or not company.is_active:
                    continue
                
                company_branches = crud.branch_crud.get_by_company(session, company_id=company.id)
                
                for branch in company_branches:
                    if branch.latitude and branch.longitude and branch.is_active:
                        distance_km = calculate_distance(latitude, longitude, branch.latitude, branch.longitude)
                        if distance_km <= 25.0:  # 25km radius
                            nearby_services_count += 1
                            break
            except Exception:
                continue
    except Exception:
        # If there's an error getting nearby services, just return 0
        nearby_services_count = 0
    
    return {
        "message": "Location updated successfully",
        "location": {
            "latitude": latitude,
            "longitude": longitude
        },
        "nearby_services_count": nearby_services_count
    }


# ===== SERVICE REQUEST MANAGEMENT =====

@router.post("/service-requests", response_model=Any)
def create_service_request(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    service_request_data: ServiceRequestCreate
) -> Any:
    """
    Create a new service request for mobile app.
    """
    # Verify the service exists
    service = crud.service_crud.get(session, id=service_request_data.service_id)
    if not service or not service.is_active:
        raise HTTPException(status_code=404, detail="Service not found or inactive")
    
    # Create the service request
    service_request = crud.crud_service_request.create_with_customer(
        session, obj_in=service_request_data, customer_id=current_customer.id
    )
    
    # Get additional details for response
    department = crud.department_crud.get(session, id=service.department_id)
    
    # Get company through branch
    branch = crud.branch_crud.get(session, id=department.branch_id) if department else None
    company = crud.company_crud.get(session, id=branch.company_id) if branch else None
    
    return {
        "id": service_request.id,
        "service_id": service_request.service_id,
        "status": service_request.status,
        "description": service_request.description,
        "preferred_date": service_request.preferred_date,
        "preferred_time": service_request.preferred_time,
        "urgent": service_request.urgent,
        "created_at": service_request.created_at,
        "service_details": {
            "name": service.name,
            "price": service.price,
            "duration_minutes": service.duration_minutes,
            "department_name": department.name if department else "Unknown",
            "company_name": company.name if company else "Unknown"
        }
    }


@router.get("/service-requests", response_model=Any)
def get_my_service_requests(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
) -> Any:
    """
    Get customer's service requests with optional status filtering.
    """
    # Get customer's service requests
    if status:
        # Filter by status if provided
        query = select(ServiceRequest).where(
            ServiceRequest.customer_id == current_customer.id,
            ServiceRequest.status == status
        ).offset(skip).limit(limit).order_by(ServiceRequest.created_at.desc())
        requests = session.exec(query).all()
        
        # Count for pagination
        count_query = select(ServiceRequest).where(
            ServiceRequest.customer_id == current_customer.id,
            ServiceRequest.status == status
        )
        total_count = len(session.exec(count_query).all())
    else:
        requests = crud.crud_service_request.get_by_customer(
            session, customer_id=current_customer.id, skip=skip, limit=limit
        )
        # For total count, get all without pagination
        all_requests = crud.crud_service_request.get_by_customer(
            session, customer_id=current_customer.id, skip=0, limit=1000
        )
        total_count = len(all_requests)
    
    # Enrich with service details
    detailed_requests = []
    for req in requests:
        service = crud.service_crud.get(session, id=req.service_id)
        department = crud.department_crud.get(session, id=service.department_id) if service else None
        
        # Get company through branch
        dept_branch = crud.branch_crud.get(session, id=department.branch_id) if department else None
        company = crud.company_crud.get(session, id=dept_branch.company_id) if dept_branch else None
        branch = crud.branch_crud.get(session, id=req.branch_id) if req.branch_id else None
        
        request_detail = {
            "id": req.id,
            "service_id": req.service_id,
            "status": req.status,
            "description": req.description,
            "preferred_date": req.preferred_date,
            "preferred_time": req.preferred_time,
            "urgent": req.urgent,
            "customer_latitude": req.customer_latitude,
            "customer_longitude": req.customer_longitude,
            "created_at": req.created_at,
            "updated_at": req.updated_at,
            "service_details": {
                "name": service.name if service else "Unknown",
                "price": service.price if service else None,
                "duration_minutes": service.duration_minutes if service else None,
                "department_name": department.name if department else "Unknown",
                "company_name": company.name if company else "Unknown"
            },
            "branch_details": {
                "id": branch.id,
                "name": branch.name,
                "address": branch.address,
                "city": branch.city,
                "phone": branch.phone
            } if branch else None
        }
        detailed_requests.append(request_detail)
    
    return {
        "data": detailed_requests,
        "count": total_count,
        "status_filter": status
    }


@router.get("/service-requests/{request_id}", response_model=Any)
def get_service_request_detail(
    request_id: uuid.UUID,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Get detailed information about a specific service request.
    """
    # Get the service request and verify ownership
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if service_request.customer_id != current_customer.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this service request")
    
    # Get related objects
    service = crud.service_crud.get(session, id=service_request.service_id)
    department = crud.department_crud.get(session, id=service.department_id) if service else None
    
    # Get company through branch
    dept_branch = crud.branch_crud.get(session, id=department.branch_id) if department else None
    company = crud.company_crud.get(session, id=dept_branch.company_id) if dept_branch else None
    branch = crud.branch_crud.get(session, id=service_request.branch_id) if service_request.branch_id else None
    service_type = crud.service_type_crud.get(session, id=service.service_type_id) if service else None
    
    return {
        "request": {
            "id": service_request.id,
            "service_id": service_request.service_id,
            "status": service_request.status,
            "description": service_request.description,
            "preferred_date": service_request.preferred_date,
            "preferred_time": service_request.preferred_time,
            "urgent": service_request.urgent,
            "customer_latitude": service_request.customer_latitude,
            "customer_longitude": service_request.customer_longitude,
            "created_at": service_request.created_at,
            "updated_at": service_request.updated_at
        },
        "service": {
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "price": service.price,
            "duration_minutes": service.duration_minutes,
            "picture_url": service.picture_url,
            "has_promotion": service.has_promotion,
            "promotion_description": service.promotion_description,
            "promotion_discount_percentage": service.promotion_discount_percentage
        } if service else None,
        "department": {
            "id": department.id,
            "name": department.name,
            "description": department.description
        } if department else None,
        "company": {
            "id": company.id,
            "name": company.name,
            "description": company.description,
            "website": company.website,
            "phone": company.phone,
            "email": company.email
        } if company else None,
        "branch": {
            "id": branch.id,
            "name": branch.name,
            "address": branch.address,
            "city": branch.city,
            "state": branch.state,
            "country": branch.country,
            "phone": branch.phone,
            "email": branch.email,
            "latitude": branch.latitude,
            "longitude": branch.longitude
        } if branch else None,
        "service_type": {
            "id": service_type.id,
            "name": service_type.name,
            "description": service_type.description
        } if service_type else None
    }


@router.patch("/service-requests/{request_id}/cancel", response_model=Any)
def cancel_service_request(
    request_id: uuid.UUID,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Cancel a service request (if allowed).
    """
    # Get the service request and verify ownership
    service_request = crud.crud_service_request.get(session, id=request_id)
    if not service_request:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    if service_request.customer_id != current_customer.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this service request")
    
    # Check if cancellation is allowed
    if service_request.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel a request that is already completed or cancelled")
    
    # Update status to cancelled
    service_request.status = "cancelled"
    service_request.updated_at = datetime.utcnow().isoformat()
    session.add(service_request)
    session.commit()
    session.refresh(service_request)
    
    return {
        "message": "Service request cancelled successfully",
        "request_id": service_request.id,
        "status": service_request.status,
        "updated_at": service_request.updated_at
    }


# ===== ENHANCED OBJECT DISCOVERY =====

@router.get("/branches/nearby", response_model=Any)
def get_nearby_branches(
    session: SessionDep,
    latitude: float,
    longitude: float,
    radius_km: float = 15.0,
    company_id: Optional[uuid.UUID] = None,
    include_ratings: bool = True,
    skip: int = 0,
    limit: int = 20
) -> Any:
    """
    Get branches near a location, optionally filtered by company, with rating information.
    """
    # Build query
    if company_id:
        # Get branches for specific company
        branches = crud.branch_crud.get_by_company(session, company_id=company_id)
        # Verify company exists and is active
        company = crud.company_crud.get(session, id=company_id)
        if not company or not company.is_active:
            raise HTTPException(status_code=404, detail="Company not found or inactive")
    else:
        # Get all active branches
        all_branches, _ = crud.branch_crud.get_multi(session, skip=0, limit=1000)
        branches = [b for b in all_branches if b.is_active]
    
    # Filter by distance and enrich with details
    nearby_branches = []
    for branch in branches:
        if branch.latitude and branch.longitude and branch.is_active:
            distance_km = calculate_distance(latitude, longitude, branch.latitude, branch.longitude)
            
            if distance_km <= radius_km:
                # Get company info
                company = crud.company_crud.get(session, id=branch.company_id)
                
                # Get services count for this branch
                departments, _ = crud.department_crud.get_by_branch(session, branch_id=branch.id)
                services_count = 0
                for dept in departments:
                    if dept.is_active:
                        dept_services = crud.service_crud.get_by_department(session, department_id=dept.id)
                        services_count += len([s for s in dept_services if s.is_active])
                
                branch_info = {
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
                    "distance_km": round(distance_km, 2),
                    "is_active": branch.is_active,
                    "company": {
                        "id": company.id,
                        "name": company.name,
                        "description": company.description,
                        "website": company.website,
                        "phone": company.phone,
                        "email": company.email,
                        "logo_image_url": company.logo_image_url
                    } if company else None,
                    "services_count": services_count,
                    "departments_count": len([d for d in departments if d.is_active])
                }
                
                # Add rating information if requested
                if include_ratings:
                    rating_stats = branch_rating_crud.get_rating_stats(session=session, branch_id=branch.id)
                    branch_info["rating_stats"] = rating_stats
                
                nearby_branches.append(branch_info)
    
    # Sort by distance
    nearby_branches.sort(key=lambda x: x["distance_km"])
    
    # Apply pagination
    paginated_branches = nearby_branches[skip:skip + limit]
    
    return {
        "data": paginated_branches,
        "count": len(nearby_branches),
        "radius_km": radius_km,
        "company_filter": company_id,
        "include_ratings": include_ratings
    }


@router.get("/departments", response_model=Any)
def get_departments_by_branch(
    session: SessionDep,
    branch_id: uuid.UUID,
    include_services: bool = False
) -> Any:
    """
    Get departments for a specific branch, optionally including services.
    """
    # Verify branch exists
    branch = crud.branch_crud.get(session, id=branch_id)
    if not branch or not branch.is_active:
        raise HTTPException(status_code=404, detail="Branch not found or inactive")
    
    # Get departments
    departments, _ = crud.department_crud.get_by_branch(session, branch_id=branch_id)
    active_departments = [d for d in departments if d.is_active]
    
    # Enrich with additional data
    departments_data = []
    for dept in active_departments:
        dept_info = {
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "is_active": dept.is_active,
            "branch_id": dept.branch_id
        }
        
        if include_services:
            # Get services for this department
            services = crud.service_crud.get_by_department(session, department_id=dept.id)
            active_services = [s for s in services if s.is_active]
            
            dept_info["services"] = [
                {
                    "id": service.id,
                    "name": service.name,
                    "description": service.description,
                    "price": service.price,
                    "duration_minutes": service.duration_minutes,
                    "has_promotion": service.has_promotion,
                    "promotion_description": service.promotion_description,
                    "promotion_discount_percentage": service.promotion_discount_percentage
                }
                for service in active_services
            ]
            dept_info["services_count"] = len(active_services)
        else:
            # Just get the count
            services = crud.service_crud.get_by_department(session, department_id=dept.id)
            dept_info["services_count"] = len([s for s in services if s.is_active])
        
        departments_data.append(dept_info)
    
    # Get company info
    company = crud.company_crud.get(session, id=branch.company_id)
    
    return {
        "branch": {
            "id": branch.id,
            "name": branch.name,
            "address": branch.address,
            "city": branch.city,
            "phone": branch.phone
        },
        "company": {
            "id": company.id,
            "name": company.name,
            "description": company.description
        } if company else None,
        "departments": departments_data,
        "total_departments": len(departments_data),
        "include_services": include_services
    }


# ===== STATISTICS AND ANALYTICS =====

@router.get("/analytics/customer-stats", response_model=Any)
def get_customer_analytics(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Get comprehensive analytics for the current customer.
    """
    # Get all customer's service requests
    all_requests = crud.crud_service_request.get_by_customer(
        session, customer_id=current_customer.id, skip=0, limit=1000
    )
    
    # Calculate statistics
    total_requests = len(all_requests)
    status_counts = {}
    service_usage = {}
    company_usage = {}
    monthly_usage = {}
    
    for request in all_requests:
        # Status distribution
        status = request.status
        status_counts[status] = status_counts.get(status, 0) + 1
        
        # Service usage
        service_id = str(request.service_id)
        service_usage[service_id] = service_usage.get(service_id, 0) + 1
        
        # Company usage (through service -> department -> branch -> company)
        service = crud.service_crud.get(session, id=request.service_id)
        if service:
            department = crud.department_crud.get(session, id=service.department_id)
            if department:
                # Get company through branch
                branch = crud.branch_crud.get(session, id=department.branch_id)
                if branch:
                    company = crud.company_crud.get(session, id=branch.company_id)
                if company:
                    company_name = company.name
                    company_usage[company_name] = company_usage.get(company_name, 0) + 1
        
        # Monthly usage (if created_at is available)
        if request.created_at:
            try:
                from datetime import datetime
                created_date = datetime.fromisoformat(request.created_at.replace('Z', '+00:00'))
                month_key = created_date.strftime('%Y-%m')
                monthly_usage[month_key] = monthly_usage.get(month_key, 0) + 1
            except:
                pass
    
    # Get most used services with details
    top_services = []
    for service_id, count in sorted(service_usage.items(), key=lambda x: x[1], reverse=True)[:5]:
        service = crud.service_crud.get(session, id=uuid.UUID(service_id))
        if service:
            department = crud.department_crud.get(session, id=service.department_id)
            top_services.append({
                "service_id": service.id,
                "service_name": service.name,
                "department_name": department.name if department else "Unknown",
                "usage_count": count
            })
    
    # Get most used companies
    top_companies = [
        {"company_name": company, "usage_count": count}
        for company, count in sorted(company_usage.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    return {
        "summary": {
            "total_requests": total_requests,
            "has_location": current_customer.latitude is not None and current_customer.longitude is not None,
            "account_active_days": "N/A"  # Would need account creation date
        },
        "status_distribution": status_counts,
        "top_services": top_services,
        "top_companies": top_companies,
        "monthly_usage": dict(sorted(monthly_usage.items())),
        "trends": {
            "avg_requests_per_month": round(total_requests / max(len(monthly_usage), 1), 2),
            "most_common_status": max(status_counts.items(), key=lambda x: x[1])[0] if status_counts else "N/A"
        }
    }


# ===== ENHANCED CUSTOMER MANAGEMENT =====

class CustomerExtendedProfile(BaseModel):
    """Extended customer profile for mobile with preferences and metadata."""
    preferences: Optional[dict] = None
    metadata: Optional[dict] = None
    settings: Optional[dict] = None
    favorites: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class CustomerProfileUpdate(BaseModel):
    """Comprehensive customer profile update."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    preferences: Optional[dict] = None
    metadata: Optional[dict] = None
    settings: Optional[dict] = None
    favorites: Optional[List[str]] = None
    tags: Optional[List[str]] = None


@router.get("/customer/profile/extended", response_model=Any)
def get_extended_customer_profile(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Get comprehensive customer profile with all associated data and analytics.
    """
    # Get service requests with detailed analytics
    all_requests = crud.crud_service_request.get_by_customer(
        session, customer_id=current_customer.id, skip=0, limit=1000
    )
    
    # Calculate comprehensive statistics
    request_stats = {
        "total": len(all_requests),
        "pending": len([r for r in all_requests if r.status == "pending"]),
        "accepted": len([r for r in all_requests if r.status == "accepted"]),
        "in_progress": len([r for r in all_requests if r.status == "in_progress"]),
        "completed": len([r for r in all_requests if r.status == "completed"]),
        "cancelled": len([r for r in all_requests if r.status == "cancelled"])
    }
    
    # Service preferences based on usage
    service_preferences = {}
    for request in all_requests:
        service = crud.service_crud.get(session, id=request.service_id)
        if service:
            dept = crud.department_crud.get(session, id=service.department_id)
            if dept:
                service_type = crud.service_type_crud.get(session, id=service.service_type_id)
                if service_type:
                    type_name = service_type.name
                    service_preferences[type_name] = service_preferences.get(type_name, 0) + 1
    
    # Location analytics
    location_analytics = {
        "has_location": current_customer.latitude is not None and current_customer.longitude is not None,
        "location_updates": 0,  # Would need tracking table in production
        "most_common_city": current_customer.city,
        "geocoded_address": f"{current_customer.address}, {current_customer.city}" if current_customer.address and current_customer.city else None
    }
    
    # Get nearby services count if location available
    nearby_services_count = 0
    if current_customer.latitude and current_customer.longitude:
        query = select(Service).where(Service.is_active == True).limit(100)
        services = session.exec(query).all()
        
        for service in services:
            try:
                department = crud.department_crud.get(session, id=service.department_id)
                if not department:
                    continue
                
                # Get company through branch
                branch_dept = crud.branch_crud.get(session, id=department.branch_id)
                if not branch_dept:
                    continue
                
                company = crud.company_crud.get(session, id=branch_dept.company_id)
                if not company or not company.is_active:
                    continue
                
                company_branches = crud.branch_crud.get_by_company(session, company_id=company.id)
                
                for branch in company_branches:
                    if branch.latitude and branch.longitude and branch.is_active:
                        distance_km = calculate_distance(
                            current_customer.latitude, current_customer.longitude,
                            branch.latitude, branch.longitude
                        )
                        if distance_km <= 25.0:
                            nearby_services_count += 1
                            break
            except Exception:
                continue
    
    return {
        "customer": {
            "id": current_customer.id,
            "email": current_customer.email,
            "full_name": current_customer.full_name,
            "phone": current_customer.phone,
            "address": current_customer.address,
            "city": current_customer.city,
            "state": current_customer.state,
            "country": current_customer.country,
            "postal_code": current_customer.postal_code,
            "latitude": current_customer.latitude,
            "longitude": current_customer.longitude,
            "is_active": current_customer.is_active
        },
        "analytics": {
            "request_statistics": request_stats,
            "service_preferences": dict(sorted(service_preferences.items(), key=lambda x: x[1], reverse=True)),
            "location_analytics": location_analytics,
            "nearby_services_count": nearby_services_count
        },
        "recommendations": {
            "suggested_services": list(service_preferences.keys())[:3],
            "location_optimized": current_customer.latitude is not None and current_customer.longitude is not None,
            "profile_completion": {
                "score": sum([
                    1 if current_customer.phone else 0,
                    1 if current_customer.address else 0,
                    1 if current_customer.city else 0,
                    1 if current_customer.latitude is not None else 0
                ]) / 4 * 100,
                "missing_fields": [
                    field for field, value in [
                        ("phone", current_customer.phone),
                        ("address", current_customer.address),
                        ("city", current_customer.city),
                        ("location", current_customer.latitude)
                    ] if not value
                ]
            }
        }
    }


@router.patch("/customer/profile/extended", response_model=Any)
def update_extended_customer_profile(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    profile_data: CustomerProfileUpdate
) -> Any:
    """
    Update customer profile with extended data including preferences and metadata.
    """
    # Update basic customer fields
    update_data = profile_data.dict(exclude_unset=True, exclude={"preferences", "metadata", "settings", "favorites", "tags"})
    
    for field, value in update_data.items():
        if hasattr(current_customer, field) and value is not None:
            setattr(current_customer, field, value)
    
    session.add(current_customer)
    session.commit()
    session.refresh(current_customer)
    
    # In a production system, you'd store extended data in a separate table
    # For now, we'll return the updated profile with confirmation
    
    return {
        "message": "Customer profile updated successfully",
        "updated_fields": list(update_data.keys()),
        "customer": {
            "id": current_customer.id,
            "email": current_customer.email,
            "full_name": current_customer.full_name,
            "phone": current_customer.phone,
            "address": current_customer.address,
            "city": current_customer.city,
            "state": current_customer.state,
            "country": current_customer.country,
            "postal_code": current_customer.postal_code,
            "latitude": current_customer.latitude,
            "longitude": current_customer.longitude,
            "is_active": current_customer.is_active
        },
        "extended_data": {
            "preferences": profile_data.preferences,
            "metadata": profile_data.metadata,
            "settings": profile_data.settings,
            "favorites": profile_data.favorites,
            "tags": profile_data.tags
        }
    }


@router.get("/customer/history/detailed", response_model=Any)
def get_detailed_customer_history(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    include_cancelled: bool = False,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> Any:
    """
    Get detailed customer service history with filtering and analytics.
    """
    # Base query for customer's requests
    query = select(ServiceRequest).where(ServiceRequest.customer_id == current_customer.id)
    
    # Apply filters
    if not include_cancelled:
        query = query.where(ServiceRequest.status != "cancelled")
    
    if start_date:
        try:
            query = query.where(ServiceRequest.created_at >= start_date)
        except:
            pass
    
    if end_date:
        try:
            query = query.where(ServiceRequest.created_at <= end_date)
        except:
            pass
    
    # Get total count for pagination
    total_requests = len(session.exec(query).all())
    
    # Apply pagination and ordering
    requests = session.exec(
        query.offset(skip).limit(limit).order_by(ServiceRequest.created_at.desc())
    ).all()
    
    # Enrich with detailed information
    detailed_history = []
    for request in requests:
        service = crud.service_crud.get(session, id=request.service_id)
        department = crud.department_crud.get(session, id=service.department_id) if service else None
        
        # Get company through branch
        dept_branch = crud.branch_crud.get(session, id=department.branch_id) if department else None
        company = crud.company_crud.get(session, id=dept_branch.company_id) if dept_branch else None
        branch = crud.branch_crud.get(session, id=request.branch_id) if request.branch_id else None
        service_type = crud.service_type_crud.get(session, id=service.service_type_id) if service else None
        
        request_detail = {
            "request": {
                "id": request.id,
                "status": request.status,
                "description": request.description,
                "preferred_date": request.preferred_date,
                "preferred_time": request.preferred_time,
                "urgent": request.urgent,
                "created_at": request.created_at,
                "updated_at": request.updated_at,
                "customer_latitude": request.customer_latitude,
                "customer_longitude": request.customer_longitude
            },
            "service": {
                "id": service.id,
                "name": service.name,
                "description": service.description,
                "price": service.price,
                "duration_minutes": service.duration_minutes,
                "has_promotion": service.has_promotion,
                "promotion_description": service.promotion_description,
                "promotion_discount_percentage": service.promotion_discount_percentage
            } if service else None,
            "provider": {
                "department": {
                    "id": department.id,
                    "name": department.name,
                    "description": department.description
                } if department else None,
                "company": {
                    "id": company.id,
                    "name": company.name,
                    "description": company.description,
                    "website": company.website,
                    "phone": company.phone,
                    "email": company.email
                } if company else None,
                "branch": {
                    "id": branch.id,
                    "name": branch.name,
                    "address": branch.address,
                    "city": branch.city,
                    "phone": branch.phone,
                    "latitude": branch.latitude,
                    "longitude": branch.longitude
                } if branch else None,
                "service_type": {
                    "id": service_type.id,
                    "name": service_type.name,
                    "description": service_type.description
                } if service_type else None
            }
        }
        
        # Calculate distance if both customer and branch have coordinates
        if (request.customer_latitude and request.customer_longitude and 
            branch and branch.latitude and branch.longitude):
            distance_km = calculate_distance(
                request.customer_latitude, request.customer_longitude,
                branch.latitude, branch.longitude
            )
            request_detail["distance_km"] = round(distance_km, 2)
        
        detailed_history.append(request_detail)
    
    return {
        "data": detailed_history,
        "pagination": {
            "skip": skip,
            "limit": limit,
            "total": total_requests,
            "has_more": skip + limit < total_requests
        },
        "filters": {
            "include_cancelled": include_cancelled,
            "start_date": start_date,
            "end_date": end_date
        }
    }


# ===== JSON OBJECT MANAGEMENT =====

class JSONObjectData(BaseModel):
    """Model for JSON object storage and manipulation."""
    key: str
    data: dict
    metadata: Optional[dict] = None
    tags: Optional[List[str]] = None
    ttl_seconds: Optional[int] = None  # Time to live in seconds


class JSONObjectUpdate(BaseModel):
    """Model for JSON object updates."""
    data: Optional[dict] = None
    metadata: Optional[dict] = None
    tags: Optional[List[str]] = None
    ttl_seconds: Optional[int] = None


# In a production system, you'd have a proper table for this
# For now, we'll use a simple in-memory storage simulation
_json_storage = {}


@router.post("/json-objects", response_model=Any)
def create_json_object(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    json_data: JSONObjectData
) -> Any:
    """
    Store a JSON object with metadata for the current customer.
    """
    object_id = str(uuid.uuid4())
    customer_key = f"customer_{current_customer.id}"
    
    if customer_key not in _json_storage:
        _json_storage[customer_key] = {}
    
    json_object = {
        "id": object_id,
        "key": json_data.key,
        "data": json_data.data,
        "metadata": json_data.metadata or {},
        "tags": json_data.tags or [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "customer_id": str(current_customer.id),
        "ttl_seconds": json_data.ttl_seconds
    }
    
    _json_storage[customer_key][json_data.key] = json_object
    
    return {
        "message": "JSON object created successfully",
        "object_id": object_id,
        "key": json_data.key,
        "data": json_data.data,
        "metadata": json_object["metadata"],
        "tags": json_object["tags"],
        "created_at": json_object["created_at"]
    }


@router.get("/json-objects", response_model=Any)
def list_json_objects(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    tag: Optional[str] = None,
    key_pattern: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> Any:
    """
    List all JSON objects for the current customer with filtering.
    """
    customer_key = f"customer_{current_customer.id}"
    customer_objects = _json_storage.get(customer_key, {})
    
    # Apply filters
    filtered_objects = []
    for key, obj in customer_objects.items():
        # Filter by tag if provided
        if tag and tag not in obj.get("tags", []):
            continue
        
        # Filter by key pattern if provided
        if key_pattern and key_pattern.lower() not in key.lower():
            continue
        
        filtered_objects.append({
            "id": obj["id"],
            "key": obj["key"],
            "data": obj["data"],
            "metadata": obj["metadata"],
            "tags": obj["tags"],
            "created_at": obj["created_at"],
            "updated_at": obj["updated_at"],
            "data_size": len(str(obj["data"])),
            "has_ttl": obj["ttl_seconds"] is not None
        })
    
    # Apply pagination
    total_count = len(filtered_objects)
    paginated_objects = filtered_objects[skip:skip + limit]
    
    return {
        "data": paginated_objects,
        "pagination": {
            "skip": skip,
            "limit": limit,
            "total": total_count,
            "has_more": skip + limit < total_count
        },
        "filters": {
            "tag": tag,
            "key_pattern": key_pattern
        }
    }


@router.get("/json-objects/{object_key}", response_model=Any)
def get_json_object(
    object_key: str,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Get a specific JSON object by key.
    """
    customer_key = f"customer_{current_customer.id}"
    customer_objects = _json_storage.get(customer_key, {})
    
    if object_key not in customer_objects:
        raise HTTPException(status_code=404, detail="JSON object not found")
    
    json_object = customer_objects[object_key]
    
    return {
        "id": json_object["id"],
        "key": json_object["key"],
        "data": json_object["data"],
        "metadata": json_object["metadata"],
        "tags": json_object["tags"],
        "created_at": json_object["created_at"],
        "updated_at": json_object["updated_at"],
        "customer_id": json_object["customer_id"],
        "ttl_seconds": json_object["ttl_seconds"]
    }


@router.put("/json-objects/{object_key}", response_model=Any)
def update_json_object(
    object_key: str,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    update_data: JSONObjectUpdate
) -> Any:
    """
    Update a JSON object by key.
    """
    customer_key = f"customer_{current_customer.id}"
    customer_objects = _json_storage.get(customer_key, {})
    
    if object_key not in customer_objects:
        raise HTTPException(status_code=404, detail="JSON object not found")
    
    json_object = customer_objects[object_key]
    
    # Update fields
    if update_data.data is not None:
        json_object["data"] = update_data.data
    
    if update_data.metadata is not None:
        json_object["metadata"] = update_data.metadata
    
    if update_data.tags is not None:
        json_object["tags"] = update_data.tags
    
    if update_data.ttl_seconds is not None:
        json_object["ttl_seconds"] = update_data.ttl_seconds
    
    json_object["updated_at"] = datetime.utcnow().isoformat()
    
    return {
        "message": "JSON object updated successfully",
        "key": object_key,
        "data": json_object["data"],
        "metadata": json_object["metadata"],
        "tags": json_object["tags"],
        "updated_at": json_object["updated_at"]
    }


@router.delete("/json-objects/{object_key}", response_model=Any)
def delete_json_object(
    object_key: str,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Delete a JSON object by key.
    """
    customer_key = f"customer_{current_customer.id}"
    customer_objects = _json_storage.get(customer_key, {})
    
    if object_key not in customer_objects:
        raise HTTPException(status_code=404, detail="JSON object not found")
    
    deleted_object = customer_objects.pop(object_key)
    
    return {
        "message": "JSON object deleted successfully",
        "deleted_key": object_key,
        "deleted_at": datetime.utcnow().isoformat(),
        "data_size": len(str(deleted_object["data"]))
    }


@router.post("/json-objects/search", response_model=Any)
def search_json_objects(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    search_criteria: dict
) -> Any:
    """
    Advanced search through JSON objects data.
    """
    customer_key = f"customer_{current_customer.id}"
    customer_objects = _json_storage.get(customer_key, {})
    
    matching_objects = []
    
    for key, obj in customer_objects.items():
        # Simple search implementation - in production you'd use proper indexing
        data_str = str(obj["data"]).lower()
        metadata_str = str(obj["metadata"]).lower()
        
        match_found = False
        
        # Search in data
        for search_key, search_value in search_criteria.items():
            search_str = str(search_value).lower()
            
            if search_str in data_str or search_str in metadata_str:
                match_found = True
                break
            
            # Check if the key exists in the object data
            if search_key in obj["data"] and str(obj["data"][search_key]).lower() == search_str:
                match_found = True
                break
        
        if match_found:
            matching_objects.append({
                "id": obj["id"],
                "key": obj["key"],
                "data": obj["data"],
                "metadata": obj["metadata"],
                "tags": obj["tags"],
                "created_at": obj["created_at"],
                "updated_at": obj["updated_at"],
                "match_score": 1.0  # Simple scoring - in production you'd implement proper relevance
            })
    
    return {
        "data": matching_objects,
        "search_criteria": search_criteria,
        "total_matches": len(matching_objects),
        "total_objects": len(customer_objects)
    }


@router.post("/json-objects/bulk-operations", response_model=Any)
def bulk_json_operations(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    operation: str,  # "delete", "update_metadata", "add_tags"
    keys: List[str],
    operation_data: Optional[dict] = None
) -> Any:
    """
    Perform bulk operations on multiple JSON objects.
    """
    customer_key = f"customer_{current_customer.id}"
    customer_objects = _json_storage.get(customer_key, {})
    
    results = []
    
    for key in keys:
        if key not in customer_objects:
            results.append({
                "key": key,
                "success": False,
                "error": "Object not found"
            })
            continue
        
        try:
            if operation == "delete":
                customer_objects.pop(key)
                results.append({
                    "key": key,
                    "success": True,
                    "action": "deleted"
                })
            
            elif operation == "update_metadata" and operation_data:
                customer_objects[key]["metadata"].update(operation_data)
                customer_objects[key]["updated_at"] = datetime.utcnow().isoformat()
                results.append({
                    "key": key,
                    "success": True,
                    "action": "metadata_updated"
                })
            
            elif operation == "add_tags" and operation_data and "tags" in operation_data:
                existing_tags = set(customer_objects[key]["tags"])
                new_tags = set(operation_data["tags"])
                customer_objects[key]["tags"] = list(existing_tags.union(new_tags))
                customer_objects[key]["updated_at"] = datetime.utcnow().isoformat()
                results.append({
                    "key": key,
                    "success": True,
                    "action": "tags_added"
                })
            
            else:
                results.append({
                    "key": key,
                    "success": False,
                    "error": "Invalid operation or missing operation data"
                })
        
        except Exception as e:
            results.append({
                "key": key,
                "success": False,
                "error": str(e)
            })
    
    return {
        "operation": operation,
        "total_processed": len(keys),
        "successful": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]]),
        "results": results
    }


@router.get("/json-objects/stats", response_model=Any)
def get_json_objects_stats(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Get statistics about customer's JSON objects.
    """
    customer_key = f"customer_{current_customer.id}"
    customer_objects = _json_storage.get(customer_key, {})
    
    if not customer_objects:
        return {
            "total_objects": 0,
            "total_data_size": 0,
            "tags_distribution": {},
            "creation_timeline": {},
            "average_object_size": 0
        }
    
    # Calculate statistics
    total_objects = len(customer_objects)
    total_size = sum(len(str(obj["data"])) for obj in customer_objects.values())
    
    # Tags distribution
    tags_count = {}
    for obj in customer_objects.values():
        for tag in obj.get("tags", []):
            tags_count[tag] = tags_count.get(tag, 0) + 1
    
    # Creation timeline (by month)
    timeline = {}
    for obj in customer_objects.values():
        try:
            created_date = datetime.fromisoformat(obj["created_at"].replace('Z', '+00:00'))
            month_key = created_date.strftime('%Y-%m')
            timeline[month_key] = timeline.get(month_key, 0) + 1
        except:
            pass
    
    return {
        "total_objects": total_objects,
        "total_data_size_bytes": total_size,
        "average_object_size_bytes": total_size // total_objects if total_objects > 0 else 0,
        "tags_distribution": dict(sorted(tags_count.items(), key=lambda x: x[1], reverse=True)),
        "creation_timeline": dict(sorted(timeline.items())),
        "storage_utilization": {
            "objects_with_metadata": len([obj for obj in customer_objects.values() if obj.get("metadata")]),
            "objects_with_tags": len([obj for obj in customer_objects.values() if obj.get("tags")]),
            "objects_with_ttl": len([obj for obj in customer_objects.values() if obj.get("ttl_seconds")])
        }
    }


# ===== BRANCH RATING SYSTEM =====

@router.post("/branches/{branch_id}/ratings", response_model=BranchRatingPublic)
def create_branch_rating(
    branch_id: uuid.UUID,
    service_request_id: uuid.UUID,
    rating_data: BranchRatingCreate,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Create a rating for a branch after completing a service.
    Only customers who have completed a service at the branch can rate it.
    """
    try:
        # Verify that the branch_id in the URL matches the rating data
        if rating_data.branch_id != branch_id:
            raise HTTPException(
                status_code=400, 
                detail="Branch ID in URL does not match rating data"
            )
        
        # Create the rating
        rating = branch_rating_crud.create_rating(
            session=session,
            rating_in=rating_data,
            customer_id=current_customer.id
        )
        
        return rating
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating rating: {str(e)}")


@router.get("/branches/{branch_id}/ratings", response_model=BranchRatingsWithDetailsPublic)
def get_branch_ratings(
    branch_id: uuid.UUID,
    session: SessionDep,
    skip: int = 0,
    limit: int = 50
) -> Any:
    """
    Get all ratings for a specific branch with detailed information.
    """
    try:
        # Verify branch exists
        branch = crud.branch_crud.get(session, id=branch_id)
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        
        # Get ratings with details
        ratings, total_count = branch_rating_crud.get_by_branch(
            session=session, branch_id=branch_id, skip=skip, limit=limit
        )
        
        # Enrich with detailed information
        detailed_ratings = []
        for rating in ratings:
            # Get customer info
            customer = crud.crud_customer.get(session, id=rating.customer_id)
            
            # Get service request and service info
            service_request = crud.crud_service_request.get(session, id=rating.service_request_id)
            service = crud.service_crud.get(session, id=service_request.service_id) if service_request else None
            
            # Get company info
            company = crud.company_crud.get(session, id=branch.company_id)
            
            detailed_rating = BranchRatingWithDetailsPublic(
                id=rating.id,
                branch_id=rating.branch_id,
                customer_id=rating.customer_id,
                service_request_id=rating.service_request_id,
                rating=rating.rating,
                comment=rating.comment,
                service_quality=rating.service_quality,
                staff_friendliness=rating.staff_friendliness,
                facility_cleanliness=rating.facility_cleanliness,
                wait_time_satisfaction=rating.wait_time_satisfaction,
                would_recommend=rating.would_recommend,
                created_at=rating.created_at,
                updated_at=rating.updated_at,
                customer_name=customer.full_name if customer else "Unknown",
                branch_name=branch.name,
                service_name=service.name if service else "Unknown",
                company_name=company.name if company else "Unknown"
            )
            detailed_ratings.append(detailed_rating)
        
        return BranchRatingsWithDetailsPublic(data=detailed_ratings, count=total_count)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving ratings: {str(e)}")


@router.get("/branches/{branch_id}/rating-stats", response_model=BranchRatingStats)
def get_branch_rating_stats(
    branch_id: uuid.UUID,
    session: SessionDep
) -> Any:
    """
    Get comprehensive rating statistics for a branch.
    """
    try:
        # Verify branch exists
        branch = crud.branch_crud.get(session, id=branch_id)
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        
        # Get rating statistics
        stats = branch_rating_crud.get_rating_stats(session=session, branch_id=branch_id)
        
        return BranchRatingStats(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving rating stats: {str(e)}")


@router.get("/my-ratings", response_model=BranchRatingsWithDetailsPublic)
def get_my_branch_ratings(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    skip: int = 0,
    limit: int = 50
) -> Any:
    """
    Get all ratings created by the current customer.
    """
    try:
        # Get customer's ratings
        ratings, total_count = branch_rating_crud.get_by_customer(
            session=session, customer_id=current_customer.id, skip=skip, limit=limit
        )
        
        # Enrich with detailed information
        detailed_ratings = []
        for rating in ratings:
            # Get branch and company info
            branch = crud.branch_crud.get(session, id=rating.branch_id)
            company = crud.company_crud.get(session, id=branch.company_id) if branch else None
            
            # Get service request and service info
            service_request = crud.crud_service_request.get(session, id=rating.service_request_id)
            service = crud.service_crud.get(session, id=service_request.service_id) if service_request else None
            
            detailed_rating = BranchRatingWithDetailsPublic(
                id=rating.id,
                branch_id=rating.branch_id,
                customer_id=rating.customer_id,
                service_request_id=rating.service_request_id,
                rating=rating.rating,
                comment=rating.comment,
                service_quality=rating.service_quality,
                staff_friendliness=rating.staff_friendliness,
                facility_cleanliness=rating.facility_cleanliness,
                wait_time_satisfaction=rating.wait_time_satisfaction,
                would_recommend=rating.would_recommend,
                created_at=rating.created_at,
                updated_at=rating.updated_at,
                customer_name=current_customer.full_name,
                branch_name=branch.name if branch else "Unknown",
                service_name=service.name if service else "Unknown",
                company_name=company.name if company else "Unknown"
            )
            detailed_ratings.append(detailed_rating)
        
        return BranchRatingsWithDetailsPublic(data=detailed_ratings, count=total_count)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving ratings: {str(e)}")


@router.get("/service-requests/rateable", response_model=Any)
def get_rateable_service_requests(
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)],
    skip: int = 0,
    limit: int = 50
) -> Any:
    """
    Get completed service requests that haven't been rated yet.
    These are the service requests that the customer can rate.
    """
    try:
        # Get rateable service requests
        service_requests, total_count = branch_rating_crud.get_rateable_service_requests(
            session=session, customer_id=current_customer.id, skip=skip, limit=limit
        )
        
        # Enrich with detailed information
        detailed_requests = []
        for request in service_requests:
            # Get service, department, branch, and company info
            service = crud.service_crud.get(session, id=request.service_id)
            department = crud.department_crud.get(session, id=service.department_id) if service else None
            branch = crud.branch_crud.get(session, id=request.branch_id) if request.branch_id else None
            company = crud.company_crud.get(session, id=branch.company_id) if branch else None
            
            request_detail = {
                "id": request.id,
                "service_id": request.service_id,
                "branch_id": request.branch_id,
                "status": request.status,
                "description": request.description,
                "preferred_date": request.preferred_date,
                "preferred_time": request.preferred_time,
                "created_at": request.created_at,
                "updated_at": request.updated_at,
                "service_details": {
                    "name": service.name if service else "Unknown",
                    "description": service.description if service else None,
                    "price": service.price if service else None,
                    "duration_minutes": service.duration_minutes if service else None
                },
                "branch_details": {
                    "id": branch.id if branch else None,
                    "name": branch.name if branch else "Unknown",
                    "address": branch.address if branch else None,
                    "phone": branch.phone if branch else None
                },
                "company_details": {
                    "id": company.id if company else None,
                    "name": company.name if company else "Unknown"
                },
                "can_rate": True  # All requests in this list are rateable
            }
            detailed_requests.append(request_detail)
        
        return {
            "data": detailed_requests,
            "count": total_count,
            "message": "These service requests are eligible for rating"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving rateable requests: {str(e)}")


@router.get("/service-requests/{request_id}/can-rate", response_model=Any)
def check_can_rate_service_request(
    request_id: uuid.UUID,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Check if a specific service request can be rated by the current customer.
    """
    try:
        can_rate, message = branch_rating_crud.can_rate_service_request(
            session=session, 
            service_request_id=request_id, 
            customer_id=current_customer.id
        )
        
        # Get service request details if it exists
        service_request = crud.crud_service_request.get(session, id=request_id)
        request_details = None
        
        if service_request and service_request.customer_id == current_customer.id:
            # Get additional details
            service = crud.service_crud.get(session, id=service_request.service_id)
            branch = crud.branch_crud.get(session, id=service_request.branch_id) if service_request.branch_id else None
            
            request_details = {
                "id": service_request.id,
                "status": service_request.status,
                "service_name": service.name if service else "Unknown",
                "branch_name": branch.name if branch else "Unknown",
                "branch_id": service_request.branch_id,
                "completed_at": service_request.updated_at
            }
        
        return {
            "can_rate": can_rate,
            "message": message,
            "service_request": request_details
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking rating eligibility: {str(e)}")


@router.patch("/ratings/{rating_id}", response_model=BranchRatingPublic)
def update_branch_rating(
    rating_id: uuid.UUID,
    rating_update: BranchRatingUpdate,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Update an existing branch rating.
    Only the customer who created the rating can update it.
    """
    try:
        # Get the existing rating
        rating = branch_rating_crud.get(session, id=rating_id)
        if not rating:
            raise HTTPException(status_code=404, detail="Rating not found")
        
        # Verify ownership
        if rating.customer_id != current_customer.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this rating")
        
        # Update the rating
        updated_rating = branch_rating_crud.update(
            session=session, db_obj=rating, obj_in=rating_update
        )
        
        return updated_rating
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating rating: {str(e)}")


@router.delete("/ratings/{rating_id}", response_model=Any)
def delete_branch_rating(
    rating_id: uuid.UUID,
    session: SessionDep,
    current_customer: Annotated[Customer, Depends(get_current_customer)]
) -> Any:
    """
    Delete a branch rating.
    Only the customer who created the rating can delete it.
    """
    try:
        # Get the existing rating
        rating = branch_rating_crud.get(session, id=rating_id)
        if not rating:
            raise HTTPException(status_code=404, detail="Rating not found")
        
        # Verify ownership
        if rating.customer_id != current_customer.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this rating")
        
        # Delete the rating
        branch_rating_crud.remove(session=session, id=rating_id)
        
        return {"message": "Rating deleted successfully", "rating_id": rating_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting rating: {str(e)}")
