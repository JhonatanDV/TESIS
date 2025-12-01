import asyncio
import aiomysql
import json

async def update_spaces():
    conn = await aiomysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='root',
        db='aulas_pasto'
    )
    
    spaces_data = [
        {
            'id': 1,
            'nombre': 'Oficina Principal A',
            'tipo': 'office',
            'capacidad': 10,
            'ubicacion': 'Edificio A, Piso 1',
            'descripcion': 'Oficina amplia con excelente iluminación natural y mobiliario moderno',
            'caracteristicas': json.dumps(['Aire Acondicionado', '4 Ventanas', 'Conexión Fibra Óptica', 'Mobiliario Moderno']),
            'estado': 'disponible',
            'imagen_url': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800'
        },
        {
            'id': 2,
            'nombre': 'Sala de Reuniones 101',
            'tipo': 'conference',
            'capacidad': 20,
            'ubicacion': 'Edificio A, Piso 1',
            'descripcion': 'Sala de reuniones equipada con tecnología de videoconferencia de última generación',
            'caracteristicas': json.dumps(['Proyector HD', 'Videoconferencia', 'Pizarra Digital', 'Mesa de Conferencias', 'WiFi de Alta Velocidad']),
            'estado': 'disponible',
            'imagen_url': 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800'
        },
        {
            'id': 3,
            'nombre': 'Laboratorio de Investigación',
            'tipo': 'laboratory',
            'capacidad': 8,
            'ubicacion': 'Edificio B, Piso 2',
            'descripcion': 'Laboratorio científico con bioseguridad nivel 2 y equipamiento especializado',
            'caracteristicas': json.dumps(['Bioseguridad Nivel 2', 'Campana de Extracción', 'Microscopios', 'Equipos de Análisis', 'Sistema de Ventilación']),
            'estado': 'disponible',
            'imagen_url': 'https://images.unsplash.com/photo-1581093458791-9d42e3f7e1f9?auto=format&fit=crop&w=800'
        },
        {
            'id': 4,
            'nombre': 'Auditorio Principal',
            'tipo': 'auditorium',
            'capacidad': 100,
            'ubicacion': 'Edificio C, Planta Baja',
            'descripcion': 'Auditorio moderno con excelente acústica y equipamiento profesional de audio e iluminación',
            'caracteristicas': json.dumps(['Sistema de Audio Profesional', 'Iluminación de Escenario', 'Proyector 4K', 'Asientos Ergonómicos', 'Accesibilidad Universal']),
            'estado': 'disponible',
            'imagen_url': 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=800'
        }
    ]
    
    async with conn.cursor() as cursor:
        for space in spaces_data:
            await cursor.execute("""
                UPDATE spaces 
                SET 
                    nombre = %s,
                    tipo = %s,
                    capacidad = %s,
                    ubicacion = %s,
                    descripcion = %s,
                    caracteristicas = %s,
                    estado = %s,
                    imagen_url = %s,
                    updated_at = NOW()
                WHERE id = %s
            """, (
                space['nombre'],
                space['tipo'],
                space['capacidad'],
                space['ubicacion'],
                space['descripcion'],
                space['caracteristicas'],
                space['estado'],
                space['imagen_url'],
                space['id']
            ))
            print(f"✓ Updated space: {space['nombre']}")
        
        await conn.commit()
        print("\n✅ All spaces updated successfully!")
    
    conn.close()

if __name__ == "__main__":
    asyncio.run(update_spaces())
