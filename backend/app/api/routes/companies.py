import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep, CurrentApprovedUser
from app.crud.crud_company import company_crud
from app.models import (
    Company,
    CompanyCreate,
    CompanyPublic,
    CompaniesPublic,
    CompanyUpdate,
    CompanyWithLocationPublic,
    CompaniesWithLocationPublic,
    Message,
    City,
)
from app.models.company import (
    CompanyRegistrationRequest,
    CompanyRegistrationResponse,
    CompanyRegistrationStatus
)
from app.services.s3_service import get_s3_service
from app.core.config import settings

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/", response_model=CompaniesPublic)
def read_companies(
    session: SessionDep, current_user: CurrentApprovedUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve companies accessible to the current user.
    SuperAdmin users can see all companies, regular users only see assigned companies.
    """
    companies, count = company_crud.get_accessible_companies(
        session=session, user=current_user, skip=skip, limit=limit
    )
    return CompaniesPublic(data=companies, count=count)


@router.get("/{company_id}", response_model=CompanyPublic)
def read_company(
    session: SessionDep, current_user: CurrentApprovedUser, company_id: uuid.UUID
) -> Any:
    """
    Get company by ID (only if user has access).
    """
    # Check if user has access to this company
    if not company_crud.can_access_company(session=session, user=current_user, company_id=company_id):
        raise HTTPException(
            status_code=403, 
            detail="You don't have access to this company's information"
        )
    
    company = company_crud.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/", response_model=CompanyPublic)
def create_company_endpoint(
    *, session: SessionDep, current_user: CurrentUser, company_in: CompanyCreate
) -> Any:
    """
    Create new company.
    """
    company = company_crud.create(
        session=session, obj_in=company_in, created_by=current_user.id
    )
    return company


@router.put("/{company_id}", response_model=CompanyPublic)
def update_company_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    company_id: uuid.UUID,
    company_in: CompanyUpdate,
) -> Any:
    """
    Update a company (only if user has access).
    """
    company = company_crud.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if user has access to this company
    if not company_crud.can_access_company(session=session, user=current_user, company_id=company_id):
        raise HTTPException(
            status_code=403, 
            detail="You don't have access to modify this company's information"
        )
    
    # Additional check: only superuser or creator can update
    if not current_user.is_superuser and company.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the company creator or superuser can update this company")
    
    company = company_crud.update(session=session, db_obj=company, obj_in=company_in)
    return company


@router.delete("/{company_id}")
def delete_company_endpoint(
    session: SessionDep, current_user: CurrentUser, company_id: uuid.UUID
) -> Message:
    """
    Delete a company.
    """
    company = company_crud.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if user is superuser or the creator of the company
    if not current_user.is_superuser and company.created_by != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    success = company_crud.remove(session=session, id=company_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete company")
    
    return Message(message="Company deleted successfully")


@router.get("/my/companies", response_model=CompaniesPublic)
def read_my_companies(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve companies created by the current user.
    """
    count_statement = (
        select(func.count())
        .select_from(Company)
        .where(Company.created_by == current_user.id)
    )
    count = session.exec(count_statement).one()
    
    statement = (
        select(Company)
        .where(Company.created_by == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    companies = session.exec(statement).all()

    return CompaniesPublic(data=companies, count=count)


@router.get("/with-location", response_model=CompaniesWithLocationPublic)
def read_companies_with_location(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve companies with their location details (city, state, country).
    """
    from sqlmodel import and_
    
    # Join with City and get location details
    statement = (
        select(Company, City)
        .join(City, Company.city_id == City.id, isouter=True)
        .offset(skip)
        .limit(limit)
    )
    results = session.exec(statement).all()
    
    # Count total companies
    count_statement = select(func.count()).select_from(Company)
    count = session.exec(count_statement).one()
    
    # Build response with location details
    companies_with_location = []
    for company, city in results:
        company_data = CompanyWithLocationPublic(
            **company.model_dump(),
            city_name=city.name if city else None,
            state_name=None,  # Will be populated when we add state relationship
            country_name=None,  # Will be populated when we add country relationship
            city_coordinates={
                "latitude": city.latitude,
                "longitude": city.longitude
            } if city and city.latitude and city.longitude else None
        )
        companies_with_location.append(company_data)
    
    return CompaniesWithLocationPublic(data=companies_with_location, count=count)


@router.get("/{company_id}/with-location", response_model=CompanyWithLocationPublic)
def read_company_with_location(
    session: SessionDep, current_user: CurrentUser, company_id: uuid.UUID
) -> Any:
    """
    Get company by ID with location details.
    """
    # Join with City to get location details
    statement = (
        select(Company, City)
        .join(City, Company.city_id == City.id, isouter=True)
        .where(Company.id == company_id)
    )
    result = session.exec(statement).first()
    
    if not result:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company, city = result
    
    return CompanyWithLocationPublic(
        **company.model_dump(),
        city_name=city.name if city else None,
        state_name=None,  # Will be populated when we add state relationship
        country_name=None,  # Will be populated when we add country relationship
        city_coordinates={
            "latitude": city.latitude,
            "longitude": city.longitude
        } if city and city.latitude and city.longitude else None
    )


@router.post("/{company_id}/upload-logo", response_model=CompanyPublic)
async def upload_company_logo(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    company_id: uuid.UUID,
    file: UploadFile = File(..., description="Company logo image file"),
) -> Any:
    """
    Upload a logo image for a company.
    
    Supported formats: jpg, jpeg, png, gif, bmp, webp, svg
    Maximum file size: 10MB
    """
    if not settings.s3_enabled:
        raise HTTPException(
            status_code=500,
            detail="S3 service is not configured. Please contact the administrator."
        )
    
    # Get the company and check permissions
    company = company_crud.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if user is superuser or the creator of the company
    if not current_user.is_superuser and company.created_by != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    # Validate file type - only allow image files
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed for company logos"
        )
    
    try:
        # Initialize S3 service
        s3_service = get_s3_service()
        
        # Delete old logo if it exists
        if company.logo_image_key:
            try:
                s3_service.delete_file(company.logo_image_key)
            except Exception:
                # Continue even if old file deletion fails
                pass
        
        # Upload new logo to S3 in companies/logos folder
        upload_result = await s3_service.upload_file(
            file=file,
            folder=f"companies/logos",
            public_read=True  # Make logo publicly accessible
        )
        
        # Update company with new logo information
        company.logo_image_key = upload_result['file_key']
        company.logo_image_url = upload_result['file_url']
        session.add(company)
        session.commit()
        session.refresh(company)
        
        return company
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logo upload failed: {str(e)}")


@router.delete("/{company_id}/logo")
def delete_company_logo(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    company_id: uuid.UUID,
) -> Message:
    """
    Delete the logo image for a company.
    """
    if not settings.s3_enabled:
        raise HTTPException(
            status_code=500,
            detail="S3 service is not configured. Please contact the administrator."
        )
    
    # Get the company and check permissions
    company = company_crud.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if user is superuser or the creator of the company
    if not current_user.is_superuser and company.created_by != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    if not company.logo_image_key:
        raise HTTPException(status_code=404, detail="Company has no logo to delete")
    
    try:
        # Initialize S3 service and delete the file
        s3_service = get_s3_service()
        s3_service.delete_file(company.logo_image_key)
        
        # Update company to remove logo information
        company.logo_image_key = None
        company.logo_image_url = None
        session.add(company)
        session.commit()
        
        return Message(message="Company logo deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logo deletion failed: {str(e)}")


@router.get("/{company_id}/logo-url")
def get_company_logo_url(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    company_id: uuid.UUID,
    expiration: int = 3600,
) -> dict[str, str]:
    """
    Get a presigned URL for the company logo (useful for private logos).
    
    Args:
        company_id: UUID of the company
        expiration: URL expiration time in seconds (default: 1 hour)
    """
    if not settings.s3_enabled:
        raise HTTPException(
            status_code=500,
            detail="S3 service is not configured. Please contact the administrator."
        )
    
    # Get the company
    company = company_crud.get(session=session, id=company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if not company.logo_image_key:
        raise HTTPException(status_code=404, detail="Company has no logo")
    
    try:
        # Generate presigned URL
        s3_service = get_s3_service()
        presigned_url = s3_service.generate_presigned_url(
            company.logo_image_key, 
            expiration=expiration
        )
        
        return {
            "company_id": str(company_id),
            "logo_url": presigned_url,
            "expires_in": expiration
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate logo URL: {str(e)}")


@router.post("/register", response_model=CompanyRegistrationResponse)
def register_company_with_admin(
    *, session: SessionDep, registration_data: CompanyRegistrationRequest
) -> Any:
    """
    Register a new company with an admin user and main branch.
    This endpoint allows new companies to register without requiring authentication.
    The registration will be in pending status until approved by a superadmin.

    Creates:
    - Company record
    - Admin user (company owner)
    - Main branch
    - User-branch assignment with owner privileges

    The admin user will have company_registration_status = "pending_review"
    and cannot login until approved by a superadmin.
    """
    try:
        # Check if email is already registered
        from app.crud.crud_user import user
        existing_user = user.get_by_email(session=session, email=registration_data.admin_user.email)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="A user with this email already exists"
            )

        # Check if company name is already taken
        existing_company = session.exec(
            select(Company).where(Company.name == registration_data.company.name)
        ).first()
        if existing_company:
            raise HTTPException(
                status_code=400,
                detail="A company with this name already exists"
            )

        # Register the company
        result = company_crud.register_company_with_admin(
            session=session,
            registration_data=registration_data
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during registration: {str(e)}"
        )


@router.get("/registrations/pending", response_model=dict)
def get_pending_company_registrations(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get pending company registrations (superadmin only).
    Returns companies that are waiting for approval.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only superadmin can view pending registrations"
        )

    pending_registrations, count = company_crud.get_pending_registrations(
        session=session, skip=skip, limit=limit
    )

    return {
        "data": pending_registrations,
        "count": count,
        "skip": skip,
        "limit": limit
    }


@router.post("/registrations/{company_id}/approve", response_model=Message)
def approve_company_registration(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    company_id: uuid.UUID
) -> Any:
    """
    Approve a company registration (superadmin only).
    This will activate the company admin user and allow them to login.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only superadmin can approve company registrations"
        )

    success = company_crud.approve_company_registration(
        session=session,
        company_id=company_id,
        approved_by=current_user.id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Company registration not found or already processed"
        )

    return Message(message="Company registration approved successfully")


@router.post("/registrations/{company_id}/reject", response_model=Message)
def reject_company_registration(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    company_id: uuid.UUID
) -> Any:
    """
    Reject a company registration (superadmin only).
    This will deactivate the company admin user and prevent login.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only superadmin can reject company registrations"
        )

    success = company_crud.reject_company_registration(
        session=session,
        company_id=company_id,
        rejected_by=current_user.id
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Company registration not found or already processed"
        )

    return Message(message="Company registration rejected")

