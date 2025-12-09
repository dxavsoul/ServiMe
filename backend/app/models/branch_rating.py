"""
Branch rating models and schemas.
Contains all branch rating-related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from datetime import datetime

from .base import BasePublicList

if TYPE_CHECKING:
    from .branch import Branch
    from .customer import Customer
    from .customer import ServiceRequest


# Shared properties for BranchRating
class BranchRatingBase(SQLModel):
    """Base branch rating model with shared properties."""
    rating: int = Field(ge=1, le=5, description="Rating from 1 to 5 stars")
    comment: Optional[str] = Field(default=None, max_length=1000, description="Optional comment about the branch service")
    service_quality: Optional[int] = Field(default=None, ge=1, le=5, description="Service quality rating (1-5)")
    staff_friendliness: Optional[int] = Field(default=None, ge=1, le=5, description="Staff friendliness rating (1-5)")
    facility_cleanliness: Optional[int] = Field(default=None, ge=1, le=5, description="Facility cleanliness rating (1-5)")
    wait_time_satisfaction: Optional[int] = Field(default=None, ge=1, le=5, description="Wait time satisfaction rating (1-5)")
    would_recommend: Optional[bool] = Field(default=None, description="Would recommend this branch to others")
    
    # Admin response fields
    admin_response: Optional[str] = Field(default=None, max_length=1000, description="Admin response to the rating")
    responded_by: Optional[uuid.UUID] = Field(default=None, description="ID of the admin who responded")
    responded_at: Optional[datetime] = Field(default=None, description="Timestamp when the response was created")


# Properties to receive on rating creation
class BranchRatingCreate(BranchRatingBase):
    """Schema for branch rating creation via API."""
    branch_id: uuid.UUID
    service_request_id: uuid.UUID


# Properties to receive on rating update
class BranchRatingUpdate(BranchRatingBase):
    """Schema for branch rating updates via API."""
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)


# Properties for admin response to rating
class BranchRatingAdminResponse(SQLModel):
    """Schema for admin response to branch rating."""
    admin_response: str = Field(max_length=1000, description="Admin response to the rating")


# Database model, database table inferred from class name
class BranchRating(BranchRatingBase, table=True):
    """Branch rating database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    branch_id: uuid.UUID = Field(
        foreign_key="branch.id", nullable=False, ondelete="CASCADE"
    )
    customer_id: uuid.UUID = Field(
        foreign_key="customer.id", nullable=False, ondelete="CASCADE"
    )
    service_request_id: uuid.UUID = Field(
        foreign_key="servicerequest.id", nullable=False, ondelete="CASCADE",
        description="Reference to the completed service request"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Rating creation timestamp")
    updated_at: Optional[datetime] = Field(default=None, description="Last update timestamp")
    
    # Relationships
    branch: Optional["Branch"] = Relationship()
    customer: Optional["Customer"] = Relationship()
    service_request: Optional["ServiceRequest"] = Relationship()


# Properties to return via API, id is always required
class BranchRatingPublic(BranchRatingBase):
    """Public branch rating schema for API responses."""
    id: uuid.UUID
    branch_id: uuid.UUID
    customer_id: uuid.UUID
    service_request_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime]


# Properties to return via API with detailed information
class BranchRatingWithDetailsPublic(BranchRatingBase):
    """Branch rating schema with detailed information for API responses."""
    id: uuid.UUID
    branch_id: uuid.UUID
    customer_id: uuid.UUID
    service_request_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime]
    customer_name: str
    branch_name: str
    service_name: str
    company_name: str
    responder_name: Optional[str] = None  # Name of admin who responded


# Response model for branch ratings list
class BranchRatingsPublic(BasePublicList):
    """Schema for paginated branch rating list responses."""
    data: List[BranchRatingPublic]


# Response model for branch ratings with details
class BranchRatingsWithDetailsPublic(BasePublicList):
    """Schema for paginated branch rating list responses with detailed information."""
    data: List[BranchRatingWithDetailsPublic]


# Branch rating statistics
class BranchRatingStats(SQLModel):
    """Branch rating statistics for API responses."""
    average_rating: float
    total_ratings: int
    rating_distribution: dict  # {"5": 10, "4": 5, "3": 2, "2": 1, "1": 0}
    average_service_quality: Optional[float] = None
    average_staff_friendliness: Optional[float] = None
    average_facility_cleanliness: Optional[float] = None
    average_wait_time_satisfaction: Optional[float] = None
    recommendation_percentage: Optional[float] = None


# Enhanced branch model with rating statistics
class BranchWithRatingStatsPublic(BranchRatingBase):
    """Branch schema with rating statistics for API responses."""
    id: uuid.UUID
    name: str
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    company_id: uuid.UUID
    company_name: str
    rating_stats: BranchRatingStats
    is_active: bool
