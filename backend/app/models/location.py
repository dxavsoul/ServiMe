"""
Location-related models and schemas.
All location-related database models, API schemas, and related functionality.
"""

import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from .base import BasePublicList

if TYPE_CHECKING:
    from .company import Company
    from .branch import Branch


# Base location models
class CountryBase(SQLModel):
    """Base country model with shared properties."""
    name: str = Field(min_length=1, max_length=100, unique=True, index=True)
    code: str = Field(min_length=2, max_length=3, unique=True, index=True, description="ISO country code (e.g., US, CA, MX)")
    is_active: bool = True


class StateBase(SQLModel):
    """Base state/province model with shared properties."""
    name: str = Field(min_length=1, max_length=100, index=True)
    code: Optional[str] = Field(default=None, max_length=10, description="State/Province code (e.g., CA, NY, ON)")
    country_id: uuid.UUID = Field(foreign_key="country.id", index=True)
    is_active: bool = True


class CityBase(SQLModel):
    """Base city model with shared properties."""
    name: str = Field(min_length=1, max_length=100, index=True)
    state_id: Optional[uuid.UUID] = Field(default=None, foreign_key="state.id", index=True)
    country_id: uuid.UUID = Field(foreign_key="country.id", index=True)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="City latitude coordinate (-90 to 90)")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="City longitude coordinate (-180 to 180)")
    population: Optional[int] = Field(default=None, ge=0, description="City population")
    is_active: bool = True


# Database models
class Country(CountryBase, table=True):
    """Country database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    states: List["State"] = Relationship(back_populates="country")
    cities: List["City"] = Relationship(back_populates="country")


class State(StateBase, table=True):
    """State/Province database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    country: "Country" = Relationship(back_populates="states")
    cities: List["City"] = Relationship(back_populates="state")


class City(CityBase, table=True):
    """City database model."""
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Relationships
    country: "Country" = Relationship(back_populates="cities")
    state: Optional["State"] = Relationship(back_populates="cities")
    companies: List["Company"] = Relationship(back_populates="location_city")
    branches: List["Branch"] = Relationship(back_populates="location_city")


# Create schemas
class CountryCreate(CountryBase):
    """Schema for country creation via API."""
    pass


class CountryUpdate(CountryBase):
    """Schema for country updates via API."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)  # type: ignore
    code: Optional[str] = Field(default=None, min_length=2, max_length=3)  # type: ignore


class StateCreate(StateBase):
    """Schema for state creation via API."""
    pass


class StateUpdate(StateBase):
    """Schema for state updates via API."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)  # type: ignore
    code: Optional[str] = Field(default=None, max_length=10)  # type: ignore
    country_id: Optional[uuid.UUID] = Field(default=None)  # type: ignore


class CityCreate(CityBase):
    """Schema for city creation via API."""
    pass


class CityUpdate(CityBase):
    """Schema for city updates via API."""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)  # type: ignore
    state_id: Optional[uuid.UUID] = Field(default=None)  # type: ignore
    country_id: Optional[uuid.UUID] = Field(default=None)  # type: ignore


# Public schemas for API responses
class CountryPublic(CountryBase):
    """Public country schema for API responses."""
    id: uuid.UUID


class StatePublic(StateBase):
    """Public state schema for API responses."""
    id: uuid.UUID


class CityPublic(CityBase):
    """Public city schema for API responses."""
    id: uuid.UUID


# Detailed schemas with relationships
class CountryWithStatesPublic(CountryPublic):
    """Country schema with states information for API responses."""
    states: List[StatePublic] = []


class StateWithCountryPublic(StatePublic):
    """State schema with country information for API responses."""
    country: CountryPublic


class CityWithDetailsPublic(CityPublic):
    """City schema with country and state information for API responses."""
    country: CountryPublic
    state: Optional[StatePublic] = None


# Collection schemas
class CountriesPublic(BasePublicList):
    """Schema for paginated country list responses."""
    data: List[CountryPublic]


class CountriesWithStatesPublic(BasePublicList):
    """Schema for paginated country list responses with states information."""
    data: List[CountryWithStatesPublic]


class StatesPublic(BasePublicList):
    """Schema for paginated state list responses."""
    data: List[StatePublic]


class StatesWithCountryPublic(BasePublicList):
    """Schema for paginated state list responses with country information."""
    data: List[StateWithCountryPublic]


class CitiesPublic(BasePublicList):
    """Schema for paginated city list responses."""
    data: List[CityPublic]


class CitiesWithDetailsPublic(BasePublicList):
    """Schema for paginated city list responses with detailed information."""
    data: List[CityWithDetailsPublic]


# Bulk data schemas for mobile optimization
class CountrySimple(SQLModel):
    """Simplified country schema for mobile apps."""
    id: uuid.UUID
    code: str
    name: str


class StateSimple(SQLModel):
    """Simplified state schema for mobile apps."""
    id: uuid.UUID
    code: Optional[str]
    name: str
    country_id: uuid.UUID


class CitySimple(SQLModel):
    """Simplified city schema for mobile apps."""
    id: uuid.UUID
    name: str
    state_id: Optional[uuid.UUID]
    country_id: uuid.UUID
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class LocationData(SQLModel):
    """Bulk location data for mobile apps."""
    countries: List[CountrySimple]
    states: List[StateSimple]
    cities: List[CitySimple]
