import asyncio
import aiomysql
import json

async def migrate_rooms_to_spaces():
    conn = await aiomysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='root',
        db='aulas_pasto'
    )
    
    async with conn.cursor(aiomysql.DictCursor) as cursor:
        # Clear existing spaces (keep only if you want to preserve them)
        print("Clearing existing spaces...")
        await cursor.execute("DELETE FROM spaces WHERE id > 4")
        await conn.commit()
        
        # Get all rooms with related data
        await cursor.execute("""
            SELECT 
                r.id,
                r.space_code,
                r.display_name,
                r.capacity,
                r.created_at,
                st.name as space_type_name,
                f.name as floor_name,
                b.name as block_name,
                c.name as campus_name
            FROM rooms r
            LEFT JOIN space_types st ON r.space_type_id = st.id
            LEFT JOIN floors f ON r.floor_id = f.id
            LEFT JOIN blocks b ON r.block_id = b.id
            LEFT JOIN campuses c ON r.campus_id = c.id
            ORDER BY r.id
        """)
        rooms = await cursor.fetchall()
        
        print(f"Found {len(rooms)} rooms to migrate")
        
        # Map space_type_name to our types
        type_mapping = {
            'Aula Múltiple': 'classroom',
            'Aula Pregrado': 'classroom',
            'Laboratorio': 'laboratory',
            'Oficina': 'office',
            'Sala de Reuniones': 'conference',
            'Auditorio': 'auditorium',
            'Otro': 'other'
        }
        
        migrated_count = 0
        for room in rooms:
            # Determine type
            space_type = type_mapping.get(room['space_type_name'], 'other')
            
            # Build location
            location_parts = []
            if room['campus_name']:
                location_parts.append(room['campus_name'])
            if room['block_name']:
                location_parts.append(f"Bloque {room['block_name']}")
            if room['floor_name']:
                location_parts.append(room['floor_name'])
            
            ubicacion = ", ".join(location_parts) if location_parts else "Campus Principal"
            
            # Build description
            descripcion = f"{room['display_name']} - Capacidad para {room['capacity']} personas"
            
            # Build caracteristicas
            caracteristicas = json.dumps([
                f"Código: {room['space_code']}",
                f"Tipo: {room['space_type_name'] or 'N/A'}",
                f"Capacidad: {room['capacity']} personas"
            ])
            
            # Default image based on type
            image_urls = {
                'classroom': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800',
                'laboratory': 'https://images.unsplash.com/photo-1581093458791-9d42e3f7e1f9?auto=format&fit=crop&w=800',
                'office': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800',
                'conference': 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800',
                'auditorium': 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=800',
                'other': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800'
            }
            imagen_url = image_urls.get(space_type, image_urls['other'])
            
            # Insert into spaces
            try:
                await cursor.execute("""
                    INSERT INTO spaces 
                    (nombre, tipo, capacidad, ubicacion, descripcion, caracteristicas, estado, imagen_url, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    room['display_name'],
                    space_type,
                    room['capacity'],
                    ubicacion,
                    descripcion,
                    caracteristicas,
                    'disponible',
                    imagen_url,
                    room['created_at']
                ))
                migrated_count += 1
                
                if migrated_count % 10 == 0:
                    print(f"  Migrated {migrated_count} rooms...")
                    
            except Exception as e:
                print(f"  Error migrating room {room['id']}: {e}")
        
        await conn.commit()
        print(f"\n✅ Successfully migrated {migrated_count} rooms to spaces table!")
        
        # Verify
        await cursor.execute("SELECT COUNT(*) as total FROM spaces")
        result = await cursor.fetchone()
        print(f"Total spaces now: {result['total']}")
    
    conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_rooms_to_spaces())
