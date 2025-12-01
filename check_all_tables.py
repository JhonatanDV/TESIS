import asyncio
import aiomysql

async def check_all_tables():
    conn = await aiomysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='root',
        db='aulas_pasto'
    )
    
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        # Show all tables
        await cursor.execute("SHOW TABLES")
        tables = await cursor.fetchall()
        
        print("Tables in database:")
        for table in tables:
            table_name = list(table.values())[0]
            await cursor.execute(f"SELECT COUNT(*) as count FROM {table_name}")
            count = await cursor.fetchone()
            print(f"  {table_name}: {count['count']} rows")
    
    conn.close()

if __name__ == "__main__":
    asyncio.run(check_all_tables())
