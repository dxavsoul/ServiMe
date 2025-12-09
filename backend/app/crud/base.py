import uuid
from typing import Any, Generic, Type, TypeVar, Union, Dict, Optional

from sqlmodel import Session, SQLModel, select, func
from pydantic import BaseModel

ModelType = TypeVar("ModelType", bound=SQLModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).
        
        **Parameters**
        * `model`: A SQLModel model class
        * `schema`: A Pydantic model (schema) class
        """
        self.model = model

    def get(self, session: Session, id: uuid.UUID) -> Optional[ModelType]:
        """Get a single record by ID"""
        statement = select(self.model).where(self.model.id == id)
        return session.exec(statement).first()

    def get_multi(
        self, session: Session, *, skip: int = 0, limit: int = 100
    ) -> tuple[list[ModelType], int]:
        """Get multiple records with pagination"""
        count_statement = select(func.count()).select_from(self.model)
        count = session.exec(count_statement).one()
        
        statement = select(self.model).offset(skip).limit(limit)
        items = session.exec(statement).all()
        return list(items), count

    def create(self, session: Session, *, obj_in: CreateSchemaType, **kwargs) -> ModelType:
        """Create a new record"""
        obj_in_data = obj_in.model_dump()
        obj_in_data.update(kwargs)
        db_obj = self.model(**obj_in_data)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    def update(
        self,
        session: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Update an existing record"""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        db_obj.sqlmodel_update(update_data)
        session.add(db_obj)
        session.commit()
        session.refresh(db_obj)
        return db_obj

    def remove(self, session: Session, *, id: uuid.UUID) -> Optional[ModelType]:
        """Delete a record by ID"""
        obj = self.get(session=session, id=id)
        if obj:
            session.delete(obj)
            session.commit()
            return obj
        return None
