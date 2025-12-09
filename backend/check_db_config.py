"""
Database Configuration Checker

This utility script verifies and displays the database configuration
being used by the FastAPI application. Useful for debugging connection
issues and validating environment settings.

Author: IntelliWorkshop Team
Created: 2025
"""

import sys
import os
from pathlib import Path
from typing import Optional

# Add the app directory to the path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from app.core.config import Settings


def check_db_config() -> Optional[str]:
    """
    Check and display the database configuration.

    Returns:
        Optional[str]: Database URI if successful, None if error occurred
    """
    print("Database Configuration Check")
    print("=" * 50)

    try:
        settings = Settings()
        
        print("Configuration Details:")
        print(f"  Server: {settings.POSTGRES_SERVER}")
        print(f"  Port: {settings.POSTGRES_PORT}")
        print(f"  User: {settings.POSTGRES_USER}")
        print(f"  Password: {'*' * len(settings.POSTGRES_PASSWORD) if settings.POSTGRES_PASSWORD else 'Not set'}")
        print(f"  Database: {settings.POSTGRES_DB}")
        print(f"\nComplete Database URI:")
        print(f"  {str(settings.SQLALCHEMY_DATABASE_URI)}")

        return str(settings.SQLALCHEMY_DATABASE_URI)
        
    except Exception as e:
        print(f"❌ ERROR: Could not load database configuration")
        print(f"   Details: {str(e)}")
        print("\n💡 Troubleshooting:")
        print("   1. Check if .env file exists")
        print("   2. Verify all required environment variables are set")
        print("   3. Ensure the app directory is accessible")
        return None


def validate_connection() -> bool:
    """
    Attempt to validate the database connection.

    Returns:
        bool: True if connection can be established, False otherwise
    """
    try:
        from app.core.db import engine
        from sqlmodel import Session, text

        with Session(engine) as session:
            # Simple query to test connection
            result = session.exec(text("SELECT 1")).first()
            print("✅ Database connection successful")
            return True

    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False


def main() -> None:
    """Main execution function."""
    db_url = check_db_config()
    
    if db_url:
        print("\n" + "=" * 50)
        print("Connection Test")
        print("=" * 50)
        validate_connection()

        print("\n" + "=" * 50)
        print("Usage Information")
        print("=" * 50)
        print("This database URL can be used for:")
        print("  • Direct database connections")
        print("  • Database migration tools")
        print("  • External database clients")
    else:
        print("\n❌ Configuration check failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
