import React, { useState, useMemo } from 'react';
import { useAI } from '../../context/AIContext';
import { useSpaces } from '../../context/SpaceContext';
import Button from '../common/Button';
import SpaceLayoutVisualization from './SpaceLayoutVisualization';
import { Search, Lightbulb, BarChart2, Loader2, Filter, ChevronLeft, ChevronRight, Calendar, MapPin, Users, CheckCircle, Building2, Settings, X, Wand2, Sparkles, Clock, AlertCircle, Ruler, Car, Monitor, Layout, Plus, Trash2, BookOpen, GraduationCap, CalendarDays } from 'lucide-react';

// Interfaz para una materia/clase
interface MateriaClase {
  id: string;
  nombreMateria: string;
  semestre: string;
  programa: string;
  docente: string;
  numeroEstudiantes: number;
  horasSemanales: number;
  tipoEspacio: string;
  equipamientoRequerido: string[];
  diasPreferidos: string[];
  horaInicioPreferida: string;
  horaFinPreferida: string;
}

// Lista de características/equipos disponibles para las aulas
const AVAILABLE_FEATURES = [
  { id: '01', name: 'Aire Acondicionado' },
  { id: '02', name: 'Calefacción' },
  { id: '03', name: 'Tarima' },
  { id: '04', name: 'Pizarra Blanca' },
  { id: '05', name: 'Retroproyector' },
  { id: '06', name: 'Televisión' },
  { id: '07', name: 'Conexión Red' },
  { id: '08', name: 'Sillas en Hilera' },
  { id: '09', name: 'Butacas' },
  { id: '10', name: 'Estudio Circuito Cerrado TV' },
  { id: '11', name: 'Ordenador' },
  { id: '12', name: 'Ventana' },
  { id: '13', name: 'Amplificadores' },
  { id: '14', name: 'Conexión Satélite' },
  { id: '15', name: 'Laboratorio Biología' },
  { id: '16', name: 'Laboratorio Química' },
  { id: '17', name: 'Laboratorio Informática' },
  { id: '18', name: 'Laboratorio Cocina' },
  { id: '19', name: 'Laboratorio Mantenim Aviación' },
  { id: '20', name: 'Laboratorio Médico' },
  { id: '21', name: 'Sala Entrevista Practicum' },
  { id: '22', name: 'Video Beam' },
  { id: '23', name: 'DVD' },
  { id: '24', name: 'Equipos de Laboratorio' },
  { id: '25', name: 'Acceso para Discapacitados' },
  { id: '26', name: 'Clínica' },
  { id: '27', name: 'Implementos Deportivos' },
  { id: '28', name: 'Sonido' },
  { id: '29', name: 'Otros' },
];

const DAYS_OF_WEEK = [
  { id: 'monday', name: 'Lunes', short: 'L' },
  { id: 'tuesday', name: 'Martes', short: 'M' },
  { id: 'wednesday', name: 'Miércoles', short: 'X' },
  { id: 'thursday', name: 'Jueves', short: 'J' },
  { id: 'friday', name: 'Viernes', short: 'V' },
  { id: 'saturday', name: 'Sábado', short: 'S' },
  { id: 'sunday', name: 'Domingo', short: 'D' },
];

const AIAssistant: React.FC = () => {
  const { getSpaceRecommendations, analyzeSpaceUsage, getOptimizationSuggestions, isProcessing } = useAI();
  const { spaces, updateSpace } = useSpaces();
  
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState<'recommend' | 'analyze' | 'optimize' | 'smart' | 'layout' | 'scheduler'>('recommend');
  
  // Search filters
  const [filters, setFilters] = useState({
    type: '',
    minCapacity: '',
    maxCapacity: '',
    location: '',
    availability: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Analysis pagination
  const [analysisPage, setAnalysisPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'capacity' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const spacesPerPage = 6;
  
  // Reservation modal
  const [showReservation, setShowReservation] = useState(false);
  const [reservationData, setReservationData] = useState({
    spaceId: '',
    spaceName: '',
    spaceCapacity: 0,
    installationId: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    selectedDays: [] as string[],
    purpose: '',
    attendees: '',
    eventType: 'class' // class, meeting, event, other
  });
  const [reservationSuccess, setReservationSuccess] = useState(false);
  
  // Feature management modal
  const [showFeatureManager, setShowFeatureManager] = useState(false);
  const [featureManagerSpace, setFeatureManagerSpace] = useState<any>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureSaveSuccess, setFeatureSaveSuccess] = useState(false);

  // Smart Reservation states
  const [smartDescription, setSmartDescription] = useState('');
  const [smartCapacity, setSmartCapacity] = useState('');
  const [smartDate, setSmartDate] = useState('');
  const [smartTimeStart, setSmartTimeStart] = useState('');
  const [smartTimeEnd, setSmartTimeEnd] = useState('');
  const [smartEquipment, setSmartEquipment] = useState<string[]>([]);
  const [smartSpaceType, setSmartSpaceType] = useState('');
  const [smartAutoCreate, setSmartAutoCreate] = useState(true);
  const [smartResult, setSmartResult] = useState<any>(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState<string | null>(null);

  // Space Layout Analysis states
  const [layoutSpaceType, setLayoutSpaceType] = useState('aula');
  const [layoutMetros, setLayoutMetros] = useState('');
  const [layoutForma, setLayoutForma] = useState('rectangular');
  const [layoutLargo, setLayoutLargo] = useState('');
  const [layoutAncho, setLayoutAncho] = useState('');
  const [layoutElementos, setLayoutElementos] = useState<Array<{tipo: string, cantidad: number}>>([]);
  const [layoutIncluirInstructor, setLayoutIncluirInstructor] = useState(true);
  const [layoutAnchoPasillo, setLayoutAnchoPasillo] = useState('1.2');
  const [layoutVentanas, setLayoutVentanas] = useState('');
  const [layoutPuerta, setLayoutPuerta] = useState('');
  const [layoutRestricciones, setLayoutRestricciones] = useState('');
  // Para parqueaderos
  const [layoutVehiculos, setLayoutVehiculos] = useState('');
  const [layoutMotos, setLayoutMotos] = useState('');
  const [layoutDiscapacitados, setLayoutDiscapacitados] = useState('');
  // Resultado
  const [layoutResult, setLayoutResult] = useState<any>(null);
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  // ============================================
  // SCHEDULER - Programador de Clases Múltiples
  // ============================================
  const [materias, setMaterias] = useState<MateriaClase[]>([]);
  const [schedulerPeriodo, setSchedulerPeriodo] = useState('2024-1'); // Semestre académico
  const [schedulerFechaInicio, setSchedulerFechaInicio] = useState('');
  const [schedulerFechaFin, setSchedulerFechaFin] = useState('');
  const [schedulerResult, setSchedulerResult] = useState<any>(null);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const [schedulerError, setSchedulerError] = useState<string | null>(null);
  const [showAddMateria, setShowAddMateria] = useState(false);
  const [editingMateria, setEditingMateria] = useState<MateriaClase | null>(null);
  
  // Estado para nueva materia
  const [nuevaMateria, setNuevaMateria] = useState<MateriaClase>({
    id: '',
    nombreMateria: '',
    semestre: '1',
    programa: '',
    docente: '',
    numeroEstudiantes: 20,
    horasSemanales: 4,
    tipoEspacio: 'aula',
    equipamientoRequerido: [],
    diasPreferidos: ['monday', 'wednesday', 'friday'],
    horaInicioPreferida: '07:00',
    horaFinPreferida: '19:00',
  });

  // Semestres disponibles
  const SEMESTRES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  
  // Programas académicos de ejemplo
  const PROGRAMAS = [
    'Ingeniería de Sistemas',
    'Ingeniería Civil', 
    'Administración de Empresas',
    'Contaduría Pública',
    'Derecho',
    'Psicología',
    'Medicina',
    'Enfermería',
    'Arquitectura',
    'Comunicación Social',
  ];

  // Elementos disponibles para agregar según tipo de espacio
  const elementosDisponibles: Record<string, Array<{id: string, nombre: string, area: number}>> = {
    aula: [
      { id: 'computador', nombre: 'Computador/PC', area: 2.0 },
      { id: 'escritorio_estudiante', nombre: 'Escritorio estudiante', area: 1.5 },
      { id: 'silla', nombre: 'Silla', area: 0.5 },
      { id: 'pupitre', nombre: 'Pupitre', area: 1.2 },
      { id: 'proyector', nombre: 'Proyector', area: 1.0 },
      { id: 'pantalla', nombre: 'Pantalla/Pizarra digital', area: 3.0 },
      { id: 'pizarra', nombre: 'Pizarra tradicional', area: 4.0 },
    ],
    laboratorio: [
      { id: 'computador', nombre: 'Computador/PC', area: 2.0 },
      { id: 'mesa_laboratorio', nombre: 'Mesa de laboratorio', area: 4.0 },
      { id: 'equipo_laboratorio', nombre: 'Equipo de laboratorio', area: 2.0 },
      { id: 'silla', nombre: 'Silla/Banqueta', area: 0.5 },
      { id: 'proyector', nombre: 'Proyector', area: 1.0 },
    ],
    parqueadero: [
      { id: 'vehiculo', nombre: 'Espacio vehículo', area: 11.25 },  // 2.5m x 4.5m
      { id: 'motocicleta', nombre: 'Espacio motocicleta', area: 1.4 },  // ~0.7m x 2m
      { id: 'vehiculo_discapacitado', nombre: 'Espacio discapacitado', area: 15.75 },  // 3.5m x 4.5m
    ],
    auditorio: [
      { id: 'butacas', nombre: 'Butaca/Asiento', area: 0.8 },
      { id: 'silla', nombre: 'Silla apilable', area: 0.5 },
      { id: 'proyector', nombre: 'Proyector', area: 1.0 },
      { id: 'pantalla', nombre: 'Pantalla grande', area: 5.0 },
    ],
    oficina: [
      { id: 'escritorio_oficina', nombre: 'Escritorio de trabajo', area: 4.0 },
      { id: 'silla_oficina', nombre: 'Silla de oficina', area: 1.0 },
      { id: 'archivador', nombre: 'Archivador', area: 0.8 },
      { id: 'mesa_trabajo', nombre: 'Mesa de reuniones', area: 2.5 },
    ],
    sala_conferencias: [
      { id: 'mesa_trabajo', nombre: 'Mesa de conferencias', area: 2.5 },
      { id: 'silla_oficina', nombre: 'Silla ejecutiva', area: 1.0 },
      { id: 'proyector', nombre: 'Proyector', area: 1.0 },
      { id: 'pantalla', nombre: 'Pantalla', area: 3.0 },
      { id: 'televisor', nombre: 'TV/Monitor grande', area: 1.5 },
    ],
  };

  // Get unique types and locations for filters
  const spaceTypes = useMemo(() => {
    const types = [...new Set(spaces.map(s => s.type))];
    return types.sort();
  }, [spaces]);

  const spaceLocations = useMemo(() => {
    const locations = [...new Set(spaces.map(s => s.location).filter(Boolean))];
    return locations.sort();
  }, [spaces]);

  // Sorted and paginated spaces for analysis
  const sortedSpaces = useMemo(() => {
    let sorted = [...spaces];
    sorted.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'capacity') {
        comparison = a.capacity - b.capacity;
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [spaces, sortBy, sortOrder]);

  const totalPages = Math.ceil(sortedSpaces.length / spacesPerPage);
  const paginatedSpaces = sortedSpaces.slice(
    (analysisPage - 1) * spacesPerPage,
    analysisPage * spacesPerPage
  );

  // Filter spaces for search
  const filterSpaces = (spacesToFilter: any[]) => {
    return spacesToFilter.filter(space => {
      if (filters.type && space.type !== filters.type) return false;
      if (filters.minCapacity && space.capacity < parseInt(filters.minCapacity)) return false;
      if (filters.maxCapacity && space.capacity > parseInt(filters.maxCapacity)) return false;
      if (filters.location && !space.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.availability === 'available' && !space.availability) return false;
      if (filters.availability === 'occupied' && space.availability) return false;
      return true;
    });
  };

  const handleSearch = async () => {
    if (!query.trim() && !Object.values(filters).some(v => v && v !== 'all')) {
      return;
    }
    
    // First apply local filters
    let filtered = filterSpaces(spaces);
    
    // If there's a text query, also search by name/description
    if (query.trim()) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter(space => 
        space.name.toLowerCase().includes(queryLower) ||
        space.type.toLowerCase().includes(queryLower) ||
        space.location?.toLowerCase().includes(queryLower) ||
        space.features?.some((f: string) => f.toLowerCase().includes(queryLower))
      );
    }
    
    // Create recommendations from filtered results
    const recs = filtered.map((space, index) => ({
      spaceId: space.id,
      space: space,
      score: 10 - (index * 0.5),
      reason: generateRecommendationReason(space, query, filters)
    }));
    
    setRecommendations(recs.slice(0, 10));
    setAnalysis(null);
    setSuggestions(null);
  };

  const generateRecommendationReason = (space: any, query: string, filters: any) => {
    const reasons = [];
    if (query && space.name.toLowerCase().includes(query.toLowerCase())) {
      reasons.push(`Name matches "${query}"`);
    }
    if (filters.type && space.type === filters.type) {
      reasons.push(`Type: ${space.type}`);
    }
    if (filters.minCapacity || filters.maxCapacity) {
      reasons.push(`Capacity: ${space.capacity} people`);
    }
    if (space.availability) {
      reasons.push('Currently available');
    }
    if (space.features?.length > 0) {
      reasons.push(`Features: ${space.features.slice(0, 3).join(', ')}`);
    }
    return reasons.length > 0 ? reasons.join(' • ') : 'Matches your search criteria';
  };

  const handleSpaceAnalysis = async (spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId);
    setSelectedSpace(space);
    const result = await analyzeSpaceUsage(spaceId);
    setAnalysis(result);
  };

  const handleOptimization = async () => {
    const result = await getOptimizationSuggestions();
    setSuggestions(result);
    setRecommendations([]);
    setAnalysis(null);
  };

  const openReservation = (space: any) => {
    setReservationData({
      spaceId: space.id,
      spaceName: space.name,
      spaceCapacity: space.capacity || 0,
      installationId: space.id,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      selectedDays: [],
      purpose: '',
      attendees: '',
      eventType: 'class'
    });
    setShowReservation(true);
    setReservationSuccess(false);
  };

  const handleReservation = async () => {
    // TODO: Send reservation to API
    console.log('Reservation data:', reservationData);
    setReservationSuccess(true);
    setTimeout(() => {
      setShowReservation(false);
      setReservationSuccess(false);
    }, 2000);
  };

  const toggleDay = (dayId: string) => {
    setReservationData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(dayId)
        ? prev.selectedDays.filter(d => d !== dayId)
        : [...prev.selectedDays, dayId]
    }));
  };

  // Feature management functions
  const openFeatureManager = (space: any) => {
    setFeatureManagerSpace(space);
    setSelectedFeatures(space.features || []);
    setShowFeatureManager(true);
    setFeatureSaveSuccess(false);
  };

  const toggleFeature = (featureName: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureName)
        ? prev.filter(f => f !== featureName)
        : [...prev, featureName]
    );
  };

  const saveFeatures = async () => {
    if (featureManagerSpace && updateSpace) {
      try {
        await updateSpace(featureManagerSpace.id, {
          ...featureManagerSpace,
          features: selectedFeatures
        });
        setFeatureSaveSuccess(true);
        setTimeout(() => {
          setShowFeatureManager(false);
          setFeatureSaveSuccess(false);
        }, 1500);
      } catch (error) {
        console.error('Error saving features:', error);
      }
    }
  };

  // Smart Reservation function
  const handleSmartReservation = async () => {
    if (!smartDescription.trim()) {
      setSmartError('Por favor, describe lo que necesitas');
      return;
    }

    setSmartLoading(true);
    setSmartError(null);
    setSmartResult(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/v1/chatbot/smart-reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          descripcion: smartDescription,
          fecha_preferida: smartDate || null,
          hora_inicio_preferida: smartTimeStart || null,
          hora_fin_preferida: smartTimeEnd || null,
          capacidad_minima: smartCapacity ? parseInt(smartCapacity) : null,
          equipamiento_requerido: smartEquipment,
          tipo_espacio_preferido: smartSpaceType || null,
          crear_reserva: smartAutoCreate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al procesar la solicitud');
      }

      setSmartResult(data);
    } catch (error: any) {
      console.error('Error en reserva inteligente:', error);
      setSmartError(error.message || 'Error al conectar con el servidor');
    } finally {
      setSmartLoading(false);
    }
  };

  const toggleSmartEquipment = (equipment: string) => {
    setSmartEquipment(prev =>
      prev.includes(equipment)
        ? prev.filter(e => e !== equipment)
        : [...prev, equipment]
    );
  };

  const clearSmartForm = () => {
    setSmartDescription('');
    setSmartCapacity('');
    setSmartDate('');
    setSmartTimeStart('');
    setSmartTimeEnd('');
    setSmartEquipment([]);
    setSmartSpaceType('');
    setSmartResult(null);
    setSmartError(null);
  };

  // Space Layout Analysis functions
  const handleLayoutAnalysis = async () => {
    if (!layoutMetros || parseFloat(layoutMetros) <= 0) {
      setLayoutError('Por favor, ingresa los metros cuadrados del espacio');
      return;
    }

    if (layoutSpaceType !== 'parqueadero' && layoutElementos.length === 0) {
      setLayoutError('Por favor, agrega al menos un elemento a distribuir');
      return;
    }

    setLayoutLoading(true);
    setLayoutError(null);
    setLayoutResult(null);

    try {
      const token = localStorage.getItem('access_token');
      
      const requestBody: any = {
        tipo_espacio: layoutSpaceType,
        metros_cuadrados: parseFloat(layoutMetros),
        forma: layoutForma,
        largo: layoutLargo ? parseFloat(layoutLargo) : null,
        ancho: layoutAncho ? parseFloat(layoutAncho) : null,
        elementos: layoutElementos.map(e => ({ tipo: e.tipo, cantidad: e.cantidad })),
        incluir_espacio_instructor: layoutIncluirInstructor,
        incluir_pasillos: true,
        ancho_pasillo_minimo: parseFloat(layoutAnchoPasillo) || 1.2,
        ventanas_en: layoutVentanas || null,
        puerta_en: layoutPuerta || null,
        restricciones_adicionales: layoutRestricciones || null,
      };

      // Para parqueaderos, agregar campos específicos
      if (layoutSpaceType === 'parqueadero') {
        requestBody.espacios_vehiculos = layoutVehiculos ? parseInt(layoutVehiculos) : null;
        requestBody.espacios_motos = layoutMotos ? parseInt(layoutMotos) : null;
        requestBody.espacios_discapacitados = layoutDiscapacitados ? parseInt(layoutDiscapacitados) : null;
      }

      const response = await fetch('http://localhost:8000/api/v1/chatbot/analyze-space-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al analizar el espacio');
      }

      setLayoutResult(data);
    } catch (error: any) {
      console.error('Error en análisis de espacio:', error);
      setLayoutError(error.message || 'Error al conectar con el servidor');
    } finally {
      setLayoutLoading(false);
    }
  };

  const addLayoutElemento = (tipo: string) => {
    const existing = layoutElementos.find(e => e.tipo === tipo);
    if (existing) {
      setLayoutElementos(prev => 
        prev.map(e => e.tipo === tipo ? { ...e, cantidad: e.cantidad + 1 } : e)
      );
    } else {
      setLayoutElementos(prev => [...prev, { tipo, cantidad: 1 }]);
    }
  };

  const updateLayoutElementoCantidad = (tipo: string, cantidad: number) => {
    if (cantidad <= 0) {
      setLayoutElementos(prev => prev.filter(e => e.tipo !== tipo));
    } else {
      setLayoutElementos(prev => 
        prev.map(e => e.tipo === tipo ? { ...e, cantidad } : e)
      );
    }
  };

  const removeLayoutElemento = (tipo: string) => {
    setLayoutElementos(prev => prev.filter(e => e.tipo !== tipo));
  };

  const clearLayoutForm = () => {
    setLayoutSpaceType('aula');
    setLayoutMetros('');
    setLayoutForma('rectangular');
    setLayoutLargo('');
    setLayoutAncho('');
    setLayoutElementos([]);
    setLayoutIncluirInstructor(true);
    setLayoutAnchoPasillo('1.2');
    setLayoutVentanas('');
    setLayoutPuerta('');
    setLayoutRestricciones('');
    setLayoutVehiculos('');
    setLayoutMotos('');
    setLayoutDiscapacitados('');
    setLayoutResult(null);
    setLayoutError(null);
  };

  // ============================================
  // FUNCIONES DEL SCHEDULER
  // ============================================
  
  const resetNuevaMateria = () => {
    setNuevaMateria({
      id: '',
      nombreMateria: '',
      semestre: '1',
      programa: '',
      docente: '',
      numeroEstudiantes: 20,
      horasSemanales: 4,
      tipoEspacio: 'aula',
      equipamientoRequerido: [],
      diasPreferidos: ['monday', 'wednesday', 'friday'],
      horaInicioPreferida: '07:00',
      horaFinPreferida: '19:00',
    });
  };

  const agregarMateria = () => {
    if (!nuevaMateria.nombreMateria.trim() || !nuevaMateria.programa.trim()) {
      setSchedulerError('Por favor ingresa el nombre de la materia y el programa');
      return;
    }

    const materia: MateriaClase = {
      ...nuevaMateria,
      id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    setMaterias(prev => [...prev, materia]);
    resetNuevaMateria();
    setShowAddMateria(false);
    setSchedulerError(null);
  };

  const editarMateria = (materia: MateriaClase) => {
    setEditingMateria(materia);
    setNuevaMateria({ ...materia });
    setShowAddMateria(true);
  };

  const guardarEdicionMateria = () => {
    if (!nuevaMateria.nombreMateria.trim() || !nuevaMateria.programa.trim()) {
      setSchedulerError('Por favor ingresa el nombre de la materia y el programa');
      return;
    }

    setMaterias(prev => prev.map(m => 
      m.id === editingMateria?.id ? { ...nuevaMateria, id: m.id } : m
    ));
    resetNuevaMateria();
    setEditingMateria(null);
    setShowAddMateria(false);
    setSchedulerError(null);
  };

  const eliminarMateria = (id: string) => {
    setMaterias(prev => prev.filter(m => m.id !== id));
  };

  const toggleDiaPreferido = (dia: string) => {
    setNuevaMateria(prev => ({
      ...prev,
      diasPreferidos: prev.diasPreferidos.includes(dia)
        ? prev.diasPreferidos.filter(d => d !== dia)
        : [...prev.diasPreferidos, dia]
    }));
  };

  const toggleEquipamientoMateria = (equipo: string) => {
    setNuevaMateria(prev => ({
      ...prev,
      equipamientoRequerido: prev.equipamientoRequerido.includes(equipo)
        ? prev.equipamientoRequerido.filter(e => e !== equipo)
        : [...prev.equipamientoRequerido, equipo]
    }));
  };

  const handleSchedulerGenerate = async () => {
    if (materias.length === 0) {
      setSchedulerError('Por favor agrega al menos una materia para generar el horario');
      return;
    }

    if (!schedulerFechaInicio || !schedulerFechaFin) {
      setSchedulerError('Por favor selecciona las fechas de inicio y fin del periodo');
      return;
    }

    setSchedulerLoading(true);
    setSchedulerError(null);
    setSchedulerResult(null);

    try {
      const token = localStorage.getItem('access_token');
      
      const requestBody = {
        periodo_academico: schedulerPeriodo,
        fecha_inicio: schedulerFechaInicio,
        fecha_fin: schedulerFechaFin,
        materias: materias.map(m => ({
          nombre_materia: m.nombreMateria,
          semestre: m.semestre,
          programa: m.programa,
          docente: m.docente,
          numero_estudiantes: m.numeroEstudiantes,
          horas_semanales: m.horasSemanales,
          tipo_espacio: m.tipoEspacio,
          equipamiento_requerido: m.equipamientoRequerido,
          dias_preferidos: m.diasPreferidos,
          hora_inicio_preferida: m.horaInicioPreferida,
          hora_fin_preferida: m.horaFinPreferida,
        })),
        evitar_cruces: true,
        optimizar_uso_espacios: true,
      };

      const response = await fetch('http://localhost:8000/api/v1/chatbot/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al generar el horario');
      }

      setSchedulerResult(data);
    } catch (error: any) {
      console.error('Error en generación de horario:', error);
      setSchedulerError(error.message || 'Error al conectar con el servidor');
    } finally {
      setSchedulerLoading(false);
    }
  };

  const clearScheduler = () => {
    setMaterias([]);
    setSchedulerPeriodo('2024-1');
    setSchedulerFechaInicio('');
    setSchedulerFechaFin('');
    setSchedulerResult(null);
    setSchedulerError(null);
    resetNuevaMateria();
  };

  const calcularAreaEstimada = () => {
    let areaTotal = 0;
    const elementos = elementosDisponibles[layoutSpaceType] || [];
    
    layoutElementos.forEach(item => {
      const elementoInfo = elementos.find(e => e.id === item.tipo);
      if (elementoInfo) {
        areaTotal += elementoInfo.area * item.cantidad;
      }
    });

    if (layoutIncluirInstructor && ['aula', 'laboratorio', 'sala_conferencias'].includes(layoutSpaceType)) {
      areaTotal += 8; // Espacio instructor
    }

    // Para parqueaderos (dimensiones reales)
    if (layoutSpaceType === 'parqueadero') {
      if (layoutVehiculos) areaTotal += parseInt(layoutVehiculos) * 11.25;  // 2.5m x 4.5m
      if (layoutMotos) areaTotal += parseInt(layoutMotos) * 1.4;  // ~0.7m x 2m = 1.4m²
      if (layoutDiscapacitados) areaTotal += parseInt(layoutDiscapacitados) * 15.75;  // 3.5m x 4.5m
    }

    return areaTotal;
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      minCapacity: '',
      maxCapacity: '',
      location: '',
      availability: 'all'
    });
    setQuery('');
    setRecommendations([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 dark:bg-slate-800 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 dark:text-white">
          Asistente IA de Espacios
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Obtén recomendaciones con IA, analiza tus espacios y descubre oportunidades de optimización.
        </p>
        
        {/* Tabs */}
        <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab('recommend')}
            className={`px-4 py-2 font-medium text-sm -mb-px ${
              activeTab === 'recommend'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Buscar Espacios
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 font-medium text-sm -mb-px ${
              activeTab === 'analyze'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              Análisis
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('optimize')}
            className={`px-4 py-2 font-medium text-sm -mb-px ${
              activeTab === 'optimize'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              Optimización
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('smart')}
            className={`px-4 py-2 font-medium text-sm -mb-px ${
              activeTab === 'smart'
                ? 'text-violet-600 border-b-2 border-violet-600 dark:text-violet-400 dark:border-violet-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center">
              <Wand2 className="h-4 w-4 mr-2" />
              <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />
              Reserva IA
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-2 font-medium text-sm -mb-px ${
              activeTab === 'layout'
                ? 'text-emerald-600 border-b-2 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center">
              <Layout className="h-4 w-4 mr-2" />
              <Ruler className="h-3 w-3 mr-1 text-emerald-500" />
              Diseño Espacio
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('scheduler')}
            className={`px-4 py-2 font-medium text-sm -mb-px ${
              activeTab === 'scheduler'
                ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center">
              <CalendarDays className="h-4 w-4 mr-2" />
              <GraduationCap className="h-3 w-3 mr-1 text-indigo-500" />
              Horarios IA
            </div>
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'recommend' && (
          <div className="space-y-4">
            {/* Search bar with filter toggle */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by name, type, or features..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                icon={<Filter className="h-4 w-4" />}
              >
                Filters
              </Button>
              <Button
                onClick={handleSearch}
                disabled={isProcessing}
                loading={isProcessing}
              >
                Search
              </Button>
            </div>
            
            {/* Advanced filters */}
            {showFilters && (
              <div className="bg-slate-50 p-4 rounded-lg dark:bg-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Type
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({...filters, type: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      <option value="">All Types</option>
                      {spaceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Min Capacity
                    </label>
                    <input
                      type="number"
                      value={filters.minCapacity}
                      onChange={(e) => setFilters({...filters, minCapacity: e.target.value})}
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Max Capacity
                    </label>
                    <input
                      type="number"
                      value={filters.maxCapacity}
                      onChange={(e) => setFilters({...filters, maxCapacity: e.target.value})}
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Location
                    </label>
                    <select
                      value={filters.location}
                      onChange={(e) => setFilters({...filters, location: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      <option value="">All Locations</option>
                      {spaceLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Availability
                    </label>
                    <select
                      value={filters.availability}
                      onChange={(e) => setFilters({...filters, availability: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      <option value="all">All</option>
                      <option value="available">Available Only</option>
                      <option value="occupied">Occupied Only</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
            
            {/* Results */}
            {isProcessing ? (
              <div className="text-center py-10">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4 dark:text-blue-400" />
                <p className="text-slate-600 dark:text-slate-400">Searching spaces...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-md font-medium text-slate-800 dark:text-white">
                    Found {recommendations.length} Space{recommendations.length !== 1 ? 's' : ''}
                  </h3>
                </div>
                
                <div className="grid gap-4">
                  {recommendations.map((rec, index) => (
                    <div 
                      key={index}
                      className="border border-slate-200 rounded-lg p-4 dark:border-slate-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h4 className="font-medium text-slate-800 dark:text-white text-lg">
                              {rec.space?.name}
                            </h4>
                            {rec.space?.availability && (
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                Available
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center mt-2 text-sm text-slate-600 dark:text-slate-300 flex-wrap gap-x-4 gap-y-1">
                            <span className="flex items-center">
                              <span className="font-medium mr-1">Type:</span>
                              {rec.space?.type}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {rec.space?.location || 'N/A'}
                            </span>
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              Capacity: {rec.space?.capacity}
                            </span>
                          </div>
                          
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {rec.reason}
                          </p>
                          
                          {rec.space?.features && rec.space.features.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {rec.space.features.slice(0, 5).map((feature: string, i: number) => (
                                <span 
                                  key={i}
                                  className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded dark:bg-slate-700 dark:text-slate-300"
                                >
                                  {feature}
                                </span>
                              ))}
                              {rec.space.features.length > 5 && (
                                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded dark:bg-slate-700 dark:text-slate-300">
                                  +{rec.space.features.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4 flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => openReservation(rec.space)}
                            icon={<Calendar className="h-4 w-4" />}
                          >
                            Reservar
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openFeatureManager(rec.space)}
                            icon={<Settings className="h-4 w-4" />}
                          >
                            Equipos
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setActiveTab('analyze');
                              handleSpaceAnalysis(rec.space?.id);
                            }}
                          >
                            Analizar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : query || Object.values(filters).some(v => v && v !== 'all') ? (
              <div className="text-center py-10">
                <p className="text-slate-600 dark:text-slate-400">No spaces found matching your criteria</p>
                <Button variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter search terms or use filters to find spaces</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'analyze' && (
          <div className="space-y-4">
            {/* Sort controls */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing {paginatedSpaces.length} of {spaces.length} spaces
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600 dark:text-slate-400">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'capacity' | 'type')}
                    className="px-2 py-1 border border-slate-300 rounded text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="name">Name</option>
                    <option value="capacity">Capacity</option>
                    <option value="type">Type</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1 hover:bg-slate-100 rounded dark:hover:bg-slate-700"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Space cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaces.length === 0 ? (
                <div className="md:col-span-2 lg:col-span-3 text-center py-10">
                  <p className="text-slate-600 dark:text-slate-400">No spaces available for analysis</p>
                </div>
              ) : (
                paginatedSpaces.map(space => (
                  <div 
                    key={space.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedSpace?.id === space.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-slate-200 hover:border-blue-400 dark:border-slate-700 dark:hover:border-blue-500'
                    }`}
                    onClick={() => handleSpaceAnalysis(space.id)}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-slate-800 dark:text-white">{space.name}</h4>
                      {space.availability ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded dark:bg-green-900/30 dark:text-green-400">
                          Available
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded dark:bg-red-900/30 dark:text-red-400">
                          Occupied
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {space.type} • Capacity: {space.capacity}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {space.location}
                    </p>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAnalysisPage(p => Math.max(1, p - 1))}
                  disabled={analysisPage === 1}
                  icon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400 px-4">
                  Page {analysisPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAnalysisPage(p => Math.min(totalPages, p + 1))}
                  disabled={analysisPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
            
            {/* Analysis results */}
            {isProcessing ? (
              <div className="text-center py-10">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4 dark:text-blue-400" />
                <p className="text-slate-600 dark:text-slate-400">Analyzing space usage...</p>
              </div>
            ) : analysis && selectedSpace ? (
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg dark:from-blue-900/30 dark:to-indigo-900/30">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      Análisis: {selectedSpace.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedSpace.type} • {selectedSpace.location} • Capacidad: {selectedSpace.capacity}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openFeatureManager(selectedSpace)}
                      icon={<Settings className="h-4 w-4" />}
                    >
                      Gestionar Equipos
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openReservation(selectedSpace)}
                      icon={<Calendar className="h-4 w-4" />}
                    >
                      Reservar
                    </Button>
                  </div>
                </div>
                
                {/* Features display */}
                {selectedSpace.features && selectedSpace.features.length > 0 && (
                  <div className="mb-4 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Equipos y Características:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedSpace.features.map((feature: string, i: number) => (
                        <span 
                          key={i}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded dark:bg-blue-900/50 dark:text-blue-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">{analysis}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
        
        {activeTab === 'optimize' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button
                onClick={handleOptimization}
                disabled={isProcessing}
                loading={isProcessing}
                size="lg"
                icon={<Lightbulb className="h-5 w-5" />}
              >
                Generate Optimization Insights
              </Button>
            </div>
            
            {isProcessing ? (
              <div className="text-center py-10">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4 dark:text-blue-400" />
                <p className="text-slate-600 dark:text-slate-400">Generating optimization suggestions...</p>
              </div>
            ) : suggestions ? (
              <div className="mt-6">
                <h3 className="text-md font-medium text-slate-800 mb-4 dark:text-white">
                  Optimization Suggestions ({suggestions.length})
                </h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div 
                      key={index}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg dark:from-blue-900/30 dark:to-indigo-900/30 flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 flex-1">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click the button above to generate AI-powered optimization insights</p>
              </div>
            )}
          </div>
        )}

        {/* Smart Reservation Tab */}
        {activeTab === 'smart' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Wand2 className="h-8 w-8" />
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <h3 className="text-xl font-bold">Reserva Inteligente con IA</h3>
              </div>
              <p className="text-violet-100">
                Describe lo que necesitas en lenguaje natural y la IA encontrará y reservará automáticamente el mejor espacio disponible.
              </p>
            </div>

            {/* Main Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Sparkles className="h-4 w-4 inline mr-2 text-violet-500" />
                    Describe lo que necesitas
                  </label>
                  <textarea
                    value={smartDescription}
                    onChange={(e) => setSmartDescription(e.target.value)}
                    placeholder="Ej: Necesito un aula para 20 estudiantes con proyector para una clase de programación el lunes de 8 a 10 de la mañana..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white h-32 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    La IA interpretará tu descripción para encontrar el espacio ideal
                  </p>
                </div>

                {/* Quick equipment selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Equipamiento requerido (opcional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Video Beam', 'Pizarra Blanca', 'Ordenador', 'Aire Acondicionado', 'Sonido', 'Conexión Red'].map(eq => (
                      <button
                        key={eq}
                        onClick={() => toggleSmartEquipment(eq)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                          smartEquipment.includes(eq)
                            ? 'bg-violet-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Optional Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <Users className="h-4 w-4 inline mr-1" />
                      Capacidad mínima
                    </label>
                    <input
                      type="number"
                      value={smartCapacity}
                      onChange={(e) => setSmartCapacity(e.target.value)}
                      placeholder="Ej: 20"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      Tipo de espacio
                    </label>
                    <select
                      value={smartSpaceType}
                      onChange={(e) => setSmartSpaceType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      <option value="">Cualquiera</option>
                      <option value="aula">Aula</option>
                      <option value="laboratorio">Laboratorio</option>
                      <option value="auditorio">Auditorio</option>
                      <option value="sala">Sala de reuniones</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Fecha preferida
                  </label>
                  <input
                    type="date"
                    value={smartDate}
                    onChange={(e) => setSmartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Hora inicio
                    </label>
                    <input
                      type="time"
                      value={smartTimeStart}
                      onChange={(e) => setSmartTimeStart(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Hora fin
                    </label>
                    <input
                      type="time"
                      value={smartTimeEnd}
                      onChange={(e) => setSmartTimeEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="autoCreate"
                    checked={smartAutoCreate}
                    onChange={(e) => setSmartAutoCreate(e.target.checked)}
                    className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                  />
                  <label htmlFor="autoCreate" className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Crear reserva automáticamente</span>
                    <span className="block text-xs text-slate-500">Si está activo, la IA creará la reserva al encontrar el mejor espacio</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={clearSmartForm}
                disabled={smartLoading}
              >
                Limpiar
              </Button>
              <Button
                onClick={handleSmartReservation}
                disabled={smartLoading || !smartDescription.trim()}
                loading={smartLoading}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {smartLoading ? 'Analizando...' : 'Buscar y Reservar con IA'}
              </Button>
            </div>

            {/* Error Message */}
            {smartError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 dark:text-red-300 mt-1">{smartError}</p>
              </div>
            )}

            {/* Results */}
            {smartResult && (
              <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                {/* Success/Info Header */}
                <div className={`rounded-lg p-4 ${
                  smartResult.success 
                    ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {smartResult.success ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-yellow-500" />
                    )}
                    <span className={`font-semibold ${
                      smartResult.success ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {smartResult.message}
                    </span>
                  </div>
                </div>

                {/* Selected Space */}
                {smartResult.espacio_seleccionado && (
                  <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg p-5 border border-violet-200 dark:border-violet-800">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-violet-500" />
                      Espacio Seleccionado por IA
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Nombre</span>
                        <p className="font-medium text-slate-800 dark:text-white">{smartResult.espacio_seleccionado.nombre}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Tipo</span>
                        <p className="font-medium text-slate-800 dark:text-white">{smartResult.espacio_seleccionado.tipo}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Capacidad</span>
                        <p className="font-medium text-slate-800 dark:text-white">{smartResult.espacio_seleccionado.capacidad} personas</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Puntuación</span>
                        <p className="font-medium text-violet-600 dark:text-violet-400">
                          {Math.round((smartResult.espacio_seleccionado.puntuacion || 0) * 100)}% compatible
                        </p>
                      </div>
                    </div>
                    {smartResult.espacio_seleccionado.ubicacion && (
                      <div className="mt-3 flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-4 w-4" />
                        {smartResult.espacio_seleccionado.ubicacion}
                      </div>
                    )}
                    {smartResult.espacio_seleccionado.caracteristicas?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {smartResult.espacio_seleccionado.caracteristicas.slice(0, 6).map((feat: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full dark:bg-violet-900/50 dark:text-violet-300">
                            {feat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reservation Created */}
                {smartResult.reserva_creada && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      ¡Reserva Creada Exitosamente!
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-600 dark:text-green-500">ID Reserva:</span>
                        <span className="ml-2 font-medium text-green-800 dark:text-green-300">#{smartResult.reserva_creada.id}</span>
                      </div>
                      <div>
                        <span className="text-green-600 dark:text-green-500">Espacio:</span>
                        <span className="ml-2 font-medium text-green-800 dark:text-green-300">{smartResult.reserva_creada.espacio_nombre}</span>
                      </div>
                      <div>
                        <span className="text-green-600 dark:text-green-500">Inicio:</span>
                        <span className="ml-2 font-medium text-green-800 dark:text-green-300">
                          {new Date(smartResult.reserva_creada.fecha_inicio).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <div>
                        <span className="text-green-600 dark:text-green-500">Fin:</span>
                        <span className="ml-2 font-medium text-green-800 dark:text-green-300">
                          {new Date(smartResult.reserva_creada.fecha_fin).toLocaleString('es-ES')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Analysis */}
                {smartResult.razon_seleccion && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      Análisis de la IA
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{smartResult.razon_seleccion}</p>
                  </div>
                )}

                {/* Alternatives */}
                {smartResult.alternativas?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Alternativas sugeridas</h4>
                    <div className="grid gap-3">
                      {smartResult.alternativas.map((alt: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <span className="font-medium text-slate-800 dark:text-white">{alt.nombre}</span>
                            <span className="ml-2 text-sm text-slate-500">({alt.tipo} - {alt.capacidad} personas)</span>
                          </div>
                          <span className="text-xs text-slate-400">{alt.ubicacion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Modelo: {smartResult.model_used}</span>
                  <span>{new Date(smartResult.timestamp).toLocaleString('es-ES')}</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!smartResult && !smartLoading && !smartError && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Wand2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Describe tus necesidades</p>
                <p className="text-sm">La IA analizará tu solicitud y encontrará el espacio perfecto</p>
              </div>
            )}
          </div>
        )}

        {/* Space Layout Analysis Tab */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Layout className="h-8 w-8" />
                <Ruler className="h-5 w-5 text-emerald-200" />
                <h3 className="text-xl font-bold">Diseño y Distribución de Espacios</h3>
              </div>
              <p className="text-emerald-100">
                Analiza si tus elementos caben en un espacio y obtén la distribución óptima. Ideal para aulas, laboratorios, parqueaderos y más.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Space Configuration */}
              <div className="lg:col-span-2 space-y-4">
                {/* Basic Space Info */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-500" />
                    Información del Espacio
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tipo de espacio *
                      </label>
                      <select
                        value={layoutSpaceType}
                        onChange={(e) => {
                          setLayoutSpaceType(e.target.value);
                          setLayoutElementos([]);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      >
                        <option value="aula">Aula de clases</option>
                        <option value="laboratorio">Laboratorio de cómputo</option>
                        <option value="parqueadero">Parqueadero</option>
                        <option value="auditorio">Auditorio</option>
                        <option value="oficina">Oficina</option>
                        <option value="sala_conferencias">Sala de conferencias</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <Ruler className="h-4 w-4 inline mr-1" />
                        Metros cuadrados *
                      </label>
                      <input
                        type="number"
                        value={layoutMetros}
                        onChange={(e) => setLayoutMetros(e.target.value)}
                        placeholder="Ej: 90"
                        min="1"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Forma del espacio
                      </label>
                      <select
                        value={layoutForma}
                        onChange={(e) => setLayoutForma(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      >
                        <option value="rectangular">Rectangular</option>
                        <option value="cuadrado">Cuadrado</option>
                        <option value="L">Forma de L</option>
                        <option value="irregular">Irregular</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Largo (m)
                        </label>
                        <input
                          type="number"
                          value={layoutLargo}
                          onChange={(e) => setLayoutLargo(e.target.value)}
                          placeholder="Opcional"
                          min="1"
                          step="0.1"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Ancho (m)
                        </label>
                        <input
                          type="number"
                          value={layoutAncho}
                          onChange={(e) => setLayoutAncho(e.target.value)}
                          placeholder="Opcional"
                          min="1"
                          step="0.1"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Elements to Add - For non-parking spaces */}
                {layoutSpaceType !== 'parqueadero' && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-emerald-500" />
                      Elementos a Distribuir
                    </h4>

                    {/* Available elements to add */}
                    <div className="mb-4">
                      <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Agregar elementos:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(elementosDisponibles[layoutSpaceType] || []).map(elem => (
                          <button
                            key={elem.id}
                            onClick={() => addLayoutElemento(elem.id)}
                            className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900 transition-colors flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            {elem.nombre}
                            <span className="text-xs text-emerald-500">({elem.area}m²)</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Added elements */}
                    {layoutElementos.length > 0 ? (
                      <div className="space-y-2">
                        <label className="block text-sm text-slate-600 dark:text-slate-400">
                          Elementos agregados:
                        </label>
                        {layoutElementos.map(elem => {
                          const info = (elementosDisponibles[layoutSpaceType] || []).find(e => e.id === elem.tipo);
                          return (
                            <div key={elem.tipo} className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-slate-800 dark:text-white">
                                  {info?.nombre || elem.tipo}
                                </span>
                                <span className="text-xs text-slate-500">
                                  ({info?.area || 2}m² c/u = {((info?.area || 2) * elem.cantidad).toFixed(1)}m² total)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateLayoutElementoCantidad(elem.tipo, elem.cantidad - 1)}
                                  className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={elem.cantidad}
                                  onChange={(e) => updateLayoutElementoCantidad(elem.tipo, parseInt(e.target.value) || 0)}
                                  className="w-16 text-center px-2 py-1 border border-slate-300 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                  min="0"
                                />
                                <button
                                  onClick={() => updateLayoutElementoCantidad(elem.tipo, elem.cantidad + 1)}
                                  className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeLayoutElemento(elem.tipo)}
                                  className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 ml-2"
                                >
                                  <Trash2 className="h-4 w-4 mx-auto" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg">
                        <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Agrega elementos usando los botones de arriba</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Parking specific fields */}
                {layoutSpaceType === 'parqueadero' && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Car className="h-5 w-5 text-emerald-500" />
                      Distribución del Parqueadero
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          🚗 Espacios vehículos
                        </label>
                        <input
                          type="number"
                          value={layoutVehiculos}
                          onChange={(e) => setLayoutVehiculos(e.target.value)}
                          placeholder="Cantidad"
                          min="0"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                        <span className="text-xs text-slate-500">11.25 m² c/u (2.5m × 4.5m)</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          🏍️ Espacios motos
                        </label>
                        <input
                          type="number"
                          value={layoutMotos}
                          onChange={(e) => setLayoutMotos(e.target.value)}
                          placeholder="Cantidad"
                          min="0"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                        <span className="text-xs text-slate-500">1.4 m² c/u (0.7m × 2m)</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          ♿ Espacios discapacitados
                        </label>
                        <input
                          type="number"
                          value={layoutDiscapacitados}
                          onChange={(e) => setLayoutDiscapacitados(e.target.value)}
                          placeholder="Cantidad"
                          min="0"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                        <span className="text-xs text-slate-500">15.75 m² c/u (3.5m × 4.5m)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Options */}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-emerald-500" />
                    Opciones Adicionales
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {layoutSpaceType !== 'parqueadero' && (
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="incluirInstructor"
                          checked={layoutIncluirInstructor}
                          onChange={(e) => setLayoutIncluirInstructor(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="incluirInstructor" className="text-sm text-slate-700 dark:text-slate-300">
                          Incluir espacio para instructor/docente (+8 m²)
                        </label>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Ancho mínimo de pasillo (m)
                      </label>
                      <input
                        type="number"
                        value={layoutAnchoPasillo}
                        onChange={(e) => setLayoutAnchoPasillo(e.target.value)}
                        placeholder="1.2"
                        min="0.5"
                        step="0.1"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Ventanas ubicadas en
                      </label>
                      <select
                        value={layoutVentanas}
                        onChange={(e) => setLayoutVentanas(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      >
                        <option value="">No especificado</option>
                        <option value="norte">Norte</option>
                        <option value="sur">Sur</option>
                        <option value="este">Este</option>
                        <option value="oeste">Oeste</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Puerta ubicada en
                      </label>
                      <select
                        value={layoutPuerta}
                        onChange={(e) => setLayoutPuerta(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      >
                        <option value="">No especificado</option>
                        <option value="norte">Norte</option>
                        <option value="sur">Sur</option>
                        <option value="este">Este</option>
                        <option value="oeste">Oeste</option>
                        <option value="esquina">Esquina</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Restricciones o consideraciones adicionales
                    </label>
                    <textarea
                      value={layoutRestricciones}
                      onChange={(e) => setLayoutRestricciones(e.target.value)}
                      placeholder="Ej: Columna en el centro, salida de emergencia al fondo, necesidad de ruta de evacuación..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white h-20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Summary & Actions */}
              <div className="space-y-4">
                {/* Quick Summary */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
                    📊 Resumen Rápido
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Área total:</span>
                      <span className="font-medium text-slate-800 dark:text-white">
                        {layoutMetros || 0} m²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Área utilizable (~70%):</span>
                      <span className="font-medium text-slate-800 dark:text-white">
                        {(parseFloat(layoutMetros || '0') * 0.7).toFixed(1)} m²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Área requerida:</span>
                      <span className={`font-medium ${
                        calcularAreaEstimada() > parseFloat(layoutMetros || '0') * 0.7
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {calcularAreaEstimada().toFixed(1)} m²
                      </span>
                    </div>
                    <hr className="border-emerald-200 dark:border-emerald-700" />
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Estado preliminar:</span>
                      <span className={`font-bold ${
                        calcularAreaEstimada() <= parseFloat(layoutMetros || '0') * 0.7
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {calcularAreaEstimada() <= parseFloat(layoutMetros || '0') * 0.7 ? '✓ Viable' : '✗ Insuficiente'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reference Info */}
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2 text-sm">
                    📏 Referencia de espacios estándar
                  </h4>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <li>• Computador + espacio: 2.0 m²</li>
                    <li>• Pupitre/escritorio: 1.2-1.5 m²</li>
                    <li>• Espacio instructor: 8 m²</li>
                    <li>• Vehículo estándar: 12.5 m²</li>
                    <li>• Motocicleta: 2.5 m²</li>
                    <li>• Pasillo mínimo: 1.2 m ancho</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleLayoutAnalysis}
                    disabled={layoutLoading || !layoutMetros}
                    loading={layoutLoading}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    <Layout className="h-4 w-4 mr-2" />
                    {layoutLoading ? 'Analizando...' : 'Analizar Distribución con IA'}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={clearLayoutForm}
                    disabled={layoutLoading}
                    className="w-full"
                  >
                    Limpiar formulario
                  </Button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {layoutError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 dark:text-red-300 mt-1">{layoutError}</p>
              </div>
            )}

            {/* Results */}
            {layoutResult && (
              <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                {/* Viability Header */}
                <div className={`rounded-lg p-5 ${
                  layoutResult.es_viable 
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/20 dark:border-emerald-800'
                    : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 dark:from-red-900/20 dark:to-orange-900/20 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {layoutResult.es_viable ? (
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${
                        layoutResult.es_viable ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        {layoutResult.es_viable ? '✓ Distribución Viable' : '✗ Espacio Insuficiente'}
                      </h3>
                      <p className={`text-sm ${
                        layoutResult.es_viable ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'
                      }`}>
                        {layoutResult.mensaje}
                      </p>
                    </div>
                  </div>
                  
                  {/* Area Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                      <span className="block text-2xl font-bold text-slate-800 dark:text-white">
                        {layoutResult.area_total}
                      </span>
                      <span className="text-xs text-slate-500">m² Total</span>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                      <span className="block text-2xl font-bold text-slate-800 dark:text-white">
                        {layoutResult.area_utilizable?.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">m² Utilizable</span>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                      <span className="block text-2xl font-bold text-slate-800 dark:text-white">
                        {layoutResult.area_requerida?.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">m² Requerido</span>
                    </div>
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                      <span className={`block text-2xl font-bold ${
                        layoutResult.porcentaje_ocupacion <= 85 
                          ? 'text-emerald-600' 
                          : layoutResult.porcentaje_ocupacion <= 100 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                      }`}>
                        {layoutResult.porcentaje_ocupacion?.toFixed(0)}%
                      </span>
                      <span className="text-xs text-slate-500">Ocupación</span>
                    </div>
                  </div>
                </div>

                {/* Distribution Details */}
                {layoutResult.distribucion_elementos?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Layout className="h-5 w-5 text-emerald-500" />
                      Distribución Sugerida
                    </h4>
                    <div className="grid gap-3">
                      {layoutResult.distribucion_elementos.map((elem: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-slate-800 dark:text-white capitalize">
                                {elem.elemento || elem.tipo}
                              </span>
                              <span className="ml-2 text-slate-500">x{elem.cantidad}</span>
                            </div>
                            <span className="text-sm text-emerald-600 dark:text-emerald-400">
                              {elem.area_total?.toFixed(1)} m²
                            </span>
                          </div>
                          {elem.disposicion && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              📐 {elem.disposicion}
                            </p>
                          )}
                          {elem.filas && elem.columnas && (
                            <p className="text-xs text-slate-500 mt-1">
                              Configuración: {elem.filas} filas × {elem.columnas} columnas
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Graphical Floor Plan Visualization */}
                {layoutResult && (
                  <SpaceLayoutVisualization
                    layoutData={{
                      largo: layoutResult.dimensiones?.largo || layoutResult.dimensiones_sugeridas?.largo_optimo || parseFloat(layoutLargo) || 10,
                      ancho: layoutResult.dimensiones?.ancho || layoutResult.dimensiones_sugeridas?.ancho_optimo || parseFloat(layoutAncho) || 8,
                      tipoEspacio: layoutSpaceType,
                      elementos: (layoutResult.distribucion_elementos || layoutResult.distribucion_optima || []).map((elem: any) => ({
                        tipo: elem.elemento || elem.tipo,
                        cantidad: elem.cantidad,
                        filas: elem.filas,
                        columnas: elem.columnas,
                        areaTotal: elem.area_total
                      })),
                      incluyeInstructor: layoutIncluirInstructor,
                      anchoPasillo: parseFloat(layoutAnchoPasillo) || 1.2,
                      ventanas: layoutVentanas,
                      puerta: layoutPuerta,
                      esViable: layoutResult.es_viable,
                      porcentajeOcupacion: layoutResult.porcentaje_ocupacion
                    }}
                  />
                )}

                {/* Recommendations */}
                {layoutResult.recomendaciones?.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                      💡 Recomendaciones
                    </h4>
                    <ul className="space-y-2">
                      {layoutResult.recomendaciones.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {layoutResult.advertencias?.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
                      ⚠️ Advertencias
                    </h4>
                    <ul className="space-y-2">
                      {layoutResult.advertencias.map((warn: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {warn}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Alternatives if not viable */}
                {!layoutResult.es_viable && layoutResult.alternativas?.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      🔄 Alternativas Sugeridas
                    </h4>
                    <div className="space-y-3">
                      {layoutResult.alternativas.map((alt: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                          <p className="font-medium text-slate-800 dark:text-white">{alt.opcion}</p>
                          {alt.beneficios && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                              ✓ {alt.beneficios}
                            </p>
                          )}
                          {alt.area_necesaria && (
                            <p className="text-xs text-slate-500 mt-1">
                              Área necesaria: {alt.area_necesaria} m²
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Modelo: {layoutResult.model_used}</span>
                  <span>{new Date(layoutResult.timestamp).toLocaleString('es-ES')}</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!layoutResult && !layoutLoading && !layoutError && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                <Layout className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Configura tu espacio</p>
                <p className="text-sm max-w-md mx-auto">
                  Ingresa las dimensiones y los elementos que deseas distribuir. La IA analizará si es viable y te dará la mejor distribución.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* SCHEDULER TAB - Programador de Horarios IA */}
        {/* ============================================ */}
        {activeTab === 'scheduler' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <CalendarDays className="h-8 w-8" />
                <GraduationCap className="h-6 w-6 text-yellow-300" />
                <h3 className="text-xl font-bold">Programador de Horarios con IA</h3>
              </div>
              <p className="text-indigo-100">
                Agrega múltiples materias de diferentes semestres y la IA generará automáticamente los horarios evitando cruces y optimizando el uso de espacios.
              </p>
            </div>

            {/* Periodo Académico */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-500" />
                Configuración del Periodo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Periodo Académico
                  </label>
                  <select
                    value={schedulerPeriodo}
                    onChange={(e) => setSchedulerPeriodo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="2024-1">2024 - Primer Semestre</option>
                    <option value="2024-2">2024 - Segundo Semestre</option>
                    <option value="2025-1">2025 - Primer Semestre</option>
                    <option value="2025-2">2025 - Segundo Semestre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={schedulerFechaInicio}
                    onChange={(e) => setSchedulerFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={schedulerFechaFin}
                    onChange={(e) => setSchedulerFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Lista de Materias Agregadas */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  Materias a Programar ({materias.length})
                </h4>
                <Button
                  onClick={() => { resetNuevaMateria(); setEditingMateria(null); setShowAddMateria(true); }}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Materia
                </Button>
              </div>
              
              {materias.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No hay materias agregadas</p>
                  <p className="text-sm">Haz clic en "Agregar Materia" para comenzar</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
                  {materias.map((materia) => (
                    <div key={materia.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-800 dark:text-white">
                              {materia.nombreMateria}
                            </span>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">
                              Semestre {materia.semestre}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {materia.programa} • {materia.docente || 'Docente por asignar'}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                              <Users className="h-3 w-3 inline mr-1" />
                              {materia.numeroEstudiantes} estudiantes
                            </span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {materia.horasSemanales} hrs/semana
                            </span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                              <Building2 className="h-3 w-3 inline mr-1" />
                              {materia.tipoEspacio}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {materia.diasPreferidos.map(dia => (
                              <span key={dia} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded dark:bg-blue-900/50 dark:text-blue-300">
                                {DAYS_OF_WEEK.find(d => d.id === dia)?.short || dia}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => editarMateria(materia)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors dark:hover:bg-indigo-900/30"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => eliminarMateria(materia.id)}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={clearScheduler}
                disabled={schedulerLoading}
              >
                Limpiar Todo
              </Button>
              <Button
                onClick={handleSchedulerGenerate}
                disabled={schedulerLoading || materias.length === 0}
                loading={schedulerLoading}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {schedulerLoading ? 'Generando Horarios...' : 'Generar Horarios con IA'}
              </Button>
            </div>

            {/* Error Message */}
            {schedulerError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-600 dark:text-red-300 mt-1">{schedulerError}</p>
              </div>
            )}

            {/* Resultados del Scheduler */}
            {schedulerResult && (
              <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                {/* Success Header */}
                <div className={`rounded-lg p-5 ${
                  schedulerResult.success 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800'
                    : 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800'
                }`}>
                  <div className="flex items-center gap-3">
                    {schedulerResult.success ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-yellow-500" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        {schedulerResult.success ? '✓ Horarios Generados Exitosamente' : 'Horario Parcial'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {schedulerResult.message || `Se programaron ${schedulerResult.horarios?.length || 0} clases`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Horarios Generados */}
                {schedulerResult.horarios && schedulerResult.horarios.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                      <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-indigo-500" />
                        Horarios Asignados
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Materia</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Semestre</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Día</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Horario</th>
                            <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Espacio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {schedulerResult.horarios.map((horario: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                              <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">
                                {horario.materia}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">
                                  {horario.semestre}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                {horario.dia}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                {horario.hora_inicio} - {horario.hora_fin}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-4 w-4 text-slate-400" />
                                  <span className="text-slate-800 dark:text-white">{horario.espacio}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Conflictos Detectados */}
                {schedulerResult.conflictos && schedulerResult.conflictos.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
                      ⚠️ Conflictos Detectados y Resueltos
                    </h4>
                    <ul className="space-y-2">
                      {schedulerResult.conflictos.map((conflicto: string, idx: number) => (
                        <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {conflicto}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Estadísticas */}
                {schedulerResult.estadisticas && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                      <span className="block text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {schedulerResult.estadisticas.total_clases || 0}
                      </span>
                      <span className="text-xs text-slate-500">Clases Programadas</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                      <span className="block text-2xl font-bold text-green-600 dark:text-green-400">
                        {schedulerResult.estadisticas.espacios_utilizados || 0}
                      </span>
                      <span className="text-xs text-slate-500">Espacios Utilizados</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                      <span className="block text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {schedulerResult.estadisticas.horas_totales || 0}
                      </span>
                      <span className="text-xs text-slate-500">Horas Semanales</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                      <span className="block text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {schedulerResult.estadisticas.eficiencia || 0}%
                      </span>
                      <span className="text-xs text-slate-500">Eficiencia</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Agregar/Editar Materia */}
        {showAddMateria && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  {editingMateria ? 'Editar Materia' : 'Agregar Nueva Materia'}
                </h3>
                <button
                  onClick={() => { setShowAddMateria(false); setEditingMateria(null); resetNuevaMateria(); }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre y Programa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nombre de la Materia *
                    </label>
                    <input
                      type="text"
                      value={nuevaMateria.nombreMateria}
                      onChange={(e) => setNuevaMateria(prev => ({ ...prev, nombreMateria: e.target.value }))}
                      placeholder="Ej: Cálculo Diferencial"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Programa Académico *
                    </label>
                    <select
                      value={nuevaMateria.programa}
                      onChange={(e) => setNuevaMateria(prev => ({ ...prev, programa: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      <option value="">Seleccionar programa...</option>
                      {PROGRAMAS.map(prog => (
                        <option key={prog} value={prog}>{prog}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Semestre y Docente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Semestre
                    </label>
                    <select
                      value={nuevaMateria.semestre}
                      onChange={(e) => setNuevaMateria(prev => ({ ...prev, semestre: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      {SEMESTRES.map(sem => (
                        <option key={sem} value={sem}>Semestre {sem}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Docente (opcional)
                    </label>
                    <input
                      type="text"
                      value={nuevaMateria.docente}
                      onChange={(e) => setNuevaMateria(prev => ({ ...prev, docente: e.target.value }))}
                      placeholder="Nombre del docente"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Estudiantes y Horas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <Users className="h-4 w-4 inline mr-1" />
                      Nº Estudiantes
                    </label>
                    <input
                      type="number"
                      value={nuevaMateria.numeroEstudiantes}
                      onChange={(e) => setNuevaMateria(prev => ({ ...prev, numeroEstudiantes: parseInt(e.target.value) || 0 }))}
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Horas/Semana
                    </label>
                    <input
                      type="number"
                      value={nuevaMateria.horasSemanales}
                      onChange={(e) => setNuevaMateria(prev => ({ ...prev, horasSemanales: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="20"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      Tipo Espacio
                    </label>
                    <select
                      value={nuevaMateria.tipoEspacio}
                      onChange={(e) => setNuevaMateria(prev => ({ ...prev, tipoEspacio: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      <option value="aula">Aula</option>
                      <option value="laboratorio">Laboratorio</option>
                      <option value="auditorio">Auditorio</option>
                      <option value="sala">Sala de Reuniones</option>
                    </select>
                  </div>
                </div>

                {/* Días Preferidos */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Días Preferidos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(dia => (
                      <button
                        key={dia.id}
                        onClick={() => toggleDiaPreferido(dia.id)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          nuevaMateria.diasPreferidos.includes(dia.id)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {dia.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horario Preferido */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Hora Inicio Preferida
                    </label>
                    <input
                      type="time"
                      value={nuevaMateria.horaInicioPreferida}
                      onChange={(e) => setNuevaMateria(prev => ({ ...prev, horaInicioPreferida: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Hora Fin Preferida
                    </label>
                    <input
                      type="time"
                      value={nuevaMateria.horaFinPreferida}
                      onChange={(e) => setNuevaMateria(prev => ({ ...prev, horaFinPreferida: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Equipamiento */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Equipamiento Requerido
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Video Beam', 'Pizarra Blanca', 'Ordenador', 'Aire Acondicionado', 'Sonido', 'Laboratorio Informática'].map(equipo => (
                      <button
                        key={equipo}
                        onClick={() => toggleEquipamientoMateria(equipo)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                          nuevaMateria.equipamientoRequerido.includes(equipo)
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {equipo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="secondary"
                  onClick={() => { setShowAddMateria(false); setEditingMateria(null); resetNuevaMateria(); }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={editingMateria ? guardarEdicionMateria : agregarMateria}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  {editingMateria ? 'Guardar Cambios' : 'Agregar Materia'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Reservation Modal - Enhanced */}
      {showReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            {reservationSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  ¡Reserva Confirmada!
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  El espacio "{reservationData.spaceName}" ha sido reservado exitosamente.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                      Reservar Espacio
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      Complete los datos para agendar
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowReservation(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Space Info Header */}
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-white">{reservationData.spaceName}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                        <span>ID: <strong>{reservationData.installationId}</strong></span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Capacidad: <strong>{reservationData.spaceCapacity}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {/* Event Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tipo de Evento *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { value: 'class', label: 'Clase', icon: '📚' },
                        { value: 'meeting', label: 'Reunión', icon: '👥' },
                        { value: 'event', label: 'Evento', icon: '🎉' },
                        { value: 'other', label: 'Otro', icon: '📋' }
                      ].map(type => (
                        <button
                          key={type.value}
                          onClick={() => setReservationData({...reservationData, eventType: type.value})}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            reservationData.eventType === type.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{type.icon}</span>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Fecha Inicio *
                      </label>
                      <input
                        type="date"
                        value={reservationData.startDate}
                        onChange={(e) => setReservationData({...reservationData, startDate: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Fecha Fin *
                      </label>
                      <input
                        type="date"
                        value={reservationData.endDate}
                        onChange={(e) => setReservationData({...reservationData, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        min={reservationData.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  {/* Time Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Hora Inicio *
                      </label>
                      <input
                        type="time"
                        value={reservationData.startTime}
                        onChange={(e) => setReservationData({...reservationData, startTime: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Hora Fin *
                      </label>
                      <input
                        type="time"
                        value={reservationData.endTime}
                        onChange={(e) => setReservationData({...reservationData, endTime: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Days of Week Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Días de la Semana *
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Seleccione los días en que se usará el espacio dentro del rango de fechas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button
                          key={day.id}
                          onClick={() => toggleDay(day.id)}
                          className={`w-12 h-12 rounded-full font-medium transition-all ${
                            reservationData.selectedDays.includes(day.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                          title={day.name}
                        >
                          {day.short}
                        </button>
                      ))}
                    </div>
                    {reservationData.selectedDays.length > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        Seleccionados: {reservationData.selectedDays.map(d => 
                          DAYS_OF_WEEK.find(day => day.id === d)?.name
                        ).join(', ')}
                      </p>
                    )}
                  </div>
                  
                  {/* Purpose */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Propósito / Descripción
                    </label>
                    <textarea
                      value={reservationData.purpose}
                      onChange={(e) => setReservationData({...reservationData, purpose: e.target.value})}
                      placeholder="Ej: Clase de Matemáticas II, Reunión de departamento, etc."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      rows={2}
                    />
                  </div>
                  
                  {/* Attendees */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Número de Asistentes
                    </label>
                    <input
                      type="number"
                      value={reservationData.attendees}
                      onChange={(e) => setReservationData({...reservationData, attendees: e.target.value})}
                      placeholder="Cantidad esperada de personas"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      min="1"
                      max={reservationData.spaceCapacity}
                    />
                    {reservationData.attendees && parseInt(reservationData.attendees) > reservationData.spaceCapacity && (
                      <p className="text-sm text-red-500 mt-1">
                        ⚠️ El número de asistentes excede la capacidad del espacio ({reservationData.spaceCapacity})
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowReservation(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleReservation}
                    disabled={
                      !reservationData.startDate || 
                      !reservationData.endDate || 
                      !reservationData.startTime || 
                      !reservationData.endTime ||
                      reservationData.selectedDays.length === 0
                    }
                  >
                    Confirmar Reserva
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Feature Manager Modal */}
      {showFeatureManager && featureManagerSpace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-3xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            {featureSaveSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  ¡Características Guardadas!
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Las características del espacio han sido actualizadas.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                      Gestionar Características del Aula
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      {featureManagerSpace.name}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowFeatureManager(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Seleccione los equipos y características disponibles en este espacio:
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {selectedFeatures.length} característica(s) seleccionada(s)
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto p-1">
                  {AVAILABLE_FEATURES.map(feature => (
                    <label
                      key={feature.id}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedFeatures.includes(feature.name)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(feature.name)}
                        onChange={() => toggleFeature(feature.name)}
                        className="sr-only"
                      />
                      <span className={`w-6 h-6 rounded flex items-center justify-center mr-3 ${
                        selectedFeatures.includes(feature.name)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-600'
                      }`}>
                        {selectedFeatures.includes(feature.name) && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500 mr-1">{feature.id}.</span>
                        {feature.name}
                      </span>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowFeatureManager(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={saveFeatures}
                  >
                    Guardar Características
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;