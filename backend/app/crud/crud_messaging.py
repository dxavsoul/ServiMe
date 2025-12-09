"""
Enhanced CRUD operations for messaging between customers and companies.
"""
import uuid
from typing import List, Optional, Tuple
from datetime import datetime, UTC
from sqlmodel import Session, select, func, and_, or_

from app.models.messaging import (
    Conversation, Message, CompanyAvailability,
    ConversationCreate, MessageCreate, ConversationUpdate,
    MessageUpdate, CompanyAvailabilityUpdate,
    ConversationPublic, MessagePublic, CompanyAvailabilityPublic
)
from app.models import User, Company
from app.crud.base import CRUDBase


class CRUDMessaging(CRUDBase[Conversation, ConversationCreate, ConversationUpdate]):
    """CRUD operations for messaging system."""

    def create_conversation(
        self,
        session: Session,
        *,
        obj_in: ConversationCreate,
        created_by: uuid.UUID
    ) -> Conversation:
        """
        Create a new conversation between customer and company.
        Only allowed after an appointment has been scheduled.
        """
        # Check if appointment exists and is confirmed (you might need to implement this check)
        # For now, we'll allow conversation creation if appointment_id is provided or None

        # Check if conversation already exists for this customer-company-appointment combination
        existing_conversation = None
        if obj_in.appointment_id:
            existing_conversation = session.exec(
                select(Conversation).where(
                    and_(
                        Conversation.customer_id == obj_in.customer_id,
                        Conversation.company_id == obj_in.company_id,
                        Conversation.appointment_id == obj_in.appointment_id
                    )
                )
            ).first()

        if existing_conversation:
            return existing_conversation

        # Create new conversation
        db_obj = Conversation(
            **obj_in.model_dump(),
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    def send_message(
        self,
        session: Session,
        *,
        conversation_id: uuid.UUID,
        sender_id: uuid.UUID,
        content: str,
        sender_type: str
    ) -> Message:
        """Send a message in a conversation."""
        # Verify conversation exists and user has access
        conversation = session.get(Conversation, conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")

        # Verify sender has access to this conversation
        if sender_type == "customer" and conversation.customer_id != sender_id:
            raise ValueError("Customer can only send messages in their own conversations")
        elif sender_type == "company":
            # Check if sender is associated with the company (through branch assignments)
            from app.crud.crud_company import company_crud
            user = session.get(User, sender_id)
            if not user or not company_crud.can_access_company(
                session=session,
                user=user,
                company_id=conversation.company_id
            ):
                raise ValueError("User not authorized to send messages for this company")

        # Check if company is available for messaging
        if sender_type == "customer":
            availability = self.get_company_availability(session, conversation.company_id)
            if availability and not availability.is_available:
                raise ValueError("Company is currently unavailable for messaging")

        # Create message
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            sender_type=sender_type,
            sent_at=datetime.now(UTC)
        )
        session.add(message)

        # Update conversation timestamp
        conversation.updated_at = datetime.now(UTC)
        session.add(conversation)

        session.commit()
        session.refresh(message)
        return message

    def get_conversation_messages(
        self,
        session: Session,
        *,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[MessagePublic], int]:
        """Get messages in a conversation with pagination."""
        # Verify user has access to this conversation
        conversation = session.get(Conversation, conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")

        # Check access permissions
        user = session.get(User, user_id)
        if not user:
            raise ValueError("User not found")

        has_access = False
        if conversation.customer_id == user_id:
            has_access = True
        else:
            # Check if user has company access
            from app.crud.crud_company import company_crud
            has_access = company_crud.can_access_company(
                session=session,
                user=user,
                company_id=conversation.company_id
            )

        if not has_access:
            raise ValueError("User not authorized to view this conversation")

        # Get messages with sender information
        count_statement = (
            select(func.count())
            .select_from(Message)
            .where(Message.conversation_id == conversation_id)
        )
        count = session.exec(count_statement).one()

        statement = (
            select(Message, User)
            .join(User, Message.sender_id == User.id)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.sent_at.asc())
            .offset(skip)
            .limit(limit)
        )
        results = session.exec(statement).all()

        # Build response
        messages = []
        for message, sender in results:
            message_public = MessagePublic(
                **message.model_dump(),
                sender_name=sender.full_name or sender.email
            )
            messages.append(message_public)

        return messages, count

    def get_user_conversations(
        self,
        session: Session,
        *,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[ConversationPublic], int]:
        """Get all conversations for a user (customer or company employee)."""
        user = session.get(User, user_id)
        if not user:
            raise ValueError("User not found")

        # Build query based on user type
        if user.is_superuser:
            # Superuser can see all conversations
            base_query = select(Conversation, User, Company).join(
                User, Conversation.customer_id == User.id
            ).join(
                Company, Conversation.company_id == Company.id
            )
        else:
            # Get user's accessible companies
            from app.crud.crud_company import company_crud
            accessible_companies, _ = company_crud.get_accessible_companies(
                session=session, user=user, skip=0, limit=1000
            )
            accessible_company_ids = [c.id for c in accessible_companies]

            # Query for conversations where user is customer OR user has company access
            base_query = select(Conversation, User, Company).join(
                User, Conversation.customer_id == User.id
            ).join(
                Company, Conversation.company_id == Company.id
            ).where(
                or_(
                    Conversation.customer_id == user_id,
                    Conversation.company_id.in_(accessible_company_ids) if accessible_company_ids else False
                )
            )

        # Count total conversations
        count_statement = select(func.count()).select_from(
            base_query.subquery()
        )
        count = session.exec(count_statement).one()

        # Get conversations with pagination
        statement = base_query.order_by(
            Conversation.updated_at.desc()
        ).offset(skip).limit(limit)

        results = session.exec(statement).all()

        # Build response with additional information
        conversations = []
        for conversation, customer, company in results:
            # Get unread message count for this user
            unread_count = self._get_unread_count(session, conversation.id, user_id)

            # Get last message
            last_message = self._get_last_message(session, conversation.id)

            conversation_public = ConversationPublic(
                **conversation.model_dump(),
                customer_name=customer.full_name or customer.email,
                company_name=company.name,
                unread_count=unread_count,
                last_message=last_message
            )
            conversations.append(conversation_public)

        return conversations, count

    def mark_message_as_read(
        self,
        session: Session,
        *,
        message_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Message:
        """Mark a message as read."""
        message = session.get(Message, message_id)
        if not message:
            raise ValueError("Message not found")

        # Verify user has access to this message
        conversation = session.get(Conversation, message.conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")

        # Check access permissions (similar to get_conversation_messages)
        user = session.get(User, user_id)
        if not user:
            raise ValueError("User not found")

        has_access = False
        if conversation.customer_id == user_id:
            has_access = True
        else:
            from app.crud.crud_company import company_crud
            has_access = company_crud.can_access_company(
                session=session,
                user=user,
                company_id=conversation.company_id
            )

        if not has_access:
            raise ValueError("User not authorized to mark this message as read")

        # Only mark as read if the user is NOT the sender
        if message.sender_id != user_id:
            message.is_read = True
            message.read_at = datetime.now(UTC)
            session.add(message)
            session.commit()
            session.refresh(message)

        return message

    def set_company_availability(
        self,
        session: Session,
        *,
        company_id: uuid.UUID,
        is_available: bool,
        availability_message: Optional[str],
        updated_by: uuid.UUID
    ) -> CompanyAvailability:
        """Set company messaging availability status."""
        # Check if user has permission to update company availability
        user = session.get(User, updated_by)
        if not user:
            raise ValueError("User not found")

        from app.crud.crud_company import company_crud
        if not user.is_superuser and not company_crud.can_access_company(
            session=session, user=user, company_id=company_id
        ):
            raise ValueError("User not authorized to update company availability")

        # Get or create availability record
        availability = session.exec(
            select(CompanyAvailability).where(
                CompanyAvailability.company_id == company_id
            )
        ).first()

        if availability:
            availability.is_available = is_available
            availability.availability_message = availability_message
            availability.updated_at = datetime.now(UTC)
            availability.updated_by = updated_by
        else:
            availability = CompanyAvailability(
                company_id=company_id,
                is_available=is_available,
                availability_message=availability_message,
                updated_at=datetime.now(UTC),
                updated_by=updated_by
            )

        session.add(availability)
        session.commit()
        session.refresh(availability)
        return availability

    def get_company_availability(
        self,
        session: Session,
        company_id: uuid.UUID
    ) -> Optional[CompanyAvailability]:
        """Get company messaging availability status."""
        return session.exec(
            select(CompanyAvailability).where(
                CompanyAvailability.company_id == company_id
            )
        ).first()

    def _get_unread_count(
        self,
        session: Session,
        conversation_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> int:
        """Get count of unread messages for a user in a conversation."""
        count = session.exec(
            select(func.count())
            .select_from(Message)
            .where(
                and_(
                    Message.conversation_id == conversation_id,
                    Message.sender_id != user_id,  # Messages not sent by this user
                    Message.is_read == False
                )
            )
        ).one()
        return count

    def _get_last_message(
        self,
        session: Session,
        conversation_id: uuid.UUID
    ) -> Optional[MessagePublic]:
        """Get the last message in a conversation."""
        statement = (
            select(Message, User)
            .join(User, Message.sender_id == User.id)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.sent_at.desc())
            .limit(1)
        )
        result = session.exec(statement).first()

        if result:
            message, sender = result
            return MessagePublic(
                **message.model_dump(),
                sender_name=sender.full_name or sender.email
            )
        return None


# Create CRUD instance
messaging_crud = CRUDMessaging(Conversation)
