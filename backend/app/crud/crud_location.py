"""
CRUD operations for location models.
"""

import uuid
from typing import Any, List, Optional, Tuple
from sqlmodel import Session, select, func, or_

from app.crud.base import CRUDBase
from app.models.location import (
    Country, CountryCreate, CountryUpdate,
    State, StateCreate, StateUpdate,
    City, CityCreate, CityUpdate
)


class CRUDCountry(CRUDBase[Country, CountryCreate, CountryUpdate]):
    def get_by_code(self, session: Session, *, code: str) -> Optional[Country]:
        """Get country by ISO code."""
        statement = select(Country).where(Country.code == code.upper())
        return session.exec(statement).first()

    def get_active(self, session: Session, *, skip: int = 0, limit: int = 100) -> Tuple[List[Country], int]:
        """Get active countries with pagination."""
        count_statement = select(func.count()).select_from(Country).where(Country.is_active == True)
        count = session.exec(count_statement).one()
        
        statement = (
            select(Country)
            .where(Country.is_active == True)
            .order_by(Country.name)
            .offset(skip)
            .limit(limit)
        )
        countries = session.exec(statement).all()
        return countries, count

    def search_by_name(self, session: Session, *, name: str, skip: int = 0, limit: int = 100) -> Tuple[List[Country], int]:
        """Search countries by name."""
        search_filter = Country.name.ilike(f"%{name}%")
        
        count_statement = (
            select(func.count())
            .select_from(Country)
            .where(Country.is_active == True)
            .where(search_filter)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(Country)
            .where(Country.is_active == True)
            .where(search_filter)
            .order_by(Country.name)
            .offset(skip)
            .limit(limit)
        )
        countries = session.exec(statement).all()
        return countries, count


class CRUDState(CRUDBase[State, StateCreate, StateUpdate]):
    def get_by_code(self, session: Session, *, code: str) -> Optional[State]:
        """Get state by code."""
        statement = select(State).where(State.code == code.upper())
        return session.exec(statement).first()

    def get_by_country(self, session: Session, *, country_id: uuid.UUID, skip: int = 0, limit: int = 100) -> Tuple[List[State], int]:
        """Get states by country ID."""
        count_statement = (
            select(func.count())
            .select_from(State)
            .where(State.country_id == country_id)
            .where(State.is_active == True)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(State)
            .where(State.country_id == country_id)
            .where(State.is_active == True)
            .order_by(State.name)
            .offset(skip)
            .limit(limit)
        )
        states = session.exec(statement).all()
        return states, count

    def get_by_country_code(self, session: Session, *, country_code: str, skip: int = 0, limit: int = 100) -> Tuple[List[State], int]:
        """Get states by country code (convenience method)."""
        # First get the country by code
        country = session.exec(select(Country).where(Country.code == country_code.upper())).first()
        if not country:
            return [], 0
        
        return self.get_by_country(session, country_id=country.id, skip=skip, limit=limit)

    def get_with_country_info(self, session: Session, *, skip: int = 0, limit: int = 100) -> Tuple[List[Tuple[State, str]], int]:
        """Get states with country information."""
        count_statement = (
            select(func.count())
            .select_from(State)
            .join(Country, State.country_id == Country.id)
            .where(State.is_active == True)
            .where(Country.is_active == True)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(State, Country.name)
            .join(Country, State.country_id == Country.id)
            .where(State.is_active == True)
            .where(Country.is_active == True)
            .order_by(Country.name, State.name)
            .offset(skip)
            .limit(limit)
        )
        results = session.exec(statement).all()
        return results, count

    def search_by_name(self, session: Session, *, name: str, country_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[State], int]:
        """Search states by name, optionally filtered by country."""
        search_filter = State.name.ilike(f"%{name}%")
        
        conditions = [State.is_active == True, search_filter]
        if country_id:
            conditions.append(State.country_id == country_id)
        
        count_statement = (
            select(func.count())
            .select_from(State)
            .where(*conditions)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(State)
            .where(*conditions)
            .order_by(State.name)
            .offset(skip)
            .limit(limit)
        )
        states = session.exec(statement).all()
        return states, count


class CRUDCity(CRUDBase[City, CityCreate, CityUpdate]):
    def get_by_country(self, session: Session, *, country_id: uuid.UUID, skip: int = 0, limit: int = 100) -> Tuple[List[City], int]:
        """Get cities by country ID."""
        count_statement = (
            select(func.count())
            .select_from(City)
            .where(City.country_id == country_id)
            .where(City.is_active == True)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(City)
            .where(City.country_id == country_id)
            .where(City.is_active == True)
            .order_by(City.name)
            .offset(skip)
            .limit(limit)
        )
        cities = session.exec(statement).all()
        return cities, count

    def get_by_country_code(self, session: Session, *, country_code: str, skip: int = 0, limit: int = 100) -> Tuple[List[City], int]:
        """Get cities by country code (convenience method)."""
        # First get the country by code
        country = session.exec(select(Country).where(Country.code == country_code.upper())).first()
        if not country:
            return [], 0
        
        return self.get_by_country(session, country_id=country.id, skip=skip, limit=limit)

    def get_by_state(self, session: Session, *, state_id: uuid.UUID, skip: int = 0, limit: int = 100) -> Tuple[List[City], int]:
        """Get cities by state ID."""
        count_statement = (
            select(func.count())
            .select_from(City)
            .where(City.state_id == state_id)
            .where(City.is_active == True)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(City)
            .where(City.state_id == state_id)
            .where(City.is_active == True)
            .order_by(City.name)
            .offset(skip)
            .limit(limit)
        )
        cities = session.exec(statement).all()
        return cities, count

    def get_by_state_code(self, session: Session, *, state_code: str, country_code: str, skip: int = 0, limit: int = 100) -> Tuple[List[City], int]:
        """Get cities by state and country code (convenience method)."""
        # First get the state by code and country
        state = session.exec(
            select(State)
            .join(Country, State.country_id == Country.id)
            .where(State.code == state_code.upper())
            .where(Country.code == country_code.upper())
        ).first()
        if not state:
            return [], 0
        
        return self.get_by_state(session, state_id=state.id, skip=skip, limit=limit)

    def get_with_details(self, session: Session, *, skip: int = 0, limit: int = 100) -> Tuple[List[Tuple[City, str, Optional[str]]], int]:
        """Get cities with country and state information."""
        count_statement = (
            select(func.count())
            .select_from(City)
            .join(Country, City.country_id == Country.id)
            .outerjoin(State, City.state_id == State.id)
            .where(City.is_active == True)
            .where(Country.is_active == True)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(City, Country.name, State.name)
            .join(Country, City.country_id == Country.id)
            .outerjoin(State, City.state_id == State.id)
            .where(City.is_active == True)
            .where(Country.is_active == True)
            .order_by(Country.name, State.name, City.name)
            .offset(skip)
            .limit(limit)
        )
        results = session.exec(statement).all()
        return results, count

    def search_by_name(
        self, 
        session: Session, 
        *, 
        name: str, 
        country_id: Optional[uuid.UUID] = None,
        state_id: Optional[uuid.UUID] = None, 
        skip: int = 0, 
        limit: int = 100
    ) -> Tuple[List[City], int]:
        """Search cities by name, optionally filtered by country and/or state."""
        search_filter = City.name.ilike(f"%{name}%")
        
        conditions = [City.is_active == True, search_filter]
        if country_id:
            conditions.append(City.country_id == country_id)
        if state_id:
            conditions.append(City.state_id == state_id)
        
        count_statement = (
            select(func.count())
            .select_from(City)
            .where(*conditions)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(City)
            .where(*conditions)
            .order_by(City.name)
            .offset(skip)
            .limit(limit)
        )
        cities = session.exec(statement).all()
        return cities, count

    def get_by_coordinates(
        self, 
        session: Session, 
        *, 
        latitude: float, 
        longitude: float, 
        radius_km: float = 50.0,
        skip: int = 0, 
        limit: int = 100
    ) -> Tuple[List[City], int]:
        """Get cities within a certain radius of coordinates (approximate)."""
        lat_diff = radius_km / 111.0  # Rough conversion km to degrees
        lon_diff = radius_km / 111.0
        
        conditions = [
            City.is_active == True,
            City.latitude.is_not(None),
            City.longitude.is_not(None),
            City.latitude >= latitude - lat_diff,
            City.latitude <= latitude + lat_diff,
            City.longitude >= longitude - lon_diff,
            City.longitude <= longitude + lon_diff
        ]
        
        count_statement = (
            select(func.count())
            .select_from(City)
            .where(*conditions)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(City)
            .where(*conditions)
            .order_by(City.name)
            .offset(skip)
            .limit(limit)
        )
        cities = session.exec(statement).all()
        return cities, count

    def get_popular_cities(self, session: Session, *, country_id: Optional[uuid.UUID] = None, state_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100) -> Tuple[List[City], int]:
        """Get popular cities (by population), optionally filtered by country and/or state."""
        conditions = [
            City.is_active == True,
            City.population.is_not(None)
        ]
        if country_id:
            conditions.append(City.country_id == country_id)
        if state_id:
            conditions.append(City.state_id == state_id)

        count_statement = (
            select(func.count())
            .select_from(City)
            .where(*conditions)
        )
        count = session.exec(count_statement).one()
        
        statement = (
            select(City)
            .where(*conditions)
            .order_by(City.population.desc())
            .offset(skip)
            .limit(limit)
        )
        cities = session.exec(statement).all()
        return cities, count

    def get_popular_cities_by_country_code(self, session: Session, *, country_code: str, skip: int = 0, limit: int = 100) -> Tuple[List[City], int]:
        """Get popular cities by country code (convenience method)."""
        # First get the country by code
        country = session.exec(select(Country).where(Country.code == country_code.upper())).first()
        if not country:
            return [], 0
        
        return self.get_popular_cities(session, country_id=country.id, skip=skip, limit=limit)


# Create instances
country_crud = CRUDCountry(Country)
state_crud = CRUDState(State)
city_crud = CRUDCity(City)
