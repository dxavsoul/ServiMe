import uuid
from typing import Optional, List

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import User, UserCreate, UserUpdate
from .base import CRUDBase


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, session: Session, *, email: str) -> Optional[User]:
        """Get user by email address"""
        statement = select(User).where(User.email == email)
        return session.exec(statement).first()

    def create(self, session: Session, *, obj_in: UserCreate) -> User:
        """Create user with hashed password"""
        create_data = obj_in.model_dump()
        create_data["hashed_password"] = get_password_hash(obj_in.password)
        del create_data["password"]
        
        # Create User object without trying to initialize relationship fields
        db_obj = User(**create_data)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    def update(self, session: Session, *, db_obj: User, obj_in: UserUpdate) -> User:
        """Update user with password hashing if needed"""
        update_data = obj_in.model_dump(exclude_unset=True)
        extra_data = {}
        
        if "password" in update_data:
            password = update_data["password"]
            extra_data["hashed_password"] = get_password_hash(password)
            del update_data["password"]
        
        db_obj.sqlmodel_update(update_data, update=extra_data)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    def authenticate(self, session: Session, *, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = self.get_by_email(session, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        """Check if user is active"""
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        """Check if user is superuser"""
        return user.is_superuser

    def get_user_assigned_companies(self, session: Session, user_id: uuid.UUID) -> List[uuid.UUID]:
        """Get list of company IDs that the user is assigned to through branches"""
        from app.models.branch_user import BranchUserLink
        from app.models.branch import Branch
        
        statement = (
            select(Branch.company_id)
            .select_from(BranchUserLink)
            .join(Branch, BranchUserLink.branch_id == Branch.id)
            .where(BranchUserLink.user_id == user_id)
            .distinct()
        )
        result = session.exec(statement).all()
        return list(result)

    def get_user_assigned_branches(self, session: Session, user_id: uuid.UUID) -> List[uuid.UUID]:
        """Get list of branch IDs that the user is assigned to"""
        from app.models.branch_user import BranchUserLink
        
        statement = select(BranchUserLink.branch_id).where(BranchUserLink.user_id == user_id)
        result = session.exec(statement).all()
        return list(result)

    def has_company_access(self, session: Session, user: User, company_id: uuid.UUID) -> bool:
        """Check if user has access to a specific company"""
        if self.is_superuser(user):
            return True
        
        assigned_companies = self.get_user_assigned_companies(session, user.id)
        return company_id in assigned_companies

    def has_branch_access(self, session: Session, user: User, branch_id: uuid.UUID) -> bool:
        """Check if user has access to a specific branch"""
        if self.is_superuser(user):
            return True
        
        assigned_branches = self.get_user_assigned_branches(session, user.id)
        return branch_id in assigned_branches

    def is_pending_approval(self, session: Session, user: User) -> bool:
        """Check if user is pending approval (not assigned to any branch and not superuser)"""
        if self.is_superuser(user):
            return False
        
        assigned_branches = self.get_user_assigned_branches(session, user.id)
        return len(assigned_branches) == 0


user = CRUDUser(User)
