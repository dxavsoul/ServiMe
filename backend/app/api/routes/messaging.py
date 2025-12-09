"""
Enhanced API endpoints for messaging between Customer and Company/Professional after appointment scheduling.
"""
import uuid
from typing import Any, List
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session

from app.api.deps import CurrentUser, SessionDep, CurrentApprovedUser
from app.crud.crud_messaging import messaging_crud
from app.models.messaging import (
    ConversationCreate, MessageCreate, CompanyAvailabilityUpdate,
    ConversationPublic, ConversationWithMessages, MessagePublic,
    CompanyAvailabilityPublic, ConversationsPublic, MessagesPublic
)
from app.models import Message

router = APIRouter(prefix="/messaging", tags=["messaging"])


@router.post("/conversations", response_model=ConversationPublic)
def create_conversation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    conversation_in: ConversationCreate
) -> Any:
    """
    Create a new conversation between customer and company.
    Only customers can initiate conversations, and only after scheduling an appointment.
    """
    try:
        # Verify the user is either the customer or has company access
        if conversation_in.customer_id != current_user.id:
            # Check if user has access to the company
            from app.crud.crud_company import company_crud
            if not company_crud.can_access_company(
                session=session,
                user=current_user,
                company_id=conversation_in.company_id
            ):
                raise HTTPException(
                    status_code=403,
                    detail="You don't have permission to create this conversation"
                )

        conversation = messaging_crud.create_conversation(
            session=session,
            obj_in=conversation_in,
            created_by=current_user.id
        )

        # Get additional information for response
        from app.models import User, Company
        customer = session.get(User, conversation.customer_id)
        company = session.get(Company, conversation.company_id)

        return ConversationPublic(
            **conversation.model_dump(),
            customer_name=customer.full_name or customer.email if customer else None,
            company_name=company.name if company else None,
            unread_count=0,
            last_message=None
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")


@router.get("/conversations", response_model=ConversationsPublic)
def get_user_conversations(
    session: SessionDep,
    current_user: CurrentApprovedUser,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get all conversations for the current user.
    Returns conversations where user is either the customer or has company access.
    """
    try:
        conversations, count = messaging_crud.get_user_conversations(
            session=session,
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )

        return ConversationsPublic(data=conversations, count=count)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversations: {str(e)}")


@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
def get_conversation_with_messages(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    conversation_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get a conversation with all its messages.
    Only accessible by the customer or company employees with proper access.
    """
    try:
        # Get conversation details
        conversation = session.get(messaging_crud.model, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Get messages
        messages, message_count = messaging_crud.get_conversation_messages(
            session=session,
            conversation_id=conversation_id,
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )

        # Get additional information
        from app.models import User, Company
        customer = session.get(User, conversation.customer_id)
        company = session.get(Company, conversation.company_id)

        return ConversationWithMessages(
            **conversation.model_dump(),
            customer_name=customer.full_name or customer.email if customer else None,
            company_name=company.name if company else None,
            unread_count=messaging_crud._get_unread_count(session, conversation_id, current_user.id),
            messages=messages
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversation: {str(e)}")


@router.post("/conversations/{conversation_id}/messages", response_model=MessagePublic)
def send_message(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    conversation_id: uuid.UUID,
    message_in: MessageCreate
) -> Any:
    """
    Send a message in a conversation.
    Users can only send messages in conversations they have access to.
    """
    if message_in.conversation_id != conversation_id:
        raise HTTPException(
            status_code=400,
            detail="Conversation ID in URL and request body must match"
        )

    try:
        # Determine sender type
        conversation = session.get(messaging_crud.model, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        sender_type = "customer" if conversation.customer_id == current_user.id else "company"

        message = messaging_crud.send_message(
            session=session,
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=message_in.content,
            sender_type=sender_type
        )

        return MessagePublic(
            **message.model_dump(),
            sender_name=current_user.full_name or current_user.email
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")


@router.get("/conversations/{conversation_id}/messages", response_model=MessagesPublic)
def get_conversation_messages(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    conversation_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get messages in a conversation with pagination.
    Only accessible by users who have access to the conversation.
    """
    try:
        messages, count = messaging_crud.get_conversation_messages(
            session=session,
            conversation_id=conversation_id,
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )

        return MessagesPublic(data=messages, count=count)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")


@router.post("/messages/{message_id}/read", response_model=MessagePublic)
def mark_message_as_read(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    message_id: uuid.UUID
) -> Any:
    """
    Mark a message as read.
    Only the recipient can mark messages as read (not the sender).
    """
    try:
        message = messaging_crud.mark_message_as_read(
            session=session,
            message_id=message_id,
            user_id=current_user.id
        )

        return MessagePublic(
            **message.model_dump(),
            sender_name=None  # Will be populated if needed
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark message as read: {str(e)}")


@router.post("/companies/{company_id}/availability", response_model=CompanyAvailabilityPublic)
def set_company_availability(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    company_id: uuid.UUID,
    availability_in: CompanyAvailabilityUpdate
) -> Any:
    """
    Set company messaging availability status.
    Only company employees or superadmin can update availability.
    """
    try:
        availability = messaging_crud.set_company_availability(
            session=session,
            company_id=company_id,
            is_available=availability_in.is_available,
            availability_message=availability_in.availability_message,
            updated_by=current_user.id
        )

        # Get additional information for response
        from app.models import Company
        company = session.get(Company, company_id)

        return CompanyAvailabilityPublic(
            **availability.model_dump(),
            company_name=company.name if company else None,
            updater_name=current_user.full_name or current_user.email
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update availability: {str(e)}")


@router.get("/companies/{company_id}/availability", response_model=CompanyAvailabilityPublic)
def get_company_availability(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    company_id: uuid.UUID
) -> Any:
    """
    Get company messaging availability status.
    Accessible by anyone who can view the company.
    """
    try:
        availability = messaging_crud.get_company_availability(
            session=session,
            company_id=company_id
        )

        if not availability:
            # Return default availability if not set
            from app.models import Company
            company = session.get(Company, company_id)
            if not company:
                raise HTTPException(status_code=404, detail="Company not found")

            return CompanyAvailabilityPublic(
                id=uuid.uuid4(),  # Placeholder ID
                company_id=company_id,
                is_available=True,
                availability_message=None,
                updated_at=company.id,  # Using company ID as placeholder
                company_name=company.name,
                updater_name=None
            )

        # Get additional information for response
        from app.models import Company, User
        company = session.get(Company, company_id)
        updater = session.get(User, availability.updated_by) if availability.updated_by else None

        return CompanyAvailabilityPublic(
            **availability.model_dump(),
            company_name=company.name if company else None,
            updater_name=updater.full_name or updater.email if updater else None
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get availability: {str(e)}")


@router.get("/conversations/{conversation_id}/unread-count")
def get_unread_message_count(
    *,
    session: SessionDep,
    current_user: CurrentApprovedUser,
    conversation_id: uuid.UUID
) -> dict[str, int]:
    """
    Get count of unread messages in a conversation for the current user.
    """
    try:
        # Verify user has access to the conversation
        conversation = session.get(messaging_crud.model, conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Check access permissions
        has_access = False
        if conversation.customer_id == current_user.id:
            has_access = True
        else:
            from app.crud.crud_company import company_crud
            has_access = company_crud.can_access_company(
                session=session,
                user=current_user,
                company_id=conversation.company_id
            )

        if not has_access:
            raise HTTPException(
                status_code=403,
                detail="You don't have access to this conversation"
            )

        unread_count = messaging_crud._get_unread_count(
            session=session,
            conversation_id=conversation_id,
            user_id=current_user.id
        )

        return {"unread_count": unread_count}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get unread count: {str(e)}")
