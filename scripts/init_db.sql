/* Database: aulas_pasto - MySQL (InnoDB)
   Versión adaptada para integrarse con el proyecto FastAPI
   Crea tablas relacionales: campuses, blocks, floors, entornos, ambientes,
   space_types, rooms, categories, resources, rooms_resources (tabla pivote), assignments
*/
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS aulas_pasto CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aulas_pasto;

-- Lookup / estructuras
CREATE TABLE IF NOT EXISTS campuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_blocks_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS floors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  block_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_floors_block FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS entornos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ambientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entornos_id INT,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ambientes_entorno FOREIGN KEY (entornos_id) REFERENCES entornos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS space_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories and Resources (map to project models)
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  estado VARCHAR(50) DEFAULT 'disponible',
  categoria_id INT,
  caracteristicas JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_resources_category FOREIGN KEY (categoria_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla principal: rooms (espacios)
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT NOT NULL,
  block_id INT NOT NULL,
  floor_id INT NOT NULL,
  entorno_id INT,
  ambiente_id INT,
  space_type_id INT,
  space_code VARCHAR(100),
  display_name VARCHAR(300) NOT NULL,
  capacity INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rooms_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT,
  CONSTRAINT fk_rooms_block FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE RESTRICT,
  CONSTRAINT fk_rooms_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE RESTRICT,
  CONSTRAINT fk_rooms_entorno FOREIGN KEY (entorno_id) REFERENCES entornos(id) ON DELETE SET NULL,
  CONSTRAINT fk_rooms_ambiente FOREIGN KEY (ambiente_id) REFERENCES ambientes(id) ON DELETE SET NULL,
  CONSTRAINT fk_rooms_spacetype FOREIGN KEY (space_type_id) REFERENCES space_types(id) ON DELETE SET NULL,
  INDEX idx_space_code (space_code),
  INDEX idx_capacity (capacity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla pivote: relaciÃ³n many-to-many entre rooms y resources
CREATE TABLE IF NOT EXISTS rooms_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NOT NULL,
  resource_id INT NOT NULL,
  cantidad INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rr_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_rr_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  UNIQUE KEY uq_room_resource (room_id, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Assignments table (reservas / asignaciones) compatible con el proyecto
CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id INT NULL,
  resource_id INT NULL,
  fecha DATETIME NOT NULL,
  fecha_fin DATETIME NULL,
  estado VARCHAR(50) DEFAULT 'activo',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_assign_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_assign_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Poblando lookups (ejemplo)
INSERT INTO campuses (id,name) VALUES (1, 'Campus Pasto') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO blocks (id,campus_id,code,name) VALUES (1, 1, 'PasBloq002', NULL) ON DUPLICATE KEY UPDATE code=VALUES(code);

INSERT INTO floors (id,block_id,name) VALUES 
(1, 1, 'Piso 6'),
(2, 1, 'Piso 5'),
(3, 1, 'Piso 4'),
(4, 1, 'Piso 3'),
(5, 1, 'Piso 2'),
(6, 1, 'Piso 1')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO entornos (id,name) VALUES (1, 'Académicos') ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO ambientes (id,entornos_id,name) VALUES (1, 1, 'Aulas') ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO space_types (id,name) VALUES
(1, 'Aula Múltiple'),
(2, 'Aula Pregrado')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Ejemplo: categories + resources
INSERT INTO categories (id,nombre,descripcion) VALUES (1, 'Equipos de Oficina','Equipos y mobiliario para espacios de oficina') ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

INSERT INTO resources (id,nombre,tipo,estado,categoria_id,caracteristicas) VALUES
(1,'Proyector Epson EB-2250U','proyector','disponible',1,JSON_OBJECT('lumenes',5000,'resolucion','WUXGA'))
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Inserts en rooms (lista tomada del Excel)
INSERT INTO rooms (id,campus_id,block_id,floor_id,entorno_id,ambiente_id,space_type_id,space_code,display_name,capacity) VALUES
(1,1,1,1,1,1,1,'0702060411','0702060411 -  Aula Múltiple-611',120),
(2,1,1,1,1,1,2,'0702060110','0702060110 -  Aula Pregrado-610',80),
(3,1,1,1,1,1,2,'0702060108','0702060108 -  Aula Pregrado-608',85),
(4,1,1,1,1,1,2,'0702060106','0702060106 -  Aula Pregrado-606',30),
(5,1,1,1,1,1,2,'0702060102','0702060102 -  Aula Pregrado-602',50),
(6,1,1,1,1,1,2,'0702060101','0702060101 -  Aula Pregrado-601',50),
(7,1,1,2,1,1,2,'0702050110','0702050110 -  Aula Pregrado-510',60),
(8,1,1,2,1,1,2,'0702050108','0702050108 -  Aula Pregrado-508',60),
(9,1,1,2,1,1,2,'0702050106','0702050106 -  Aula Pregrado-506',60),
(10,1,1,2,1,1,2,'0702050105','0702050105 -  Aula Pregrado-505',40),
(11,1,1,2,1,1,2,'0702050104','0702050104 -  Aula Pregrado-504',40),
(12,1,1,2,1,1,2,'0702050103','0702050103 -  Aula Pregrado-503',40),
(13,1,1,2,1,1,2,'0702050102','0702050102 -  Aula Pregrado-502',50),
(14,1,1,2,1,1,2,'0702050101','0702050101 -  Aula Pregrado-501',50),
(15,1,1,3,1,1,2,'0702040110','0702040110 -  Aula Pregrado-410',75),
(16,1,1,3,1,1,2,'0702040108','0702040108 -  Aula Pregrado-408',50),
(17,1,1,3,1,1,2,'0702040102','0702040102 -  Aula Pregrado-402',50),
(18,1,1,3,1,1,2,'0702040101','0702040101 -  Aula Pregrado-401',50),
(19,1,1,4,1,1,2,'0702030112','0702030112 -  Aula Pregrado-312',35),
(20,1,1,4,1,1,2,'0702030110','0702030110 -  Aula Pregrado-310',35),
(21,1,1,4,1,1,2,'0702030108','0702030108 -  Aula Pregrado-308',35),
(22,1,1,4,1,1,2,'0702030106','0702030106 -  Aula Pregrado-306',35),
(23,1,1,4,1,1,2,'0702030105','0702030105 -  Aula Pregrado-305',30),
(24,1,1,4,1,1,2,'0702030104','0702030104 -  Aula Pregrado-304',40),
(25,1,1,4,1,1,2,'0702030103','0702030103 -  Aula Pregrado-303',40),
(26,1,1,4,1,1,2,'0702030102','0702030102 -  Aula Pregrado-302',40),
(27,1,1,4,1,1,2,'0702030101','0702030101 -  Aula Pregrado-301',40),
(28,1,1,5,1,1,2,'0702020105','0702020105 -  Aula Pregrado-205',35),
(29,1,1,5,1,1,2,'0702020104','0702020104 -  Aula Pregrado-204',30),
(30,1,1,5,1,1,2,'0702020103','0702020103 -  Aula Pregrado-203',30),
(31,1,1,5,1,1,2,'0702020102','0702020102 -  Aula Pregrado-202',30),
(32,1,1,5,1,1,2,'0702020101','0702020101 -  Aula Pregrado-201',30),
(33,1,1,6,1,1,2,'0702010105','0702010105 -  Aula Pregrado-105',30),
(34,1,1,6,1,1,2,'0702010104','0702010104 -  Aula Pregrado-104',30),
(35,1,1,6,1,1,2,'0702010103','0702010103 -  Aula Pregrado-103',30),
(36,1,1,6,1,1,2,'0702010102','0702010102 -  Aula Pregrado-102',30),
(37,1,1,6,1,1,2,'0702010101','0702010101 -  Aula Pregrado-101',30),
(38,1,1,1,1,1,2,'0702060106','0702060106 -  Aula Pregrado-606',30),
(39,1,1,1,1,1,2,'0702060102','0702060102 -  Aula Pregrado-602',50),
(40,1,1,1,1,1,2,'0702060101','0702060101 -  Aula Pregrado-601',50),
(41,1,1,2,1,1,2,'0702050110','0702050110 -  Aula Pregrado-510',60),
(42,1,1,2,1,1,2,'0702050108','0702050108 -  Aula Pregrado-508',60),
(43,1,1,2,1,1,2,'0702050106','0702050106 -  Aula Pregrado-506',60),
(44,1,1,2,1,1,2,'0702050105','0702050105 -  Aula Pregrado-505',40),
(45,1,1,2,1,1,2,'0702050104','0702050104 -  Aula Pregrado-504',40),
(46,1,1,2,1,1,2,'0702050103','0702050103 -  Aula Pregrado-503',40),
(47,1,1,2,1,1,2,'0702050102','0702050102 -  Aula Pregrado-502',50),
(48,1,1,2,1,1,2,'0702050101','0702050101 -  Aula Pregrado-501',50),
(49,1,1,3,1,1,2,'0702040110','0702040110 -  Aula Pregrado-410',75),
(50,1,1,3,1,1,2,'0702040108','0702040108 -  Aula Pregrado-408',50),
(51,1,1,3,1,1,2,'0702040102','0702040102 -  Aula Pregrado-402',50)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- Ejemplo de asignar un recurso a una sala (tabla pivote)
INSERT INTO rooms_resources (room_id,resource_id,cantidad) VALUES (1,1,1) ON DUPLICATE KEY UPDATE cantidad=VALUES(cantidad);

SET FOREIGN_KEY_CHECKS = 1;

-- Ejemplo de consulta usando INNER JOIN a travÃ©s de la tabla pivote
-- Selecciona salas y sus recursos
-- Mapea a la estructura del proyecto: rooms <-> rooms_resources <-> resources
SELECT r.id AS room_id,
       r.display_name,
       r.capacity,
       res.id AS resource_id,
       res.nombre AS resource_name,
       rr.cantidad
FROM rooms r
INNER JOIN rooms_resources rr ON rr.room_id = r.id
INNER JOIN resources res ON res.id = rr.resource_id
WHERE r.capacity >= 50
ORDER BY r.id;
