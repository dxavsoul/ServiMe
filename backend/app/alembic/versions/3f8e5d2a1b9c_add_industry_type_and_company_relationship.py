"""Add industry type table and update company relationship

Revision ID: 3f8e5d2a1b9c
Revises: 2a8b9c4d5e6f
Create Date: 2025-10-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3f8e5d2a1b9c'
down_revision = '2a8b9c4d5e6f'
branch_labels = None
depends_on = None


def upgrade():
    # Create industry_type table
    op.create_table('industry_type',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('code', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for industry_type
    op.create_index(op.f('ix_industry_type_name'), 'industry_type', ['name'], unique=True)
    op.create_index(op.f('ix_industry_type_code'), 'industry_type', ['code'], unique=True)

    # Add industry_type_id column to company table
    op.add_column('company', sa.Column('industry_type_id', sa.Uuid(), nullable=True))

    # Create foreign key constraint for industry_type_id
    op.create_foreign_key(
        'fk_company_industry_type_id',
        'company',
        'industry_type',
        ['industry_type_id'],
        ['id']
    )

    # Remove the old industry column from company table (if it exists)
    # First check if the column exists before trying to drop it
    try:
        op.drop_column('company', 'industry')
    except Exception:
        # Column might not exist, continue
        pass


def downgrade():
    # Add back the old industry column
    op.add_column('company', sa.Column('industry', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=True))

    # Drop foreign key constraint
    op.drop_constraint('fk_company_industry_type_id', 'company', type_='foreignkey')

    # Drop industry_type_id column from company table
    op.drop_column('company', 'industry_type_id')

    # Drop indexes for industry_type
    op.drop_index(op.f('ix_industry_type_code'), table_name='industry_type')
    op.drop_index(op.f('ix_industry_type_name'), table_name='industry_type')

    # Drop industry_type table
    op.drop_table('industry_type')
