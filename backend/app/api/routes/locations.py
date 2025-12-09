"""
Location API routes.
Handles endpoints for countries, states, and cities.
"""

import uuid
from typing import Any, Optional
from fastapi import APIRouter, HTTPException, Query

from app.api.deps import CurrentUser, SessionDep
from app.crud.crud_location import country_crud, state_crud, city_crud
from app.models import Message
from app.models.location import (
    Country, CountryCreate, CountryPublic, CountriesPublic, CountryUpdate,
    State, StateCreate, StatePublic, StatesPublic, StateUpdate, StateWithCountryPublic, StatesWithCountryPublic,
    City, CityCreate, CityPublic, CitiesPublic, CityUpdate, CityWithDetailsPublic, CitiesWithDetailsPublic,
    LocationData, CountrySimple, StateSimple, CitySimple
)

router = APIRouter(prefix="/locations", tags=["locations"])

# ====================
# COUNTRIES ENDPOINTS
# ====================

@router.get("/countries", response_model=CountriesPublic)
def read_countries(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search countries by name"),
    active_only: bool = Query(True, description="Filter active countries only")
) -> Any:
    """
    Retrieve countries with pagination and search.
    """
    if search:
        countries, count = country_crud.search_by_name(
            session=session, name=search, skip=skip, limit=limit
        )
    elif active_only:
        countries, count = country_crud.get_active(
            session=session, skip=skip, limit=limit
        )
    else:
        countries, count = country_crud.get_multi(
            session=session, skip=skip, limit=limit
        )
    
    return CountriesPublic(data=countries, count=count)


@router.get("/countries/{country_code}", response_model=CountryPublic)
def read_country_by_code(
    session: SessionDep, country_code: str
) -> Any:
    """
    Get country by ISO code.
    """
    country = country_crud.get_by_code(session=session, code=country_code)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return country


@router.post("/countries", response_model=CountryPublic)
def create_country(
    *, session: SessionDep, current_user: CurrentUser, country_in: CountryCreate
) -> Any:
    """
    Create new country. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if country with this code already exists
    existing_country = country_crud.get_by_code(session=session, code=country_in.code)
    if existing_country:
        raise HTTPException(
            status_code=400,
            detail="Country with this code already exists"
        )
    
    country = country_crud.create(session=session, obj_in=country_in)
    return country


@router.put("/countries/{country_id}", response_model=CountryPublic)
def update_country(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    country_id: uuid.UUID,
    country_in: CountryUpdate
) -> Any:
    """
    Update country. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    country = country_crud.get(session=session, id=country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    
    # If updating code, check for conflicts
    if country_in.code and country_in.code != country.code:
        existing_country = country_crud.get_by_code(session=session, code=country_in.code)
        if existing_country:
            raise HTTPException(
                status_code=400,
                detail="Country with this code already exists"
            )
    
    country = country_crud.update(session=session, db_obj=country, obj_in=country_in)
    return country


@router.delete("/countries/{country_id}", response_model=Message)
def delete_country(
    session: SessionDep, current_user: CurrentUser, country_id: uuid.UUID
) -> Any:
    """
    Delete country. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    country = country_crud.get(session=session, id=country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    
    country_crud.remove(session=session, id=country_id)
    return Message(message="Country deleted successfully")


# ====================
# STATES ENDPOINTS
# ====================

@router.get("/states", response_model=StatesWithCountryPublic)
def read_states(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    country_id: Optional[uuid.UUID] = Query(None, description="Filter states by country ID"),
    country_code: Optional[str] = Query(None, description="Filter states by country code"),
    search: Optional[str] = Query(None, description="Search states by name")
) -> Any:
    """
    Retrieve states with pagination and search.
    """
    if search:
        # Handle country filtering for search
        filter_country_id = None
        if country_code:
            country = country_crud.get_by_code(session=session, code=country_code)
            filter_country_id = country.id if country else None
        elif country_id:
            filter_country_id = country_id
            
        states, count = state_crud.search_by_name(
            session=session, name=search, country_id=filter_country_id, skip=skip, limit=limit
        )
        # Get states with country info
        states_with_country = []
        for state in states:
            country = country_crud.get(session=session, id=state.country_id)
            state_dict = state.model_dump()
            state_dict["country"] = country.model_dump() if country else None
            states_with_country.append(StateWithCountryPublic(**state_dict))
        
        return StatesWithCountryPublic(data=states_with_country, count=count)
    elif country_id:
        states, count = state_crud.get_by_country(
            session=session, country_id=country_id, skip=skip, limit=limit
        )
        country = country_crud.get(session=session, id=country_id)
        states_with_country = []
        for state in states:
            state_dict = state.model_dump()
            state_dict["country"] = country.model_dump() if country else None
            states_with_country.append(StateWithCountryPublic(**state_dict))
        
        return StatesWithCountryPublic(data=states_with_country, count=count)
    elif country_code:
        states, count = state_crud.get_by_country_code(
            session=session, country_code=country_code, skip=skip, limit=limit
        )
        country = country_crud.get_by_code(session=session, code=country_code)
        states_with_country = []
        for state in states:
            state_dict = state.model_dump()
            state_dict["country"] = country.model_dump() if country else None
            states_with_country.append(StateWithCountryPublic(**state_dict))
        
        return StatesWithCountryPublic(data=states_with_country, count=count)
    else:
        # Get all states with country info
        results, count = state_crud.get_with_country_info(
            session=session, skip=skip, limit=limit
        )
        states_with_country = []
        for state, country_name in results:
            # Get full country object
            country = country_crud.get(session=session, id=state.country_id)
            state_dict = state.model_dump()
            state_dict["country"] = country.model_dump() if country else None
            states_with_country.append(StateWithCountryPublic(**state_dict))
        
        return StatesWithCountryPublic(data=states_with_country, count=count)


@router.post("/states", response_model=StatePublic)
def create_state(
    *, session: SessionDep, current_user: CurrentUser, state_in: StateCreate
) -> Any:
    """
    Create new state. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify country exists
    country = country_crud.get(session=session, id=state_in.country_id)
    if not country:
        raise HTTPException(status_code=400, detail="Country not found")
    
    state = state_crud.create(session=session, obj_in=state_in)
    return state


@router.put("/states/{state_id}", response_model=StatePublic)
def update_state(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    state_id: uuid.UUID,
    state_in: StateUpdate
) -> Any:
    """
    Update state. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    state = state_crud.get(session=session, id=state_id)
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    
    # If updating country_id, verify it exists
    if state_in.country_id:
        country = country_crud.get(session=session, id=state_in.country_id)
        if not country:
            raise HTTPException(status_code=400, detail="Country not found")
    
    state = state_crud.update(session=session, db_obj=state, obj_in=state_in)
    return state


@router.delete("/states/{state_id}", response_model=Message)
def delete_state(
    session: SessionDep, current_user: CurrentUser, state_id: uuid.UUID
) -> Any:
    """
    Delete state. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    state = state_crud.get(session=session, id=state_id)
    if not state:
        raise HTTPException(status_code=404, detail="State not found")
    
    state_crud.remove(session=session, id=state_id)
    return Message(message="State deleted successfully")


# ====================
# CITIES ENDPOINTS
# ====================

@router.get("/cities", response_model=CitiesWithDetailsPublic)
def read_cities(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    country_code: Optional[str] = Query(None, description="Filter cities by country code"),
    state_code: Optional[str] = Query(None, description="Filter cities by state code"),
    country_id: Optional[uuid.UUID] = Query(None, description="Filter cities by country ID"),
    state_id: Optional[uuid.UUID] = Query(None, description="Filter cities by state ID"),
    search: Optional[str] = Query(None, description="Search cities by name"),
    popular: bool = Query(False, description="Sort by population (most populous first)")
) -> Any:
    """
    Retrieve cities with pagination and search.
    """
    if search:
        print("Search cities by name:", search)
        # Convert country_code to country_id if provided
        filter_country_id = None
        if country_id:
            filter_country_id = country_id
        elif country_code:
            country = country_crud.get_by_code(session=session, code=country_code)
            filter_country_id = country.id if country else None

        # Convert state_code to state_id if provided
        filter_state_id = None
        if state_id:
            filter_state_id = state_id
        elif state_code:
            if filter_country_id:
                # If we have country_id, search for state within that country
                states, _ = state_crud.get_by_country(session=session, country_id=filter_country_id)
                for s in states:
                    if s.code and s.code.upper() == state_code.upper():
                        filter_state_id = s.id
                        break
            else:
                # If no country_id, search for state by code alone
                state = state_crud.get_by_code(session=session, code=state_code)
                filter_state_id = state.id if state else None

        cities, count = city_crud.search_by_name(
            session=session, name=search, country_id=filter_country_id,
            state_id=filter_state_id, skip=skip, limit=limit
        )
    elif popular:
        print("Popular cities:", popular)
        # Convert country_code to country_id if provided
        filter_country_id = None
        if country_id:
            filter_country_id = country_id
        elif country_code:
            country = country_crud.get_by_code(session=session, code=country_code)
            filter_country_id = country.id if country else None

        filter_state_id = None
        if state_id:
            filter_state_id = state_id
        elif state_code:
            if filter_country_id:
                # If we have country_id, search for state within that country
                states, _ = state_crud.get_by_country(session=session, country_id=filter_country_id)
                for s in states:
                    if s.code and s.code.upper() == state_code.upper():
                        filter_state_id = s.id
                        break
            else:
                # If no country_id, search for state by code alone
                state = state_crud.get_by_code(session=session, code=state_code)
                filter_state_id = state.id if state else None

        cities, count = city_crud.get_popular_cities(
            session=session, country_id=filter_country_id, state_id=filter_state_id, skip=skip, limit=limit
        )
    elif (country_code and state_code) or (country_id and state_id) or (country_code and state_id) or (country_id and state_code):
        print("Country and state filtering with codes/IDs")
        # Handle combinations of country/state filtering by code or ID
        filter_country_id = None
        if country_id:
            filter_country_id = country_id
        elif country_code:
            country = country_crud.get_by_code(session=session, code=country_code)
            filter_country_id = country.id if country else None

        if not filter_country_id:
            return CitiesWithDetailsPublic(data=[], count=0)
            
        filter_state_id = None
        if state_id:
            # Verify state belongs to the country
            state = state_crud.get(session=session, id=state_id)
            if state and state.country_id == filter_country_id:
                filter_state_id = state_id
        elif state_code:
            states, _ = state_crud.get_by_country(session=session, country_id=filter_country_id)
            for s in states:
                if s.code and s.code.upper() == state_code.upper():
                    filter_state_id = s.id
                    break

        if not filter_state_id:
            return CitiesWithDetailsPublic(data=[], count=0)
            
        cities, count = city_crud.get_by_state(session=session, state_id=filter_state_id, skip=skip, limit=limit)
    elif state_code or state_id:
        print("State filtering only")
        # Filter by state_code or state_id alone
        filter_state_id = None
        if state_id:
            filter_state_id = state_id
        elif state_code:
            state = state_crud.get_by_code(session=session, code=state_code)
            filter_state_id = state.id if state else None

        if not filter_state_id:
            return CitiesWithDetailsPublic(data=[], count=0)

        cities, count = city_crud.get_by_state(session=session, state_id=filter_state_id, skip=skip, limit=limit)
    elif country_code or country_id:
        print("Country filtering only")
        # Filter by country_code or country_id alone
        filter_country_id = None
        if country_id:
            filter_country_id = country_id
        elif country_code:
            country = country_crud.get_by_code(session=session, code=country_code)
            filter_country_id = country.id if country else None

        if not filter_country_id:
            return CitiesWithDetailsPublic(data=[], count=0)
            
        cities, count = city_crud.get_by_country(session=session, country_id=filter_country_id, skip=skip, limit=limit)
    else:
        # Get all cities with details
        results, count = city_crud.get_with_details(session=session, skip=skip, limit=limit)
        cities_with_details = []
        for city, country_name, state_name in results:
            # Get full country and state objects for the response
            country = country_crud.get(session=session, id=city.country_id)
            state = None
            if city.state_id:
                state = state_crud.get(session=session, id=city.state_id)
            
            city_dict = city.model_dump()
            city_dict["country"] = country.model_dump() if country else None
            city_dict["state"] = state.model_dump() if state else None
            cities_with_details.append(CityWithDetailsPublic(**city_dict))
        
        return CitiesWithDetailsPublic(data=cities_with_details, count=count)
    
    # Process cities to include country and state details
    cities_with_details = []
    for city in cities:
        # Get country details
        country = country_crud.get(session=session, id=city.country_id)
        # Get state details if state_id exists
        state = None
        if city.state_id:
            state = state_crud.get(session=session, id=city.state_id)
        
        city_dict = city.model_dump()
        city_dict["country"] = country.model_dump() if country else None
        city_dict["state"] = state.model_dump() if state else None
        cities_with_details.append(CityWithDetailsPublic(**city_dict))
    
    return CitiesWithDetailsPublic(data=cities_with_details, count=count)


@router.get("/cities/nearby", response_model=CitiesWithDetailsPublic)
def read_nearby_cities(
    session: SessionDep,
    latitude: float = Query(..., description="Latitude coordinate"),
    longitude: float = Query(..., description="Longitude coordinate"),
    radius_km: float = Query(50.0, description="Search radius in kilometers"),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Get cities near specified coordinates.
    """
    cities, count = city_crud.get_by_coordinates(
        session=session, latitude=latitude, longitude=longitude,
        radius_km=radius_km, skip=skip, limit=limit
    )
    
    cities_with_details = []
    for city in cities:
        # Get country details
        country = country_crud.get(session=session, id=city.country_id)
        # Get state details if state_id exists
        state = None
        if city.state_id:
            state = state_crud.get(session=session, id=city.state_id)
        
        city_dict = city.model_dump()
        city_dict["country"] = country.model_dump() if country else None
        city_dict["state"] = state.model_dump() if state else None
        cities_with_details.append(CityWithDetailsPublic(**city_dict))
    
    return CitiesWithDetailsPublic(data=cities_with_details, count=count)


@router.post("/cities", response_model=CityPublic)
def create_city(
    *, session: SessionDep, current_user: CurrentUser, city_in: CityCreate
) -> Any:
    """
    Create new city. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify country exists
    country = country_crud.get(session=session, id=city_in.country_id)
    if not country:
        raise HTTPException(status_code=400, detail="Country not found")
    
    # If state_id provided, verify it exists and belongs to the country
    if city_in.state_id:
        state = state_crud.get(session=session, id=city_in.state_id)
        if not state:
            raise HTTPException(status_code=400, detail="State not found")
        if state.country_id != city_in.country_id:
            raise HTTPException(status_code=400, detail="State does not belong to the specified country")
    
    city = city_crud.create(session=session, obj_in=city_in)
    return city


@router.put("/cities/{city_id}", response_model=CityPublic)
def update_city(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    city_id: uuid.UUID,
    city_in: CityUpdate
) -> Any:
    """
    Update city. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    city = city_crud.get(session=session, id=city_id)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    # If updating country_id, verify it exists
    if city_in.country_id:
        country = country_crud.get(session=session, id=city_in.country_id)
        if not country:
            raise HTTPException(status_code=400, detail="Country not found")
    
    # If updating state_id, verify it exists and belongs to the country
    if city_in.state_id:
        state = state_crud.get(session=session, id=city_in.state_id)
        if not state:
            raise HTTPException(status_code=400, detail="State not found")
        
        # Use the new country_id if provided, otherwise use existing
        country_id = city_in.country_id or city.country_id
        if state.country_id != country_id:
            raise HTTPException(status_code=400, detail="State does not belong to the specified country")
    
    city = city_crud.update(session=session, db_obj=city, obj_in=city_in)
    return city


@router.delete("/cities/{city_id}", response_model=Message)
def delete_city(
    session: SessionDep, current_user: CurrentUser, city_id: uuid.UUID
) -> Any:
    """
    Delete city. Admin only.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    city = city_crud.get(session=session, id=city_id)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    
    city_crud.remove(session=session, id=city_id)
    return Message(message="City deleted successfully")


# ====================
# BULK DATA ENDPOINTS (Mobile Optimized)
# ====================

@router.get("/bulk", response_model=LocationData)
def get_bulk_location_data(
    session: SessionDep,
    country_codes: Optional[str] = Query(None, description="Comma-separated country codes to filter")
) -> Any:
    """
    Get bulk location data optimized for mobile apps.
    Returns simplified location data for dropdowns and forms.
    """
    # Parse country codes if provided
    filter_countries = None
    if country_codes:
        filter_countries = [code.strip().upper() for code in country_codes.split(",")]
    
    # Get countries
    countries_data = []
    if filter_countries:
        for code in filter_countries:
            country = country_crud.get_by_code(session=session, code=code)
            if country and country.is_active:
                countries_data.append(CountrySimple(
                    id=country.id,
                    code=country.code, 
                    name=country.name
                ))
    else:
        countries, _ = country_crud.get_active(session=session, skip=0, limit=1000)
        countries_data = [CountrySimple(
            id=c.id,
            code=c.code, 
            name=c.name
        ) for c in countries]
    
    # Get states for filtered countries
    states_data = []
    cities_data = []
    
    for country_simple in countries_data:
        # Get states for this country
        states, _ = state_crud.get_by_country(
            session=session, country_id=country_simple.id, skip=0, limit=1000
        )
        for state in states:
            states_data.append(StateSimple(
                id=state.id,
                code=state.code,
                name=state.name,
                country_id=state.country_id
            ))
        
        # Get major cities for this country (limit to 100 most populous)
        cities, _ = city_crud.get_popular_cities(
            session=session, country_id=country_simple.id, skip=0, limit=100
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
