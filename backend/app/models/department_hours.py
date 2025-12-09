"""
Department Hours-related models and schemas.
Contains all department hours-related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List
from datetime import time
from sqlmodel import Field, Relationship, SQLModel
from enum import Enum

from .base import BasePublicList


class DayOfWeek(str, Enum):
    """Enumeration for days of the week."""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


# Shared properties for Department Hours
class DepartmentHoursBase(SQLModel):
    """Base department hours model with shared properties."""
    day_of_week: DayOfWeek
    open_time: Optional[time] = Field(default=None)
    close_time: Optional[time] = Field(default=None)
    is_closed: bool = False  # True if the department is closed on this day


# Properties to receive on department hours creation
class DepartmentHoursCreate(DepartmentHoursBase):
    """Schema for department hours creation via API."""
    department_id: uuid.UUID


# Properties to receive on department hours update
class DepartmentHoursUpdate(DepartmentHoursBase):
    """Schema for department hours updates via API."""
    day_of_week: Optional[DayOfWeek] = None
    department_id: Optional[uuid.UUID] = None


# Database model, database table inferred from class name
class DepartmentHours(DepartmentHoursBase, table=True):
    """Department Hours database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    department_id: uuid.UUID = Field(
        foreign_key="department.id", nullable=False, ondelete="CASCADE"
    )
    
    # Relationships
    department: Optional["Department"] = Relationship(back_populates="hours")


# Properties to return via API, id is always required
class DepartmentHoursPublic(DepartmentHoursBase):
    """Public department hours schema for API responses."""
    id: uuid.UUID
    department_id: uuid.UUID


class DepartmentHoursListPublic(BasePublicList):
    """Schema for paginated department hours list responses."""
    data: List[DepartmentHoursPublic]
