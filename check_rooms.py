import asyncio
import aiomysql

async def check_rooms():
    conn = await aiomysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='root',
        db='aulas_pasto'
    )
    
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        # Get structure
        await cursor.execute("DESCRIBE rooms")
        columns = await cursor.fetchall()
        
        print("Structure of 'rooms' table:")
        for col in columns:
            print(f"  {col['Field']}: {col['Type']}")
        
        print("\n" + "="*80)
        
        # Get first 5 rooms
        await cursor.execute("SELECT * FROM rooms LIMIT 5")
        rooms = await cursor.fetchall()
        
        print("\nFirst 5 rooms:")
        for room in rooms:
            print(f"\nID: {room['id']}")
            for key, value in room.items():
                if value is not None and key != 'id':
                    print(f"  {key}: {value}")
    
    conn.close()

if __name__ == "__main__":
    asyncio.run(check_rooms())
