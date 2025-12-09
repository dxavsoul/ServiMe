"""
Script to populate industry types with common industry categories.
This script can be run to seed the database with default industry types.
"""

import uuid
from sqlmodel import Session, create_engine
from app.core.config import settings
from app.models.industry_type import IndustryType


def populate_industry_types():
    """Populate the database with common industry types."""

    # Common industry types with codes and descriptions
    industry_types = [
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

    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

    with Session(engine) as session:
        # Check if industry types already exist
        existing_count = session.query(IndustryType).count()
        if existing_count > 0:
            print(f"Industry types already exist ({existing_count} found). Skipping population.")
            return

        print("Populating industry types...")

        for industry_data in industry_types:
            industry_type = IndustryType(
                id=uuid.uuid4(),
                name=industry_data["name"],
                code=industry_data["code"],
                description=industry_data["description"],
                is_active=True
            )
            session.add(industry_type)

        session.commit()
        print(f"Successfully added {len(industry_types)} industry types to the database.")


if __name__ == "__main__":
    populate_industry_types()
