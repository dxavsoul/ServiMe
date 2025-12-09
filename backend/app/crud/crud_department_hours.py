import uuid
from typing import Optional, List

from sqlmodel import Session, select, func

from app.models import DepartmentHours, DepartmentHoursCreate, DepartmentHoursUpdate, DayOfWeek
from .base import CRUDBase


class CRUDDepartmentHours(CRUDBase[DepartmentHours, DepartmentHoursCreate, DepartmentHoursUpdate]):
    
    def get_by_department(
        self, session: Session, *, department_id: uuid.UUID
    ) -> List[DepartmentHours]:
        """Get all hours for a specific department"""
        statement = (
            select(DepartmentHours)
            .where(DepartmentHours.department_id == department_id)
            .order_by(DepartmentHours.day_of_week)
        )
        hours = session.exec(statement).all()
        return list(hours)

    def get_by_department_and_day(
        self, session: Session, *, department_id: uuid.UUID, day_of_week: DayOfWeek
    ) -> Optional[DepartmentHours]:
        """Get hours for a specific department and day"""
        statement = (
            select(DepartmentHours)
            .where(DepartmentHours.department_id == department_id)
            .where(DepartmentHours.day_of_week == day_of_week)
        )
        return session.exec(statement).first()

    def create_weekly_schedule(
        self, session: Session, *, department_id: uuid.UUID, hours_data: List[DepartmentHoursCreate]
    ) -> List[DepartmentHours]:
        """Create a complete weekly schedule for a department"""
        created_hours = []
        for hour_data in hours_data:
            # Ensure the department_id is set
            hour_data.department_id = department_id
            hour = self.create(session=session, obj_in=hour_data)
            created_hours.append(hour)
        return created_hours

    def update_weekly_schedule(
        self, session: Session, *, department_id: uuid.UUID, hours_data: List[DepartmentHoursUpdate]
    ) -> List[DepartmentHours]:
        """Update the complete weekly schedule for a department"""
        updated_hours = []
        
        for hour_data in hours_data:
            if hour_data.day_of_week:
                # Find existing hour for this day
                existing_hour = self.get_by_department_and_day(
                    session=session, department_id=department_id, day_of_week=hour_data.day_of_week
                )
                
                if existing_hour:
                    # Update existing hour
                    update_dict = hour_data.model_dump(exclude_unset=True)
                    updated_hour = self.update(session=session, db_obj=existing_hour, obj_in=update_dict)
                    updated_hours.append(updated_hour)
                else:
                    # Create new hour if it doesn't exist
                    create_data = DepartmentHoursCreate(
                        department_id=department_id,
                        day_of_week=hour_data.day_of_week,
                        open_time=hour_data.open_time,
                        close_time=hour_data.close_time,
                        is_closed=hour_data.is_closed
                    )
                    new_hour = self.create(session=session, obj_in=create_data)
                    updated_hours.append(new_hour)
        
        return updated_hours

    def delete_by_department(
        self, session: Session, *, department_id: uuid.UUID
    ) -> bool:
        """Delete all hours for a specific department"""
        statement = select(DepartmentHours).where(DepartmentHours.department_id == department_id)
        hours = session.exec(statement).all()
        
        for hour in hours:
            session.delete(hour)
        
        session.commit()
        return True

    def get_open_departments_by_day(
        self, session: Session, *, day_of_week: DayOfWeek
    ) -> List[DepartmentHours]:
        """Get all departments that are open on a specific day"""
        statement = (
            select(DepartmentHours)
            .where(DepartmentHours.day_of_week == day_of_week)
            .where(DepartmentHours.is_closed == False)
            .where(DepartmentHours.open_time.is_not(None))
        )
        hours = session.exec(statement).all()
        return list(hours)


department_hours_crud = CRUDDepartmentHours(DepartmentHours)
department_hours = department_hours_crud
