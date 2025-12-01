import pymysql

# Conectar a MySQL sin especificar base de datos
connection = pymysql.connect(
    host='localhost',
    user='root',
    password='root',
    charset='utf8mb4'
)

try:
    with connection.cursor() as cursor:
        # Crear la base de datos si no existe
        cursor.execute("CREATE DATABASE IF NOT EXISTS `438B8041db8a0124` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print("Base de datos '438B8041db8a0124' creada exitosamente!")
    connection.commit()
finally:
    connection.close()
