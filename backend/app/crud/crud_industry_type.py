"""
CRUD operations for Industry Type.
"""

import uuid
from typing import Optional, List
from sqlmodel import Session, select, func

from app.crud.base import CRUDBase
from app.models.industry_type import IndustryType, IndustryTypeCreate, IndustryTypeUpdate


class CRUDIndustryType(CRUDBase[IndustryType, IndustryTypeCreate, IndustryTypeUpdate]):
    def get_by_name(self, session: Session, *, name: str) -> Optional[IndustryType]:
        """Get industry type by name."""
        statement = select(IndustryType).where(IndustryType.name == name)
        return session.exec(statement).first()

    def get_by_code(self, session: Session, *, code: str) -> Optional[IndustryType]:
        """Get industry type by code."""
        statement = select(IndustryType).where(IndustryType.code == code)
        return session.exec(statement).first()

    def get_active(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[List[IndustryType], int]:
        """Get active industry types with pagination."""
        count_statement = select(func.count()).select_from(IndustryType).where(
            IndustryType.is_active == True
        )
        count = session.exec(count_statement).one()

        statement = (
            select(IndustryType)
            .where(IndustryType.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        items = session.exec(statement).all()
        return list(items), count

    def search_by_name(
        self, session: Session, *, name: str, skip: int = 0, limit: int = 100
    ) -> tuple[List[IndustryType], int]:
        """Search industry types by name (case insensitive)."""
        count_statement = select(func.count()).select_from(IndustryType).where(
            IndustryType.name.ilike(f"%{name}%")
        )
        count = session.exec(count_statement).one()

        statement = (
            select(IndustryType)
            .where(IndustryType.name.ilike(f"%{name}%"))
            .offset(skip)
            .limit(limit)
        )
        items = session.exec(statement).all()
        return list(items), count


industry_type = CRUDIndustryType(IndustryType)
