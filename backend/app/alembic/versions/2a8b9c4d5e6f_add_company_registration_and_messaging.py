"""Add company registration fields and messaging system

Revision ID: 2a8b9c4d5e6f
Revises: da759414c3c6
Create Date: 2025-10-10 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '2a8b9c4d5e6f'
down_revision = 'da759414c3c6'
branch_labels = None
depends_on = None


def upgrade():
    # ### Add company registration fields to user table ###
    op.add_column('user', sa.Column('company_registration_status', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=True))
    op.add_column('user', sa.Column('is_company_admin', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('user', sa.Column('approved_by', sa.Uuid(), nullable=True))
    op.add_column('user', sa.Column('approved_at', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

    # Add foreign key constraint for approved_by
    op.create_foreign_key('fk_user_approved_by', 'user', 'user', ['approved_by'], ['id'], ondelete='SET NULL')

    # ### Create messaging system tables ###

    # Create conversation table
    op.create_table('conversation',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('customer_id', sa.Uuid(), nullable=False),
        sa.Column('company_id', sa.Uuid(), nullable=False),
        sa.Column('appointment_id', sa.Uuid(), nullable=True),
        sa.Column('subject', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False, server_default='active'),
        sa.Column('is_company_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['user.id'], name='fk_conversation_customer'),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], name='fk_conversation_company'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create message table
    op.create_table('message',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('conversation_id', sa.Uuid(), nullable=False),
        sa.Column('sender_id', sa.Uuid(), nullable=False),
        sa.Column('content', sqlmodel.sql.sqltypes.AutoString(length=1000), nullable=False),
        sa.Column('sender_type', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('sent_at', sa.DateTime(), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversation.id'], name='fk_message_conversation', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['user.id'], name='fk_message_sender'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create company availability table
    op.create_table('companyavailability',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('company_id', sa.Uuid(), nullable=False),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('availability_message', sqlmodel.sql.sqltypes.AutoString(length=255), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('updated_by', sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], name='fk_company_availability_company'),
        sa.ForeignKeyConstraint(['updated_by'], ['user.id'], name='fk_company_availability_updater'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_id', name='uq_company_availability_company')
    )

    # Create indexes for better performance
    op.create_index('ix_conversation_customer_id', 'conversation', ['customer_id'])
    op.create_index('ix_conversation_company_id', 'conversation', ['company_id'])
    op.create_index('ix_conversation_created_at', 'conversation', ['created_at'])
    op.create_index('ix_conversation_updated_at', 'conversation', ['updated_at'])

    op.create_index('ix_message_conversation_id', 'message', ['conversation_id'])
    op.create_index('ix_message_sender_id', 'message', ['sender_id'])
    op.create_index('ix_message_sent_at', 'message', ['sent_at'])
    op.create_index('ix_message_is_read', 'message', ['is_read'])

    op.create_index('ix_companyavailability_company_id', 'companyavailability', ['company_id'])


def downgrade():
    # ### Drop messaging system tables ###
    op.drop_index('ix_companyavailability_company_id', table_name='companyavailability')
    op.drop_index('ix_message_is_read', table_name='message')
    op.drop_index('ix_message_sent_at', table_name='message')
    op.drop_index('ix_message_sender_id', table_name='message')
    op.drop_index('ix_message_conversation_id', table_name='message')
    op.drop_index('ix_conversation_updated_at', table_name='conversation')
    op.drop_index('ix_conversation_created_at', table_name='conversation')
    op.drop_index('ix_conversation_company_id', table_name='conversation')
    op.drop_index('ix_conversation_customer_id', table_name='conversation')

    op.drop_table('companyavailability')
    op.drop_table('message')
    op.drop_table('conversation')

    # ### Remove company registration fields from user table ###
    op.drop_constraint('fk_user_approved_by', 'user', type_='foreignkey')
    op.drop_column('user', 'approved_at')
    op.drop_column('user', 'approved_by')
    op.drop_column('user', 'is_company_admin')
    op.drop_column('user', 'company_registration_status')
