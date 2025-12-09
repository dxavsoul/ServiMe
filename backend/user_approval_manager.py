"""
Administrative utilities for managing user approvals and access control.

This module provides a comprehensive manager class for administrators to handle
user approval workflows, branch assignments, and access control operations.

Author: IntelliWorkshop Team
Created: 2025
"""

from sqlmodel import Session, select
from typing import List, Optional, Dict, Union
import uuid
from datetime import datetime

from app.core.db import engine
from app.models import User, BranchUserLink, Branch, Company
from app.crud.crud_user import user as user_crud


class UserApprovalManager:
    """
    Manager class for handling user approval and assignment operations.

    This class provides methods to:
    - Retrieve pending users awaiting approval
    - Get detailed user assignment information
    - Assign users to branches with proper validation
    - Remove user assignments when needed

    Attributes:
        session (Session): Database session for operations
    """

    def __init__(self, session: Session) -> None:
        """
        Initialize the UserApprovalManager with a database session.

        Args:
            session (Session): SQLModel database session
        """
        self.session = session
    
    def get_pending_users(self) -> List[User]:
        """
        Get all users who are pending approval (not assigned to any branch).

        Returns:
            List[User]: List of users awaiting approval
        """
        pending_users = []
        users = self.session.exec(
            select(User).where(User.is_superuser == False)
        ).all()

        for user in users:
            if user_crud.is_pending_approval(self.session, user):
                pending_users.append(user)
        
        return pending_users
    
    def get_user_assignments(self, user_id: uuid.UUID) -> Dict[str, Union[str, bool, List[Dict]]]:
        """
        Get detailed assignment information for a specific user.

        Args:
            user_id (uuid.UUID): The ID of the user to query

        Returns:
            Dict: User assignment details including branches and companies,
                 or error message if user not found
        """
        user = self.session.get(User, user_id)
        if not user:
            return {"error": "User not found"}
        
        assigned_companies = user_crud.get_user_assigned_companies(self.session, user_id)
        assigned_branches = user_crud.get_user_assigned_branches(self.session, user_id)
        
        # Get detailed branch and company information
        branch_details = []
        company_details = []
        
        for branch_id in assigned_branches:
            branch = self.session.get(Branch, branch_id)
            if branch:
                company = self.session.get(Company, branch.company_id)
                branch_details.append({
                    "branch_id": str(branch_id),
                    "branch_name": branch.name,
                    "company_id": str(branch.company_id),
                    "company_name": company.name if company else "Unknown"
                })
        
        for company_id in assigned_companies:
            company = self.session.get(Company, company_id)
            if company:
                company_details.append({
                    "company_id": str(company_id),
                    "company_name": company.name
                })
        
        return {
            "user_id": str(user_id),
            "user_email": user.email,
            "is_superuser": user.is_superuser,
            "is_pending": user_crud.is_pending_approval(self.session, user),
            "assigned_companies": company_details,
            "assigned_branches": branch_details
        }
    
    def assign_user_to_branch(
        self, 
        user_id: uuid.UUID, 
        branch_id: uuid.UUID, 
        role: str = "employee",
        assigned_by: Optional[uuid.UUID] = None
    ) -> Dict[str, Union[bool, str]]:
        """
        Assign a user to a branch with proper validation.

        Args:
            user_id (uuid.UUID): ID of the user to assign
            branch_id (uuid.UUID): ID of the branch to assign to
            role (str, optional): Role for the assignment. Defaults to "employee"
            assigned_by (uuid.UUID, optional): ID of the admin making the assignment

        Returns:
            Dict: Success status and message or error details
        """
        try:
            # Validate user exists
            user = self.session.get(User, user_id)
            if not user:
                return {"success": False, "error": "User not found"}
            
            # Validate branch exists
            branch = self.session.get(Branch, branch_id)
            if not branch:
                return {"success": False, "error": "Branch not found"}
            
            # Check for existing assignment
            existing = self.session.exec(
                select(BranchUserLink)
                .where(BranchUserLink.user_id == user_id)
                .where(BranchUserLink.branch_id == branch_id)
            ).first()
            
            if existing:
                return {
                    "success": False,
                    "error": f"User {user.email} is already assigned to branch {branch.name}"
                }

            # Create new assignment
            new_assignment = BranchUserLink(
                user_id=user_id,
                branch_id=branch_id,
                role=role,
                assigned_by=assigned_by,
                created_at=datetime.utcnow()
            )
            
            self.session.add(new_assignment)
            self.session.commit()
            
            return {
                "success": True,
                "message": f"Successfully assigned {user.email} to {branch.name} as {role}"
            }
            
        except Exception as e:
            self.session.rollback()
            return {"success": False, "error": f"Database error: {str(e)}"}

    def remove_user_from_branch(
        self,
        user_id: uuid.UUID,
        branch_id: uuid.UUID
    ) -> Dict[str, Union[bool, str]]:
        """
        Remove a user's assignment from a specific branch.

        Args:
            user_id (uuid.UUID): ID of the user
            branch_id (uuid.UUID): ID of the branch

        Returns:
            Dict: Success status and message or error details
        """
        try:
            assignment = self.session.exec(
                select(BranchUserLink)
                .where(BranchUserLink.user_id == user_id)
                .where(BranchUserLink.branch_id == branch_id)
            ).first()
            
            if not assignment:
                return {"success": False, "error": "Assignment not found"}
            
            self.session.delete(assignment)
            self.session.commit()
            
            return {"success": True, "message": "User assignment removed successfully"}

        except Exception as e:
            self.session.rollback()
            return {"success": False, "error": f"Database error: {str(e)}"}


def create_approval_manager() -> UserApprovalManager:
    """
    Factory function to create a UserApprovalManager with a fresh database session.

    Returns:
        UserApprovalManager: Configured manager instance
    """
    with Session(engine) as session:
        return UserApprovalManager(session)


# Usage example for administrators:
if __name__ == "__main__":
    # Example usage - uncomment to use interactively
    # manager = create_approval_manager()
    # pending = manager.get_pending_users()
    # print(f"Found {len(pending)} pending users")
    pass
