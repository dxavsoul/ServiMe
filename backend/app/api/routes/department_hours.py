import uuid
from typing import Any, List

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.crud.crud_department_hours import department_hours_crud
from app.crud.crud_department import department_crud
from app.models import (
    DepartmentHours,
    DepartmentHoursCreate,
    DepartmentHoursUpdate,
    DepartmentHoursPublic,
    DepartmentHoursListPublic,
    DayOfWeek,
    Message,
)

router = APIRouter(prefix="/department-hours", tags=["department-hours"])


@router.get("/department/{department_id}", response_model=DepartmentHoursListPublic)
def read_department_hours(
    session: SessionDep, 
    current_user: CurrentUser, 
    department_id: uuid.UUID
) -> Any:
    """
    Get all hours for a specific department.
    """
    # Verify department exists and user has access
    department = department_crud.get(session=session, id=department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    hours = department_hours_crud.get_by_department(session=session, department_id=department_id)
    return DepartmentHoursListPublic(data=hours, count=len(hours))


@router.get("/department/{department_id}/day/{day_of_week}", response_model=DepartmentHoursPublic)
def read_department_hours_by_day(
    session: SessionDep, 
    current_user: CurrentUser, 
    department_id: uuid.UUID,
    day_of_week: DayOfWeek
) -> Any:
    """
    Get hours for a specific department and day.
    """
    # Verify department exists and user has access
    department = department_crud.get(session=session, id=department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    hours = department_hours_crud.get_by_department_and_day(
        session=session, department_id=department_id, day_of_week=day_of_week
    )
    if not hours:
        raise HTTPException(status_code=404, detail="Hours not found for this day")
    
    return hours


@router.post("/department/{department_id}", response_model=DepartmentHoursPublic)
def create_department_hours(
    *, 
    session: SessionDep, 
    current_user: CurrentUser, 
    department_id: uuid.UUID,
    hours_in: DepartmentHoursCreate
) -> Any:
    """
    Create hours for a specific department and day.
    """
    # Verify department exists and user has access
    department = department_crud.get(session=session, id=department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if hours already exist for this day
    existing_hours = department_hours_crud.get_by_department_and_day(
        session=session, department_id=department_id, day_of_week=hours_in.day_of_week
    )
    if existing_hours:
        raise HTTPException(
            status_code=400, 
            detail=f"Hours already exist for {hours_in.day_of_week}"
        )
    
    # Set department_id
    hours_in.department_id = department_id
    hours = department_hours_crud.create(session=session, obj_in=hours_in)
    return hours


@router.post("/department/{department_id}/weekly", response_model=DepartmentHoursListPublic)
def create_weekly_schedule(
    *, 
    session: SessionDep, 
    current_user: CurrentUser, 
    department_id: uuid.UUID,
    weekly_hours: List[DepartmentHoursCreate]
) -> Any:
    """
    Create a complete weekly schedule for a department.
    """
    # Verify department exists and user has access
    department = department_crud.get(session=session, id=department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Validate that we don't have duplicate days
    days = [hours.day_of_week for hours in weekly_hours]
    if len(days) != len(set(days)):
        raise HTTPException(status_code=400, detail="Duplicate days in weekly schedule")
    
    # Check for existing hours
    existing_hours = department_hours_crud.get_by_department(session=session, department_id=department_id)
    if existing_hours:
        raise HTTPException(
            status_code=400, 
            detail="Hours already exist for this department. Use PUT to update."
        )
    
    created_hours = department_hours_crud.create_weekly_schedule(
        session=session, department_id=department_id, hours_data=weekly_hours
    )
    return DepartmentHoursListPublic(data=created_hours, count=len(created_hours))


@router.put("/department/{department_id}/day/{day_of_week}", response_model=DepartmentHoursPublic)
def update_department_hours(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    department_id: uuid.UUID,
    day_of_week: DayOfWeek,
    hours_in: DepartmentHoursUpdate,
) -> Any:
    """
    Update hours for a specific department and day.
    """
    # Verify department exists and user has access
    department = department_crud.get(session=session, id=department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    hours = department_hours_crud.get_by_department_and_day(
        session=session, department_id=department_id, day_of_week=day_of_week
    )
    if not hours:
        raise HTTPException(status_code=404, detail="Hours not found for this day")
    
    update_dict = hours_in.model_dump(exclude_unset=True)
    updated_hours = department_hours_crud.update(session=session, db_obj=hours, obj_in=update_dict)
    return updated_hours


@router.put("/department/{department_id}/weekly", response_model=DepartmentHoursListPublic)
def update_weekly_schedule(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    department_id: uuid.UUID,
    weekly_hours: List[DepartmentHoursUpdate],
) -> Any:
    """
    Update the complete weekly schedule for a department.
    """
    # Verify department exists and user has access
    department = department_crud.get(session=session, id=department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    updated_hours = department_hours_crud.update_weekly_schedule(
        session=session, department_id=department_id, hours_data=weekly_hours
    )
    return DepartmentHoursListPublic(data=updated_hours, count=len(updated_hours))


@router.delete("/department/{department_id}/day/{day_of_week}")
def delete_department_hours(
    session: SessionDep, 
    current_user: CurrentUser, 
    department_id: uuid.UUID,
    day_of_week: DayOfWeek
) -> Message:
    """
    Delete hours for a specific department and day.
    """
    # Verify department exists and user has access
    department = department_crud.get(session=session, id=department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    hours = department_hours_crud.get_by_department_and_day(
        session=session, department_id=department_id, day_of_week=day_of_week
    )
    if not hours:
        raise HTTPException(status_code=404, detail="Hours not found for this day")
    
    department_hours_crud.remove(session=session, id=hours.id)
    return Message(message="Department hours deleted successfully")


@router.delete("/department/{department_id}/weekly")
def delete_weekly_schedule(
    session: SessionDep, 
    current_user: CurrentUser, 
    department_id: uuid.UUID
) -> Message:
    """
    Delete the complete weekly schedule for a department.
    """
    # Verify department exists and user has access
    department = department_crud.get(session=session, id=department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    if not current_user.is_superuser and department.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    department_hours_crud.delete_by_department(session=session, department_id=department_id)
    return Message(message="Weekly schedule deleted successfully")


@router.get("/open-departments/{day_of_week}", response_model=DepartmentHoursListPublic)
def read_open_departments_by_day(
    session: SessionDep, 
    current_user: CurrentUser, 
    day_of_week: DayOfWeek
) -> Any:
    """
    Get all departments that are open on a specific day.
    """
    hours = department_hours_crud.get_open_departments_by_day(session=session, day_of_week=day_of_week)
    return DepartmentHoursListPublic(data=hours, count=len(hours))
