import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.crud.crud_service_type import service_type_crud
from app.models import (
    ServiceType,
    ServiceTypeCreate,
    ServiceTypePublic,
    ServiceTypesPublic,
    ServiceTypeUpdate,
    Message,
)

router = APIRouter(prefix="/service-types", tags=["service-types"])


@router.get("/", response_model=ServiceTypesPublic)
def read_service_types(
    session: SessionDep, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve active service types. This endpoint is public and does not require authentication.
    """
    # Only return active service types for public access
    service_types, count = service_type_crud.get_active(session=session, skip=skip, limit=limit)

    return ServiceTypesPublic(data=service_types, count=count)


@router.get("/{id}", response_model=ServiceTypePublic)
def read_service_type(session: SessionDep, id: uuid.UUID) -> Any:
    """
    Get service type by ID. This endpoint is public and does not require authentication.
    Only active service types are returned.
    """
    service_type = service_type_crud.get(session=session, id=id)
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    # Only return active service types for public access
    if not service_type.is_active:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    return service_type


@router.post("/", response_model=ServiceTypePublic)
def create_service_type(
    *, session: SessionDep, current_user: CurrentUser, service_type_in: ServiceTypeCreate
) -> Any:
    """
    Create new service type. Only superusers can create service types.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if service type with same name already exists
    existing_service_type = service_type_crud.get_by_name(session=session, name=service_type_in.name)
    if existing_service_type:
        raise HTTPException(status_code=400, detail="Service type with this name already exists")
    
    service_type = service_type_crud.create_with_owner(
        session=session, obj_in=service_type_in, created_by=current_user.id
    )
    return service_type


@router.put("/{id}", response_model=ServiceTypePublic)
def update_service_type(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    service_type_in: ServiceTypeUpdate,
) -> Any:
    """
    Update a service type. Only superusers or creators can update.
    """
    service_type = service_type_crud.get(session=session, id=id)
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    # Check permissions
    if not current_user.is_superuser and service_type.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check for name conflicts if name is being updated
    if service_type_in.name and service_type_in.name != service_type.name:
        existing_service_type = service_type_crud.get_by_name(session=session, name=service_type_in.name)
        if existing_service_type:
            raise HTTPException(status_code=400, detail="Service type with this name already exists")
    
    update_dict = service_type_in.model_dump(exclude_unset=True)
    service_type = service_type_crud.update(session=session, db_obj=service_type, obj_in=update_dict)
    return service_type


@router.delete("/{id}")
def delete_service_type(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a service type. Only superusers or creators can delete.
    """
    service_type = service_type_crud.get(session=session, id=id)
    if not service_type:
        raise HTTPException(status_code=404, detail="Service type not found")
    
    # Check permissions
    if not current_user.is_superuser and service_type.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    service_type_crud.remove(session=session, id=id)
    return Message(message="Service type deleted successfully")
