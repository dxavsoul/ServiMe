import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.crud.crud_service import service_crud
from app.crud.crud_department import department_crud
from app.crud.crud_service_type import service_type_crud
from app.models import (
    Service,
    ServiceCreate,
    ServicePublic,
    ServicesPublic,
    ServiceWithDetailsPublic,
    ServicesWithDetailsPublic,
    ServiceUpdate,
    Message,
)

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/", response_model=ServicesWithDetailsPublic)
def read_services(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve services with detailed information.
    Only shows services from companies the user has access to.
    """
    if current_user.is_superuser:
        # Superusers can see all services with details
        results, count = service_crud.get_with_details(session=session, skip=skip, limit=limit)
        services_with_details = []
        for service, department_name, service_type_name in results:
            service_dict = service.model_dump()
            service_dict["department_name"] = department_name
            service_dict["service_type_name"] = service_type_name
            services_with_details.append(ServiceWithDetailsPublic(**service_dict))
    else:
        # Regular users only see active services from companies they have access to
        results, count = service_crud.get_with_details_by_user_companies(
            session=session, user_id=current_user.id, skip=skip, limit=limit
        )
        services_with_details = []
        for service, department_name, service_type_name in results:
            service_dict = service.model_dump()
            service_dict["department_name"] = department_name
            service_dict["service_type_name"] = service_type_name
            services_with_details.append(ServiceWithDetailsPublic(**service_dict))

    return ServicesWithDetailsPublic(data=services_with_details, count=count)


@router.get("/{id}", response_model=ServicePublic)
def read_service(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get service by ID.
    Only accessible if user has access to the company that owns the service.
    """
    service = service_crud.get(session=session, id=id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Regular users can only see active services
    if not current_user.is_superuser and not service.is_active:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check access permissions for non-superusers
    if not current_user.is_superuser:
        # Check if user has access to the service through company access
        if not service_crud.user_has_access_to_service(
            session=session, user_id=current_user.id, service_id=service.id
        ):
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return service


@router.post("/", response_model=ServicePublic)
def create_service(
    *, session: SessionDep, current_user: CurrentUser, service_in: ServiceCreate
) -> Any:
    """
    Create new service.
    """
    # Verify that the department exists and user has access
    department = department_crud.get(session=session, id=service_in.department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if user has permission to create services in this department
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions to create service in this department")
    
    # Verify that the service type exists
    service_type = service_type_crud.get(session=session, id=service_in.service_type_id)
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    # Regular users can only use active service types
    if not current_user.is_superuser and not service_type.is_active:
        raise HTTPException(status_code=400, detail="Service type is not active")
    
    service = service_crud.create_with_owner(
        session=session, obj_in=service_in, created_by=current_user.id
    )
    return service


@router.put("/{id}", response_model=ServicePublic)
def update_service(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    service_in: ServiceUpdate,
) -> Any:
    """
    Update a service.
    """
    service = service_crud.get(session=session, id=id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check permissions
    if not current_user.is_superuser and service.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # If department_id is being updated, verify access to new department
    if service_in.department_id and service_in.department_id != service.department_id:
        department = department_crud.get(session=session, id=service_in.department_id)
        if not department:
            raise HTTPException(status_code=404, detail="New department not found")
        if not current_user.is_superuser and department.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions for new department")
    
    # If service_type_id is being updated, verify it exists and is accessible
    if service_in.service_type_id and service_in.service_type_id != service.service_type_id:
        service_type = service_type_crud.get(session=session, id=service_in.service_type_id)
        if not service_type:
            raise HTTPException(status_code=404, detail="New service type not found")
        if not current_user.is_superuser and not service_type.is_active:
            raise HTTPException(status_code=400, detail="New service type is not active")
    
    update_dict = service_in.model_dump(exclude_unset=True)
    service = service_crud.update(session=session, db_obj=service, obj_in=update_dict)
    return service


@router.delete("/{id}")
def delete_service(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a service.
    """
    service = service_crud.get(session=session, id=id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check permissions
    if not current_user.is_superuser and service.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    service_crud.remove(session=session, id=id)
    return Message(message="Service deleted successfully")


@router.get("/department/{department_id}", response_model=ServicesPublic)
def read_services_by_department(
    session: SessionDep, 
    current_user: CurrentUser, 
    department_id: uuid.UUID,
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    Get all services for a specific department.
    Only accessible if user has access to the company that owns the department.
    """
    # Verify department exists and user has access through company access
    department = department_crud.get(session=session, id=department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # For non-superusers, check if they have access to this department through company access
    if not current_user.is_superuser:
        from app.models import Branch, BranchUserLink

        # Check if user has access to the branch that owns this department
        statement = (
            select(func.count())
            .select_from(Department)
            .join(Branch, Department.branch_id == Branch.id)
            .join(BranchUserLink, Branch.id == BranchUserLink.branch_id)
            .where(Department.id == department_id)
            .where(BranchUserLink.user_id == current_user.id)
        )
        count = session.exec(statement).one()
        if count == 0:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    services, count = service_crud.get_by_department_with_count(
        session=session, department_id=department_id, skip=skip, limit=limit
    )

    # Filter out inactive services for non-superusers
    if not current_user.is_superuser:
        services = [service for service in services if service.is_active]
        count = len(services)

    return ServicesPublic(data=services, count=count)


@router.get("/service-type/{service_type_id}", response_model=ServicesPublic)
def read_services_by_service_type(
    session: SessionDep, 
    current_user: CurrentUser, 
    service_type_id: uuid.UUID,
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    Get all services for a specific service type.
    Only shows services from companies the user has access to.
    """
    # Verify service type exists
    service_type = service_type_crud.get(session=session, id=service_type_id)
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    # Regular users can only see services from active service types
    if not current_user.is_superuser and not service_type.is_active:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    if current_user.is_superuser:
        # Superusers can see all services for this service type
        services, count = service_crud.get_by_service_type(
            session=session, service_type_id=service_type_id, skip=skip, limit=limit
        )
    else:
        # Regular users only see services from companies they have access to
        from app.models import Branch, BranchUserLink

        count_statement = (
            select(func.count())
            .select_from(Service)
            .join(Department, Service.department_id == Department.id)
            .join(Branch, Department.branch_id == Branch.id)
            .join(BranchUserLink, Branch.id == BranchUserLink.branch_id)
            .where(Service.service_type_id == service_type_id)
            .where(BranchUserLink.user_id == current_user.id)
            .where(Service.is_active == True)
        )
        count = session.exec(count_statement).one()

        statement = (
            select(Service)
            .join(Department, Service.department_id == Department.id)
            .join(Branch, Department.branch_id == Branch.id)
            .join(BranchUserLink, Branch.id == BranchUserLink.branch_id)
            .where(Service.service_type_id == service_type_id)
            .where(BranchUserLink.user_id == current_user.id)
            .where(Service.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        services = list(session.exec(statement).all())

    return ServicesPublic(data=services, count=count)


@router.get("/promotions/", response_model=ServicesPublic)
def read_services_with_promotions(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Get all services that have active promotions.
    Only shows services from companies the user has access to.
    """
    if current_user.is_superuser:
        # Superusers can see all services with promotions
        services, count = service_crud.get_with_promotions(session=session, skip=skip, limit=limit)
    else:
        # Regular users only see services with promotions from companies they have access to
        services, count = service_crud.get_with_promotions_by_user_companies(
            session=session, user_id=current_user.id, skip=skip, limit=limit
        )

    return ServicesPublic(data=services, count=count)
