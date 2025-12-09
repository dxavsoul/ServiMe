import uuid
from typing import Optional

from sqlmodel import Session, select, func

from app.models import Service, ServiceCreate, ServiceUpdate, Department, ServiceType
from .base import CRUDBase


class CRUDService(CRUDBase[Service, ServiceCreate, ServiceUpdate]):
    def create_with_owner(
        self, session: Session, *, obj_in: ServiceCreate, created_by: uuid.UUID
    ) -> Service:
        """Create service with owner"""
        return self.create(session=session, obj_in=obj_in, created_by=created_by)

    def get_by_department(
        self, session: Session, *, department_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> list[Service]:
        """Get services for a specific department - simplified version"""
        statement = (
            select(Service)
            .where(Service.department_id == department_id)
            .offset(skip)
            .limit(limit)
        )
        return session.exec(statement).all()

    def get_by_department_with_count(
        self, session: Session, *, department_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Service], int]:
        """Get services for a specific department with count"""
        count_statement = (
            select(func.count())
            .select_from(Service)
            .where(Service.department_id == department_id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Service)
            .where(Service.department_id == department_id)
            .offset(skip)
            .limit(limit)
        )
        services = session.exec(statement).all()
        return list(services), count

    def get_by_service_type(
        self, session: Session, *, service_type_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Service], int]:
        """Get services for a specific service type"""
        count_statement = (
            select(func.count())
            .select_from(Service)
            .where(Service.service_type_id == service_type_id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Service)
            .where(Service.service_type_id == service_type_id)
            .offset(skip)
            .limit(limit)
        )
        services = session.exec(statement).all()
        return list(services), count

    def get_by_owner(
        self, session: Session, *, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Service], int]:
        """Get services created by a specific user"""
        count_statement = (
            select(func.count())
            .select_from(Service)
            .where(Service.created_by == owner_id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Service)
            .where(Service.created_by == owner_id)
            .offset(skip)
            .limit(limit)
        )
        services = session.exec(statement).all()
        return list(services), count

    def get_with_details(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[tuple[Service, str, str]], int]:
        """Get services with department and service type information"""
        count_statement = (
            select(func.count())
            .select_from(Service)
            .join(Department, Service.department_id == Department.id)
            .join(ServiceType, Service.service_type_id == ServiceType.id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(
                Service, 
                Department.name.label("department_name"),
                ServiceType.name.label("service_type_name")
            )
            .join(Department, Service.department_id == Department.id)
            .join(ServiceType, Service.service_type_id == ServiceType.id)
            .offset(skip)
            .limit(limit)
        )
        results = session.exec(statement).all()
        return list(results), count

    def get_active(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[Service], int]:
        """Get active services"""
        count_statement = (
            select(func.count())
            .select_from(Service)
            .where(Service.is_active == True)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Service)
            .where(Service.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        services = session.exec(statement).all()
        return list(services), count

    def get_with_promotions(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[Service], int]:
        """Get services that have active promotions"""
        count_statement = (
            select(func.count())
            .select_from(Service)
            .where(Service.has_promotion == True)
            .where(Service.is_active == True)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Service)
            .where(Service.has_promotion == True)
            .where(Service.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        services = session.exec(statement).all()
        return list(services), count

    def get_by_user_companies(
        self, session: Session, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Service], int]:
        """Get services from companies the user has access to"""
        from app.models import Branch, BranchUserLink

        count_statement = (
            select(func.count())
            .select_from(Service)
            .join(Department, Service.department_id == Department.id)
            .join(Branch, Department.branch_id == Branch.id)
            .join(BranchUserLink, Branch.id == BranchUserLink.branch_id)
            .where(BranchUserLink.user_id == user_id)
            .where(Service.is_active == True)
        )
        count = session.exec(count_statement).one()

        statement = (
            select(Service)
            .join(Department, Service.department_id == Department.id)
            .join(Branch, Department.branch_id == Branch.id)
            .join(BranchUserLink, Branch.id == BranchUserLink.branch_id)
            .where(BranchUserLink.user_id == user_id)
            .where(Service.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        services = session.exec(statement).all()
        return list(services), count

    def get_with_details_by_user_companies(
        self, session: Session, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[tuple[Service, str, str]], int]:
        """Get services with details from companies the user has access to"""
        from app.models import Branch, BranchUserLink

        count_statement = (
            select(func.count())
            .select_from(Service)
            .join(Department, Service.department_id == Department.id)
            .join(ServiceType, Service.service_type_id == ServiceType.id)
            .join(Branch, Department.branch_id == Branch.id)
            .join(BranchUserLink, Branch.id == BranchUserLink.branch_id)
            .where(BranchUserLink.user_id == user_id)
            .where(Service.is_active == True)
        )
        count = session.exec(count_statement).one()

        statement = (
            select(
                Service,
                Department.name.label("department_name"),
                ServiceType.name.label("service_type_name")
            )
            .join(Department, Service.department_id == Department.id)
            .join(ServiceType, Service.service_type_id == ServiceType.id)
            .join(Branch, Department.branch_id == Branch.id)
            .join(BranchUserLink, Branch.id == BranchUserLink.branch_id)
            .where(BranchUserLink.user_id == user_id)
            .where(Service.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        results = session.exec(statement).all()
        return list(results), count

    def get_with_promotions_by_user_companies(
        self, session: Session, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Service], int]:
        """Get services with promotions from companies the user has access to"""
        from app.models import Branch, BranchUserLink

        count_statement = (
            select(func.count())
            .select_from(Service)
            .join(Department, Service.department_id == Department.id)
            .join(Branch, Department.branch_id == Branch.id)
            .join(BranchUserLink, Branch.id == BranchUserLink.branch_id)
            .where(BranchUserLink.user_id == user_id)
            .where(Service.has_promotion == True)
            .where(Service.is_active == True)
        )
        count = session.exec(count_statement).one()

        statement = (
            select(Service)
            .join(Department, Service.department_id == Department.id)
            .join(Branch, Department.branch_id == Branch.id)
            .join(BranchUserLink, Branch.id == BranchUserLink.branch_id)
            .where(BranchUserLink.user_id == user_id)
            .where(Service.has_promotion == True)
            .where(Service.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        services = session.exec(statement).all()
        return list(services), count

    def user_has_access_to_service(
        self, session: Session, *, user_id: uuid.UUID, service_id: uuid.UUID
    ) -> bool:
        """Check if user has access to a specific service through company access"""
        from app.models import Branch, BranchUserLink

        statement = (
            select(func.count())
            .select_from(Service)
            .join(Department, Service.department_id == Department.id)
            .join(Branch, Department.branch_id == Branch.id)
            .join(BranchUserLink, Branch.id == BranchUserLink.branch_id)
            .where(Service.id == service_id)
            .where(BranchUserLink.user_id == user_id)
        )
        count = session.exec(statement).one()
        return count > 0


service_crud = CRUDService(Service)
service = service_crud
