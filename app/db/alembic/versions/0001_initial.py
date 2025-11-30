"""initial

Revision ID: 0001_initial
Revises: 
Create Date: 2025-11-28 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated ###
    op.create_table('campuses',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )

    op.create_table('blocks',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('campus_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['campus_id'], ['campuses.id'], name='fk_blocks_campus', ondelete='CASCADE'),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )

    op.create_table('floors',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('block_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['block_id'], ['blocks.id'], name='fk_floors_block', ondelete='CASCADE'),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )

    op.create_table('entornos',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )

    op.create_table('ambientes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('entornos_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['entornos_id'], ['entornos.id'], name='fk_ambientes_entorno', ondelete='SET NULL'),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )

    op.create_table('space_types',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )

    op.create_table('categories',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('nombre', sa.String(length=100), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )

    op.create_table('resources',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('nombre', sa.String(length=200), nullable=False),
        sa.Column('tipo', sa.String(length=100), nullable=False),
        sa.Column('estado', sa.String(length=50), nullable=True, server_default='disponible'),
        sa.Column('categoria_id', sa.Integer(), nullable=True),
        sa.Column('caracteristicas', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['categoria_id'], ['categories.id'], name='fk_resources_category', ondelete='SET NULL'),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )

    op.create_table('rooms',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('campus_id', sa.Integer(), nullable=False),
        sa.Column('block_id', sa.Integer(), nullable=False),
        sa.Column('floor_id', sa.Integer(), nullable=False),
        sa.Column('entorno_id', sa.Integer(), nullable=True),
        sa.Column('ambiente_id', sa.Integer(), nullable=True),
        sa.Column('space_type_id', sa.Integer(), nullable=True),
        sa.Column('space_code', sa.String(length=100), nullable=True),
        sa.Column('display_name', sa.String(length=300), nullable=False),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['campus_id'], ['campuses.id'], name='fk_rooms_campus', ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['block_id'], ['blocks.id'], name='fk_rooms_block', ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['floor_id'], ['floors.id'], name='fk_rooms_floor', ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['entorno_id'], ['entornos.id'], name='fk_rooms_entorno', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['ambiente_id'], ['ambientes.id'], name='fk_rooms_ambiente', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['space_type_id'], ['space_types.id'], name='fk_rooms_spacetype', ondelete='SET NULL'),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )

    op.create_index('idx_space_code', 'rooms', ['space_code'])
    op.create_index('idx_capacity', 'rooms', ['capacity'])

    op.create_table('rooms_resources',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('resource_id', sa.Integer(), nullable=False),
        sa.Column('cantidad', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], name='fk_rr_room', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['resource_id'], ['resources.id'], name='fk_rr_resource', ondelete='CASCADE'),
        sa.UniqueConstraint('room_id', 'resource_id', name='uq_room_resource'),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )

    op.create_table('assignments',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('room_id', sa.Integer(), nullable=True),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('fecha', sa.DateTime(), nullable=False),
        sa.Column('fecha_fin', sa.DateTime(), nullable=True),
        sa.Column('estado', sa.String(length=50), nullable=True, server_default='activo'),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], name='fk_assign_room', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['resource_id'], ['resources.id'], name='fk_assign_resource', ondelete='SET NULL'),
        mysql_engine='InnoDB', mysql_charset='utf8mb4'
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated ###
    op.drop_table('assignments')
    op.drop_table('rooms_resources')
    op.drop_index('idx_capacity', table_name='rooms')
    op.drop_index('idx_space_code', table_name='rooms')
    op.drop_table('rooms')
    op.drop_table('resources')
    op.drop_table('categories')
    op.drop_table('space_types')
    op.drop_table('ambientes')
    op.drop_table('entornos')
    op.drop_table('floors')
    op.drop_table('blocks')
    op.drop_table('campuses')
    # ### end Alembic commands ###
