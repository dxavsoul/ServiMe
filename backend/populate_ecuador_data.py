#!/usr/bin/env python3
"""
Script to populate Ecuador's geographical data (provinces and cities).
Run this script to add Ecuador, its 24 provinces, and major cities to the database.
"""

import logging
from sqlmodel import Session, select

from app.core.db import engine
from app.crud.crud_location import country_crud, state_crud, city_crud
from app.models.location import CountryCreate, StateCreate, CityCreate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ecuador's provinces (states) with their codes and major cities
ECUADOR_DATA = {
    "country": {
        "name": "Ecuador",
        "code": "EC"
    },
    "provinces": [
        {
            "name": "Azuay",
            "code": "A",
            "cities": [
                {"name": "Cuenca", "latitude": -2.9001, "longitude": -79.0059, "population": 636996},
                {"name": "Gualaceo", "latitude": -2.8833, "longitude": -78.7833, "population": 42729},
                {"name": "Paute", "latitude": -2.7667, "longitude": -78.7500, "population": 25494}
            ]
        },
        {
            "name": "Bolívar",
            "code": "B", 
            "cities": [
                {"name": "Guaranda", "latitude": -1.5925, "longitude": -79.0061, "population": 91877},
                {"name": "Chillanes", "latitude": -1.9667, "longitude": -79.0667, "population": 18685},
                {"name": "San Miguel", "latitude": -1.7000, "longitude": -79.0333, "population": 26747}
            ]
        },
        {
            "name": "Cañar",
            "code": "F",
            "cities": [
                {"name": "Azogues", "latitude": -2.7394, "longitude": -78.8486, "population": 70064},
                {"name": "Cañar", "latitude": -2.5667, "longitude": -78.9333, "population": 59323},
                {"name": "La Troncal", "latitude": -2.4167, "longitude": -79.3333, "population": 54389}
            ]
        },
        {
            "name": "Carchi",
            "code": "C",
            "cities": [
                {"name": "Tulcán", "latitude": 0.8117, "longitude": -77.7175, "population": 86498},
                {"name": "San Gabriel", "latitude": 0.6000, "longitude": -77.8333, "population": 16161},
                {"name": "Mira", "latitude": 0.3833, "longitude": -78.1167, "population": 12180}
            ]
        },
        {
            "name": "Cotopaxi",
            "code": "X",
            "cities": [
                {"name": "Latacunga", "latitude": -0.9347, "longitude": -78.6150, "population": 170489},
                {"name": "La Maná", "latitude": -0.9417, "longitude": -79.2250, "population": 42216},
                {"name": "Saquisilí", "latitude": -0.8333, "longitude": -78.6667, "population": 25320}
            ]
        },
        {
            "name": "Chimborazo",
            "code": "H",
            "cities": [
                {"name": "Riobamba", "latitude": -1.6635, "longitude": -78.6547, "population": 225741},
                {"name": "Alausí", "latitude": -2.2000, "longitude": -78.8500, "population": 45418},
                {"name": "Chambo", "latitude": -1.7167, "longitude": -78.5833, "population": 11691}
            ]
        },
        {
            "name": "El Oro",
            "code": "O",
            "cities": [
                {"name": "Machala", "latitude": -3.2581, "longitude": -79.9553, "population": 245972},
                {"name": "Pasaje", "latitude": -3.3250, "longitude": -79.8083, "population": 72806},
                {"name": "Santa Rosa", "latitude": -3.4486, "longitude": -79.9594, "population": 69036}
            ]
        },
        {
            "name": "Esmeraldas",
            "code": "E",
            "cities": [
                {"name": "Esmeraldas", "latitude": 0.9592, "longitude": -79.6567, "population": 189504},
                {"name": "Atacames", "latitude": 0.8667, "longitude": -79.8500, "population": 21203},
                {"name": "Quinindé", "latitude": 0.3333, "longitude": -79.4667, "population": 122570}
            ]
        },
        {
            "name": "Galápagos",
            "code": "W",
            "cities": [
                {"name": "Puerto Baquerizo Moreno", "latitude": -0.9000, "longitude": -89.6000, "population": 6672},
                {"name": "Puerto Ayora", "latitude": -0.7500, "longitude": -90.3167, "population": 11974},
                {"name": "Puerto Villamil", "latitude": -0.9500, "longitude": -91.0000, "population": 2200}
            ]
        },
        {
            "name": "Guayas",
            "code": "G",
            "cities": [
                {"name": "Guayaquil", "latitude": -2.1709, "longitude": -79.9224, "population": 2644891},
                {"name": "Durán", "latitude": -2.1667, "longitude": -79.8333, "population": 315724},
                {"name": "Milagro", "latitude": -2.1333, "longitude": -79.5833, "population": 180103},
                {"name": "Daule", "latitude": -1.8667, "longitude": -79.9833, "population": 120326}
            ]
        },
        {
            "name": "Imbabura",
            "code": "I",
            "cities": [
                {"name": "Ibarra", "latitude": 0.3397, "longitude": -78.1228, "population": 181175},
                {"name": "Otavalo", "latitude": 0.2333, "longitude": -78.2667, "population": 104874},
                {"name": "Cotacachi", "latitude": 0.3000, "longitude": -78.2667, "population": 40036}
            ]
        },
        {
            "name": "Loja",
            "code": "L",
            "cities": [
                {"name": "Loja", "latitude": -3.9929, "longitude": -79.2048, "population": 214855},
                {"name": "Catamayo", "latitude": -3.9833, "longitude": -79.3500, "population": 30638},
                {"name": "Macará", "latitude": -4.3833, "longitude": -79.9500, "population": 18350}
            ]
        },
        {
            "name": "Los Ríos",
            "code": "R",
            "cities": [
                {"name": "Babahoyo", "latitude": -1.8006, "longitude": -79.5342, "population": 153776},
                {"name": "Quevedo", "latitude": -1.0281, "longitude": -79.4631, "population": 213842},
                {"name": "Ventanas", "latitude": -1.4500, "longitude": -79.4667, "population": 71145}
            ]
        },
        {
            "name": "Manabí",
            "code": "M",
            "cities": [
                {"name": "Portoviejo", "latitude": -1.0545, "longitude": -80.4545, "population": 280029},
                {"name": "Manta", "latitude": -0.9481, "longitude": -80.7320, "population": 264281},
                {"name": "Chone", "latitude": -0.6833, "longitude": -80.1000, "population": 126747},
                {"name": "Montecristi", "latitude": -1.0333, "longitude": -80.6667, "population": 74000}
            ]
        },
        {
            "name": "Morona Santiago",
            "code": "S",
            "cities": [
                {"name": "Macas", "latitude": -2.3086, "longitude": -78.1119, "population": 23687},
                {"name": "Gualaquiza", "latitude": -3.4167, "longitude": -78.5500, "population": 16456},
                {"name": "Sucúa", "latitude": -2.4667, "longitude": -78.1667, "population": 18318}
            ]
        },
        {
            "name": "Napo",
            "code": "N",
            "cities": [
                {"name": "Tena", "latitude": -0.9833, "longitude": -77.8167, "population": 60880},
                {"name": "Archidona", "latitude": -0.9167, "longitude": -77.8000, "population": 24137},
                {"name": "El Chaco", "latitude": -0.3333, "longitude": -77.8167, "population": 8246}
            ]
        },
        {
            "name": "Orellana",
            "code": "D",
            "cities": [
                {"name": "Francisco de Orellana", "latitude": -0.4667, "longitude": -76.9833, "population": 42010},
                {"name": "La Joya de los Sachas", "latitude": -0.2833, "longitude": -76.6167, "population": 26363},
                {"name": "Loreto", "latitude": -0.7000, "longitude": -77.2833, "population": 21163}
            ]
        },
        {
            "name": "Pastaza",
            "code": "Y",
            "cities": [
                {"name": "Puyo", "latitude": -1.4897, "longitude": -78.0075, "population": 62016},
                {"name": "Mera", "latitude": -1.4667, "longitude": -78.1333, "population": 9924},
                {"name": "Santa Clara", "latitude": -1.2333, "longitude": -78.0000, "population": 2427}
            ]
        },
        {
            "name": "Pichincha",
            "code": "P",
            "cities": [
                {"name": "Quito", "latitude": -0.2295, "longitude": -78.5243, "population": 2781641},
                {"name": "Cayambe", "latitude": 0.0417, "longitude": -78.1467, "population": 85795},
                {"name": "Machachi", "latitude": -0.5167, "longitude": -78.5667, "population": 28564},
                {"name": "San Antonio de Pichincha", "latitude": 0.0167, "longitude": -78.4333, "population": 18521}
            ]
        },
        {
            "name": "Santa Elena",
            "code": "SE",
            "cities": [
                {"name": "Santa Elena", "latitude": -2.2264, "longitude": -80.8581, "population": 50649},
                {"name": "La Libertad", "latitude": -2.2333, "longitude": -80.9167, "population": 95942},
                {"name": "Salinas", "latitude": -2.2167, "longitude": -80.9667, "population": 68675}
            ]
        },
        {
            "name": "Santo Domingo de los Tsáchilas",
            "code": "SD",
            "cities": [
                {"name": "Santo Domingo", "latitude": -0.2500, "longitude": -79.1667, "population": 458580},
                {"name": "La Concordia", "latitude": -0.0167, "longitude": -79.3833, "population": 44778}
            ]
        },
        {
            "name": "Sucumbíos",
            "code": "U",
            "cities": [
                {"name": "Nueva Loja", "latitude": 0.0831, "longitude": -76.8947, "population": 57727},
                {"name": "Shushufindi", "latitude": -0.1667, "longitude": -76.6333, "population": 44328},
                {"name": "Cascales", "latitude": 0.1167, "longitude": -77.2833, "population": 11262}
            ]
        },
        {
            "name": "Tungurahua",
            "code": "T",
            "cities": [
                {"name": "Ambato", "latitude": -1.2543, "longitude": -78.6211, "population": 329856},
                {"name": "Baños de Agua Santa", "latitude": -1.3958, "longitude": -78.4267, "population": 20018},
                {"name": "Pelileo", "latitude": -1.3333, "longitude": -78.5500, "population": 56573}
            ]
        },
        {
            "name": "Zamora Chinchipe",
            "code": "Z",
            "cities": [
                {"name": "Zamora", "latitude": -4.0672, "longitude": -78.9547, "population": 25510},
                {"name": "Yantzaza", "latitude": -3.8167, "longitude": -78.7667, "population": 18675},
                {"name": "Gualaquiza", "latitude": -3.4167, "longitude": -78.5500, "population": 16456}
            ]
        }
    ]
}

def populate_ecuador_data():
    """Populate Ecuador's geographical data in the database."""
    
    with Session(engine) as session:
        logger.info("Starting Ecuador data population...")
        
        # Check if Ecuador already exists
        existing_country = country_crud.get_by_code(session=session, code="EC")
        if existing_country:
            logger.info("Ecuador already exists in database")
            country = existing_country
        else:
            # Create Ecuador
            logger.info("Creating Ecuador...")
            country_data = CountryCreate(
                name=ECUADOR_DATA["country"]["name"],
                code=ECUADOR_DATA["country"]["code"],
                is_active=True
            )
            country = country_crud.create(session=session, obj_in=country_data)
            logger.info(f"Created country: {country.name} ({country.code})")
        
        # Process provinces
        for province_data in ECUADOR_DATA["provinces"]:
            logger.info(f"Processing province: {province_data['name']}...")
            
            # Check if province already exists
            existing_states, _ = state_crud.get_by_country(session=session, country_id=country.id)
            existing_state = None
            for state in existing_states:
                if state.name == province_data["name"] or state.code == province_data["code"]:
                    existing_state = state
                    break
            
            if existing_state:
                logger.info(f"Province {province_data['name']} already exists")
                province = existing_state
            else:
                # Create province
                state_data = StateCreate(
                    name=province_data["name"],
                    code=province_data["code"],
                    country_id=country.id,
                    is_active=True
                )
                province = state_crud.create(session=session, obj_in=state_data)
                logger.info(f"Created province: {province.name} ({province.code})")
            
            # Process cities in this province
            for city_data in province_data["cities"]:
                logger.info(f"  Processing city: {city_data['name']}...")
                
                # Check if city already exists
                existing_cities, _ = city_crud.get_by_state(session=session, state_id=province.id)
                existing_city = None
                for city in existing_cities:
                    if city.name == city_data["name"]:
                        existing_city = city
                        break
                
                if existing_city:
                    logger.info(f"  City {city_data['name']} already exists")
                else:
                    # Create city
                    city_create_data = CityCreate(
                        name=city_data["name"],
                        state_id=province.id,
                        country_id=country.id,
                        latitude=city_data.get("latitude"),
                        longitude=city_data.get("longitude"),
                        population=city_data.get("population"),
                        is_active=True
                    )
                    city = city_crud.create(session=session, obj_in=city_create_data)
                    logger.info(f"  Created city: {city.name} (Pop: {city.population})")
        
        logger.info("Ecuador data population completed successfully!")
        
        # Print summary
        provinces, provinces_count = state_crud.get_by_country(session=session, country_id=country.id)
        cities, cities_count = city_crud.get_by_country(session=session, country_id=country.id)
        
        logger.info(f"Summary:")
        logger.info(f"  Country: {country.name} ({country.code})")
        logger.info(f"  Provinces: {provinces_count}")
        logger.info(f"  Cities: {cities_count}")

def main():
    """Main function to run the data population."""
    try:
        populate_ecuador_data()
    except Exception as e:
        logger.error(f"Error populating Ecuador data: {e}")
        raise

if __name__ == "__main__":
    main()
