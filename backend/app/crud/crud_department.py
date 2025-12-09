import uuid
from typing import Optional

from sqlmodel import Session, select, func

from app.models import Department, DepartmentCreate, DepartmentUpdate, Branch
from .base import CRUDBase


class CRUDDepartment(CRUDBase[Department, DepartmentCreate, DepartmentUpdate]):
    def create_with_owner(
        self, session: Session, *, obj_in: DepartmentCreate, created_by: uuid.UUID
    ) -> Department:
        """Create department with owner"""
        return self.create(session=session, obj_in=obj_in, created_by=created_by)

    def get_by_company(
        self, session: Session, *, company_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> list[Department]:
        """Get departments for a specific company"""
        # Get departments through branch relationship since departments belong to branches
        statement = (
            select(Department)
            .join(Branch, Department.branch_id == Branch.id)
            .where(Branch.company_id == company_id)
            .offset(skip)
            .limit(limit)
        )
        return session.exec(statement).all()

    def get_by_branch(
        self, session: Session, *, branch_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Department], int]:
        """Get departments for a specific branch"""
        count_statement = (
            select(func.count())
            .select_from(Department)
            .where(Department.branch_id == branch_id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Department)
            .where(Department.branch_id == branch_id)
            .offset(skip)
            .limit(limit)
        )
        departments = session.exec(statement).all()
        return list(departments), count

    def get_by_owner(
        self, session: Session, *, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Department], int]:
        """Get departments created by a specific user"""
        count_statement = (
            select(func.count())
            .select_from(Department)
            .where(Department.created_by == owner_id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Department)
            .where(Department.created_by == owner_id)
            .offset(skip)
            .limit(limit)
        )
        departments = session.exec(statement).all()
        return list(departments), count

    def get_with_branch_info(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[tuple[Department, str]], int]:
        """Get departments with branch information"""
        count_statement = (
            select(func.count())
            .select_from(Department)
            .join(Branch, Department.branch_id == Branch.id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Department, Branch.name.label("branch_name"))
            .join(Branch, Department.branch_id == Branch.id)
            .offset(skip)
            .limit(limit)
        )
        results = session.exec(statement).all()
        return list(results), count

    def get_accessible_by_user(
        self, session: Session, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Department], int]:
        """Get departments accessible by a user (either created by them or in accessible branches)"""
        # This would need to be enhanced based on your access control logic
        # For now, returning departments created by the user
        return self.get_by_owner(session=session, owner_id=user_id, skip=skip, limit=limit)

    def get_with_hours(
        self, session: Session, *, department_id: uuid.UUID
    ) -> Optional[tuple[Department, list]]:
        """Get department with its hours"""
        from app.crud.crud_department_hours import department_hours_crud
        
        department = self.get(session=session, id=department_id)
        if not department:
            return None
        
        hours = department_hours_crud.get_by_department(session=session, department_id=department_id)
        return department, hours

    def get_multiple_with_hours(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[tuple[Department, list]], int]:
        """Get multiple departments with their hours"""
        from app.crud.crud_department_hours import department_hours_crud
        
        departments, count = self.get_multi(session=session, skip=skip, limit=limit)
        departments_with_hours = []
        
        for department in departments:
            hours = department_hours_crud.get_by_department(session=session, department_id=department.id)
            departments_with_hours.append((department, hours))
        
        return departments_with_hours, count


department_crud = CRUDDepartment(Department)
department = department_crud
