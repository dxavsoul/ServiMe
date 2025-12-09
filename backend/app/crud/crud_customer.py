"""
CRUD operations for Customer model.
"""

import uuid
from typing import Optional
from sqlmodel import Session, select
from app.core.security import get_password_hash, verify_password
from app.models.customer import Customer, CustomerCreate, CustomerUpdate
from app.crud.base import CRUDBase


class CRUDCustomer(CRUDBase[Customer, CustomerCreate, CustomerUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[Customer]:
        """Get customer by email address."""
        statement = select(Customer).where(Customer.email == email)
        return db.exec(statement).first()

    def create(self, db: Session, *, obj_in: CustomerCreate) -> Customer:
        """Create new customer with hashed password."""
        if hasattr(obj_in, 'model_dump'):
            create_data = obj_in.model_dump(exclude_unset=True)
        else:
            create_data = obj_in.copy() if isinstance(obj_in, dict) else obj_in
        
        create_data.pop("password", None)
        db_obj = Customer(**create_data)
        db_obj.hashed_password = get_password_hash(obj_in.password if hasattr(obj_in, 'password') else obj_in['password'])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: Customer, obj_in: CustomerUpdate | dict
    ) -> Customer:
        """Update customer with optional password hashing."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[Customer]:
        """Authenticate customer with email and password."""
        customer = self.get_by_email(db, email=email)
        if not customer:
            return None
        if not verify_password(password, customer.hashed_password):
            return None
        return customer

    def is_active(self, customer: Customer) -> bool:
        """Check if customer is active."""
        return customer.is_active

    def get_customers_near_location(
        self, 
        db: Session, 
        *, 
        latitude: float, 
        longitude: float, 
        radius_km: float = 10.0,
        skip: int = 0,
        limit: int = 100
    ) -> list[Customer]:
        """Get customers within a specified radius from a location."""
        # Using simple distance calculation (this could be optimized with PostGIS for production)
        # For now, we'll just filter by customers who have location data
        statement = (
            select(Customer)
            .where(
                Customer.latitude.is_not(None),
                Customer.longitude.is_not(None),
                Customer.is_active == True
            )
            .offset(skip)
            .limit(limit)
        )
        customers = db.exec(statement).all()
        
        # Filter by distance (basic implementation)
        # In production, you'd want to use proper geospatial queries
        nearby_customers = []
        for customer in customers:
            if customer.latitude and customer.longitude:
                # Simple distance calculation (could be improved)
                lat_diff = abs(customer.latitude - latitude)
                lon_diff = abs(customer.longitude - longitude)
                # Rough approximation - in production use proper haversine formula
                if lat_diff <= (radius_km / 111.0) and lon_diff <= (radius_km / 111.0):
                    nearby_customers.append(customer)
        
        return nearby_customers

    def search_customers(
        self,
        db: Session,
        *,
        query: str,
        skip: int = 0,
        limit: int = 100
    ) -> list[Customer]:
        """Search customers by name, email, or phone."""
        from sqlmodel import or_
        
        statement = (
            select(Customer)
            .where(
                or_(
                    Customer.full_name.icontains(query),
                    Customer.email.icontains(query),
                    Customer.phone.icontains(query) if query else False
                )
            )
            .offset(skip)
            .limit(limit)
        )
        return db.exec(statement).all()

    def count_search_results(
        self,
        db: Session,
        *,
        query: str
    ) -> int:
        """Count search results for customers."""
        from sqlmodel import or_, func
        
        statement = select(func.count(Customer.id)).where(
            or_(
                Customer.full_name.icontains(query),
                Customer.email.icontains(query),
                Customer.phone.icontains(query) if query else False
            )
        )
        return db.exec(statement).first() or 0


crud_customer = CRUDCustomer(Customer)
