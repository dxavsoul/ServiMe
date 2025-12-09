import uuid
from sqlmodel import Session

from app.crud import create_company
from app.models import Company, CompanyCreate
from app.tests.utils.utils import random_email, random_lower_string


def create_random_company(db: Session, *, created_by: uuid.UUID | None = None) -> Company:
    if created_by is None:
        from app.tests.utils.user import create_random_user
        user = create_random_user(db)
        created_by = user.id
    
    name = random_lower_string()
    description = random_lower_string()
    industry = random_lower_string()
    website = f"https://{random_lower_string()}.com"
    email = random_email()
    phone = f"+1{random_lower_string()[:10]}"
    address = f"{random_lower_string()} Street"
    city = random_lower_string()
    country = random_lower_string()
    
    company_in = CompanyCreate(
        name=name,
        description=description,
        industry=industry,
        website=website,
        email=email,
        phone=phone,
        address=address,
        city=city,
        country=country,
    )
    return create_company(session=db, company_in=company_in, created_by=created_by)
