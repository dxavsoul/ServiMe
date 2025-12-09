"""
CRUD operations for ServiceRequestTimeline model.
"""

import uuid
from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select
from app.models.service_request_timeline import (
    ServiceRequestTimeline,
    ServiceRequestTimelineCreate,
    ServiceRequestTimelineUpdate
)
from app.crud.base import CRUDBase


class CRUDServiceRequestTimeline(CRUDBase[ServiceRequestTimeline, ServiceRequestTimelineCreate, ServiceRequestTimelineUpdate]):
    
    def create_timeline_entry(
        self,
        db: Session,
        *,
        service_request_id: uuid.UUID,
        status: str,
        notes: Optional[str] = None,
        changed_by_user_id: Optional[uuid.UUID] = None,
        changed_by_user_type: Optional[str] = None
    ) -> ServiceRequestTimeline:
        """Create a new timeline entry for a service request."""
        timeline_data = ServiceRequestTimelineCreate(
            service_request_id=service_request_id,
            status=status,
            notes=notes,
            changed_by_user_id=changed_by_user_id,
            changed_by_user_type=changed_by_user_type,
            timestamp=datetime.utcnow().isoformat()
        )
        
        db_obj = ServiceRequestTimeline(**timeline_data.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_service_request(
        self, 
        db: Session, 
        *, 
        service_request_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[ServiceRequestTimeline]:
        """Get all timeline entries for a specific service request."""
        statement = (
            select(ServiceRequestTimeline)
            .where(ServiceRequestTimeline.service_request_id == service_request_id)
            .order_by(ServiceRequestTimeline.timestamp.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def get_latest_by_service_request(
        self, 
        db: Session, 
        *, 
        service_request_id: uuid.UUID
    ) -> Optional[ServiceRequestTimeline]:
        """Get the latest timeline entry for a specific service request."""
        statement = (
            select(ServiceRequestTimeline)
            .where(ServiceRequestTimeline.service_request_id == service_request_id)
            .order_by(ServiceRequestTimeline.timestamp.desc())
            .limit(1)
        )
        return db.exec(statement).first()

    def get_by_status(
        self, 
        db: Session, 
        service_request_id: uuid.UUID, 
        status: str,
        skip: int = 0, 
        limit: int = 100
    ) -> List[ServiceRequestTimeline]:
        """Get all timeline entries with a specific status."""
        statement = (
            select(ServiceRequestTimeline)
            .where(ServiceRequestTimeline.status == status)
            .order_by(ServiceRequestTimeline.timestamp.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def get_by_user(
        self, 
        db: Session, 
        *, 
        user_id: uuid.UUID,
        user_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ServiceRequestTimeline]:
        """Get all timeline entries by a specific user."""
        statement = select(ServiceRequestTimeline).where(
            ServiceRequestTimeline.changed_by_user_id == user_id
        )
        
        if user_type:
            statement = statement.where(ServiceRequestTimeline.changed_by_user_type == user_type)
        
        statement = (
            statement
            .order_by(ServiceRequestTimeline.timestamp.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()


crud_service_request_timeline = CRUDServiceRequestTimeline(ServiceRequestTimeline)
