"""
CRUD operations for ServiceRequest model.
"""

import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import Session, select
from app.models.service_request import ServiceRequest, ServiceRequestCreate, ServiceRequestUpdate
from app.crud.base import CRUDBase


class CRUDServiceRequest(CRUDBase[ServiceRequest, ServiceRequestCreate, ServiceRequestUpdate]):
    def create_with_customer(
        self, 
        db: Session, 
        *, 
        obj_in: ServiceRequestCreate, 
        customer_id: uuid.UUID
    ) -> ServiceRequest:
        """Create new service request for a specific customer."""
        create_data = obj_in.model_dump(exclude_unset=True)
        create_data["customer_id"] = customer_id
        create_data["created_at"] = datetime.utcnow().isoformat()
        create_data["updated_at"] = datetime.utcnow().isoformat()
        create_data["status"] = "PENDING"
        
        db_obj = ServiceRequest(**create_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        return db_obj

    def update(
        self, 
        db: Session, 
        *, 
        db_obj: ServiceRequest, 
        obj_in: ServiceRequestUpdate | dict
    ) -> ServiceRequest:
        """Update service request with timestamp."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def get_by_branches(
        self, 
        db: Session, 
        *, 
        branch_ids: list[uuid.UUID], 
        status: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> list[ServiceRequest]:
        """Get service requests assigned to specific branches."""
        statement = select(ServiceRequest).where(ServiceRequest.branch_id.in_(branch_ids))
        
        if status:
            statement = statement.where(ServiceRequest.status == status)
            
        statement = statement.offset(skip).limit(limit)
        return db.exec(statement).all()

    def get_by_branches_with_details(
        self, 
        db: Session, 
        *, 
        branch_ids: list[uuid.UUID], 
        status: Optional[str] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> list[ServiceRequest]:
        """Get detailed service requests assigned to specific branches."""
        # For now, this is the same as get_by_branches
        # Can be enhanced later to include joins with related tables
        return self.get_by_branches(
            db, 
            branch_ids=branch_ids, 
            status=status, 
            skip=skip, 
            limit=limit
        )

    def get_with_details(self, db: Session, *, id: uuid.UUID) -> Optional[ServiceRequest]:
        """Get service request with detailed information."""
        # For now, this is the same as get
        # Can be enhanced later to include joins with related tables
        return self.get(db, id=id)

    def get_nearby(
        self,
        db: Session,
        *,
        latitude: float,
        longitude: float,
        radius_km: float = 10.0,
        skip: int = 0,
        limit: int = 100
    ) -> list[ServiceRequest]:
        """Get service requests near a location."""
        # Simple implementation - can be enhanced with proper geospatial queries
        statement = select(ServiceRequest).where(
            ServiceRequest.customer_latitude.is_not(None),
            ServiceRequest.customer_longitude.is_not(None)
        ).offset(skip).limit(limit)
        
        # For now, return all requests with coordinates
        # TODO: Implement proper distance calculation
        return db.exec(statement).all()

    def get_by_customer(
        self, 
        db: Session, 
        *, 
        customer_id: uuid.UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> list[ServiceRequest]:
        """Get all service requests for a specific customer."""
        statement = (
            select(ServiceRequest)
            .where(ServiceRequest.customer_id == customer_id)
            .order_by(ServiceRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def get_by_service(
        self, 
        db: Session, 
        *, 
        service_id: uuid.UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> list[ServiceRequest]:
        """Get all service requests for a specific service."""
        statement = (
            select(ServiceRequest)
            .where(ServiceRequest.service_id == service_id)
            .order_by(ServiceRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def get_by_branch(
        self, 
        db: Session, 
        *, 
        branch_id: uuid.UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> list[ServiceRequest]:
        """Get all service requests for a specific branch."""
        statement = (
            select(ServiceRequest)
            .where(ServiceRequest.branch_id == branch_id)
            .order_by(ServiceRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def get_by_status(
        self, 
        db: Session, 
        *, 
        status: str, 
        skip: int = 0, 
        limit: int = 100
    ) -> list[ServiceRequest]:
        """Get all service requests with a specific status."""
        statement = (
            select(ServiceRequest)
            .where(ServiceRequest.status == status)
            .order_by(ServiceRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def get_near_location(
        self, 
        db: Session, 
        *, 
        latitude: float, 
        longitude: float, 
        radius_km: float = 10.0,
        skip: int = 0, 
        limit: int = 100
    ) -> list[ServiceRequest]:
        """Get service requests near a specific location."""
        statement = (
            select(ServiceRequest)
            .where(
                ServiceRequest.customer_latitude.is_not(None),
                ServiceRequest.customer_longitude.is_not(None)
            )
            .order_by(ServiceRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        requests = db.exec(statement).all()
        
        # Filter by distance (basic implementation)
        nearby_requests = []
        for request in requests:
            if request.customer_latitude and request.customer_longitude:
                lat_diff = abs(request.customer_latitude - latitude)
                lon_diff = abs(request.customer_longitude - longitude)
                # Rough approximation - in production use proper haversine formula
                if lat_diff <= (radius_km / 111.0) and lon_diff <= (radius_km / 111.0):
                    nearby_requests.append(request)
        
        return nearby_requests

    def update_status(
        self, 
        db: Session, 
        *, 
        request_id: uuid.UUID, 
        new_status: str,
        notes: Optional[str] = None,
        changed_by_user_id: Optional[uuid.UUID] = None,
        changed_by_user_type: Optional[str] = None
    ) -> Optional[ServiceRequest]:
        """Update the status of a service request."""
        db_obj = self.get(db, id=request_id)
        if db_obj:
            # Update the service request
            updated_obj = self.update(db, db_obj=db_obj, obj_in={"status": new_status})
            return updated_obj
        return None

    def assign_to_branch(
        self, 
        db: Session, 
        *, 
        request_id: uuid.UUID, 
        branch_id: uuid.UUID,
        assigned_by_user_id: Optional[uuid.UUID] = None,
        assigned_by_user_type: Optional[str] = None
    ) -> Optional[ServiceRequest]:
        """Assign a service request to a specific branch."""
        db_obj = self.get(db, id=request_id)
        if db_obj:
            # Update the service request
            updated_obj = self.update(db, db_obj=db_obj, obj_in={
                "branch_id": branch_id, 
                "status": "ASSIGNED"
            })
            return updated_obj
        return None

    def accept_request(
        self,
        db: Session,
        *,
        request_id: uuid.UUID,
        branch_user_id: uuid.UUID,
        notes: Optional[str] = None
    ) -> Optional[ServiceRequest]:
        """Accept a service request (branch user action)."""
        db_obj = self.get(db, id=request_id)
        if not db_obj:
            return None
            
        if db_obj.status not in ["PENDING", "ASSIGNED"]:
            raise ValueError("Service request must be in pending or assigned status to be accepted")
            
        return self.update_status(
            db,
            request_id=request_id,
            new_status="ACCEPTED",
            notes=notes or "Service request accepted",
            changed_by_user_id=branch_user_id,
            changed_by_user_type="branch_user"
        )

    def start_request(
        self,
        db: Session,
        *,
        request_id: uuid.UUID,
        branch_user_id: uuid.UUID,
        notes: Optional[str] = None
    ) -> Optional[ServiceRequest]:
        """Start work on a service request (branch user action)."""
        db_obj = self.get(db, id=request_id)
        if not db_obj:
            return None
            
        if db_obj.status != "ACCEPTED":
            raise ValueError("Service request must be accepted to start work")
            
        return self.update_status(
            db,
            request_id=request_id,
            new_status="IN_PROGRESS",
            notes=notes or "Work started on service request",
            changed_by_user_id=branch_user_id,
            changed_by_user_type="branch_user"
        )

    def complete_request(
        self,
        db: Session,
        *,
        request_id: uuid.UUID,
        branch_user_id: uuid.UUID,
        notes: Optional[str] = None
    ) -> Optional[ServiceRequest]:
        """Complete a service request (branch user action)."""
        db_obj = self.get(db, id=request_id)
        if not db_obj:
            return None
            
        if db_obj.status != "IN_PROGRESS":
            raise ValueError("Service request must be in progress to be completed")
            
        return self.update_status(
            db,
            request_id=request_id,
            new_status="COMPLETED",
            notes=notes or "Service request completed",
            changed_by_user_id=branch_user_id,
            changed_by_user_type="branch_user"
        )

    def reschedule_request(
        self,
        db: Session,
        *,
        request_id: uuid.UUID,
        new_date: str,
        new_time: str,
        branch_user_id: uuid.UUID,
        notes: Optional[str] = None
    ) -> Optional[ServiceRequest]:
        """Reschedule a service request."""
        db_obj = self.get(db, id=request_id)
        if not db_obj:
            return None
            
        if db_obj.status in ["COMPLETED", "CANCELLED"]:
            raise ValueError("Cannot reschedule completed or cancelled service requests")
            
        # Update the preferred date and time
        updated_obj = self.update(db, db_obj=db_obj, obj_in={
            "preferred_date": new_date,
            "preferred_time": new_time
        })
        
        return updated_obj

    def cancel_request(
        self,
        db: Session,
        *,
        request_id: uuid.UUID,
        user_id: uuid.UUID,
        user_type: str,
        reason: Optional[str] = None
    ) -> Optional[ServiceRequest]:
        """Cancel a service request."""
        db_obj = self.get(db, id=request_id)
        if not db_obj:
            return None
            
        return self.update_status(
            db,
            request_id=request_id,
            new_status="CANCELLED",
            notes=reason or "Service request cancelled",
            changed_by_user_id=user_id,
            changed_by_user_type=user_type
        )


crud_service_request = CRUDServiceRequest(ServiceRequest)
