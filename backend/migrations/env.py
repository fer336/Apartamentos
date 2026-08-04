import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# Prepends the backend root (parent of migrations/) to sys.path so the `app`
# package is importable regardless of the working directory.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings  # noqa: E402
from app.core.database import Base  # noqa: E402
from app.models import models  # noqa: E402,F401  (registers all models on Base.metadata)

# This is the Alembic Config object, which provides access to the values
# within the .ini file in use.
config = context.config

# Interpret the config file for Python logging. This line sets up loggers
# basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Injects the app's DATABASE_URL into the config for both online and offline
# modes. The full `postgresql+asyncpg` URL is kept so the online path uses the
# async engine (no psycopg2 required); the asyncpg dialect can also compile SQL
# for offline mode.
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine, though an
    Engine is acceptable as well. By skipping the Engine creation we don't even
    need a DBAPI to be available.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def include_object(object, name, type_, reflected, compare_to) -> bool:
    """Only manage objects that exist in the SQLAlchemy models.

    The live database still contains legacy tables and columns that are no
    longer part of the models. Without this filter, autogenerate would propose
    destructive DROPs for them on every revision.
    """
    if type_ == "table":
        return name in target_metadata.tables
    if type_ == "column":
        table = getattr(object, "table", None)
        if table is None or table.name not in target_metadata.tables:
            return False
        return name in target_metadata.tables[table.name].columns
    return True


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode using the async engine (asyncpg)."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()