from __future__ import with_statement
import asyncio
from logging.config import fileConfig
import os

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

from app.db.base import Base
from app.config import settings

target_metadata = Base.metadata


def _get_database_url() -> str:
    """Resolve DB URL in this priority:
    1. Environment variable `SQLALCHEMY_URL`
    2. `sqlalchemy.url` in `alembic.ini` (if set)
    3. `settings.DATABASE_URL` from project config
    """
    # prefer explicit env var set by user
    env_url = os.environ.get("SQLALCHEMY_URL")
    if env_url:
        return env_url

    # check alembic.ini main option
    ini_url = config.get_main_option("sqlalchemy.url")
    if ini_url and ini_url != "driver://user:pass@localhost/dbname":
        return ini_url

    # fallback to project's settings
    return settings.DATABASE_URL


def run_migrations_offline():
    url = _get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection):
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    db_url = _get_database_url()
    connectable = create_async_engine(db_url, poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online():
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
