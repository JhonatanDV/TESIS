import sqlite3

conn = sqlite3.connect('test.db')
cursor = conn.cursor()

# Get tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('Tables:', [t[0] for t in tables])

# Get users if table exists
if ('users',) in tables:
    cursor.execute('SELECT id, username, email, rol, is_active FROM users')
    users = cursor.fetchall()
    print('\nUsers:')
    for user in users:
        print(f"  ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Rol: {user[3]}, Active: {user[4]}")
else:
    print('\nTable "users" does not exist!')

conn.close()
