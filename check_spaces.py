import asyncio
import aiomysql
import json

async def check_spaces():
    conn = await aiomysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='root',
        db='aulas_pasto'
    )
    
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("SELECT * FROM spaces")
        spaces = await cursor.fetchall()
        
        print(f"Total spaces found: {len(spaces)}")
        print("\n" + "="*80)
        
        for space in spaces:
            print(f"\nID: {space['id']}")
            print(f"Nombre: {space['nombre']}")
            print(f"Tipo: {space['tipo']}")
            print(f"Capacidad: {space['capacidad']}")
            print(f"Ubicacion: {space['ubicacion']}")
            print(f"Descripcion: {space['descripcion']}")
            print(f"Caracteristicas: {space['caracteristicas']}")
            print(f"Estado: {space['estado']}")
            print(f"Imagen URL: {space['imagen_url']}")
            print(f"Created at: {space['created_at']}")
            print("-" * 80)
    
    conn.close()

if __name__ == "__main__":
    asyncio.run(check_spaces())
