import asyncio
import aiomysql

async def check_assignments():
    conn = await aiomysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='root',
        db='aulas_pasto'
    )
    
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        # Get structure
        await cursor.execute("DESCRIBE assignments")
        columns = await cursor.fetchall()
        
        print("Structure of 'assignments' table:")
        for col in columns:
            print(f"  {col['Field']}: {col['Type']}")
        
        # Count
        await cursor.execute("SELECT COUNT(*) as count FROM assignments")
        result = await cursor.fetchone()
        print(f"\nTotal assignments: {result['count']}")
    
    conn.close()

if __name__ == "__main__":
    asyncio.run(check_assignments())
