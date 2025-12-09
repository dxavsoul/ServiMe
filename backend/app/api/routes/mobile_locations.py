"""
Mobile-specific location API routes.
Optimized endpoints for mobile apps to get location data.
"""

from typing import Any, Optional
from fastapi import APIRouter, Query

from app.api.deps import SessionDep
from app.crud.crud_location import country_crud, state_crud, city_crud
from app.models.location import LocationData, CountrySimple, StateSimple, CitySimple

router = APIRouter(prefix="/mobile/locations", tags=["mobile-locations"])


@router.get("/countries", response_model=list[CountrySimple])
def get_countries_mobile(session: SessionDep) -> Any:
    """
    Get all active countries for mobile apps (simplified format).
    """
    countries, _ = country_crud.get_active(session=session, skip=0, limit=300)
    return [CountrySimple(id=c.id, code=c.code, name=c.name) for c in countries]


@router.get("/states", response_model=list[StateSimple])
def get_states_mobile(
    session: SessionDep,
    country_code: Optional[str] = Query(None, description="Filter states by country code")
) -> Any:
    """
    Get states for mobile apps (simplified format).
    """
    if country_code:
        states, _ = state_crud.get_by_country_code(
            session=session, country_code=country_code, skip=0, limit=500
        )
    else:
        states, _ = state_crud.get_multi(session=session, skip=0, limit=1000)
    
    return [
        StateSimple(
            id=s.id,
            code=s.code,
            name=s.name,
            country_id=s.country_id
        ) for s in states if s.is_active
    ]


@router.get("/cities", response_model=list[CitySimple])
def get_cities_mobile(
    session: SessionDep,
    country_code: Optional[str] = Query(None, description="Filter cities by country code"),
    state_code: Optional[str] = Query(None, description="Filter cities by state code"),
    popular: bool = Query(False, description="Get most populous cities only"),
    limit: int = Query(100, le=500, description="Maximum number of cities to return")
) -> Any:
    """
    Get cities for mobile apps (simplified format).
    """
    if popular and country_code:
        cities, _ = city_crud.get_popular_cities_by_country_code(
            session=session, country_code=country_code, skip=0, limit=limit
        )
    elif popular:
        # Get popular cities from all countries
        cities, _ = city_crud.get_popular_cities(
            session=session, skip=0, limit=limit
        )
    elif country_code and state_code:
        cities, _ = city_crud.get_by_state_code(
            session=session, state_code=state_code, country_code=country_code,
            skip=0, limit=limit
        )
    elif country_code:
        cities, _ = city_crud.get_by_country_code(
            session=session, country_code=country_code, skip=0, limit=limit
        )
    else:
        cities, _ = city_crud.get_multi(session=session, skip=0, limit=limit)
    
    return [
        CitySimple(
            id=c.id,
            name=c.name,
            state_id=c.state_id,
            country_id=c.country_id,
            latitude=c.latitude,
            longitude=c.longitude
        ) for c in cities if c.is_active
    ]


@router.get("/nearby-cities", response_model=list[CitySimple])
def get_nearby_cities_mobile(
    session: SessionDep,
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    radius_km: float = Query(50.0, description="Search radius in kilometers"),
    limit: int = Query(50, le=100, description="Maximum number of cities to return")
) -> Any:
    """
    Get nearby cities for mobile apps (simplified format).
    """
    cities, _ = city_crud.get_by_coordinates(
        session=session, latitude=latitude, longitude=longitude,
        radius_km=radius_km, skip=0, limit=limit
    )
    
    return [
        CitySimple(
            id=c.id,
            name=c.name,
            state_id=c.state_id,
            country_id=c.country_id,
            latitude=c.latitude,
            longitude=c.longitude
        ) for c in cities
    ]


@router.get("/all", response_model=LocationData)
def get_all_locations_mobile(
    session: SessionDep,
    countries: Optional[str] = Query(None, description="Comma-separated country codes"),
    include_cities: bool = Query(True, description="Include cities in response"),
    cities_limit: int = Query(100, le=500, description="Max cities per country")
) -> Any:
    """
    Get comprehensive location data optimized for mobile apps.
    Returns all countries, states, and popular cities in a single request.
    """
    # Parse country filter
    country_filter = None
    if countries:
        country_filter = [code.strip().upper() for code in countries.split(",")]
    
    # Get countries
    if country_filter:
        countries_data = []
        for code in country_filter:
            country = country_crud.get_by_code(session=session, code=code)
            if country and country.is_active:
                countries_data.append(CountrySimple(id=country.id, code=country.code, name=country.name))
    else:
        countries_list, _ = country_crud.get_active(session=session, skip=0, limit=300)
        countries_data = [CountrySimple(id=c.id, code=c.code, name=c.name) for c in countries_list]
    
    # Get states and cities for the selected countries
    states_data = []
    cities_data = []
    
    for country in countries_data:
        # Get states for this country
        states, _ = state_crud.get_by_country_code(
            session=session, country_code=country.code, skip=0, limit=100
        )
        for state in states:
            if state.is_active:
                states_data.append(StateSimple(
                    id=state.id,
                    code=state.code,
                    name=state.name,
                    country_id=state.country_id
                ))
        
        # Get popular cities for this country if requested
        if include_cities:
            cities, _ = city_crud.get_popular_cities_by_country_code(
                session=session, country_code=country.code, 
                skip=0, limit=cities_limit
            )
            for city in cities:
                cities_data.append(CitySimple(
                    id=city.id,
                    name=city.name,
                    state_id=city.state_id,
                    country_id=city.country_id,
                    latitude=city.latitude,
                    longitude=city.longitude
                ))
    
    return LocationData(
        countries=countries_data,
        states=states_data,
        cities=cities_data
    )
