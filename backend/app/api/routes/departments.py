import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.crud.crud_department import department_crud
from app.crud.crud_department_hours import department_hours_crud
from app.crud.crud_branch import branch_crud
from app.models import (
    Department,
    DepartmentCreate,
    DepartmentPublic,
    DepartmentsPublic,
    DepartmentWithBranchPublic,
    DepartmentsWithBranchPublic,
    DepartmentUpdate,
    Message,
)

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("/", response_model=DepartmentsWithBranchPublic)
def read_departments(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve departments with branch information.
    """
    if current_user.is_superuser:
        # Superusers can see all departments with branch info
        results, count = department_crud.get_with_branch_info(session=session, skip=skip, limit=limit)
        departments_with_branch = []
        for department, branch_name in results:
            department_dict = department.model_dump()
            department_dict["branch_name"] = branch_name
            departments_with_branch.append(DepartmentWithBranchPublic(**department_dict))
    else:
        # Regular users only see departments they have access to
        departments, count = department_crud.get_accessible_by_user(
            session=session, user_id=current_user.id, skip=skip, limit=limit
        )
        departments_with_branch = [DepartmentWithBranchPublic(**department.model_dump(), branch_name="") for department in departments]
    
    return DepartmentsWithBranchPublic(data=departments_with_branch, count=count)


@router.get("/{id}", response_model=DepartmentPublic)
def read_department(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get department by ID.
    """
    department = department_crud.get(session=session, id=id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check access permissions
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return department


@router.post("/", response_model=DepartmentPublic)
def create_department(
    *, session: SessionDep, current_user: CurrentUser, department_in: DepartmentCreate
) -> Any:
    """
    Create new department.
    """
    # Verify that the branch exists and user has access
    branch = branch_crud.get(session=session, id=department_in.branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check if user has permission to create departments in this branch
    if not current_user.is_superuser and branch.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions to create department in this branch")
    
    department = department_crud.create_with_owner(
        session=session, obj_in=department_in, created_by=current_user.id
    )
    return department


@router.put("/{id}", response_model=DepartmentPublic)
def update_department(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    department_in: DepartmentUpdate,
) -> Any:
    """
    Update a department.
    """
    department = department_crud.get(session=session, id=id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check permissions
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # If branch_id is being updated, verify access to new branch
    if department_in.branch_id and department_in.branch_id != department.branch_id:
        branch = branch_crud.get(session=session, id=department_in.branch_id)
        if not branch:
            raise HTTPException(status_code=404, detail="New branch not found")
        if not current_user.is_superuser and branch.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions for new branch")
    
    update_dict = department_in.model_dump(exclude_unset=True)
    department = department_crud.update(session=session, db_obj=department, obj_in=update_dict)
    return department


@router.delete("/{id}")
def delete_department(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a department.
    """
    department = department_crud.get(session=session, id=id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check permissions
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    department_crud.remove(session=session, id=id)
    return Message(message="Department deleted successfully")


@router.get("/branch/{branch_id}", response_model=DepartmentsPublic)
def read_departments_by_branch(
    session: SessionDep, 
    current_user: CurrentUser, 
    branch_id: uuid.UUID,
    skip: int = 0, 
    limit: int = 100
) -> Any:
    """
    Get all departments for a specific branch.
    """
    # Verify branch exists and user has access
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    if not current_user.is_superuser and branch.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    departments, count = department_crud.get_by_branch(
        session=session, branch_id=branch_id, skip=skip, limit=limit
    )
    return DepartmentsPublic(data=departments, count=count)


@router.get("/{id}/with-hours", response_model=dict)
def read_department_with_hours(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get department by ID with its hours.
    """
    department = department_crud.get(session=session, id=id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check access permissions
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get department hours
    hours = department_hours_crud.get_by_department(session=session, department_id=id)
    
    # Convert to dict and add hours
    department_dict = department.model_dump()
    department_dict["hours"] = [hour.model_dump() for hour in hours]
    
    return department_dict
