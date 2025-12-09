import logging
import uuid
from sqlmodel import Session, select

from app.core.db import engine, init_db
from app.models.location import Country, State, City
from app.models.industry_type import IndustryType
from app.models.category import Category

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def populate_industry_types(session: Session) -> None:
    """Populate the database with common industry types."""
    logger.info("🏭 Starting industry types population...")

    # Check if industry types already exist
    existing_industry_types = session.exec(select(IndustryType)).all()
    logger.info(f"Found {len(existing_industry_types)} existing industry types")

    if len(existing_industry_types) > 0:
        logger.info("✓ Industry types already exist, skipping population")
        return

    # Common industry types with codes and descriptions
    industry_types_data = [
        {
            "name": "Technology",
            "code": "TECH",
            "description": "Software development, IT services, and technology consulting"
        },
        {
            "name": "Healthcare",
            "code": "HEALTH",
            "description": "Medical services, hospitals, clinics, and healthcare providers"
        },
        {
            "name": "Finance",
            "code": "FIN",
            "description": "Banking, insurance, investment, and financial services"
        },
        {
            "name": "Retail",
            "code": "RETAIL",
            "description": "Retail stores, e-commerce, and consumer goods"
        },
        {
            "name": "Manufacturing",
            "code": "MFG",
            "description": "Production, assembly, and manufacturing of goods"
        },
        {
            "name": "Education",
            "code": "EDU",
            "description": "Schools, universities, training, and educational services"
        },
        {
            "name": "Food & Beverage",
            "code": "F&B",
            "description": "Restaurants, food service, and beverage industry"
        },
        {
            "name": "Construction",
            "code": "CONST",
            "description": "Building construction, infrastructure, and real estate development"
        },
        {
            "name": "Transportation",
            "code": "TRANS",
            "description": "Logistics, shipping, delivery, and transportation services"
        },
        {
            "name": "Entertainment",
            "code": "ENT",
            "description": "Media, entertainment, gaming, and creative services"
        },
        {
            "name": "Energy",
            "code": "ENERGY",
            "description": "Oil, gas, renewable energy, and utilities"
        },
        {
            "name": "Agriculture",
            "code": "AGRI",
            "description": "Farming, agriculture, and food production"
        },
        {
            "name": "Real Estate",
            "code": "RE",
            "description": "Property management, real estate sales, and development"
        },
        {
            "name": "Automotive",
            "code": "AUTO",
            "description": "Car manufacturing, automotive services, and dealerships"
        },
        {
            "name": "Telecommunications",
            "code": "TELECOM",
            "description": "Internet, phone services, and telecommunications"
        },
        {
            "name": "Professional Services",
            "code": "PROF",
            "description": "Consulting, legal, accounting, and business services"
        },
        {
            "name": "Government",
            "code": "GOV",
            "description": "Public sector and government organizations"
        },
        {
            "name": "Non-Profit",
            "code": "NPO",
            "description": "Non-profit organizations and charities"
        },
        {
            "name": "Tourism",
            "code": "TOUR",
            "description": "Travel, hospitality, and tourism services"
        },
        {
            "name": "Other",
            "code": "OTHER",
            "description": "Other industries not specified above"
        }
    ]

    logger.info("Adding industry types...")

    for industry_data in industry_types_data:
        industry_type = IndustryType(
            id=uuid.uuid4(),
            name=industry_data["name"],
            code=industry_data["code"],
            description=industry_data["description"],
            is_active=True
        )
        session.add(industry_type)
        logger.info(f"  + Added industry type: {industry_data['name']}")

    session.commit()
    logger.info(f"✅ Industry types processed: {len(industry_types_data)} total")


def populate_location_data(session: Session) -> None:
    """Populate countries, states, and cities in the database."""
    logger.info("🌍 Starting location data population...")

    # Check if we already have location data
    existing_countries = session.exec(select(Country)).all()
    logger.info(f"Found {len(existing_countries)} existing countries")

    # Countries data
    countries_data = [
        {'name': 'United States', 'code': 'US'},
        {'name': 'Canada', 'code': 'CA'},
        {'name': 'Mexico', 'code': 'MX'},
        {'name': 'Ecuador', 'code': 'EC'},
        {'name': 'United Kingdom', 'code': 'GB'},
        {'name': 'Germany', 'code': 'DE'},
        {'name': 'France', 'code': 'FR'},
        {'name': 'Spain', 'code': 'ES'},
        {'name': 'Italy', 'code': 'IT'},
        {'name': 'Brazil', 'code': 'BR'},
        {'name': 'Argentina', 'code': 'AR'},
        {'name': 'Australia', 'code': 'AU'},
        {'name': 'Japan', 'code': 'JP'},
        {'name': 'China', 'code': 'CN'},
        {'name': 'India', 'code': 'IN'},
        {'name': 'Russia', 'code': 'RU'},
    ]

    # Insert or update countries
    country_uuids = {}
    for country_data in countries_data:
        # Check if country already exists
        existing = session.exec(
            select(Country).where(Country.code == country_data['code'])
        ).first()

        if existing:
            logger.info(f"  ✓ Country {country_data['name']} already exists")
            country_uuids[country_data['code']] = existing.id
        else:
            # Create new country
            country = Country(
                id=uuid.uuid4(),
                name=country_data['name'],
                code=country_data['code'],
                is_active=True
            )
            session.add(country)
            session.flush()  # Get the ID
            country_uuids[country_data['code']] = country.id
            logger.info(f"  + Added country: {country_data['name']}")

    session.commit()
    logger.info(f"✅ Countries processed: {len(countries_data)} total")

    # US States data
    us_states_data = [
        {'name': 'California', 'code': 'CA'},
        {'name': 'New York', 'code': 'NY'},
        {'name': 'Texas', 'code': 'TX'},
        {'name': 'Florida', 'code': 'FL'},
        {'name': 'Illinois', 'code': 'IL'},
        {'name': 'Pennsylvania', 'code': 'PA'},
        {'name': 'Ohio', 'code': 'OH'},
        {'name': 'Georgia', 'code': 'GA'},
        {'name': 'North Carolina', 'code': 'NC'},
        {'name': 'Michigan', 'code': 'MI'},
        {'name': 'Arizona', 'code': 'AZ'},
        {'name': 'Washington', 'code': 'WA'},
    ]

    # Canadian Provinces
    ca_states_data = [
        {'name': 'Ontario', 'code': 'ON'},
        {'name': 'Quebec', 'code': 'QC'},
        {'name': 'British Columbia', 'code': 'BC'},
        {'name': 'Alberta', 'code': 'AB'},
        {'name': 'Manitoba', 'code': 'MB'},
        {'name': 'Saskatchewan', 'code': 'SK'},
    ]

    # Ecuador Provinces
    ec_states_data = [
        {'name': 'Pichincha', 'code': 'P'},
        {'name': 'Guayas', 'code': 'G'},
        {'name': 'Azuay', 'code': 'A'},
        {'name': 'Manabí', 'code': 'M'},
        {'name': 'Los Ríos', 'code': 'LR'},
        {'name': 'Tungurahua', 'code': 'T'},
        {'name': 'El Oro', 'code': 'EO'},
        {'name': 'Esmeraldas', 'code': 'E'},
        {'name': 'Loja', 'code': 'L'},
        {'name': 'Imbabura', 'code': 'I'},
        {'name': 'Chimborazo', 'code': 'C'},
        {'name': 'Cañar', 'code': 'CR'},
    ]

    # Insert states
    state_uuids = {}

    # US States
    if 'US' in country_uuids:
        us_country_id = country_uuids['US']
        for state_data in us_states_data:
            # Check if state already exists
            existing = session.exec(
                select(State).where(
                    State.code == state_data['code'],
                    State.country_id == us_country_id
                )
            ).first()

            if existing:
                logger.info(f"  ✓ State {state_data['name']} already exists")
                state_uuids[f"US-{state_data['code']}"] = existing.id
            else:
                state = State(
                    id=uuid.uuid4(),
                    name=state_data['name'],
                    code=state_data['code'],
                    country_id=us_country_id,
                    is_active=True
                )
                session.add(state)
                session.flush()
                state_uuids[f"US-{state_data['code']}"] = state.id
                logger.info(f"  + Added US state: {state_data['name']}")

    # Canadian Provinces
    if 'CA' in country_uuids:
        ca_country_id = country_uuids['CA']
        for state_data in ca_states_data:
            # Check if province already exists
            existing = session.exec(
                select(State).where(
                    State.code == state_data['code'],
                    State.country_id == ca_country_id
                )
            ).first()

            if existing:
                logger.info(f"  ✓ Province {state_data['name']} already exists")
                state_uuids[f"CA-{state_data['code']}"] = existing.id
            else:
                state = State(
                    id=uuid.uuid4(),
                    name=state_data['name'],
                    code=state_data['code'],
                    country_id=ca_country_id,
                    is_active=True
                )
                session.add(state)
                session.flush()
                state_uuids[f"CA-{state_data['code']}"] = state.id
                logger.info(f"  + Added Canadian province: {state_data['name']}")

    # Ecuador Provinces
    if 'EC' in country_uuids:
        ec_country_id = country_uuids['EC']
        for state_data in ec_states_data:
            # Check if province already exists
            existing = session.exec(
                select(State).where(
                    State.code == state_data['code'],
                    State.country_id == ec_country_id
                )
            ).first()

            if existing:
                logger.info(f"  ✓ Province {state_data['name']} already exists")
                state_uuids[f"EC-{state_data['code']}"] = existing.id
            else:
                state = State(
                    id=uuid.uuid4(),
                    name=state_data['name'],
                    code=state_data['code'],
                    country_id=ec_country_id,
                    is_active=True
                )
                session.add(state)
                session.flush()
                state_uuids[f"EC-{state_data['code']}"] = state.id
                logger.info(f"  + Added Ecuador province: {state_data['name']}")

    session.commit()
    logger.info(f"✅ States/Provinces processed: {len(us_states_data) + len(ca_states_data) + len(ec_states_data)} total")

    # Cities data
    cities_data = [
        # Major US Cities
        {'name': 'New York City', 'state_code': 'NY', 'country_code': 'US', 'latitude': 40.7128, 'longitude': -74.0060, 'population': 8336817},
        {'name': 'Los Angeles', 'state_code': 'CA', 'country_code': 'US', 'latitude': 34.0522, 'longitude': -118.2437, 'population': 3979576},
        {'name': 'Chicago', 'state_code': 'IL', 'country_code': 'US', 'latitude': 41.8781, 'longitude': -87.6298, 'population': 2693976},
        {'name': 'Houston', 'state_code': 'TX', 'country_code': 'US', 'latitude': 29.7604, 'longitude': -95.3698, 'population': 2320268},
        {'name': 'Phoenix', 'state_code': 'AZ', 'country_code': 'US', 'latitude': 33.4484, 'longitude': -112.0740, 'population': 1680992},
        {'name': 'Philadelphia', 'state_code': 'PA', 'country_code': 'US', 'latitude': 39.9526, 'longitude': -75.1652, 'population': 1584064},
        {'name': 'San Antonio', 'state_code': 'TX', 'country_code': 'US', 'latitude': 29.4241, 'longitude': -98.4936, 'population': 1547253},
        {'name': 'San Diego', 'state_code': 'CA', 'country_code': 'US', 'latitude': 32.7157, 'longitude': -117.1611, 'population': 1423851},
        {'name': 'Dallas', 'state_code': 'TX', 'country_code': 'US', 'latitude': 32.7767, 'longitude': -96.7970, 'population': 1343573},
        {'name': 'San Jose', 'state_code': 'CA', 'country_code': 'US', 'latitude': 37.3382, 'longitude': -121.8863, 'population': 1021795},

        # Canadian Cities
        {'name': 'Toronto', 'state_code': 'ON', 'country_code': 'CA', 'latitude': 43.6532, 'longitude': -79.3832, 'population': 2930000},
        {'name': 'Montreal', 'state_code': 'QC', 'country_code': 'CA', 'latitude': 45.5017, 'longitude': -73.5673, 'population': 1704694},
        {'name': 'Vancouver', 'state_code': 'BC', 'country_code': 'CA', 'latitude': 49.2827, 'longitude': -123.1207, 'population': 631486},
        {'name': 'Calgary', 'state_code': 'AB', 'country_code': 'CA', 'latitude': 51.0447, 'longitude': -114.0719, 'population': 1239220},
        {'name': 'Edmonton', 'state_code': 'AB', 'country_code': 'CA', 'latitude': 53.5461, 'longitude': -113.4938, 'population': 972223},
        {'name': 'Ottawa', 'state_code': 'ON', 'country_code': 'CA', 'latitude': 45.4215, 'longitude': -75.6972, 'population': 994837},

        # Ecuador Cities
        {'name': 'Quito', 'state_code': 'P', 'country_code': 'EC', 'latitude': -0.1807, 'longitude': -78.4678, 'population': 2781641},
        {'name': 'Guayaquil', 'state_code': 'G', 'country_code': 'EC', 'latitude': -2.1894, 'longitude': -79.8890, 'population': 2723665},
        {'name': 'Cuenca', 'state_code': 'A', 'country_code': 'EC', 'latitude': -2.9001, 'longitude': -79.0059, 'population': 636996},
        {'name': 'Ambato', 'state_code': 'T', 'country_code': 'EC', 'latitude': -1.2490, 'longitude': -78.6067, 'population': 387309},
        {'name': 'Portoviejo', 'state_code': 'M', 'country_code': 'EC', 'latitude': -1.0548, 'longitude': -80.4458, 'population': 321800},
        {'name': 'Machala', 'state_code': 'EO', 'country_code': 'EC', 'latitude': -3.2581, 'longitude': -79.9553, 'population': 289141},
        {'name': 'Loja', 'state_code': 'L', 'country_code': 'EC', 'latitude': -3.9928, 'longitude': -79.2042, 'population': 274112},
        {'name': 'Riobamba', 'state_code': 'C', 'country_code': 'EC', 'latitude': -1.6650, 'longitude': -78.6591, 'population': 225741},

        # International Cities (no states)
        {'name': 'London', 'state_code': None, 'country_code': 'GB', 'latitude': 51.5074, 'longitude': -0.1278, 'population': 9648110},
        {'name': 'Paris', 'state_code': None, 'country_code': 'FR', 'latitude': 48.8566, 'longitude': 2.3522, 'population': 2161000},
        {'name': 'Berlin', 'state_code': None, 'country_code': 'DE', 'latitude': 52.5200, 'longitude': 13.4050, 'population': 3669491},
        {'name': 'Madrid', 'state_code': None, 'country_code': 'ES', 'latitude': 40.4168, 'longitude': -3.7038, 'population': 3223334},
        {'name': 'Rome', 'state_code': None, 'country_code': 'IT', 'latitude': 41.9028, 'longitude': 12.4964, 'population': 2873000},
        {'name': 'Tokyo', 'state_code': None, 'country_code': 'JP', 'latitude': 35.6762, 'longitude': 139.6503, 'population': 37400068},
        {'name': 'Sydney', 'state_code': None, 'country_code': 'AU', 'latitude': -33.8688, 'longitude': 151.2093, 'population': 5312163},
        {'name': 'Mexico City', 'state_code': None, 'country_code': 'MX', 'latitude': 19.4326, 'longitude': -99.1332, 'population': 9209944},
        {'name': 'São Paulo', 'state_code': None, 'country_code': 'BR', 'latitude': -23.5505, 'longitude': -46.6333, 'population': 12325232},
        {'name': 'Buenos Aires', 'state_code': None, 'country_code': 'AR', 'latitude': -34.6037, 'longitude': -58.3816, 'population': 3054300},
    ]

    # Insert cities
    cities_added = 0
    cities_existing = 0

    for city_data in cities_data:
        # Get country ID
        if city_data['country_code'] not in country_uuids:
            logger.warning(f"  ⚠️ Skipping city {city_data['name']} - country {city_data['country_code']} not found")
            continue

        country_id = country_uuids[city_data['country_code']]

        # Get state ID if state exists
        state_id = None
        if city_data['state_code']:
            state_key = f"{city_data['country_code']}-{city_data['state_code']}"
            if state_key in state_uuids:
                state_id = state_uuids[state_key]
            else:
                logger.warning(f"  ⚠️ Skipping city {city_data['name']} - state {city_data['state_code']} not found")
                continue

        # Check if city already exists
        existing = session.exec(
            select(City).where(
                City.name == city_data['name'],
                City.country_id == country_id
            )
        ).first()

        if existing:
            cities_existing += 1
            logger.info(f"  ✓ City {city_data['name']} already exists")
        else:
            city = City(
                id=uuid.uuid4(),
                name=city_data['name'],
                state_id=state_id,
                country_id=country_id,
                latitude=city_data['latitude'],
                longitude=city_data['longitude'],
                population=city_data['population'],
                is_active=True
            )
            session.add(city)
            cities_added += 1
            logger.info(f"  + Added city: {city_data['name']}")

    session.commit()
    logger.info(f"✅ Cities processed: {cities_added} added, {cities_existing} existing")

    # Final summary
    logger.info("🎉 Location data population completed!")

    # Show final counts
    total_countries = session.exec(select(Country)).all()
    total_states = session.exec(select(State)).all()
    total_cities = session.exec(select(City)).all()

    logger.info(f"📊 Final database totals:")
    logger.info(f"  - Countries: {len(total_countries)}")
    logger.info(f"  - States/Provinces: {len(total_states)}")
    logger.info(f"  - Cities: {len(total_cities)}")


def populate_categories(session: Session) -> None:
    """Populate the database with company categories and their document requirements."""
    logger.info("📋 Starting categories population...")

    # Check if categories already exist
    existing_categories = session.exec(select(Category)).all()
    logger.info(f"Found {len(existing_categories)} existing categories")

    if len(existing_categories) > 0:
        logger.info("✓ Categories already exist, skipping population")
        return

    # Company categories with different document requirements
    categories_data = [
        {
            "name": "Individual Professional",
            "code": "INDIVIDUAL",
            "description": "Solo professionals, freelancers, and individual service providers",
            "requires_business_license": False,
            "requires_tax_id": True,
            "requires_professional_license": True,
            "requires_incorporation_docs": False,
            "requires_personal_id": True,
            "min_employees": 1,
            "max_employees": 1,
            "sort_order": 1
        },
        {
            "name": "Small Business",
            "code": "SMALL_BIZ",
            "description": "Small businesses with 2-50 employees",
            "requires_business_license": True,
            "requires_tax_id": True,
            "requires_professional_license": False,
            "requires_incorporation_docs": True,
            "requires_personal_id": False,
            "min_employees": 2,
            "max_employees": 50,
            "sort_order": 2
        },
        {
            "name": "Medium Enterprise",
            "code": "MEDIUM_ENT",
            "description": "Medium-sized companies with 51-250 employees",
            "requires_business_license": True,
            "requires_tax_id": True,
            "requires_professional_license": False,
            "requires_incorporation_docs": True,
            "requires_personal_id": False,
            "min_employees": 51,
            "max_employees": 250,
            "sort_order": 3
        },
        {
            "name": "Large Corporation",
            "code": "LARGE_CORP",
            "description": "Large corporations with 250+ employees",
            "requires_business_license": True,
            "requires_tax_id": True,
            "requires_professional_license": False,
            "requires_incorporation_docs": True,
            "requires_personal_id": False,
            "min_employees": 251,
            "max_employees": None,
            "sort_order": 4
        },
        {
            "name": "Non-Profit Organization",
            "code": "NONPROFIT",
            "description": "Non-profit organizations and charities",
            "requires_business_license": True,
            "requires_tax_id": True,
            "requires_professional_license": False,
            "requires_incorporation_docs": True,
            "requires_personal_id": False,
            "min_employees": None,
            "max_employees": None,
            "sort_order": 5
        },
        {
            "name": "Government Entity",
            "code": "GOVERNMENT",
            "description": "Government agencies and public sector organizations",
            "requires_business_license": False,
            "requires_tax_id": True,
            "requires_professional_license": False,
            "requires_incorporation_docs": True,
            "requires_personal_id": False,
            "min_employees": None,
            "max_employees": None,
            "sort_order": 6
        },
        {
            "name": "Startup",
            "code": "STARTUP",
            "description": "Early-stage companies and startups",
            "requires_business_license": True,
            "requires_tax_id": True,
            "requires_professional_license": False,
            "requires_incorporation_docs": True,
            "requires_personal_id": False,
            "min_employees": 1,
            "max_employees": 20,
            "sort_order": 7
        },
        {
            "name": "Partnership",
            "code": "PARTNERSHIP",
            "description": "Business partnerships and joint ventures",
            "requires_business_license": True,
            "requires_tax_id": True,
            "requires_professional_license": False,
            "requires_incorporation_docs": True,
            "requires_personal_id": True,
            "min_employees": 2,
            "max_employees": None,
            "sort_order": 8
        }
    ]

    logger.info("Adding categories...")

    for category_data in categories_data:
        category_obj = Category(
            id=uuid.uuid4(),
            name=category_data["name"],
            code=category_data["code"],
            description=category_data["description"],
            is_active=True,
            requires_business_license=category_data["requires_business_license"],
            requires_tax_id=category_data["requires_tax_id"],
            requires_professional_license=category_data["requires_professional_license"],
            requires_incorporation_docs=category_data["requires_incorporation_docs"],
            requires_personal_id=category_data["requires_personal_id"],
            min_employees=category_data["min_employees"],
            max_employees=category_data["max_employees"],
            sort_order=category_data["sort_order"]
        )
        session.add(category_obj)
        logger.info(f"  + Added category: {category_data['name']}")

    session.commit()
    logger.info(f"✅ Categories processed: {len(categories_data)} total")


def init() -> None:
    with Session(engine) as session:
        init_db(session)
        # Reference data should be populated first
        populate_industry_types(session)
        populate_categories(session)
        populate_location_data(session)


def main() -> None:
    logger.info("Creating initial data")
    init()
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
