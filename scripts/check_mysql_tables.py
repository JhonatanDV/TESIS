r"""
Script para listar tablas en una base MySQL usando SQLAlchemy + PyMySQL.
Uso:
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  $env:DB_URL = 'mysql+pymysql://root:root@localhost:3306/438B8041db8a0124'
  python .\scripts\check_mysql_tables.py

O pasar la URL como argumento:
  python .\scripts\check_mysql_tables.py "mysql+pymysql://root:root@localhost:3306/438B8041db8a0124"
"""
import sys
import os
from sqlalchemy import create_engine, inspect


def main():
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = os.environ.get('DB_URL') or os.environ.get('SQLALCHEMY_URL')

    if not url:
        print("Error: No DB URL provided. Set env var DB_URL or pass as argument.")
        print("Example: mysql+pymysql://root:root@localhost:3306/438B8041db8a0124")
        sys.exit(1)

    print(f"Connecting to: {url}")
    try:
        engine = create_engine(url)
        insp = inspect(engine)
        tables = insp.get_table_names()
        print(f"Found {len(tables)} tables:")
        for t in tables:
            print(" - ", t)
    except Exception as e:
        print(f"Failed to connect or list tables: {e}")
        sys.exit(2)


if __name__ == '__main__':
    main()
