from fastapi import APIRouter

from app.api.routes import (
    branch_users, 
    branches, 
    companies, 
    login, 
    private, 
    users, 
    utils,
    departments,
    department_hours,
    service_types,
    services,
    customer_auth,
    customers,
    customer_service_requests,
    company_service_requests,
    admin_service_requests,
    service_request_actions,
    mobile,
    locations,
    mobile_locations,
    files,
    company_management,
    messaging,
    industry_types,
    categories
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(companies.router)
api_router.include_router(branches.router)
api_router.include_router(branch_users.router)
api_router.include_router(company_management.router)
api_router.include_router(departments.router)
api_router.include_router(department_hours.router)
api_router.include_router(service_types.router)
api_router.include_router(services.router)
api_router.include_router(industry_types.router)
api_router.include_router(categories.router)
api_router.include_router(customer_auth.router)
api_router.include_router(customers.router)
api_router.include_router(customer_service_requests.router)
api_router.include_router(company_service_requests.router, prefix="/company")
api_router.include_router(admin_service_requests.router, prefix="/admin")
api_router.include_router(service_request_actions.router, prefix="/branch")
api_router.include_router(mobile.router)
api_router.include_router(mobile_locations.router)
api_router.include_router(locations.router)
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(messaging.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
