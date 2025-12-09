"""
CRUD operations for branch ratings.
"""

import uuid
from typing import Any, Dict, List, Optional, Tuple
from sqlmodel import Session, select, func, and_

from app.crud.base import CRUDBase
from app.models.branch_rating import BranchRating, BranchRatingCreate, BranchRatingUpdate
from app.models.service_request import ServiceRequest
from app.models.user import User


class CRUDBranchRating(CRUDBase[BranchRating, BranchRatingCreate, BranchRatingUpdate]):
    """CRUD operations for branch ratings."""

    def create_rating(
        self,
        session: Session,
        *,
        rating_in: BranchRatingCreate,
        customer_id: uuid.UUID
    ) -> BranchRating:
        """Create a new branch rating after validating the service request."""
        # Verify that the service request exists, belongs to the customer, and is completed
        service_request = session.get(ServiceRequest, rating_in.service_request_id)
        if not service_request:
            raise ValueError("Service request not found")
        
        if service_request.customer_id != customer_id:
            raise ValueError("Service request does not belong to this customer")
        
        if service_request.status != "completed":
            raise ValueError("Can only rate completed service requests")
        
        if service_request.branch_id != rating_in.branch_id:
            raise ValueError("Service request was not completed at this branch")
        
        # Check if rating already exists for this service request
        existing_rating = session.exec(
            select(BranchRating).where(
                BranchRating.service_request_id == rating_in.service_request_id
            )
        ).first()
        
        if existing_rating:
            raise ValueError("This service request has already been rated")
        
        # Create the rating
        rating_data = rating_in.model_dump()
        rating_data["customer_id"] = customer_id
        
        db_rating = BranchRating(**rating_data)
        session.add(db_rating)
        session.commit()
        session.refresh(db_rating)
        return db_rating

    def get_by_branch(
        self,
        session: Session,
        *,
        branch_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[BranchRating], int]:
        """Get ratings for a specific branch with pagination."""
        # Get total count
        count_query = select(func.count()).select_from(BranchRating).where(
            BranchRating.branch_id == branch_id
        )
        total_count = session.exec(count_query).one()
        
        # Get ratings with pagination
        query = (
            select(BranchRating)
            .where(BranchRating.branch_id == branch_id)
            .order_by(BranchRating.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        ratings = session.exec(query).all()
        
        return list(ratings), total_count

    def get_by_customer(
        self,
        session: Session,
        *,
        customer_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[BranchRating], int]:
        """Get ratings by a specific customer with pagination."""
        # Get total count
        count_query = select(func.count()).select_from(BranchRating).where(
            BranchRating.customer_id == customer_id
        )
        total_count = session.exec(count_query).one()
        
        # Get ratings with pagination
        query = (
            select(BranchRating)
            .where(BranchRating.customer_id == customer_id)
            .order_by(BranchRating.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        ratings = session.exec(query).all()
        
        return list(ratings), total_count

    def get_rating_stats(
        self,
        session: Session,
        *,
        branch_id: uuid.UUID
    ) -> Dict[str, Any]:
        """Get comprehensive rating statistics for a branch."""
        # Get all ratings for the branch
        query = select(BranchRating).where(BranchRating.branch_id == branch_id)
        ratings = session.exec(query).all()
        
        if not ratings:
            return {
                "average_rating": 0.0,
                "total_ratings": 0,
                "rating_distribution": {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0},
                "average_service_quality": None,
                "average_staff_friendliness": None,
                "average_facility_cleanliness": None,
                "average_wait_time_satisfaction": None,
                "recommendation_percentage": None
            }
        
        # Calculate basic statistics
        total_ratings = len(ratings)
        average_rating = sum(r.rating for r in ratings) / total_ratings
        
        # Rating distribution
        rating_distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
        for rating in ratings:
            rating_distribution[str(rating.rating)] += 1
        
        # Calculate detailed averages (only for non-null values)
        service_quality_ratings = [r.service_quality for r in ratings if r.service_quality is not None]
        staff_friendliness_ratings = [r.staff_friendliness for r in ratings if r.staff_friendliness is not None]
        facility_cleanliness_ratings = [r.facility_cleanliness for r in ratings if r.facility_cleanliness is not None]
        wait_time_ratings = [r.wait_time_satisfaction for r in ratings if r.wait_time_satisfaction is not None]
        recommendations = [r.would_recommend for r in ratings if r.would_recommend is not None]
        
        return {
            "average_rating": round(average_rating, 2),
            "total_ratings": total_ratings,
            "rating_distribution": rating_distribution,
            "average_service_quality": round(sum(service_quality_ratings) / len(service_quality_ratings), 2) if service_quality_ratings else None,
            "average_staff_friendliness": round(sum(staff_friendliness_ratings) / len(staff_friendliness_ratings), 2) if staff_friendliness_ratings else None,
            "average_facility_cleanliness": round(sum(facility_cleanliness_ratings) / len(facility_cleanliness_ratings), 2) if facility_cleanliness_ratings else None,
            "average_wait_time_satisfaction": round(sum(wait_time_ratings) / len(wait_time_ratings), 2) if wait_time_ratings else None,
            "recommendation_percentage": round((sum(recommendations) / len(recommendations)) * 100, 2) if recommendations else None
        }

    def can_rate_service_request(
        self,
        session: Session,
        *,
        service_request_id: uuid.UUID,
        customer_id: uuid.UUID
    ) -> Tuple[bool, str]:
        """Check if a customer can rate a specific service request."""
        # Check if service request exists and belongs to customer
        service_request = session.get(ServiceRequest, service_request_id)
        if not service_request:
            return False, "Service request not found"
        
        if service_request.customer_id != customer_id:
            return False, "Service request does not belong to this customer"
        
        if service_request.status != "completed":
            return False, "Can only rate completed service requests"
        
        # Check if already rated
        existing_rating = session.exec(
            select(BranchRating).where(
                BranchRating.service_request_id == service_request_id
            )
        ).first()
        
        if existing_rating:
            return False, "This service request has already been rated"
        
        return True, "Can rate this service request"

    def get_rateable_service_requests(
        self,
        session: Session,
        *,
        customer_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[ServiceRequest], int]:
        """Get completed service requests that haven't been rated yet by the customer."""
        # Get service request IDs that have already been rated
        rated_request_ids_query = select(BranchRating.service_request_id).where(
            BranchRating.customer_id == customer_id
        )
        rated_request_ids = session.exec(rated_request_ids_query).all()
        
        # Get completed service requests that haven't been rated
        query = (
            select(ServiceRequest)
            .where(
                and_(
                    ServiceRequest.customer_id == customer_id,
                    ServiceRequest.status == "completed",
                    ServiceRequest.id.not_in(rated_request_ids) if rated_request_ids else True
                )
            )
            .order_by(ServiceRequest.updated_at.desc())
        )
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_count = session.exec(count_query).one()
        
        # Get with pagination
        paginated_query = query.offset(skip).limit(limit)
        service_requests = session.exec(paginated_query).all()
        
        return list(service_requests), total_count

    def add_admin_response(
        self,
        session: Session,
        *,
        rating_id: uuid.UUID,
        admin_response: str,
        admin_user_id: uuid.UUID
    ) -> Optional[BranchRating]:
        """Add an admin response to a branch rating."""
        from datetime import datetime
        
        rating = session.get(BranchRating, rating_id)
        if not rating:
            return None
        
        # Update the rating with admin response
        rating.admin_response = admin_response
        rating.responded_by = admin_user_id
        rating.responded_at = datetime.utcnow()
        rating.updated_at = datetime.utcnow()
        
        session.add(rating)
        session.commit()
        session.refresh(rating)
        
        return rating

    def get_ratings_for_branch_admin(
        self,
        session: Session,
        *,
        branch_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get all ratings for a branch with detailed information for admin view."""
        # Complex query to get rating details with customer and service information
        query = session.exec(
            select(
                BranchRating,
                func.concat(
                    func.coalesce(func.nullif(ServiceRequest.customer_name, ''), ''),
                    ' ',
                    func.coalesce(func.nullif(ServiceRequest.customer_last_name, ''), '')
                ).label('customer_name'),
                ServiceRequest.service_name,
                func.coalesce(User.full_name, 'Admin').label('responder_name')
            )
            .join(ServiceRequest, BranchRating.service_request_id == ServiceRequest.id)
            .outerjoin(User, BranchRating.responded_by == User.id)
            .where(BranchRating.branch_id == branch_id)
            .order_by(BranchRating.created_at.desc())
            .offset(skip)
            .limit(limit)
        ).all()
        
        # Count total ratings for this branch
        count_query = select(func.count(BranchRating.id)).where(BranchRating.branch_id == branch_id)
        total_count = session.exec(count_query).one()
        
        # Format results
        results = []
        for rating, customer_name, service_name, responder_name in query:
            rating_dict = rating.model_dump()
            rating_dict.update({
                'customer_name': customer_name.strip() if customer_name else 'Unknown Customer',
                'service_name': service_name or 'Unknown Service',
                'responder_name': responder_name
            })
            results.append(rating_dict)
        
        return results, total_count


# Create instance
branch_rating_crud = CRUDBranchRating(BranchRating)
