# CRUD imports
from .crud_user import user
from .crud_company import company_crud, company
from .crud_branch import branch_crud, branch
from .crud_branch_user import branch_user_crud, branch_user
from .crud_department import department_crud, department
from .crud_department_hours import department_hours_crud, department_hours
from .crud_service_type import service_type_crud, service_type
from .crud_service import service_crud, service
from .crud_customer import crud_customer
from .crud_service_request import crud_service_request
from .crud_service_request_timeline import crud_service_request_timeline
from .crud_location import country_crud, state_crud, city_crud

# Legacy function exports for backward compatibility
from .legacy_functions import (
    create_user,
    update_user,
    get_user_by_email,
    authenticate,
    create_company,
    update_company,
    get_company_by_id,
    delete_company,
    create_branch,
    update_branch,
    get_branch_by_id,
    delete_branch,
    assign_user_to_branch,
    remove_user_from_branch,
    get_branch_users,
    get_user_branches,
    get_branch_user_assignment,
    user_has_branch_access,
    get_user_accessible_branches,
)

__all__ = [
    # CRUD classes
    "user",
    "company_crud",
    "company",
    "branch_crud",
    "branch", 
    "branch_user_crud",
    "branch_user",
    "department_crud",
    "department_hours_crud",
    "service_type_crud",
    "service_crud",
    "customer",
    "service_request",
    # Legacy functions
    "create_user",
    "update_user",
    "get_user_by_email",
    "authenticate",
    "create_company",
    "update_company",
    "get_company_by_id",
    "delete_company",
    "create_branch",
    "update_branch",
    "get_branch_by_id",
    "delete_branch",
    "assign_user_to_branch",
    "remove_user_from_branch",
    "get_branch_users",
    "get_user_branches",
    "get_branch_user_assignment",
    "user_has_branch_access",
    "get_user_accessible_branches",
]
