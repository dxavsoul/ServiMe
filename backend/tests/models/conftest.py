"""
Test configuration and fixtures for model tests.
"""

import pytest
import uuid
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool


@pytest.fixture(name="session")
def session_fixture():
    """Create a test database session."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture
def sample_uuid():
    """Generate a sample UUID for testing."""
    return uuid.uuid4()


@pytest.fixture
def sample_email():
    """Sample email for testing."""
    return "test@example.com"


@pytest.fixture
def sample_password():
    """Sample password for testing."""
    return "testpassword123"
