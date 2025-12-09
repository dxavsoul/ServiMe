import uuid
from typing import Optional, List

from sqlmodel import Session, select, func

from app.models import Branch, BranchCreate, BranchUpdate, Company, City, User
from .base import CRUDBase


class CRUDBranch(CRUDBase[Branch, BranchCreate, BranchUpdate]):
    def create_with_owner(
        self, session: Session, *, obj_in: BranchCreate, created_by: uuid.UUID
    ) -> Branch:
        """Create branch with owner and auto-assign company owners"""
        branch = self.create(session=session, obj_in=obj_in, created_by=created_by)
        
        # Auto-assign existing company owners to this new branch
        self._auto_assign_company_owners(session=session, branch=branch, created_by=created_by)
        
        return branch

    def _auto_assign_company_owners(self, session: Session, *, branch: Branch, created_by: uuid.UUID) -> None:
        """Automatically assign existing company owners to a new branch"""
        from app.crud.crud_branch_user import branch_user_crud
        
        # Find all company owners for this company
        company_owners, _ = branch_user_crud.get_company_owners(
            session=session, 
            company_id=branch.company_id,
            skip=0,
            limit=1000  # Get all company owners
        )
        
        # Assign each company owner to the new branch
        for owner_link in company_owners:
            # Check if the owner is already assigned to this specific branch
            existing_assignment = branch_user_crud.get_assignment(
                session=session,
                branch_id=branch.id,
                user_id=owner_link.user_id
            )
            
            # Only create assignment if one doesn't exist
            if not existing_assignment:
                branch_user_crud.assign_user_to_branch(
                    session=session,
                    branch_id=branch.id,
                    user_id=owner_link.user_id,
                    role="owner",  # Company owners get owner role on branches
                    assigned_by=created_by,
                    is_company_owner=True,
                    company_role=owner_link.company_role,
                    company_access_level=owner_link.company_access_level
                )

    def get_by_company(
        self, session: Session, *, company_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> list[Branch]:
        """Get branches for a specific company - simplified version"""
        statement = (
            select(Branch)
            .where(Branch.company_id == company_id)
            .offset(skip)
            .limit(limit)
        )
        return session.exec(statement).all()

    def get_by_company_with_count(
        self, session: Session, *, company_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Branch], int]:
        """Get branches for a specific company with count"""
        count_statement = (
            select(func.count())
            .select_from(Branch)
            .where(Branch.company_id == company_id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Branch)
            .where(Branch.company_id == company_id)
            .offset(skip)
            .limit(limit)
        )
        branches = session.exec(statement).all()
        return list(branches), count

    def get_by_owner(
        self, session: Session, *, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Branch], int]:
        """Get branches created by a specific user"""
        count_statement = (
            select(func.count())
            .select_from(Branch)
            .where(Branch.created_by == owner_id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Branch)
            .where(Branch.created_by == owner_id)
            .offset(skip)
            .limit(limit)
        )
        branches = session.exec(statement).all()
        return list(branches), count

    def get_accessible_by_user(
        self, session: Session, *, accessible_branch_ids: list[uuid.UUID], skip: int = 0, limit: int = 100
    ) -> tuple[list[Branch], int]:
        """Get branches that a user has access to"""
        if not accessible_branch_ids:
            return [], 0
            
        count_statement = (
            select(func.count())
            .select_from(Branch)
            .where(Branch.id.in_(accessible_branch_ids))
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Branch)
            .where(Branch.id.in_(accessible_branch_ids))
            .offset(skip)
            .limit(limit)
        )
        branches = session.exec(statement).all()
        return list(branches), count

    def get_active(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[Branch], int]:
        """Get only active branches"""
        count_statement = (
            select(func.count())
            .select_from(Branch)
            .where(Branch.is_active == True)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Branch)
            .where(Branch.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        branches = session.exec(statement).all()
        return list(branches), count

    def get_with_company_info(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[tuple[Branch, str]], int]:
        """Get branches with company name for superusers"""
        count_statement = (
            select(func.count())
            .select_from(Branch)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Branch, Company.name)
            .join(Company, Branch.company_id == Company.id)
            .offset(skip)
            .limit(limit)
        )
        results = session.exec(statement).all()
        return list(results), count

    def get_accessible_with_company_info(
        self, session: Session, *, accessible_branch_ids: list[uuid.UUID], user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[tuple[Branch, str]], int]:
        """Get accessible branches with company name for regular users"""
        if not accessible_branch_ids:
            return [], 0
            
        count_statement = (
            select(func.count())
            .select_from(Branch)
            .where((Branch.id.in_(accessible_branch_ids)) | (Branch.created_by == user_id))
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Branch, Company.name)
            .join(Company, Branch.company_id == Company.id)
            .where((Branch.id.in_(accessible_branch_ids)) | (Branch.created_by == user_id))
            .offset(skip)
            .limit(limit)
        )
        results = session.exec(statement).all()
        return list(results), count

    def get_with_location_info(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[Branch], int]:
        """Get branches with location information for superusers"""
        count_statement = (
            select(func.count())
            .select_from(Branch)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Branch)
            .options()  # SQLModel will handle the relationship loading
            .offset(skip)
            .limit(limit)
        )
        branches = session.exec(statement).all()
        return list(branches), count

    def get_accessible_with_location_info(
        self, session: Session, *, accessible_branch_ids: list[uuid.UUID], user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[Branch], int]:
        """Get accessible branches with location information for regular users"""
        if not accessible_branch_ids:
            return [], 0
            
        count_statement = (
            select(func.count())
            .select_from(Branch)
            .where((Branch.id.in_(accessible_branch_ids)) | (Branch.created_by == user_id))
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Branch)
            .where((Branch.id.in_(accessible_branch_ids)) | (Branch.created_by == user_id))
            .offset(skip)
            .limit(limit)
        )
        branches = session.exec(statement).all()
        return list(branches), count

    def get_with_full_details(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[tuple[Branch, str]], int]:
        """Get branches with both company and location information for superusers"""
        count_statement = (
            select(func.count())
            .select_from(Branch)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Branch, Company.name)
            .join(Company, Branch.company_id == Company.id)
            .offset(skip)
            .limit(limit)
        )
        results = session.exec(statement).all()
        return list(results), count

    def get_accessible_branches(
        self, session: Session, *, user: User, skip: int = 0, limit: int = 100
    ) -> tuple[List[Branch], int]:
        """Get branches accessible to the user (all for superuser, assigned ones for regular users)"""
        from app.crud.crud_user import user as user_crud
        
        if user_crud.is_superuser(user):
            # Superuser can see all branches
            return self.get_multi(session, skip=skip, limit=limit)
        
        # Regular user can only see branches they are assigned to
        assigned_branch_ids = user_crud.get_user_assigned_branches(session, user.id)
        return self.get_accessible_by_user(session, accessible_branch_ids=assigned_branch_ids, skip=skip, limit=limit)

    def get_accessible_branches_by_company(
        self, session: Session, *, user: User, company_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[List[Branch], int]:
        """Get branches accessible to the user for a specific company"""
        from app.crud.crud_user import user as user_crud
        
        # First check if user has access to the company
        if not user_crud.has_company_access(session, user, company_id):
            return [], 0
        
        if user_crud.is_superuser(user):
            # Superuser can see all branches for the company
            return self.get_by_company_with_count(session, company_id=company_id, skip=skip, limit=limit)
        
        # Regular user can only see branches they are assigned to within the company
        assigned_branch_ids = user_crud.get_user_assigned_branches(session, user.id)
        
        if not assigned_branch_ids:
            return [], 0
        
        count_statement = (
            select(func.count())
            .select_from(Branch)
            .where(Branch.company_id == company_id)
            .where(Branch.id.in_(assigned_branch_ids))
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Branch)
            .where(Branch.company_id == company_id)
            .where(Branch.id.in_(assigned_branch_ids))
            .offset(skip)
            .limit(limit)
        )
        branches = session.exec(statement).all()
        return list(branches), count

    def can_access_branch(self, session: Session, *, user: User, branch_id: uuid.UUID) -> bool:
        """Check if user can access a specific branch"""
        from app.crud.crud_user import user as user_crud
        return user_crud.has_branch_access(session, user, branch_id)


branch_crud = CRUDBranch(Branch)
branch = branch_crud  # Alias for backward compatibility
