r"""
Ejecuta un archivo SQL contra un servidor MySQL usando PyMySQL.
Uso:
  python .\scripts\run_sql_file.py .\scripts\init_db.sql "mysql+pymysql://root:root@localhost:3306/"

El segundo argumento es una URL SQLAlchemy; si incluye un nombre de base se usará igualmente.
"""
import sys
import os
from sqlalchemy.engine import make_url
import pymysql


def split_sql_statements(sql_text: str):
    # split by semicolon; naive but sufficient for typical dump files
    parts = []
    cur = []
    for line in sql_text.splitlines():
        cur.append(line)
        if line.strip().endswith(';'):
            parts.append('\n'.join(cur))
            cur = []
    if cur:
        parts.append('\n'.join(cur))
    # strip whitespace and remove empty
    return [p.strip() for p in parts if p.strip()]


def main():
    if len(sys.argv) < 3:
        print("Usage: python run_sql_file.py <sql_file> <sqlalchemy_url>")
        sys.exit(1)

    sql_file = sys.argv[1]
    url = sys.argv[2]

    if not os.path.exists(sql_file):
        print(f"SQL file not found: {sql_file}")
        sys.exit(1)

    print(f"Reading SQL from {sql_file}")
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_text = f.read()

    parsed = make_url(url)
    user = parsed.username or 'root'
    password = parsed.password or ''
    host = parsed.host or 'localhost'
    port = parsed.port or 3306

    print(f"Connecting to MySQL {host}:{port} as {user}")
    try:
        conn = pymysql.connect(host=host, user=user, password=password, port=port, autocommit=True)
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(2)

    try:
        with conn.cursor() as cur:
            statements = split_sql_statements(sql_text)
            print(f"Found {len(statements)} statements. Executing...")
            for i, st in enumerate(statements, 1):
                try:
                    cur.execute(st)
                except Exception as e:
                    print(f"Statement {i} failed: {e}\nStatement:\n{st}\n---")
                    # continue executing remaining statements
            print("SQL script execution finished.")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
