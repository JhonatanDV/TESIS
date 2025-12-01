import React, { useState, useEffect } from 'react';
import { useSpaces } from '../../context/SpaceContext';
import Button from '../common/Button';
import Input from '../common/Input';
import { SpaceType } from '../../types';
import { X, Plus, CheckSquare, Square, Settings } from 'lucide-react';

// Lista de equipos/características predefinidas (misma que AIAssistant)
const AVAILABLE_EQUIPMENT = [
  'Aire Acondicionado', 'Calefacción', 'Video Beam', 'Proyector', 'Pantalla',
  'Tablero Digital', 'Tablero Acrílico', 'Computador', 'Computadores Múltiples',
  'Acceso a Internet', 'WiFi', 'Sistema de Audio', 'Micrófono', 'Parlantes',
  'Cámaras de Seguridad', 'Control de Acceso', 'Iluminación LED', 
  'Ventilación Natural', 'Escritorios', 'Sillas Ergonómicas', 'Mesas de Trabajo',
  'Laboratorios', 'Equipos de Laboratorio', 'Material Didáctico', 'Biblioteca',
  'Cafetería', 'Baños Cercanos', 'Acceso para Discapacitados', 'Estacionamiento'
];

interface SpaceFormProps {
  spaceId: string | null;
  onComplete: () => void;
}

const SpaceForm: React.FC<SpaceFormProps> = ({ spaceId, onComplete }) => {
  const { getSpaceById, addSpace, updateSpace } = useSpaces();
  const isEditing = Boolean(spaceId);
  
  const spaceTypes: SpaceType[] = [
    'classroom', 'laboratory', 'parking', 'office', 
    'conference', 'auditorium', 'outdoor', 'other'
  ];

  // Traducción de tipos de espacio
  const spaceTypeLabels: Record<SpaceType, string> = {
    'classroom': 'Aula',
    'laboratory': 'Laboratorio',
    'parking': 'Parqueadero',
    'office': 'Oficina',
    'conference': 'Sala de Conferencias',
    'auditorium': 'Auditorio',
    'outdoor': 'Espacio Exterior',
    'other': 'Otro'
  };
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType>('classroom');
  const [capacity, setCapacity] = useState(0);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [availability, setAvailability] = useState(true);
  const [image, setImage] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  
  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Load space data if editing
  useEffect(() => {
    if (spaceId) {
      const space = getSpaceById(spaceId);
      if (space) {
        setName(space.name);
        setType(space.type);
        setCapacity(space.capacity);
        setLocation(space.location);
        setDescription(space.description);
        setFeatures(space.features);
        setAvailability(space.availability);
        setImage(space.image);
      }
    }
  }, [spaceId, getSpaceById]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (capacity < 1) newErrors.capacity = 'Capacity must be at least 1';
    if (!description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };
  
  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (isEditing && spaceId) {
      updateSpace(spaceId, {
        name,
        type,
        capacity,
        location,
        description,
        features,
        availability,
        image
      });
    } else {
      addSpace({
        name,
        type,
        capacity,
        location,
        description,
        features,
        availability,
        image
      });
    }
    
    onComplete();
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
      <h2 className="text-xl font-semibold text-slate-800 mb-6 dark:text-white">
        {isEditing ? 'Editar Espacio' : 'Agregar Nuevo Espacio'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nombre del Espacio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            error={errors.name}
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tipo de Espacio
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as SpaceType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            >
              {spaceTypes.map(t => (
                <option key={t} value={t}>
                  {spaceTypeLabels[t]}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Ubicación"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            error={errors.location}
          />
          
          <Input
            label="Capacidad"
            type="number"
            value={capacity.toString()}
            onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
            required
            error={errors.capacity}
          />
          
          <div className="md:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          
          <Input
            label="URL de Imagen"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Disponibilidad
            </label>
            <div className="mt-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                  checked={availability}
                  onChange={() => setAvailability(true)}
                />
                <span className="ml-2 text-slate-700 dark:text-slate-300">Disponible</span>
              </label>
              <label className="inline-flex items-center ml-6">
                <input
                  type="radio"
                  className="form-radio text-blue-600 focus:ring-blue-500 dark:bg-slate-700"
                  checked={!availability}
                  onChange={() => setAvailability(false)}
                />
                <span className="ml-2 text-slate-700 dark:text-slate-300">No Disponible</span>
              </label>
            </div>
          </div>
          
          {/* Sección de Equipos/Características */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Equipos y Características ({features.length} seleccionados)
              </label>
              <button
                type="button"
                onClick={() => setShowEquipmentModal(true)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Settings className="h-4 w-4" />
                Gestionar Equipos
              </button>
            </div>
            
            {/* Características seleccionadas */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg dark:bg-slate-700/50 min-h-[60px]">
              {features.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No hay equipos seleccionados. Haz clic en "Gestionar Equipos" para agregar.
                </p>
              ) : (
                features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="flex items-center bg-blue-100 text-blue-700 rounded-full px-3 py-1 dark:bg-blue-900/50 dark:text-blue-300"
                  >
                    <span className="text-sm">{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="ml-2 text-blue-500 hover:text-red-500 focus:outline-none dark:text-blue-400 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Agregar característica personalizada */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Agregar característica personalizada..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 bg-slate-600 text-white font-medium rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onComplete}
          >
            Cancelar
          </Button>
          <Button type="submit">
            {isEditing ? 'Actualizar Espacio' : 'Crear Espacio'}
          </Button>
        </div>
      </form>

      {/* Modal de Gestión de Equipos */}
      {showEquipmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold dark:text-white">
                Gestionar Equipos y Características
              </h3>
              <button 
                onClick={() => setShowEquipmentModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Selecciona los equipos y características disponibles en este espacio:
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AVAILABLE_EQUIPMENT.map((equip) => {
                  const isSelected = features.includes(equip);
                  return (
                    <button
                      key={equip}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFeatures(features.filter(f => f !== equip));
                        } else {
                          setFeatures([...features, equip]);
                        }
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-300' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{equip}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t dark:border-slate-700 flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {features.length} equipos seleccionados
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFeatures([])}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Limpiar Todo
                </button>
                <button
                  type="button"
                  onClick={() => setShowEquipmentModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceForm;