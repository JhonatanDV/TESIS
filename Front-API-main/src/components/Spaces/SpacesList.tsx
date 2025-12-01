import React, { useState } from 'react';
import { useSpaces } from '../../context/SpaceContext';
import { FileEdit, Trash2, Search, Users, MapPin, Settings } from 'lucide-react';
import { SpaceType } from '../../types';

interface SpacesListProps {
  onSpaceSelect: (id: string) => void;
}

// Traducción de tipos de espacio
const spaceTypeLabels: Record<SpaceType | 'all', string> = {
  'all': 'Todos los Espacios',
  'classroom': 'Aula',
  'laboratory': 'Laboratorio',
  'parking': 'Parqueadero',
  'office': 'Oficina',
  'conference': 'Sala de Conferencias',
  'auditorium': 'Auditorio',
  'outdoor': 'Espacio Exterior',
  'other': 'Otro'
};

const SpacesList: React.FC<SpacesListProps> = ({ onSpaceSelect }) => {
  const { spaces, deleteSpace } = useSpaces();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SpaceType | 'all'>('all');
  const [showEquipmentModal, setShowEquipmentModal] = useState<string | null>(null);
  
  const spaceTypes: Array<SpaceType | 'all'> = [
    'all', 'classroom', 'laboratory', 'parking', 'office', 
    'conference', 'auditorium', 'outdoor', 'other'
  ];
  
  // Filter spaces by search and type
  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = 
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || space.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Obtener espacio para el modal de equipos
  const equipmentModalSpace = showEquipmentModal ? spaces.find(s => s.id === showEquipmentModal) : null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar espacios..."
                className="pl-10 w-full pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex-shrink-0">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as SpaceType | 'all')}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                {spaceTypes.map(type => (
                  <option key={type} value={type}>
                    {spaceTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold">{filteredSpaces.length}</span>
            <span>de</span>
            <span className="font-semibold">{spaces.length}</span>
            <span>espacios</span>
          </div>
        </div>
      </div>
      
      {filteredSpaces.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 text-center dark:bg-slate-800 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            {spaces.length === 0 
              ? "No se encontraron espacios. ¡Agrega tu primer espacio para comenzar!" 
              : "No hay espacios que coincidan con tu búsqueda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpaces.map(space => (
            <div 
              key={space.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md dark:bg-slate-800 dark:border-slate-700"
            >
              <div 
                className="h-48 bg-slate-200 dark:bg-slate-700 relative"
                style={{
                  backgroundImage: space.image ? `url(${space.image})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute top-2 right-2 flex gap-1">
                  <div className={`text-xs font-medium px-2 py-1 rounded ${
                    space.availability 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {space.availability ? 'Disponible' : 'No Disponible'}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <div className="inline-block px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md">
                    {spaceTypeLabels[space.type]}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{space.name}</h3>
                
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{space.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{space.capacity} personas</span>
                  </div>
                </div>
                
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                  {space.description}
                </p>
                
                {/* Equipos/Características */}
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {space.features.slice(0, 3).map((feature, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {feature}
                      </span>
                    ))}
                    {space.features.length > 3 && (
                      <button
                        onClick={() => setShowEquipmentModal(space.id)}
                        className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      >
                        +{space.features.length - 3} más
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Acciones */}
                <div className="mt-4 flex items-center justify-between border-t pt-3 dark:border-slate-700">
                  <button
                    onClick={() => setShowEquipmentModal(space.id)}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Ver Equipos ({space.features.length})
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSpaceSelect(space.id)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md dark:text-blue-400 dark:hover:bg-blue-900/30"
                      title="Editar"
                    >
                      <FileEdit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar este espacio?')) {
                          deleteSpace(space.id);
                        }
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md dark:text-red-400 dark:hover:bg-red-900/30"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Equipos del Espacio */}
      {showEquipmentModal && equipmentModalSpace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-semibold dark:text-white">
                Equipos de {equipmentModalSpace.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {equipmentModalSpace.features.length} equipos/características
              </p>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {equipmentModalSpace.features.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                  Este espacio no tiene equipos registrados.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {equipmentModalSpace.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEquipmentModal(null);
                  onSpaceSelect(equipmentModalSpace.id);
                }}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                Editar Espacio
              </button>
              <button
                onClick={() => setShowEquipmentModal(null)}
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpacesList;