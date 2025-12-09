import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.crud.crud_user import user as user_crud
from app.crud.crud_company import company_crud
from app.crud.crud_branch import branch_crud
from app.crud.crud_branch_user import branch_user_crud
from app.models import (
    BranchUserAssign,
    BranchUserPublic,
    BranchUsersPublic,
    BranchUserUpdate,
    Message,
    User,
    UserBranchPublic,
    UserBranchesPublic,
    UserPublic,
)

router = APIRouter(prefix="/branch-users", tags=["branch-users"])


@router.post("/{branch_id}/assign", response_model=BranchUserPublic)
def assign_user_to_branch_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    branch_id: uuid.UUID,
    assignment: BranchUserAssign,
) -> Any:
    """
    Assign a user to a branch.
    """
    try:
        # Verify branch exists
        branch = branch_crud.get(session=session, id=branch_id)
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")
        
        # Check permissions - user must be superuser, branch creator, or company owner
        company = company_crud.get(session=session, id=branch.company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        if not (
            current_user.is_superuser 
            or branch.created_by == current_user.id 
            or company.created_by == current_user.id
        ):
            raise HTTPException(status_code=400, detail="Not enough permissions")
        
        # Verify user exists
        user_statement = select(User).where(User.id == assignment.user_id)
        user = session.exec(user_statement).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Assign user to branch
        branch_user = branch_user_crud.assign_user_to_branch(
            session=session,
            branch_id=branch_id,
            user_id=assignment.user_id,
            role=assignment.role,
            assigned_by=current_user.id
        )
        
        # Create UserPublic object from the user data
        user_public = UserPublic(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            full_name=user.full_name
        )
        
        return BranchUserPublic(
            user_id=branch_user.user_id,
            branch_id=branch_user.branch_id,
            role=branch_user.role,
            assigned_by=branch_user.assigned_by,
            assigned_at=branch_user.assigned_at,
            user=user_public.model_dump() if user_public else None
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log unexpected errors and return 500
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Unexpected error in assign_user_to_branch_endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/{branch_id}/remove/{user_id}")
def remove_user_from_branch_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    branch_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Message:
    """
    Remove a user from a branch.
    """
    # Verify branch exists
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check permissions - user must be superuser, branch creator, or company owner
    company = company_crud.get(session=session, id=branch.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if not (
        current_user.is_superuser 
        or branch.created_by == current_user.id 
        or company.created_by == current_user.id
    ):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    # Check if assignment exists
    assignment = branch_user_crud.get_assignment(session=session, branch_id=branch_id, user_id=user_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="User is not assigned to this branch")
    
    # Remove user from branch
    success = branch_user_crud.remove_user_from_branch(session=session, branch_id=branch_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to remove user from branch")
    
    return Message(message="User removed from branch successfully")


@router.put("/{branch_id}/update-role/{user_id}", response_model=BranchUserPublic)
def update_branch_user_role(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    branch_id: uuid.UUID,
    user_id: uuid.UUID,
    role_update: BranchUserUpdate,
) -> Any:
    """
    Update a user's role in a branch.
    """
    # Verify branch exists
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check permissions - user must be superuser, branch creator, or company owner
    company = company_crud.get(session=session, id=branch.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if not (
        current_user.is_superuser 
        or branch.created_by == current_user.id 
        or company.created_by == current_user.id
    ):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    # Check if assignment exists
    assignment = branch_user_crud.get_assignment(session=session, branch_id=branch_id, user_id=user_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="User is not assigned to this branch")
    
    # Update role
    branch_user = branch_user_crud.assign_user_to_branch(
        session=session,
        branch_id=branch_id,
        user_id=user_id,
        role=role_update.role,
        assigned_by=current_user.id
    )
    
    # Get user details
    user_statement = select(User).where(User.id == user_id)
    user = session.exec(user_statement).first()
    
    return BranchUserPublic(
        user_id=branch_user.user_id,
        branch_id=branch_user.branch_id,
        role=branch_user.role,
        assigned_by=branch_user.assigned_by,
        assigned_at=branch_user.assigned_at,
        user=UserPublic(**user.model_dump()).model_dump() if user else None
    )


@router.get("/{branch_id}/users", response_model=BranchUsersPublic)
def get_branch_users_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    branch_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all users assigned to a branch.
    """
    # Verify branch exists
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check permissions - user must be superuser, branch creator, company owner, or have access to the branch
    company = company_crud.get(session=session, id=branch.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if not (
        current_user.is_superuser 
        or branch.created_by == current_user.id 
        or company.created_by == current_user.id
        or branch_user_crud.user_has_branch_access(session=session, user_id=current_user.id, branch_id=branch_id)
    ):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    # Get branch users
    assignments, count = branch_user_crud.get_branch_users(session=session, branch_id=branch_id, skip=skip, limit=limit)
    
    # Get user details for each assignment
    result_data = []
    for assignment in assignments:
        user_statement = select(User).where(User.id == assignment.user_id)
        user = session.exec(user_statement).first()
        
        result_data.append(BranchUserPublic(
            user_id=assignment.user_id,
            branch_id=assignment.branch_id,
            role=assignment.role,
            assigned_by=assignment.assigned_by,
            assigned_at=assignment.assigned_at,
            user=UserPublic(**user.model_dump()).model_dump() if user else None
        ))
    
    return BranchUsersPublic(data=result_data, count=count)


@router.get("/user/{user_id}/branches", response_model=UserBranchesPublic)
def get_user_branches_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all branches a user has access to.
    """
    # Check permissions - user must be superuser or the user themselves
    if not (current_user.is_superuser or current_user.id == user_id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    # Verify user exists
    user_statement = select(User).where(User.id == user_id)
    user = session.exec(user_statement).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's branch assignments
    assignments, count = branch_user_crud.get_user_branches(session=session, user_id=user_id, skip=skip, limit=limit)
    
    # Get branch details for each assignment
    result_data = []
    for assignment in assignments:
        branch = branch_crud.get(session=session, id=assignment.branch_id)
        
        result_data.append(UserBranchPublic(
            user_id=assignment.user_id,
            branch_id=assignment.branch_id,
            role=assignment.role,
            assigned_by=assignment.assigned_by,
            branch=branch
        ))
    
    return UserBranchesPublic(data=result_data, count=count)


@router.get("/my/branches", response_model=UserBranchesPublic)
def get_my_branches_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all branches the current user has access to.
    """
    # Get current user's branch assignments
    assignments, count = branch_user_crud.get_user_branches(session=session, user_id=current_user.id, skip=skip, limit=limit)
    
    # Get branch details for each assignment
    result_data = []
    for assignment in assignments:
        branch = branch_crud.get(session=session, id=assignment.branch_id)
        
        result_data.append(UserBranchPublic(
            user_id=assignment.user_id,
            branch_id=assignment.branch_id,
            role=assignment.role,
            assigned_by=assignment.assigned_by,
            branch=branch
        ))
    
    return UserBranchesPublic(data=result_data, count=count)


@router.get("/check-access/{branch_id}")
def check_branch_access(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    branch_id: uuid.UUID,
) -> dict[str, bool]:
    """
    Check if the current user has access to a specific branch.
    """
    # Verify branch exists
    branch = branch_crud.get(session=session, id=branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    # Check access
    has_access = (
        current_user.is_superuser 
        or branch.created_by == current_user.id
        or branch_user_crud.check_branch_access(session=session, user_id=current_user.id, branch_id=branch_id)
    )
    
    return {"has_access": has_access}
