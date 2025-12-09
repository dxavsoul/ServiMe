import uuid
from datetime import datetime
from typing import Optional, List

from sqlmodel import Session, select, func

from app.models import BranchUserLink, BranchUserAssign, BranchUserUpdate, Branch, Company
from .base import CRUDBase


class CRUDBranchUser(CRUDBase[BranchUserLink, BranchUserAssign, BranchUserUpdate]):
    def assign_user_to_branch(
        self,
        session: Session,
        *,
        branch_id: uuid.UUID,
        user_id: uuid.UUID,
        role: str,
        assigned_by: uuid.UUID,
        is_company_owner: bool = False,
        company_role: Optional[str] = None,
        company_access_level: Optional[str] = None
    ) -> BranchUserLink:
        """Assign user to branch or update existing assignment"""
        # Check if assignment already exists
        existing = session.exec(
            select(BranchUserLink).where(
                BranchUserLink.branch_id == branch_id,
                BranchUserLink.user_id == user_id
            )
        ).first()
        
        if existing:
            # Update existing assignment
            existing.role = role
            existing.assigned_by = assigned_by
            existing.assigned_at = datetime.utcnow().isoformat()
            existing.is_company_owner = is_company_owner
            existing.company_role = company_role
            existing.company_access_level = company_access_level
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
        
        # Create new assignment
        assignment = BranchUserLink(
            branch_id=branch_id,
            user_id=user_id,
            role=role,
            assigned_by=assigned_by,
            assigned_at=datetime.utcnow().isoformat(),
            is_company_owner=is_company_owner,
            company_role=company_role,
            company_access_level=company_access_level
        )
        session.add(assignment)
        session.commit()
        session.refresh(assignment)
        return assignment

    def remove_user_from_branch(
        self, session: Session, *, branch_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Remove user from branch"""
        assignment = session.exec(
            select(BranchUserLink).where(
                BranchUserLink.branch_id == branch_id,
                BranchUserLink.user_id == user_id
            )
        ).first()
        
        if assignment:
            session.delete(assignment)
            session.commit()
            return True
        return False

    def get_branch_users(
        self, session: Session, *, branch_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[BranchUserLink], int]:
        """Get all users assigned to a branch"""
        count_statement = (
            select(func.count())
            .select_from(BranchUserLink)
            .where(BranchUserLink.branch_id == branch_id)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(BranchUserLink)
            .where(BranchUserLink.branch_id == branch_id)
            .offset(skip)
            .limit(limit)
        )
        assignments = session.exec(statement).all()
        return list(assignments), count

    def get_user_branches(
        self, session: Session, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[BranchUserLink], int]:
        """Get all branches a user has access to (direct assignments + company ownership)"""
        # Get all accessible branch IDs
        accessible_branch_ids = self.get_user_accessible_branches(session=session, user_id=user_id)
        
        if not accessible_branch_ids:
            return [], 0
        
        # Create virtual assignments for company-owned branches that don't have direct assignments
        all_assignments = []
        
        # Get direct assignments first
        direct_statement = select(BranchUserLink).where(
            BranchUserLink.user_id == user_id,
            BranchUserLink.branch_id.in_(accessible_branch_ids)
        )
        direct_assignments = session.exec(direct_statement).all()
        direct_branch_ids = {assignment.branch_id for assignment in direct_assignments}
        
        # Add direct assignments
        all_assignments.extend(direct_assignments)
        
        # For branches accessible through company ownership but without direct assignment,
        # create virtual assignments
        company_only_branch_ids = set(accessible_branch_ids) - direct_branch_ids
        
        if company_only_branch_ids:
            # Find the company ownership record to get assignment details
            company_ownership_statement = select(BranchUserLink).where(
                BranchUserLink.user_id == user_id,
                BranchUserLink.is_company_owner == True
            ).limit(1)
            company_ownership = session.exec(company_ownership_statement).first()
            
            # Create virtual assignments for company-owned branches
            for branch_id in company_only_branch_ids:
                virtual_assignment = BranchUserLink(
                    user_id=user_id,
                    branch_id=branch_id,
                    role="owner" if company_ownership else "employee",  # Company owners get owner role
                    assigned_by=company_ownership.assigned_by if company_ownership else user_id,
                    assigned_at=company_ownership.assigned_at if company_ownership else datetime.utcnow().isoformat(),
                    is_company_owner=True,
                    company_role=company_ownership.company_role if company_ownership else "owner",
                    company_access_level=company_ownership.company_access_level if company_ownership else "all_branches"
                )
                all_assignments.append(virtual_assignment)
        
        # Apply pagination
        total_count = len(all_assignments)
        paginated_assignments = all_assignments[skip:skip + limit]
        
        return paginated_assignments, total_count

    def get_assignment(
        self, session: Session, *, branch_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[BranchUserLink]:
        """Get specific branch-user assignment"""
        return session.exec(
            select(BranchUserLink).where(
                BranchUserLink.branch_id == branch_id,
                BranchUserLink.user_id == user_id
            )
        ).first()

    def check_branch_access(
        self, session: Session, *, user_id: uuid.UUID, branch_id: uuid.UUID
    ) -> bool:
        """Check if user has access to branch - alias for user_has_branch_access"""
        return self.user_has_branch_access(session=session, user_id=user_id, branch_id=branch_id)

    def user_has_branch_access(
        self, session: Session, *, user_id: uuid.UUID, branch_id: uuid.UUID
    ) -> bool:
        """Check if user has access to branch (direct assignment or company ownership)"""
        # First check direct branch assignment
        assignment = self.get_assignment(session=session, branch_id=branch_id, user_id=user_id)
        if assignment is not None:
            return True
        
        # Check if user has company-level access to this branch
        return self.user_has_company_level_access(session=session, user_id=user_id, branch_id=branch_id)

    def user_has_company_level_access(
        self, session: Session, *, user_id: uuid.UUID, branch_id: uuid.UUID
    ) -> bool:
        """Check if user has company-level access to a specific branch"""
        # Get the branch to find its company
        branch = session.get(Branch, branch_id)
        if not branch:
            return False
        
        # Check if user has company ownership or high-level access for this company
        company_access_statement = select(BranchUserLink).where(
            BranchUserLink.user_id == user_id,
            BranchUserLink.is_company_owner == True
        ).join(Branch).where(Branch.company_id == branch.company_id)
        
        company_access = session.exec(company_access_statement).first()
        if company_access:
            # User has company ownership - check access level
            if company_access.company_access_level in ["all_branches", None]:  # None defaults to all branches
                return True
        
        return False

    def get_user_company_access_info(
        self, session: Session, *, user_id: uuid.UUID, company_id: uuid.UUID
    ) -> Optional[BranchUserLink]:
        """Get user's company-level access information for a specific company"""
        statement = select(BranchUserLink).where(
            BranchUserLink.user_id == user_id,
            BranchUserLink.is_company_owner == True
        ).join(Branch).where(Branch.company_id == company_id)
        
        return session.exec(statement).first()

    def get_user_accessible_branches(self, session: Session, *, user_id: uuid.UUID) -> list[uuid.UUID]:
        """Get list of branch IDs that a user has access to (direct + company-level)"""
        # Get direct branch assignments
        direct_statement = select(BranchUserLink.branch_id).where(BranchUserLink.user_id == user_id)
        direct_branch_ids = set(session.exec(direct_statement).all())
        
        # Get branches from company-level access
        company_level_branches = self.get_user_company_accessible_branches(session=session, user_id=user_id)
        
        # Combine both sets
        all_accessible_branches = direct_branch_ids.union(set(company_level_branches))
        return list(all_accessible_branches)

    def get_user_company_accessible_branches(self, session: Session, *, user_id: uuid.UUID) -> list[uuid.UUID]:
        """Get branch IDs that user can access through company-level permissions"""
        # Find companies where user has ownership access
        company_access_statement = select(BranchUserLink).where(
            BranchUserLink.user_id == user_id,
            BranchUserLink.is_company_owner == True
        )
        
        company_accesses = session.exec(company_access_statement).all()
        accessible_branches = []
        
        for access in company_accesses:
            if access.company_access_level in ["all_branches", None]:  # None defaults to all branches
                # Get the company ID from the branch
                branch = session.get(Branch, access.branch_id)
                if branch:
                    # Get ALL branches for this company (including future ones)
                    company_branches_statement = select(Branch.id).where(Branch.company_id == branch.company_id)
                    company_branch_ids = session.exec(company_branches_statement).all()
                    accessible_branches.extend(company_branch_ids)
        
        return list(set(accessible_branches))  # Remove duplicates

    def get_users_by_role(
        self, session: Session, *, branch_id: uuid.UUID, role: str, skip: int = 0, limit: int = 100
    ) -> tuple[list[BranchUserLink], int]:
        """Get users in a branch with a specific role"""
        count_statement = (
            select(func.count())
            .select_from(BranchUserLink)
            .where(BranchUserLink.branch_id == branch_id, BranchUserLink.role == role)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(BranchUserLink)
            .where(BranchUserLink.branch_id == branch_id, BranchUserLink.role == role)
            .offset(skip)
            .limit(limit)
        )
        assignments = session.exec(statement).all()
        return list(assignments), count

    def assign_company_owner(
        self,
        session: Session,
        *,
        company_id: uuid.UUID,
        user_id: uuid.UUID,
        company_role: str = "owner",
        company_access_level: str = "all_branches",
        assigned_by: uuid.UUID
    ) -> BranchUserLink:
        """Assign user as company owner to any branch of the company (or create a company-level record)"""
        # Find a branch from this company to create the assignment
        # We need at least one branch to create a BranchUserLink record
        branch_statement = select(Branch).where(Branch.company_id == company_id).limit(1)
        branch = session.exec(branch_statement).first()
        
        if not branch:
            raise ValueError(f"No branches found for company {company_id}. Cannot assign company owner.")
        
        # Create or update assignment with company ownership
        assignment = self.assign_user_to_branch(
            session=session,
            branch_id=branch.id,
            user_id=user_id,
            role="owner",  # Branch role for company owners
            assigned_by=assigned_by,
            is_company_owner=True,
            company_role=company_role,
            company_access_level=company_access_level
        )
        
        # Auto-assign the company owner to all existing branches in the company
        if company_access_level in ["all_branches", None]:
            self._assign_owner_to_all_company_branches(
                session=session,
                company_id=company_id,
                user_id=user_id,
                assigned_by=assigned_by,
                company_role=company_role,
                company_access_level=company_access_level
            )
        
        return assignment

    def _assign_owner_to_all_company_branches(
        self,
        session: Session,
        *,
        company_id: uuid.UUID,
        user_id: uuid.UUID,
        assigned_by: uuid.UUID,
        company_role: str,
        company_access_level: str
    ) -> None:
        """Assign a company owner to all existing branches in the company"""
        # Get all branches for this company
        all_branches_statement = select(Branch).where(Branch.company_id == company_id)
        all_branches = session.exec(all_branches_statement).all()
        
        for branch in all_branches:
            # Check if assignment already exists
            existing_assignment = self.get_assignment(
                session=session,
                branch_id=branch.id,
                user_id=user_id
            )
            
            if not existing_assignment:
                # Create new assignment
                self.assign_user_to_branch(
                    session=session,
                    branch_id=branch.id,
                    user_id=user_id,
                    role="owner",
                    assigned_by=assigned_by,
                    is_company_owner=True,
                    company_role=company_role,
                    company_access_level=company_access_level
                )
            elif not existing_assignment.is_company_owner:
                # Update existing assignment to include company ownership
                existing_assignment.is_company_owner = True
                existing_assignment.company_role = company_role
                existing_assignment.company_access_level = company_access_level
                existing_assignment.role = "owner"  # Upgrade to owner role
                session.add(existing_assignment)
        
        session.commit()

    def remove_company_ownership(
        self, session: Session, *, company_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Remove company ownership from user"""
        # Find all company ownership records for this user in this company
        statement = select(BranchUserLink).where(
            BranchUserLink.user_id == user_id,
            BranchUserLink.is_company_owner == True
        ).join(Branch).where(Branch.company_id == company_id)
        
        ownership_records = session.exec(statement).all()
        
        if ownership_records:
            for record in ownership_records:
                # Reset company ownership fields but keep branch assignment if it exists
                record.is_company_owner = False
                record.company_role = None
                record.company_access_level = None
                session.add(record)
            
            session.commit()
            return True
        return False

    def get_company_owners(
        self, session: Session, *, company_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> tuple[list[BranchUserLink], int]:
        """Get all company owners for a specific company"""
        count_statement = (
            select(func.count())
            .select_from(BranchUserLink)
            .join(Branch)
            .where(
                Branch.company_id == company_id,
                BranchUserLink.is_company_owner == True
            )
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(BranchUserLink)
            .join(Branch)
            .where(
                Branch.company_id == company_id,
                BranchUserLink.is_company_owner == True
            )
            .offset(skip)
            .limit(limit)
        )
        owners = session.exec(statement).all()
        return list(owners), count


branch_user_crud = CRUDBranchUser(BranchUserLink)
branch_user = branch_user_crud  # Alias for backward compatibility
