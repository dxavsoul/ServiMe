import uuid
from typing import List
from datetime import datetime, UTC

from sqlmodel import Session, select, func

from app.models import Company, CompanyCreate, CompanyUpdate, User, Branch, BranchUserLink
from app.models.company import CompanyRegistrationRequest, CompanyRegistrationResponse, CompanyRegistrationStatus
from app.models.user import UserCreate
from app.core.security import get_password_hash
from .base import CRUDBase


class CRUDCompany(CRUDBase[Company, CompanyCreate, CompanyUpdate]):
    def create_with_owner(
        self, session: Session, *, obj_in: CompanyCreate, created_by: uuid.UUID
    ) -> Company:
        """Create company with owner"""
        return self.create(session=session, obj_in=obj_in, created_by=created_by)

    def get_by_owner(
        self, session: Session, *, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Company], int]:
        """Get companies created by a specific user"""
        count_statement = (
            select(func.count())
            .select_from(Company)
            .where(Company.created_by == owner_id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Company)
            .where(Company.created_by == owner_id)
            .offset(skip)
            .limit(limit)
        )
        companies = session.exec(statement).all()
        return list(companies), count

    def get_active(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[Company], int]:
        """Get only active companies"""
        count_statement = (
            select(func.count())
            .select_from(Company)
            .where(Company.is_active == True)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Company)
            .where(Company.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        companies = session.exec(statement).all()
        return list(companies), count

    def get_accessible_companies(
        self, session: Session, *, user: User, skip: int = 0, limit: int = 100
    ) -> tuple[List[Company], int]:
        """Get companies accessible to the user (all for superuser, assigned ones for regular users)"""

        if user.is_superuser:
            # Superuser can see all companies
            return self.get_multi(session, skip=skip, limit=limit)
        
        # Regular user can only see companies they are assigned to through branches
        # Get user's assigned company IDs through branch assignments
        branch_links = session.exec(
            select(BranchUserLink.branch_id).where(BranchUserLink.user_id == user.id)
        ).all()

        if not branch_links:
            return [], 0

        # Get company IDs from branches
        branch_ids = [link for link in branch_links]
        company_ids_query = session.exec(
            select(Branch.company_id).where(Branch.id.in_(branch_ids))
        ).all()
        assigned_company_ids = list(company_ids_query)

        if not assigned_company_ids:
            # User has no assigned companies
            return [], 0
        
        count_statement = (
            select(func.count())
            .select_from(Company)
            .where(Company.id.in_(assigned_company_ids))
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Company)
            .where(Company.id.in_(assigned_company_ids))
            .offset(skip)
            .limit(limit)
        )
        companies = session.exec(statement).all()
        return list(companies), count

    def can_access_company(self, session: Session, *, user: User, company_id: uuid.UUID) -> bool:
        """Check if user can access a specific company"""
        if user.is_superuser:
            return True

        # Check if user is assigned to any branch of this company
        branch_link = session.exec(
            select(BranchUserLink)
            .join(Branch, BranchUserLink.branch_id == Branch.id)
            .where(
                BranchUserLink.user_id == user.id,
                Branch.company_id == company_id
            )
        ).first()

        return branch_link is not None

    def register_company_with_admin(
        self, session: Session, *, registration_data: CompanyRegistrationRequest
    ) -> CompanyRegistrationResponse:
        """
        Register a new company with an admin user and main branch.
        This creates all entities in a single transaction and sets the user status to pending review.
        """
        try:
            # 1. Create the admin user first
            hashed_password = get_password_hash(registration_data.admin_user.password)

            db_user = User(
                email=registration_data.admin_user.email,
                full_name=registration_data.admin_user.full_name,
                hashed_password=hashed_password,
                is_active=True,
                is_company_admin=True,
                company_registration_status=CompanyRegistrationStatus.PENDING_REVIEW
            )
            session.add(db_user)
            session.flush()  # Get the user ID

            # 2. Create the company
            db_company = Company(
                **registration_data.company.model_dump(),
                created_by=db_user.id
            )
            session.add(db_company)
            session.flush()  # Get the company ID

            # 3. Create the main branch
            db_branch = Branch(
                **registration_data.main_branch.model_dump(),
                company_id=db_company.id,
                created_by=db_user.id
            )
            session.add(db_branch)
            session.flush()  # Get the branch ID

            # 4. Assign the user to the branch as company owner
            branch_user_link = BranchUserLink(
                branch_id=db_branch.id,
                user_id=db_user.id,
                role="company_admin",
                assigned_by=db_user.id,
                assigned_at=datetime.now(UTC).isoformat(),
                is_company_owner=True,
                company_role="owner",
                company_access_level="all_branches"
            )
            session.add(branch_user_link)

            session.commit()

            return CompanyRegistrationResponse(
                company_id=db_company.id,
                user_id=db_user.id,
                branch_id=db_branch.id,
                registration_status=CompanyRegistrationStatus.PENDING_REVIEW,
                message="Company registration submitted successfully. Your registration is pending review by a system administrator.",
                next_steps="Please wait for approval. You will receive an email notification once your company has been reviewed and approved."
            )

        except Exception as e:
            session.rollback()
            raise e

    def approve_company_registration(
        self, session: Session, *, company_id: uuid.UUID, approved_by: uuid.UUID
    ) -> bool:
        """
        Approve a company registration by updating the user's status.
        """
        # Get the company and its creator
        company = self.get(session=session, id=company_id)
        if not company:
            return False

        # Get the company creator (admin user)
        admin_user = session.get(User, company.created_by)
        if not admin_user:
            return False

        # Update user status to approved
        admin_user.company_registration_status = CompanyRegistrationStatus.APPROVED
        admin_user.approved_by = approved_by
        admin_user.approved_at = datetime.now(UTC).isoformat()

        session.add(admin_user)
        session.commit()

        return True

    def reject_company_registration(
        self, session: Session, *, company_id: uuid.UUID, rejected_by: uuid.UUID
    ) -> bool:
        """
        Reject a company registration by updating the user's status.
        """
        # Get the company and its creator
        company = self.get(session=session, id=company_id)
        if not company:
            return False

        # Get the company creator (admin user)
        admin_user = session.get(User, company.created_by)
        if not admin_user:
            return False

        # Update user status to rejected
        admin_user.company_registration_status = CompanyRegistrationStatus.REJECTED
        admin_user.approved_by = rejected_by
        admin_user.approved_at = datetime.now(UTC).isoformat()
        admin_user.is_active = False  # Deactivate the user

        session.add(admin_user)
        session.commit()

        return True

    def get_pending_registrations(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[List[dict], int]:
        """
        Get companies with pending registration status.
        """
        # Query for companies where the creator has pending registration status
        statement = (
            select(Company, User)
            .join(User, Company.created_by == User.id)
            .where(User.company_registration_status == CompanyRegistrationStatus.PENDING_REVIEW)
            .offset(skip)
            .limit(limit)
        )

        results = session.exec(statement).all()

        # Count total pending registrations
        count_statement = (
            select(func.count())
            .select_from(Company)
            .join(User, Company.created_by == User.id)
            .where(User.company_registration_status == CompanyRegistrationStatus.PENDING_REVIEW)
        )
        count = session.exec(count_statement).one()

        # Format results
        pending_registrations = []
        for company, user in results:
            pending_registrations.append({
                "company_id": company.id,
                "company_name": company.name,
                "company_email": company.email,
                "company_industry": company.industry,
                "admin_user_id": user.id,
                "admin_user_email": user.email,
                "admin_user_name": user.full_name,
                "registration_status": user.company_registration_status,
                "created_at": str(company.id)  # You might want to add a created_at field to Company model
            })

        return pending_registrations, count

    def get_by_industry_type(
        self, session: Session, *, industry_type_id: uuid.UUID
    ) -> List[Company]:
        """Get companies by industry type ID"""
        statement = select(Company).where(Company.industry_type_id == industry_type_id)
        return list(session.exec(statement).all())

company_crud = CRUDCompany(Company)
company = company_crud  # Alias for backward compatibility
