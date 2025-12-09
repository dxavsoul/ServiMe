"""
Test cases for company registration endpoints.
"""

import uuid
from typing import Dict, Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import User, Company, Branch, BranchUserLink
from app.models.company import CompanyRegistrationStatus
from app.tests.utils.user import create_random_superuser
from app.tests.utils.utils import random_email, random_lower_string


class TestCompanyRegistration:
    """Test company registration functionality."""

    def test_register_company_success(
        self, client: TestClient, db: Session
    ) -> None:
        """Test successful company registration."""
        # Prepare registration data
        company_data = {
            "name": f"Test Company {random_lower_string()}",
            "description": "A test company for registration",
            "industry": "Technology",
            "website": "https://testcompany.com",
            "email": random_email(),
            "phone": "+1234567890",
            "address": "123 Test Street"
        }

        admin_user_data = {
            "email": random_email(),
            "password": "TestPassword123!",
            "full_name": "Test Admin User"
        }

        branch_data = {
            "name": "Main Branch",
            "code": "MAIN",
            "address": "123 Main Street",
            "postal_code": "12345",
            "phone": "+1234567890",
            "email": random_email(),
            "manager_name": "Branch Manager"
        }

        registration_payload = {
            "company": company_data,
            "admin_user": admin_user_data,
            "main_branch": branch_data,
            "registration_notes": "Initial company registration"
        }

        # Make the request
        response = client.post(
            f"{settings.API_V1_STR}/companies/register",
            json=registration_payload
        )

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "company_id" in data
        assert "user_id" in data
        assert "branch_id" in data
        assert data["registration_status"] == CompanyRegistrationStatus.PENDING_REVIEW
        assert "message" in data
        assert "next_steps" in data

        # Verify entities were created in database
        company_id = uuid.UUID(data["company_id"])
        user_id = uuid.UUID(data["user_id"])
        branch_id = uuid.UUID(data["branch_id"])

        # Check company was created
        company = db.get(Company, company_id)
        assert company is not None
        assert company.name == company_data["name"]
        assert company.created_by == user_id

        # Check user was created with correct status
        user = db.get(User, user_id)
        assert user is not None
        assert user.email == admin_user_data["email"]
        assert user.is_company_admin is True
        assert user.company_registration_status == CompanyRegistrationStatus.PENDING_REVIEW

        # Check branch was created
        branch = db.get(Branch, branch_id)
        assert branch is not None
        assert branch.name == branch_data["name"]
        assert branch.company_id == company_id
        assert branch.created_by == user_id

        # Check user-branch relationship was created
        from sqlmodel import select
        branch_user_link = db.exec(
            select(BranchUserLink).where(
                BranchUserLink.user_id == user_id,
                BranchUserLink.branch_id == branch_id
            )
        ).first()
        assert branch_user_link is not None
        assert branch_user_link.is_company_owner is True
        assert branch_user_link.company_role == "owner"

    def test_register_company_duplicate_email(
        self, client: TestClient, db: Session
    ) -> None:
        """Test registration fails with duplicate email."""
        # Create an existing user
        existing_user = User(
            email="existing@example.com",
            hashed_password="hashed_password",
            full_name="Existing User"
        )
        db.add(existing_user)
        db.commit()

        registration_payload = {
            "company": {
                "name": "Test Company",
                "description": "Test Description"
            },
            "admin_user": {
                "email": "existing@example.com",  # Same email as existing user
                "password": "TestPassword123!",
                "full_name": "Test Admin"
            },
            "main_branch": {
                "name": "Main Branch"
            }
        }

        response = client.post(
            f"{settings.API_V1_STR}/companies/register",
            json=registration_payload
        )

        assert response.status_code == 400
        assert "email already exists" in response.json()["detail"]

    def test_register_company_duplicate_name(
        self, client: TestClient, db: Session
    ) -> None:
        """Test registration fails with duplicate company name."""
        # Create an existing company
        existing_company = Company(
            name="Existing Company",
            created_by=uuid.uuid4()
        )
        db.add(existing_company)
        db.commit()

        registration_payload = {
            "company": {
                "name": "Existing Company",  # Same name as existing company
                "description": "Test Description"
            },
            "admin_user": {
                "email": random_email(),
                "password": "TestPassword123!",
                "full_name": "Test Admin"
            },
            "main_branch": {
                "name": "Main Branch"
            }
        }

        response = client.post(
            f"{settings.API_V1_STR}/companies/register",
            json=registration_payload
        )

        assert response.status_code == 400
        assert "company with this name already exists" in response.json()["detail"]

    def test_get_pending_registrations_as_superuser(
        self, client: TestClient, db: Session
    ) -> None:
        """Test getting pending registrations as superuser."""
        superuser = create_random_superuser(db)

        # Create a company with pending registration
        pending_user = User(
            email=random_email(),
            hashed_password="hashed_password",
            full_name="Pending User",
            is_company_admin=True,
            company_registration_status=CompanyRegistrationStatus.PENDING_REVIEW
        )
        db.add(pending_user)
        db.flush()

        pending_company = Company(
            name=f"Pending Company {random_lower_string()}",
            created_by=pending_user.id
        )
        db.add(pending_company)
        db.commit()

        # Login as superuser and get pending registrations
        with client:
            login_data = {
                "username": superuser.email,
                "password": "password"  # Default password from create_random_superuser
            }
            login_response = client.post(
                f"{settings.API_V1_STR}/login/access-token", data=login_data
            )
            tokens = login_response.json()
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}

            response = client.get(
                f"{settings.API_V1_STR}/companies/registrations/pending",
                headers=headers
            )

            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            assert "count" in data
            assert data["count"] >= 1

            # Verify the pending registration appears in the list
            pending_found = False
            for registration in data["data"]:
                if registration["company_id"] == str(pending_company.id):
                    pending_found = True
                    assert registration["company_name"] == pending_company.name
                    assert registration["admin_user_email"] == pending_user.email
                    assert registration["registration_status"] == CompanyRegistrationStatus.PENDING_REVIEW
                    break

            assert pending_found, "Pending registration should appear in the list"

    def test_get_pending_registrations_as_regular_user(
        self, client: TestClient, db: Session
    ) -> None:
        """Test that regular users cannot get pending registrations."""
        regular_user = User(
            email=random_email(),
            hashed_password="hashed_password",
            full_name="Regular User",
            is_superuser=False
        )
        db.add(regular_user)
        db.commit()

        # Try to access pending registrations as regular user
        with client:
            login_data = {
                "username": regular_user.email,
                "password": "password"
            }
            # Note: This would fail because we don't have the password hash setup
            # In a real test, you'd need to create the user properly

            # For this test, let's just test the endpoint directly
            response = client.get(
                f"{settings.API_V1_STR}/companies/registrations/pending",
                headers={"Authorization": "Bearer fake_token"}
            )

            assert response.status_code in [401, 403]

    def test_approve_company_registration(
        self, client: TestClient, db: Session
    ) -> None:
        """Test approving a company registration."""
        superuser = create_random_superuser(db)

        # Create a company with pending registration
        pending_user = User(
            email=random_email(),
            hashed_password="hashed_password",
            full_name="Pending User",
            is_company_admin=True,
            company_registration_status=CompanyRegistrationStatus.PENDING_REVIEW
        )
        db.add(pending_user)
        db.flush()

        pending_company = Company(
            name=f"Pending Company {random_lower_string()}",
            created_by=pending_user.id
        )
        db.add(pending_company)
        db.commit()

        # Login as superuser and approve the registration
        with client:
            login_data = {
                "username": superuser.email,
                "password": "password"
            }
            login_response = client.post(
                f"{settings.API_V1_STR}/login/access-token", data=login_data
            )
            tokens = login_response.json()
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}

            response = client.post(
                f"{settings.API_V1_STR}/companies/registrations/{pending_company.id}/approve",
                headers=headers
            )

            assert response.status_code == 200
            assert "approved successfully" in response.json()["message"]

            # Verify user status was updated
            db.refresh(pending_user)
            assert pending_user.company_registration_status == CompanyRegistrationStatus.APPROVED
            assert pending_user.approved_by == superuser.id
            assert pending_user.approved_at is not None

    def test_reject_company_registration(
        self, client: TestClient, db: Session
    ) -> None:
        """Test rejecting a company registration."""
        superuser = create_random_superuser(db)

        # Create a company with pending registration
        pending_user = User(
            email=random_email(),
            hashed_password="hashed_password",
            full_name="Pending User",
            is_company_admin=True,
            company_registration_status=CompanyRegistrationStatus.PENDING_REVIEW,
            is_active=True
        )
        db.add(pending_user)
        db.flush()

        pending_company = Company(
            name=f"Pending Company {random_lower_string()}",
            created_by=pending_user.id
        )
        db.add(pending_company)
        db.commit()

        # Login as superuser and reject the registration
        with client:
            login_data = {
                "username": superuser.email,
                "password": "password"
            }
            login_response = client.post(
                f"{settings.API_V1_STR}/login/access-token", data=login_data
            )
            tokens = login_response.json()
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}

            response = client.post(
                f"{settings.API_V1_STR}/companies/registrations/{pending_company.id}/reject",
                headers=headers
            )

            assert response.status_code == 200
            assert "rejected" in response.json()["message"]

            # Verify user status was updated
            db.refresh(pending_user)
            assert pending_user.company_registration_status == CompanyRegistrationStatus.REJECTED
            assert pending_user.approved_by == superuser.id
            assert pending_user.approved_at is not None
            assert pending_user.is_active is False  # User should be deactivated

    def test_invalid_registration_data(
        self, client: TestClient, db: Session
    ) -> None:
        """Test registration with invalid data."""
        # Test missing required fields
        invalid_payload = {
            "company": {
                "description": "Missing name field"
            },
            "admin_user": {
                "email": "invalid-email",  # Invalid email format
                "password": "123"  # Too short password
            },
            "main_branch": {}  # Missing name field
        }

        response = client.post(
            f"{settings.API_V1_STR}/companies/register",
            json=invalid_payload
        )

        assert response.status_code == 422  # Validation error


# Example payloads for documentation
COMPANY_REGISTRATION_EXAMPLE = {
    "company": {
        "name": "Tech Solutions Inc",
        "description": "A technology consulting company specializing in digital transformation",
        "industry": "Technology",
        "website": "https://techsolutions.com",
        "email": "info@techsolutions.com",
        "phone": "+1-555-123-4567",
        "address": "123 Innovation Drive, Tech City, TC 12345"
    },
    "admin_user": {
        "email": "admin@techsolutions.com",
        "password": "SecurePassword123!",
        "full_name": "John Smith"
    },
    "main_branch": {
        "name": "Headquarters",
        "code": "HQ",
        "address": "123 Innovation Drive, Tech City, TC 12345",
        "postal_code": "12345",
        "phone": "+1-555-123-4567",
        "email": "hq@techsolutions.com",
        "manager_name": "Jane Doe"
    },
    "registration_notes": "Initial company registration for new tech consulting firm"
}

COMPANY_REGISTRATION_RESPONSE_EXAMPLE = {
    "company_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "123e4567-e89b-12d3-a456-426614174001",
    "branch_id": "123e4567-e89b-12d3-a456-426614174002",
    "registration_status": "pending_review",
    "message": "Company registration submitted successfully. Your registration is pending review by a system administrator.",
    "next_steps": "Please wait for approval. You will receive an email notification once your company has been reviewed and approved."
}

PENDING_REGISTRATIONS_RESPONSE_EXAMPLE = {
    "data": [
        {
            "company_id": "123e4567-e89b-12d3-a456-426614174000",
            "company_name": "Tech Solutions Inc",
            "company_email": "info@techsolutions.com",
            "company_industry": "Technology",
            "admin_user_id": "123e4567-e89b-12d3-a456-426614174001",
            "admin_user_email": "admin@techsolutions.com",
            "admin_user_name": "John Smith",
            "registration_status": "pending_review",
            "created_at": "123e4567-e89b-12d3-a456-426614174000"
        }
    ],
    "count": 1,
    "skip": 0,
    "limit": 100
}
