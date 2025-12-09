"""Add category table and update company relationship

Revision ID: 4a9f6b2c3d8e
Revises: 3f8e5d2a1b9c
Create Date: 2025-10-12 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes

# revision identifiers, used by Alembic.
revision = '4a9f6b2c3d8e'
down_revision = '3f8e5d2a1b9c'
branch_labels = None
depends_on = None


def upgrade():
    # Create category table
    op.create_table('category',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(length=500), nullable=True),
        sa.Column('code', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('requires_business_license', sa.Boolean(), nullable=False),
        sa.Column('requires_tax_id', sa.Boolean(), nullable=False),
        sa.Column('requires_professional_license', sa.Boolean(), nullable=False),
        sa.Column('requires_incorporation_docs', sa.Boolean(), nullable=False),
        sa.Column('requires_personal_id', sa.Boolean(), nullable=False),
        sa.Column('min_employees', sa.Integer(), nullable=True),
        sa.Column('max_employees', sa.Integer(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for category
    op.create_index(op.f('ix_category_name'), 'category', ['name'], unique=True)
    op.create_index(op.f('ix_category_code'), 'category', ['code'], unique=True)
    op.create_index(op.f('ix_category_sort_order'), 'category', ['sort_order'])

    # Add category_id column to company table
    op.add_column('company', sa.Column('category_id', sa.Uuid(), nullable=True))

    # Create foreign key constraint for category_id
    op.create_foreign_key(
        'fk_company_category_id',
        'company',
        'category',
        ['category_id'],
        ['id']
    )


def downgrade():
    # Drop foreign key constraint
    op.drop_constraint('fk_company_category_id', 'company', type_='foreignkey')

    # Drop category_id column from company table
    op.drop_column('company', 'category_id')

    # Drop indexes for category
    op.drop_index(op.f('ix_category_sort_order'), table_name='category')
    op.drop_index(op.f('ix_category_code'), table_name='category')
    op.drop_index(op.f('ix_category_name'), table_name='category')

    # Drop category table
    op.drop_table('category')
