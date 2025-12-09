"""
Models package for the application.

This module provides a clean, organized structure for all database models and schemas.
Import all mfrom .service_request_timeline import (
    ServiceRequestTimelineBase,
    ServiceRequestTimeline,
    ServiceRequestTimelineCreate,
    ServiceRequestTimelineRead,
    ServiceRequestTimelineUpdate,
    ServiceRequestAccept,
    ServiceRequestStart,
    ServiceRequestComplete,
    ServiceRequestReschedule,
    ServiceRequestCancel,
)r respective modules to maintain backwards compatibility
and provide a single point of access.

Usage:
    from app.models import User, Company, Branch
    # or
    from app.models.user import User, UserCreate, UserPublic
"""

# Base models and utilities
from .base import Message, BasePublicList
from sqlmodel import SQLModel  # Required for Alembic

# Import all table models to register them with SQLModel.metadata
# This is essential for Alembic to detect the tables for migrations

# Authentication models
from .auth import Token, TokenPayload, NewPassword, UpdatePassword

# User models
from .user import (
    User,
    UserBase,
    UserCreate,
    UserRegister,
    UserUpdate,
    UserUpdateMe,
    UserPublic,
    UsersPublic,
    UserApprovalStatus,
)

# Company models
from .company import (
    Company,
    CompanyBase,
    CompanyCreate,
    CompanyUpdate,
    CompanyPublic,
    CompaniesPublic,
    CompanyWithLocationPublic,
    CompaniesWithLocationPublic,
    CompanyWithDetailsPublic,
    CompaniesWithDetailsPublic,
)

# Industry Type models
from .industry_type import (
    IndustryType,
    IndustryTypeBase,
    IndustryTypeCreate,
    IndustryTypeUpdate,
    IndustryTypePublic,
    IndustryTypesPublic,
)

# Category models
from .category import (
    Category,
    CategoryBase,
    CategoryCreate,
    CategoryUpdate,
    CategoryPublic,
    CategoriesPublic,
    CategoryWithStatsPublic,
    CategoriesWithStatsPublic,
)

# Branch models
from .branch import (
    Branch,
    BranchBase,
    BranchCreate,
    BranchUpdate,
    BranchPublic,
    BranchWithCompanyPublic,
    BranchWithLocationPublic,
    BranchWithDetailsPublic,
    BranchesPublic,
    BranchesWithCompanyPublic,
    BranchesWithLocationPublic,
    BranchesWithDetailsPublic,
)

# Branch rating models
from .branch_rating import (
    BranchRating,
    BranchRatingBase,
    BranchRatingCreate,
    BranchRatingUpdate,
    BranchRatingPublic,
    BranchRatingWithDetailsPublic,
    BranchRatingsPublic,
    BranchRatingsWithDetailsPublic,
    BranchRatingStats,
    BranchWithRatingStatsPublic,
)

# Branch-User relationship models
from .branch_user import (
    BranchUserLink,
    BranchUserAssign,
    BranchUserUpdate,
    BranchUserPublic,
    BranchUsersPublic,
    BranchUserLinksPublic,
    UserBranchPublic,
    UserBranchesPublic,
)

# Department models
from .department import (
    Department,
    DepartmentBase,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentPublic,
    DepartmentWithBranchPublic,
    DepartmentWithHoursPublic,
    DepartmentWithBranchAndHoursPublic,
    DepartmentsPublic,
    DepartmentsWithBranchPublic,
    DepartmentsWithHoursPublic,
    DepartmentsWithBranchAndHoursPublic,
)

# Department Hours models
from .department_hours import (
    DepartmentHours,
    DepartmentHoursBase,
    DepartmentHoursCreate,
    DepartmentHoursUpdate,
    DepartmentHoursPublic,
    DepartmentHoursListPublic,
    DayOfWeek,
)

# Service Type models
from .service_type import (
    ServiceType,
    ServiceTypeBase,
    ServiceTypeCreate,
    ServiceTypeUpdate,
    ServiceTypePublic,
    ServiceTypesPublic,
)

# Service models
from .service import (
    Service,
    ServiceBase,
    ServiceCreate,
    ServiceUpdate,
    ServicePublic,
    ServiceWithDetailsPublic,
    ServicesPublic,
    ServicesWithDetailsPublic,
)

# Service Request Timeline models
from .service_request_timeline import (
    ServiceRequestTimeline,
    ServiceRequestTimelineBase,
    ServiceRequestTimelineCreate,
    ServiceRequestTimelineUpdate,
    ServiceRequestTimelinePublic,
    ServiceRequestTimelinesPublic,
    ServiceRequestAction,
    ServiceRequestAccept,
    ServiceRequestStart,
    ServiceRequestComplete,
    ServiceRequestReschedule,
    ServiceRequestCancel,
)

# Service Request models
from .service_request import (
    ServiceRequest,
    ServiceRequestBase,
    ServiceRequestCreate,
    ServiceRequestUpdate,
    ServiceRequestPublic,
    ServiceRequestWithDetailsPublic,
    ServiceRequestsPublic,
    ServiceRequestsWithDetailsPublic,
    ServiceRequestStatus,
)

# Customer models
from .customer import (
    Customer,
    CustomerBase,
    CustomerRegister,
    CustomerCreate,
    CustomerUpdate,
    CustomerUpdateMe,
    CustomerPublic,
    CustomersPublic,
)

# Location models
from .location import (
    Country,
    CountryBase,
    CountryCreate,
    CountryUpdate,
    CountryPublic,
    CountriesPublic,
    State,
    StateBase,
    StateCreate,
    StateUpdate,
    StatePublic,
    StatesPublic,
    StateWithCountryPublic,
    StatesWithCountryPublic,
    City,
    CityBase,
    CityCreate,
    CityUpdate,
    CityPublic,
    CitiesPublic,
    CityWithDetailsPublic,
    CitiesWithDetailsPublic,
    LocationData,
    CountrySimple,
    StateSimple,
    CitySimple,
)

# File upload models
from .file_upload import (
    FileUploadResponse,
    FileInfoResponse,
    FileDeleteResponse,
    PresignedUrlResponse,
    FileUploadRequest,
)

# Export all models for easy importing
__all__ = [
    # Base
    "SQLModel",  # Required for Alembic
    "Message",
    "BasePublicList",
    # Auth
    "Token",
    "TokenPayload",
    "NewPassword",
    "UpdatePassword",
    # User
    "User",
    "UserBase",
    "UserCreate",
    "UserRegister",
    "UserUpdate",
    "UserUpdateMe",
    "UserPublic",
    "UsersPublic",
    "UserApprovalStatus",
    # Company
    "Company",
    "CompanyBase",
    "CompanyCreate",
    "CompanyUpdate",
    "CompanyPublic",
    "CompaniesPublic",
    "CompanyWithLocationPublic",
    "CompaniesWithLocationPublic",
    # Industry Type
    "IndustryType",
    "IndustryTypeBase",
    "IndustryTypeCreate",
    "IndustryTypeUpdate",
    "IndustryTypePublic",
    "IndustryTypesPublic",
    # Category
    "Category",
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryPublic",
    "CategoriesPublic",
    "CategoryWithStatsPublic",
    "CategoriesWithStatsPublic",
    # Branch
    "Branch",
    "BranchBase",
    "BranchCreate",
    "BranchUpdate",
    "BranchPublic",
    "BranchWithCompanyPublic",
    "BranchWithLocationPublic",
    "BranchWithDetailsPublic",
    "BranchesPublic",
    "BranchesWithCompanyPublic",
    "BranchesWithLocationPublic",
    "BranchesWithDetailsPublic",
    # Branch Rating
    "BranchRating",
    "BranchRatingBase",
    "BranchRatingCreate",
    "BranchRatingUpdate",
    "BranchRatingPublic",
    "BranchRatingWithDetailsPublic",
    "BranchRatingsPublic",
    "BranchRatingsWithDetailsPublic",
    "BranchRatingStats",
    "BranchWithRatingStatsPublic",
    # Branch-User
    "BranchUserLink",
    "BranchUserAssign",
    "BranchUserUpdate",
    "BranchUserPublic",
    "BranchUsersPublic",
    "UserBranchPublic",
    "UserBranchesPublic",
    # Department
    "Department",
    "DepartmentBase",
    "DepartmentCreate",
    "DepartmentUpdate",
    "DepartmentPublic",
    "DepartmentWithBranchPublic",
    "DepartmentWithHoursPublic",
    "DepartmentWithBranchAndHoursPublic",
    "DepartmentsPublic",
    "DepartmentsWithBranchPublic",
    "DepartmentsWithHoursPublic",
    "DepartmentsWithBranchAndHoursPublic",
    # Department Hours
    "DepartmentHours",
    "DepartmentHoursBase",
    "DepartmentHoursCreate",
    "DepartmentHoursUpdate",
    "DepartmentHoursPublic",
    "DepartmentHoursListPublic",
    "DayOfWeek",
    # Service Type
    "ServiceType",
    "ServiceTypeBase",
    "ServiceTypeCreate",
    "ServiceTypeUpdate",
    "ServiceTypePublic",
    "ServiceTypesPublic",
    # Service
    "Service",
    "ServiceBase",
    "ServiceCreate",
    "ServiceUpdate",
    "ServicePublic",
    "ServiceWithDetailsPublic",
    "ServicesPublic",
    "ServicesWithDetailsPublic",
    # Service Request Timeline
    "ServiceRequestTimeline",
    "ServiceRequestTimelineBase",
    "ServiceRequestTimelineCreate",
    "ServiceRequestTimelineUpdate",
    "ServiceRequestTimelinePublic",
    "ServiceRequestTimelinesPublic",
    "ServiceRequestAction",
    "ServiceRequestAccept",
    "ServiceRequestStart",
    "ServiceRequestComplete",
    "ServiceRequestReschedule",
    "ServiceRequestCancel",
    # Customer
    "Customer",
    "CustomerBase",
    "CustomerRegister",
    "CustomerCreate",
    "CustomerUpdate",
    "CustomerUpdateMe",
    "CustomerPublic",
    "CustomersPublic",
    # Service Request
    "ServiceRequest",
    "ServiceRequestBase",
    "ServiceRequestCreate",
    "ServiceRequestUpdate",
    "ServiceRequestPublic",
    "ServiceRequestWithDetailsPublic",
    "ServiceRequestsPublic",
    "ServiceRequestsWithDetailsPublic",
    "ServiceRequestStatus",
    # Location
    "Country",
    "CountryBase",
    "CountryCreate",
    "CountryUpdate",
    "CountryPublic",
    "CountriesPublic",
    "State",
    "StateBase",
    "StateCreate",
    "StateUpdate",
    "StatePublic",
    "StatesPublic",
    "StateWithCountryPublic",
    "StatesWithCountryPublic",
    "City",
    "CityBase",
    "CityCreate",
    "CityUpdate",
    "CityPublic",
    "CitiesPublic",
    "CityWithDetailsPublic",
    "CitiesWithDetailsPublic",
    "LocationData",
    "CountrySimple",
    "StateSimple",
    "CitySimple",
    # File upload
    "FileUploadResponse",
    "FileInfoResponse",
    "FileDeleteResponse",
    "PresignedUrlResponse",
    "FileUploadRequest",
]

# No need for model rebuilding since we're using dict types for nested objects
# This avoids forward reference complexity while maintaining functionality
