import uuid
from typing import Optional

from sqlmodel import Session, select, func

from app.models import ServiceType, ServiceTypeCreate, ServiceTypeUpdate
from .base import CRUDBase


class CRUDServiceType(CRUDBase[ServiceType, ServiceTypeCreate, ServiceTypeUpdate]):
    def create_with_owner(
        self, session: Session, *, obj_in: ServiceTypeCreate, created_by: uuid.UUID
    ) -> ServiceType:
        """Create service type with owner"""
        return self.create(session=session, obj_in=obj_in, created_by=created_by)

    def get_by_owner(
        self, session: Session, *, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[ServiceType], int]:
        """Get service types created by a specific user"""
        count_statement = (
            select(func.count())
            .select_from(ServiceType)
            .where(ServiceType.created_by == owner_id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(ServiceType)
            .where(ServiceType.created_by == owner_id)
            .offset(skip)
            .limit(limit)
        )
        service_types = session.exec(statement).all()
        return list(service_types), count

    def get_active(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[ServiceType], int]:
        """Get active service types"""
        count_statement = (
            select(func.count())
            .select_from(ServiceType)
            .where(ServiceType.is_active == True)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(ServiceType)
            .where(ServiceType.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        service_types = session.exec(statement).all()
        return list(service_types), count

    def get_by_name(
        self, session: Session, *, name: str
    ) -> Optional[ServiceType]:
        """Get service type by name"""
        statement = select(ServiceType).where(ServiceType.name == name)
        return session.exec(statement).first()


service_type_crud = CRUDServiceType(ServiceType)
service_type = service_type_crud
