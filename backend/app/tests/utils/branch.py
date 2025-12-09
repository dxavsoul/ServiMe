import uuid
from sqlmodel import Session

from app.crud import create_branch
from app.models import Branch, BranchCreate
from app.tests.utils.utils import random_email, random_lower_string


def create_random_branch(
    db: Session, 
    *, 
    company_id: uuid.UUID | None = None,
    created_by: uuid.UUID | None = None
) -> Branch:
    if company_id is None:
        from app.tests.utils.company import create_random_company
        company = create_random_company(db)
        company_id = company.id
    
    if created_by is None:
        from app.tests.utils.user import create_random_user
        user = create_random_user(db)
        created_by = user.id
    
    name = f"Branch {random_lower_string()}"
    code = random_lower_string()[:10].upper()
    address = f"{random_lower_string()} Street"
    city = random_lower_string()
    state = random_lower_string()
    country = random_lower_string()
    postal_code = random_lower_string()[:10]
    phone = f"+1{random_lower_string()[:10]}"
    email = random_email()
    manager_name = f"{random_lower_string()} {random_lower_string()}"
    
    branch_in = BranchCreate(
        name=name,
        code=code,
        address=address,
        city=city,
        state=state,
        country=country,
        postal_code=postal_code,
        phone=phone,
        email=email,
        manager_name=manager_name,
        company_id=company_id,
    )
    return create_branch(session=db, branch_in=branch_in, created_by=created_by)
