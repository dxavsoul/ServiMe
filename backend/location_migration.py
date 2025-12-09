"""Add location tables

Revision ID: add_location_tables
Revises: 
Create Date: 2025-01-22 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_location_tables'
down_revision = None  # Set this to the latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create country table
    op.create_table(
        'country',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('code', sqlmodel.sql.sqltypes.AutoString(length=3), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_country_name'), 'country', ['name'], unique=False)
    op.create_index(op.f('ix_country_code'), 'country', ['code'], unique=False)

    # Create state table
    op.create_table(
        'state',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('code', sqlmodel.sql.sqltypes.AutoString(length=10), nullable=True),
        sa.Column('country_id', sa.UUID(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['country_id'], ['country.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_state_name'), 'state', ['name'], unique=False)
    op.create_index(op.f('ix_state_country_id'), 'state', ['country_id'], unique=False)

    # Create city table
    op.create_table(
        'city',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('state_id', sa.UUID(), nullable=True),
        sa.Column('country_id', sa.UUID(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('population', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['state_id'], ['state.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['country_id'], ['country.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_city_name'), 'city', ['name'], unique=False)
    op.create_index(op.f('ix_city_country_id'), 'city', ['country_id'], unique=False)
    op.create_index(op.f('ix_city_state_id'), 'city', ['state_id'], unique=False)

    # Insert sample data
    # Countries
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
    
    # Store country UUIDs for later reference
    country_uuids = {}
    for country in countries_data:
        country_uuid = op.execute(f"""
            INSERT INTO country (id, name, code, is_active) 
            VALUES (gen_random_uuid(), '{country['name']}', '{country['code']}', true)
            RETURNING id
        """).fetchone()[0]
        country_uuids[country['code']] = country_uuid

    # States for US
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
    ]
    
    # Store state UUIDs for later reference
    state_uuids = {}
    us_country_id = country_uuids['US']
    for state in us_states_data:
        state_uuid = op.execute(f"""
            INSERT INTO state (id, name, code, country_id, is_active) 
            VALUES (gen_random_uuid(), '{state['name']}', '{state['code']}', '{us_country_id}', true)
            RETURNING id
        """).fetchone()[0]
        state_uuids[f"US-{state['code']}"] = state_uuid

    # States for Canada
    ca_states_data = [
        {'name': 'Ontario', 'code': 'ON'},
        {'name': 'Quebec', 'code': 'QC'},
        {'name': 'British Columbia', 'code': 'BC'},
        {'name': 'Alberta', 'code': 'AB'},
        {'name': 'Manitoba', 'code': 'MB'},
        {'name': 'Saskatchewan', 'code': 'SK'},
    ]
    
    ca_country_id = country_uuids['CA']
    for state in ca_states_data:
        state_uuid = op.execute(f"""
            INSERT INTO state (id, name, code, country_id, is_active) 
            VALUES (gen_random_uuid(), '{state['name']}', '{state['code']}', '{ca_country_id}', true)
            RETURNING id
        """).fetchone()[0]
        state_uuids[f"CA-{state['code']}"] = state_uuid

    # Major cities with coordinates and population
    cities_data = [
        # US Cities
        {'name': 'New York', 'state_code': 'NY', 'country_code': 'US', 'latitude': 40.7128, 'longitude': -74.0060, 'population': 8336817},
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
    
    for city in cities_data:
        # Get country UUID
        country_id = country_uuids[city['country_code']]
        
        # Get state UUID if state exists
        state_id = None
        if city['state_code']:
            state_key = f"{city['country_code']}-{city['state_code']}"
            state_id = state_uuids.get(state_key)
        
        state_id_val = f"'{state_id}'" if state_id else 'NULL'
        
        op.execute(f"""
            INSERT INTO city (id, name, state_id, country_id, latitude, longitude, population, is_active) 
            VALUES (gen_random_uuid(), '{city['name']}', {state_id_val}, '{country_id}', 
                    {city['latitude']}, {city['longitude']}, {city['population']}, true)
        """)


def downgrade():
    op.drop_table('city')
    op.drop_table('state')
    op.drop_table('country')
