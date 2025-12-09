"""
Test cases for the messaging system between customers and companies.
"""

import uuid
from typing import Dict, Any
from datetime import datetime, UTC

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import User, Company, Branch
from app.models.messaging import Conversation, Message, CompanyAvailability
from app.tests.utils.user import create_random_user, create_random_superuser
from app.tests.utils.company import create_random_company
from app.tests.utils.utils import random_email, random_lower_string


class TestMessagingSystem:
    """Test messaging functionality between customers and companies."""

    def test_create_conversation_success(
        self, client: TestClient, db: Session
    ) -> None:
        """Test successful conversation creation."""
        # Create test users and company
        customer = create_random_user(db)
        company_admin = create_random_user(db)
        company = create_random_company(db, created_by=company_admin.id)

        # Create conversation payload
        conversation_payload = {
            "customer_id": str(customer.id),
            "company_id": str(company.id),
            "subject": "Service inquiry"
        }

        # Login as customer
        with client:
            login_data = {
                "username": customer.email,
                "password": "password"
            }
            login_response = client.post(
                f"{settings.API_V1_STR}/login/access-token", data=login_data
            )
            tokens = login_response.json()
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}

            response = client.post(
                f"{settings.API_V1_STR}/messaging/conversations",
                json=conversation_payload,
                headers=headers
            )

            assert response.status_code == 200
            data = response.json()

            assert "id" in data
            assert data["customer_id"] == str(customer.id)
            assert data["company_id"] == str(company.id)
            assert data["subject"] == "Service inquiry"
            assert data["status"] == "active"

    def test_send_message_success(
        self, client: TestClient, db: Session
    ) -> None:
        """Test successful message sending."""
        # Create test data
        customer = create_random_user(db)
        company_admin = create_random_user(db)
        company = create_random_company(db, created_by=company_admin.id)

        # Create conversation
        conversation = Conversation(
            customer_id=customer.id,
            company_id=company.id,
            subject="Test conversation",
            status="active",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        # Message payload
        message_payload = {
            "conversation_id": str(conversation.id),
            "content": "Hello, I have a question about your services."
        }

        # Login as customer and send message
        with client:
            login_data = {
                "username": customer.email,
                "password": "password"
            }
            login_response = client.post(
                f"{settings.API_V1_STR}/login/access-token", data=login_data
            )
            tokens = login_response.json()
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}

            response = client.post(
                f"{settings.API_V1_STR}/messaging/conversations/{conversation.id}/messages",
                json=message_payload,
                headers=headers
            )

            assert response.status_code == 200
            data = response.json()

            assert data["content"] == message_payload["content"]
            assert data["sender_type"] == "customer"
            assert data["sender_id"] == str(customer.id)
            assert data["is_read"] is False

    def test_get_user_conversations(
        self, client: TestClient, db: Session
    ) -> None:
        """Test retrieving user conversations."""
        customer = create_random_user(db)
        company_admin = create_random_user(db)
        company = create_random_company(db, created_by=company_admin.id)

        # Create multiple conversations
        for i in range(3):
            conversation = Conversation(
                customer_id=customer.id,
                company_id=company.id,
                subject=f"Test conversation {i+1}",
                status="active",
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            db.add(conversation)

        db.commit()

        # Login as customer and get conversations
        with client:
            login_data = {
                "username": customer.email,
                "password": "password"
            }
            login_response = client.post(
                f"{settings.API_V1_STR}/login/access-token", data=login_data
            )
            tokens = login_response.json()
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}

            response = client.get(
                f"{settings.API_V1_STR}/messaging/conversations",
                headers=headers
            )

            assert response.status_code == 200
            data = response.json()

            assert "data" in data
            assert "count" in data
            assert data["count"] == 3
            assert len(data["data"]) == 3

    def test_company_availability_management(
        self, client: TestClient, db: Session
    ) -> None:
        """Test company availability status management."""
        company_admin = create_random_user(db)
        company = create_random_company(db, created_by=company_admin.id)

        # Set availability payload
        availability_payload = {
            "is_available": False,
            "availability_message": "Currently busy with other clients"
        }

        # Login as company admin and set availability
        with client:
            login_data = {
                "username": company_admin.email,
                "password": "password"
            }
            login_response = client.post(
                f"{settings.API_V1_STR}/login/access-token", data=login_data
            )
            tokens = login_response.json()
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}

            # Set availability
            response = client.post(
                f"{settings.API_V1_STR}/messaging/companies/{company.id}/availability",
                json=availability_payload,
                headers=headers
            )

            assert response.status_code == 200
            data = response.json()

            assert data["is_available"] is False
            assert data["availability_message"] == availability_payload["availability_message"]
            assert data["company_id"] == str(company.id)

            # Get availability
            response = client.get(
                f"{settings.API_V1_STR}/messaging/companies/{company.id}/availability",
                headers=headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["is_available"] is False

    def test_message_read_functionality(
        self, client: TestClient, db: Session
    ) -> None:
        """Test marking messages as read."""
        customer = create_random_user(db)
        company_admin = create_random_user(db)
        company = create_random_company(db, created_by=company_admin.id)

        # Create conversation and message
        conversation = Conversation(
            customer_id=customer.id,
            company_id=company.id,
            subject="Test conversation",
            status="active",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        # Create message from customer to company
        message = Message(
            conversation_id=conversation.id,
            sender_id=customer.id,
            content="Test message",
            sender_type="customer",
            sent_at=datetime.now(UTC),
            is_read=False
        )
        db.add(message)
        db.commit()
        db.refresh(message)

        # Login as company admin and mark message as read
        with client:
            login_data = {
                "username": company_admin.email,
                "password": "password"
            }
            login_response = client.post(
                f"{settings.API_V1_STR}/login/access-token", data=login_data
            )
            tokens = login_response.json()
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}

            response = client.post(
                f"{settings.API_V1_STR}/messaging/messages/{message.id}/read",
                headers=headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["is_read"] is True

    def test_unauthorized_access_prevention(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that unauthorized users cannot access conversations."""
        customer1 = create_random_user(db)
        customer2 = create_random_user(db)
        company_admin = create_random_user(db)
        company = create_random_company(db, created_by=company_admin.id)

        # Create conversation between customer1 and company
        conversation = Conversation(
            customer_id=customer1.id,
            company_id=company.id,
            subject="Private conversation",
            status="active",
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC)
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        # Try to access conversation as customer2 (unauthorized)
        with client:
            login_data = {
                "username": customer2.email,
                "password": "password"
            }
            login_response = client.post(
                f"{settings.API_V1_STR}/login/access-token", data=login_data
            )
            tokens = login_response.json()
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}

            response = client.get(
                f"{settings.API_V1_STR}/messaging/conversations/{conversation.id}",
                headers=headers
            )

            assert response.status_code in [403, 404]  # Forbidden or Not Found


# Example payloads for documentation
CONVERSATION_CREATE_EXAMPLE = {
    "customer_id": "123e4567-e89b-12d3-a456-426614174001",
    "company_id": "123e4567-e89b-12d3-a456-426614174002",
    "appointment_id": "123e4567-e89b-12d3-a456-426614174003",
    "subject": "Question about scheduled service"
}

MESSAGE_CREATE_EXAMPLE = {
    "conversation_id": "123e4567-e89b-12d3-a456-426614174004",
    "content": "Hello, I have a question about my scheduled appointment tomorrow."
}

COMPANY_AVAILABILITY_EXAMPLE = {
    "is_available": True,
    "availability_message": "We're available to chat Monday-Friday 9AM-5PM EST"
}

CONVERSATION_RESPONSE_EXAMPLE = {
    "id": "123e4567-e89b-12d3-a456-426614174004",
    "customer_id": "123e4567-e89b-12d3-a456-426614174001",
    "company_id": "123e4567-e89b-12d3-a456-426614174002",
    "appointment_id": "123e4567-e89b-12d3-a456-426614174003",
    "subject": "Question about scheduled service",
    "status": "active",
    "is_company_available": True,
    "created_at": "2025-10-10T10:30:00Z",
    "updated_at": "2025-10-10T10:30:00Z",
    "customer_name": "John Doe",
    "company_name": "Tech Solutions Inc",
    "unread_count": 0,
    "last_message": None
}

MESSAGE_RESPONSE_EXAMPLE = {
    "id": "123e4567-e89b-12d3-a456-426614174005",
    "conversation_id": "123e4567-e89b-12d3-a456-426614174004",
    "sender_id": "123e4567-e89b-12d3-a456-426614174001",
    "content": "Hello, I have a question about my scheduled appointment tomorrow.",
    "sender_type": "customer",
    "is_read": False,
    "sent_at": "2025-10-10T10:35:00Z",
    "read_at": None,
    "sender_name": "John Doe"
}
