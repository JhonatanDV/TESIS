import asyncio
import aiomysql

async def count_spaces():
    conn = await aiomysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='root',
        db='aulas_pasto'
    )
    
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        await cursor.execute("SELECT COUNT(*) as total FROM spaces")
        result = await cursor.fetchone()
        print(f"Total spaces in database: {result['total']}")
        
        # Get first 10 spaces
        await cursor.execute("SELECT id, nombre, tipo, estado FROM spaces LIMIT 10")
        spaces = await cursor.fetchall()
        
        print("\nFirst 10 spaces:")
        for space in spaces:
            print(f"  ID: {space['id']}, Nombre: {space['nombre']}, Tipo: {space['tipo']}, Estado: {space['estado']}")
    
    conn.close()

if __name__ == "__main__":
    asyncio.run(count_spaces())
