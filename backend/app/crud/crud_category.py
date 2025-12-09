"""
CRUD operations for Category.
"""

import uuid
from typing import Optional, List
from sqlmodel import Session, select, func

from app.crud.base import CRUDBase
from app.models.category import Category, CategoryCreate, CategoryUpdate


class CRUDCategory(CRUDBase[Category, CategoryCreate, CategoryUpdate]):
    def get_by_name(self, session: Session, *, name: str) -> Optional[Category]:
        """Get category by name."""
        statement = select(Category).where(Category.name == name)
        return session.exec(statement).first()

    def get_by_code(self, session: Session, *, code: str) -> Optional[Category]:
        """Get category by code."""
        statement = select(Category).where(Category.code == code)
        return session.exec(statement).first()

    def get_active(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[List[Category], int]:
        """Get active categories with pagination, ordered by sort_order."""
        count_statement = select(func.count()).select_from(Category).where(
            Category.is_active == True
        )
        count = session.exec(count_statement).one()

        statement = (
            select(Category)
            .where(Category.is_active == True)
            .order_by(Category.sort_order.asc(), Category.name.asc())
            .offset(skip)
            .limit(limit)
        )
        items = session.exec(statement).all()
        return list(items), count

    def get_with_stats(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[List[dict], int]:
        """Get categories with company count statistics."""
        from app.models.company import Company

        # Get categories with company counts
        statement = (
            select(Category, func.count(Company.id).label('company_count'))
            .outerjoin(Company, Category.id == Company.category_id)
            .group_by(Category.id)
            .order_by(Category.sort_order.asc(), Category.name.asc())
            .offset(skip)
            .limit(limit)
        )

        results = session.exec(statement).all()

        # Count total categories
        count_statement = select(func.count()).select_from(Category)
        count = session.exec(count_statement).one()

        # Format results
        categories_with_stats = []
        for category, company_count in results:
            category_dict = category.model_dump()
            category_dict['company_count'] = company_count
            categories_with_stats.append(category_dict)

        return categories_with_stats, count

    def search_by_name(
        self, session: Session, *, name: str, skip: int = 0, limit: int = 100
    ) -> tuple[List[Category], int]:
        """Search categories by name (case insensitive)."""
        count_statement = select(func.count()).select_from(Category).where(
            Category.name.ilike(f"%{name}%")
        )
        count = session.exec(count_statement).one()

        statement = (
            select(Category)
            .where(Category.name.ilike(f"%{name}%"))
            .order_by(Category.sort_order.asc(), Category.name.asc())
            .offset(skip)
            .limit(limit)
        )
        items = session.exec(statement).all()
        return list(items), count

    def get_document_requirements(
        self, session: Session, *, category_id: uuid.UUID
    ) -> Optional[dict]:
        """Get document requirements for a specific category."""
        category = self.get(session=session, id=category_id)
        if not category:
            return None

        return {
            "requires_business_license": category.requires_business_license,
            "requires_tax_id": category.requires_tax_id,
            "requires_professional_license": category.requires_professional_license,
            "requires_incorporation_docs": category.requires_incorporation_docs,
            "requires_personal_id": category.requires_personal_id,
            "min_employees": category.min_employees,
            "max_employees": category.max_employees
        }


category = CRUDCategory(Category)
