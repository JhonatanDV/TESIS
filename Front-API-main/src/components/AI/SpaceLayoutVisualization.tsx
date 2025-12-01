import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from 'lucide-react';

interface LayoutElement {
  tipo: string;
  cantidad: number;
  filas?: number;
  columnas?: number;
  disposicion?: string;
  area_total?: number;
}

interface LayoutData {
  largo: number;
  ancho: number;
  tipoEspacio: string;
  elementos?: LayoutElement[];
  incluyeInstructor?: boolean;
  anchoPasillo?: number;
  ventanas?: string;
  puerta?: string;
  esViable?: boolean;
  porcentajeOcupacion?: number;
}

interface SpaceLayoutVisualizationProps {
  layoutData: LayoutData;
}

// Configuración de elementos con sus dimensiones visuales reales
const ELEMENT_CONFIG: Record<string, { 
  fill: string; 
  stroke: string; 
  label: string;
  width: number;
  height: number;
  showOnFloor: boolean;
  icon?: string;
}> = {
  computador: { fill: '#3B82F6', stroke: '#1D4ED8', label: 'PC', width: 1.2, height: 0.8, showOnFloor: true, icon: '💻' },
  pupitre: { fill: '#8B5CF6', stroke: '#7C3AED', label: 'Pup', width: 0.7, height: 0.6, showOnFloor: true, icon: '📝' },
  proyector: { fill: '#EF4444', stroke: '#DC2626', label: 'Proy', width: 0.3, height: 0.3, showOnFloor: false, icon: '📽️' },
  escritorio_estudiante: { fill: '#10B981', stroke: '#059669', label: 'Esc', width: 1.2, height: 0.6, showOnFloor: true },
  silla: { fill: '#F59E0B', stroke: '#D97706', label: 'S', width: 0.5, height: 0.5, showOnFloor: true },
  mesa_laboratorio: { fill: '#EC4899', stroke: '#DB2777', label: 'Mesa', width: 2.0, height: 0.8, showOnFloor: true, icon: '🔬' },
  pantalla: { fill: '#6366F1', stroke: '#4F46E5', label: 'Pant', width: 2.5, height: 0.1, showOnFloor: false },
  pizarra: { fill: '#14B8A6', stroke: '#0D9488', label: 'Piz', width: 3.0, height: 0.1, showOnFloor: false },
  espacio_instructor: { fill: '#F97316', stroke: '#EA580C', label: 'Prof', width: 2.0, height: 1.0, showOnFloor: true, icon: '👨‍🏫' },
  vehiculo: { fill: '#6B7280', stroke: '#4B5563', label: '🚗', width: 2.5, height: 4.5, showOnFloor: true },
  espacio_vehiculo: { fill: '#6B7280', stroke: '#4B5563', label: '🚗', width: 2.5, height: 4.5, showOnFloor: true },
  motocicleta: { fill: '#A855F7', stroke: '#9333EA', label: '🏍️', width: 0.7, height: 2.0, showOnFloor: true }, // ~1.4m²
  espacio_motocicleta: { fill: '#A855F7', stroke: '#9333EA', label: '🏍️', width: 0.7, height: 2.0, showOnFloor: true },
  vehiculo_discapacitado: { fill: '#3B82F6', stroke: '#1D4ED8', label: '♿', width: 3.5, height: 4.5, showOnFloor: true },
  espacio_discapacitado: { fill: '#3B82F6', stroke: '#1D4ED8', label: '♿', width: 3.5, height: 4.5, showOnFloor: true },
  butacas: { fill: '#F59E0B', stroke: '#D97706', label: 'But', width: 0.6, height: 0.6, showOnFloor: true },
  escritorio_oficina: { fill: '#10B981', stroke: '#059669', label: 'Esc', width: 1.5, height: 0.8, showOnFloor: true },
  archivador: { fill: '#6B7280', stroke: '#4B5563', label: 'Arch', width: 0.5, height: 0.4, showOnFloor: true },
  mesa_trabajo: { fill: '#EC4899', stroke: '#DB2777', label: 'Mesa', width: 1.8, height: 0.8, showOnFloor: true },
  televisor: { fill: '#EF4444', stroke: '#DC2626', label: 'TV', width: 1.2, height: 0.1, showOnFloor: false },
  default: { fill: '#9CA3AF', stroke: '#6B7280', label: '?', width: 0.5, height: 0.5, showOnFloor: true },
};

// Función para obtener icono según tipo de espacio
const getTipoIcon = (tipo: string): string => {
  const t = tipo.toLowerCase();
  if (t.includes('laboratorio') || t.includes('computo')) return '💻';
  if (t.includes('parqueadero') || t.includes('estacionamiento')) return '🅿️';
  if (t.includes('auditorio') || t.includes('teatro')) return '🎭';
  if (t.includes('oficina')) return '🏢';
  if (t.includes('conferencia') || t.includes('reunion')) return '🤝';
  return '📍';
};

const SpaceLayoutVisualization: React.FC<SpaceLayoutVisualizationProps> = ({ layoutData }) => {
  const tipoEspacio = layoutData?.tipoEspacio || 'aula';
  const largo = layoutData?.largo || 10;
  const ancho = layoutData?.ancho || 8;
  const elementos = layoutData?.elementos || [];
  const incluirInstructor = layoutData?.incluyeInstructor ?? false;
  const esViable = layoutData?.esViable ?? true;
  const porcentajeOcupacion = layoutData?.porcentajeOcupacion || 0;
  const anchoPasillo = layoutData?.anchoPasillo || 1.2;
  const metrosCuadrados = largo * ancho;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const roomLargo = largo;
  const roomAncho = ancho;
  const baseScale = 50;
  const scale = baseScale * zoom;
  const margin = 80;
  const canvasWidth = Math.max(500, roomLargo * scale + margin * 2);
  const canvasHeight = Math.max(400, roomAncho * scale + margin * 2);

  // ============================================
  // FUNCIONES DE DIBUJO AUXILIARES
  // ============================================

  const drawComputerStation = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    _scale: number,
    showLabels: boolean,
    zoom: number,
    numero: number
  ) => {
    // Escritorio (mesa)
    ctx.fillStyle = '#E5E7EB';
    ctx.strokeStyle = '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h * 0.55);
    ctx.strokeRect(x, y, w, h * 0.55);
    
    // Monitor
    const monitorW = w * 0.5;
    const monitorH = h * 0.35;
    const monitorX = x + (w - monitorW) / 2;
    const monitorY = y + h * 0.08;
    
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(monitorX, monitorY, monitorW, monitorH);
    ctx.strokeStyle = '#0F172A';
    ctx.strokeRect(monitorX, monitorY, monitorW, monitorH);
    
    // Pantalla del monitor (brillo azul)
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(monitorX + 2, monitorY + 2, monitorW - 4, monitorH - 4);
    
    // Base del monitor
    ctx.fillStyle = '#374151';
    ctx.fillRect(monitorX + monitorW * 0.35, monitorY + monitorH, monitorW * 0.3, h * 0.08);
    
    // Teclado
    const tecladoW = w * 0.4;
    const tecladoH = h * 0.12;
    ctx.fillStyle = '#4B5563';
    ctx.fillRect(x + (w - tecladoW) / 2, y + h * 0.42, tecladoW, tecladoH);
    
    // Silla
    const sillaR = Math.min(w, h) * 0.22;
    const sillaX = x + w / 2;
    const sillaY = y + h * 0.78;
    
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.arc(sillaX, sillaY, sillaR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.stroke();
    
    // Respaldo de silla
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(sillaX, sillaY - sillaR * 0.8, sillaR * 0.7, Math.PI, 0);
    ctx.fill();
    
    // Número de estación
    if (showLabels && zoom >= 0.7) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(8, 10 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${numero}`, sillaX, sillaY);
    }
  };

  // Función para dibujar un vehículo (auto) gráficamente - vista superior
  const drawCarShape = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    numero: number,
    showLabels: boolean,
    zoom: number,
    isDisabled: boolean = false
  ) => {
    const carW = w * 0.88;
    const carH = h * 0.92;
    const carX = x + (w - carW) / 2;
    const carY = y + (h - carH) / 2;
    
    // Sombra del vehículo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(carX + 4, carY + 4, carW, carH, 10);
    ctx.fill();
    
    // Cuerpo principal del auto (color base)
    const bodyColor = isDisabled ? '#3B82F6' : color;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(carX, carY, carW, carH, 10);
    ctx.fill();
    
    // Gradiente para dar profundidad
    const gradient = ctx.createLinearGradient(carX, carY, carX + carW, carY);
    gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(carX, carY, carW, carH, 10);
    ctx.fill();
    
    // Contorno del auto
    ctx.strokeStyle = isDisabled ? '#1E40AF' : '#1F2937';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(carX, carY, carW, carH, 10);
    ctx.stroke();
    
    // Techo/cabina (ventanas) - zona central más oscura
    const cabinaW = carW * 0.65;
    const cabinaH = carH * 0.45;
    const cabinaX = carX + (carW - cabinaW) / 2;
    const cabinaY = carY + carH * 0.28;
    
    // Sombra de la cabina
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(cabinaX + 2, cabinaY + 2, cabinaW, cabinaH, 6);
    ctx.fill();
    
    // Cabina/techo
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.roundRect(cabinaX, cabinaY, cabinaW, cabinaH, 6);
    ctx.fill();
    
    // Ventanas (cristal azul)
    ctx.fillStyle = isDisabled ? '#93C5FD' : '#60A5FA';
    ctx.beginPath();
    ctx.roundRect(cabinaX + 3, cabinaY + 3, cabinaW - 6, cabinaH - 6, 4);
    ctx.fill();
    
    // Línea divisoria de ventanas
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cabinaX + cabinaW / 2, cabinaY);
    ctx.lineTo(cabinaX + cabinaW / 2, cabinaY + cabinaH);
    ctx.stroke();
    
    // Ruedas (4 ruedas visibles desde arriba)
    const ruedaW = carW * 0.18;
    const ruedaH = carH * 0.12;
    ctx.fillStyle = '#111827';
    
    // Rueda frontal izquierda
    ctx.beginPath();
    ctx.ellipse(carX + carW * 0.18, carY + carH * 0.12, ruedaW / 2, ruedaH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rueda frontal derecha
    ctx.beginPath();
    ctx.ellipse(carX + carW * 0.82, carY + carH * 0.12, ruedaW / 2, ruedaH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rueda trasera izquierda
    ctx.beginPath();
    ctx.ellipse(carX + carW * 0.18, carY + carH * 0.88, ruedaW / 2, ruedaH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rueda trasera derecha
    ctx.beginPath();
    ctx.ellipse(carX + carW * 0.82, carY + carH * 0.88, ruedaW / 2, ruedaH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Rines de las ruedas
    ctx.fillStyle = '#6B7280';
    ctx.beginPath();
    ctx.ellipse(carX + carW * 0.18, carY + carH * 0.12, ruedaW / 4, ruedaH / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(carX + carW * 0.82, carY + carH * 0.12, ruedaW / 4, ruedaH / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(carX + carW * 0.18, carY + carH * 0.88, ruedaW / 4, ruedaH / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(carX + carW * 0.82, carY + carH * 0.88, ruedaW / 4, ruedaH / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Luces delanteras
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.roundRect(carX + carW * 0.15, carY + 4, carW * 0.15, carH * 0.04, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(carX + carW * 0.70, carY + 4, carW * 0.15, carH * 0.04, 2);
    ctx.fill();
    
    // Luces traseras
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.roundRect(carX + carW * 0.15, carY + carH - 8, carW * 0.12, carH * 0.03, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(carX + carW * 0.73, carY + carH - 8, carW * 0.12, carH * 0.03, 2);
    ctx.fill();
    
    // Símbolo de discapacitado si aplica
    if (isDisabled) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(16, 22 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♿', carX + carW / 2, carY + carH * 0.78);
    }
    
    // Número del espacio
    if (showLabels && numero > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(12, 14 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${numero}`, cabinaX + cabinaW / 2, cabinaY + cabinaH / 2);
    }
  };

  // Función para dibujar una motocicleta gráficamente - vista superior
  const drawMotorcycleShape = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    numero: number,
    showLabels: boolean,
    zoom: number
  ) => {
    const motoW = w * 0.9;
    const motoH = h * 0.9;
    const motoX = x + (w - motoW) / 2;
    const motoY = y + (h - motoH) / 2;
    
    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(motoX + motoW / 2 + 2, motoY + motoH / 2 + 2, motoW * 0.35, motoH * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Cuerpo principal de la moto (tanque y asiento) - forma ovalada vertical
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(motoX + motoW / 2, motoY + motoH / 2, motoW * 0.32, motoH * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Contorno del cuerpo
    ctx.strokeStyle = '#5B21B6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(motoX + motoW / 2, motoY + motoH / 2, motoW * 0.32, motoH * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Rueda delantera
    const ruedaW = motoW * 0.4;
    const ruedaH = motoH * 0.18;
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.ellipse(motoX + motoW / 2, motoY + ruedaH, ruedaW / 2, ruedaH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Rin delantero
    ctx.fillStyle = '#9CA3AF';
    ctx.beginPath();
    ctx.ellipse(motoX + motoW / 2, motoY + ruedaH, ruedaW / 4, ruedaH / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Rueda trasera
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.ellipse(motoX + motoW / 2, motoY + motoH - ruedaH, ruedaW / 2, ruedaH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.stroke();
    
    // Rin trasero
    ctx.fillStyle = '#9CA3AF';
    ctx.beginPath();
    ctx.ellipse(motoX + motoW / 2, motoY + motoH - ruedaH, ruedaW / 4, ruedaH / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Manubrio (línea horizontal arriba)
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = Math.max(3, 4 * zoom);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(motoX + motoW * 0.15, motoY + motoH * 0.22);
    ctx.lineTo(motoX + motoW * 0.85, motoY + motoH * 0.22);
    ctx.stroke();
    
    // Espejos (círculos en los extremos del manubrio)
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.arc(motoX + motoW * 0.12, motoY + motoH * 0.2, motoW * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(motoX + motoW * 0.88, motoY + motoH * 0.2, motoW * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Luz delantera
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.ellipse(motoX + motoW / 2, motoY + motoH * 0.08, motoW * 0.12, motoH * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Luz trasera
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.ellipse(motoX + motoW / 2, motoY + motoH * 0.92, motoW * 0.1, motoH * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Asiento (parte superior del cuerpo)
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.ellipse(motoX + motoW / 2, motoY + motoH * 0.55, motoW * 0.18, motoH * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Número
    if (showLabels) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(8, 10 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${numero}`, motoX + motoW / 2, motoY + motoH * 0.42);
    }
  };

  const drawElement = (
    ctx: CanvasRenderingContext2D,
    tipo: string,
    x: number,
    y: number,
    w: number,
    h: number,
    config: typeof ELEMENT_CONFIG[string],
    showLabels: boolean,
    zoom: number
  ) => {
    ctx.fillStyle = config.fill;
    ctx.strokeStyle = config.stroke;
    ctx.lineWidth = 1.5;

    if (tipo === 'pupitre') {
      // Mesa
      ctx.fillStyle = config.fill;
      ctx.fillRect(x, y, w, h * 0.5);
      ctx.strokeStyle = config.stroke;
      ctx.strokeRect(x, y, w, h * 0.5);
      
      // Silla integrada
      ctx.fillStyle = '#C4B5FD';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.75, w * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = config.stroke;
      ctx.stroke();
      
    } else if (tipo === 'vehiculo' || tipo === 'vehiculo_discapacitado') {
      // Usar la función gráfica para dibujar el vehículo
      const isDisabled = tipo === 'vehiculo_discapacitado';
      const color = isDisabled ? '#60A5FA' : '#6B7280';
      drawCarShape(ctx, x, y, w, h, color, 0, false, zoom, isDisabled);
      
    } else if (tipo === 'motocicleta') {
      // Usar la función gráfica para dibujar la motocicleta
      drawMotorcycleShape(ctx, x, y, w, h, '#A855F7', 0, false, zoom);
      
    } else if (tipo === 'butacas') {
      ctx.fillStyle = config.fill;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2 * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = config.stroke;
      ctx.stroke();
      
      ctx.fillStyle = '#D97706';
      ctx.fillRect(x + w * 0.2, y, w * 0.6, h * 0.25);
      
    } else {
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    }

    if (showLabels && zoom >= 0.7 && config.icon && zoom >= 1) {
      ctx.fillStyle = '#1F2937';
      ctx.font = `${Math.max(10, 14 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(config.icon, x + w / 2, y + h / 2);
    }
  };

  const drawLegend = (
    ctx: CanvasRenderingContext2D,
    elementos: LayoutElement[],
    canvasHeight: number
  ) => {
    const usedTypes = [...new Set(elementos.map(e => e.tipo))].filter(t => {
      const config = ELEMENT_CONFIG[t];
      return config && t !== 'pizarra' && t !== 'pantalla';
    });

    if (usedTypes.length === 0) return;

    const legendX = 10;
    const legendY = canvasHeight - 30 - usedTypes.length * 22;
    const legendW = 180;
    const legendH = 25 + usedTypes.length * 22;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.fillRect(legendX, legendY, legendW, legendH);
    ctx.strokeRect(legendX, legendY, legendW, legendH);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('📋 Leyenda', legendX + 8, legendY + 15);

    usedTypes.forEach((tipo, idx) => {
      const config = ELEMENT_CONFIG[tipo] || ELEMENT_CONFIG.default;
      const elemento = elementos.find(e => e.tipo === tipo);
      const cantidad = elemento?.cantidad || 0;
      
      const itemY = legendY + 30 + idx * 20;
      
      ctx.fillStyle = config.fill;
      ctx.fillRect(legendX + 8, itemY - 8, 14, 14);
      ctx.strokeStyle = config.stroke;
      ctx.strokeRect(legendX + 8, itemY - 8, 14, 14);

      ctx.fillStyle = '#4B5563';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      const label = tipo.replace(/_/g, ' ');
      ctx.fillText(`${label} (${cantidad})`, legendX + 28, itemY + 2);
    });
  };

  // ============================================
  // LAYOUTS ESPECÍFICOS POR TIPO DE ESPACIO
  // ============================================

  const drawLabComputerLayout = (
    ctx: CanvasRenderingContext2D,
    elementos: LayoutElement[],
    roomX: number,
    roomY: number,
    roomW: number,
    roomH: number,
    scale: number,
    showLabels: boolean,
    zoom: number,
    areaStartY: number,
    anchoPasillo: number
  ) => {
    const computadores = elementos.find(e => e.tipo === 'computador');
    if (!computadores) return;

    const cantidad = computadores.cantidad;
    const pcConfig = ELEMENT_CONFIG.computador;
    
    const stationW = pcConfig.width * scale;
    const stationH = pcConfig.height * scale;
    
    const pasilloW = anchoPasillo * scale;
    const margenLateral = 0.4 * scale;
    const espacioEntreFilas = 0.3 * scale;
    const espacioEntreColumnas = 0.15 * scale;
    
    const areaUtilW = roomW - margenLateral * 2;
    const startY = areaStartY + 0.3 * scale;
    
    const ladoW = (areaUtilW - pasilloW) / 2;
    const estacionesPorLado = Math.max(1, Math.floor(ladoW / (stationW + espacioEntreColumnas)));
    const estacionesPorFila = estacionesPorLado * 2;
    
    const filasNecesarias = Math.ceil(cantidad / estacionesPorFila);
    const filaH = stationH + espacioEntreFilas;
    
    let drawnCount = 0;
    
    for (let fila = 0; fila < filasNecesarias && drawnCount < cantidad; fila++) {
      const y = startY + fila * filaH;
      
      if (y + stationH > roomY + roomH - 0.3 * scale) break;
      
      // Lado izquierdo
      for (let col = 0; col < estacionesPorLado && drawnCount < cantidad; col++) {
        const x = roomX + margenLateral + col * (stationW + espacioEntreColumnas);
        drawComputerStation(ctx, x, y, stationW, stationH, scale, showLabels, zoom, drawnCount + 1);
        drawnCount++;
      }
      
      // Lado derecho
      for (let col = 0; col < estacionesPorLado && drawnCount < cantidad; col++) {
        const x = roomX + margenLateral + ladoW + pasilloW + col * (stationW + espacioEntreColumnas);
        drawComputerStation(ctx, x, y, stationW, stationH, scale, showLabels, zoom, drawnCount + 1);
        drawnCount++;
      }
    }
    
    // Etiqueta del pasillo central
    ctx.fillStyle = '#94A3B8';
    ctx.font = `${Math.max(10, 12 * zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(roomX + roomW / 2, roomY + roomH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('PASILLO', 0, 0);
    ctx.restore();
  };

  const drawGenericClassroomLayout = (
    ctx: CanvasRenderingContext2D,
    elementos: LayoutElement[],
    roomX: number,
    roomY: number,
    roomW: number,
    roomH: number,
    scale: number,
    showLabels: boolean,
    zoom: number,
    areaStartY: number,
    pasilloX: number,
    pasilloW: number,
    pasilloH: number
  ) => {
    const elementosEnPiso = elementos.filter(e => {
      const config = ELEMENT_CONFIG[e.tipo] || ELEMENT_CONFIG.default;
      return config.showOnFloor && e.tipo !== 'pizarra' && e.tipo !== 'pantalla' && e.tipo !== 'espacio_instructor';
    });

    const areaIzqX = roomX + 0.3 * scale;
    const areaIzqW = (roomW - pasilloW) / 2 - 0.5 * scale;
    const areaDerX = pasilloX + pasilloW + 0.2 * scale;
    const areaDerW = areaIzqW;
    const areaY = areaStartY + 0.5 * scale;
    const areaH = pasilloH;

    elementosEnPiso.forEach(elemento => {
      const config = ELEMENT_CONFIG[elemento.tipo] || ELEMENT_CONFIG.default;
      const elemW = config.width * scale;
      const elemH = config.height * scale;
      
      const espacioH = elemH + 0.15 * scale;
      const espacioW = elemW + 0.1 * scale;
      
      const elementosPorFilaIzq = Math.max(1, Math.floor(areaIzqW / espacioW));
      const elementosPorFilaDer = Math.max(1, Math.floor(areaDerW / espacioW));
      const filasDisponibles = Math.max(1, Math.floor(areaH / espacioH));
      
      let drawnCount = 0;
      
      for (let i = 0; i < elemento.cantidad && drawnCount < elemento.cantidad; i++) {
        const ladoIzq = (i % 2 === 0);
        const indexEnLado = Math.floor(i / 2);
        
        const elementosPorFila = ladoIzq ? elementosPorFilaIzq : elementosPorFilaDer;
        if (elementosPorFila <= 0) continue;
        
        const fila = Math.floor(indexEnLado / elementosPorFila);
        const col = indexEnLado % elementosPorFila;
        
        if (fila >= filasDisponibles) continue;
        
        let x: number, y: number;
        if (ladoIzq) {
          x = areaIzqX + col * espacioW;
          y = areaY + fila * espacioH;
        } else {
          x = areaDerX + col * espacioW;
          y = areaY + fila * espacioH;
        }
        
        if (x + elemW > roomX + roomW - 0.1 * scale) continue;
        if (y + elemH > roomY + roomH - 0.5 * scale) continue;
        
        drawElement(ctx, elemento.tipo, x, y, elemW, elemH, config, showLabels, zoom);
        drawnCount++;
      }
    });
  };

  const drawGenericElements = (
    ctx: CanvasRenderingContext2D,
    elementos: LayoutElement[],
    roomX: number,
    roomY: number,
    roomW: number,
    roomH: number,
    scale: number,
    showLabels: boolean,
    zoom: number
  ) => {
    const elementosEnPiso = elementos.filter(e => {
      const config = ELEMENT_CONFIG[e.tipo] || ELEMENT_CONFIG.default;
      return config.showOnFloor && e.tipo !== 'pizarra' && e.tipo !== 'pantalla' && e.tipo !== 'espacio_instructor';
    });

    let currentX = roomX + 0.5 * scale;
    let currentY = roomY + 1.5 * scale;
    const maxX = roomX + roomW - 0.5 * scale;
    const maxY = roomY + roomH - 0.5 * scale;

    elementosEnPiso.forEach(elemento => {
      const config = ELEMENT_CONFIG[elemento.tipo] || ELEMENT_CONFIG.default;
      const elemW = config.width * scale;
      const elemH = config.height * scale;

      for (let i = 0; i < elemento.cantidad; i++) {
        if (currentX + elemW > maxX) {
          currentX = roomX + 0.5 * scale;
          currentY += elemH + 0.2 * scale;
        }
        if (currentY + elemH > maxY) break;

        drawElement(ctx, elemento.tipo, currentX, currentY, elemW, elemH, config, showLabels, zoom);
        currentX += elemW + 0.2 * scale;
      }
    });
  };

  // ============================================
  // LAYOUT ESPECIALIZADO: PARQUEADERO
  // Diseño que muestra TODOS los vehículos solicitados
  // ============================================
  const drawParkingLayout = (
    ctx: CanvasRenderingContext2D,
    elementos: LayoutElement[],
    roomX: number,
    roomY: number,
    roomW: number,
    roomH: number,
    scale: number,
    showLabels: boolean,
    zoom: number
  ) => {
    // Buscar elementos
    const vehiculos = elementos.find(e => 
      e.tipo === 'vehiculo' || e.tipo === 'espacio_vehiculo' || 
      e.tipo === 'auto' || e.tipo === 'carro' || e.tipo.includes('vehiculo')
    );
    const motos = elementos.find(e => 
      e.tipo === 'motocicleta' || e.tipo === 'espacio_motocicleta' || 
      e.tipo === 'moto' || e.tipo.includes('motocicleta') || e.tipo.includes('moto')
    );
    const discapacitados = elementos.find(e => 
      e.tipo === 'vehiculo_discapacitado' || e.tipo === 'espacio_discapacitado' || e.tipo.includes('discapacitado')
    );
    
    const totalVehiculos = vehiculos?.cantidad || 0;
    const totalMotos = motos?.cantidad || 0;
    const totalDisc = discapacitados?.cantidad || 0;
    const totalCarros = totalVehiculos + totalDisc;
    
    console.log('Parqueadero - Vehículos:', totalVehiculos, 'Motos:', totalMotos, 'Disc:', totalDisc);
    
    // ===== DIMENSIONES REALES =====
    const VEHICULO_ANCHO = 2.5 * scale;  // 2.5 metros de ancho
    const VEHICULO_LARGO = 4.5 * scale;  // 4.5 metros de largo
    const MOTO_ANCHO = 0.7 * scale;      // 0.7 metros
    const MOTO_LARGO = 2.0 * scale;      // 2.0 metros (~1.4m²)
    const CARRIL_ANCHO = 4.5 * scale;    // 4.5 metros para circulación (reducido para más espacio)
    const MARGEN = 0.2 * scale;
    const ESPACIO_ENTRE = 0.1 * scale;
    
    // ===== CALCULAR ZONA DE MOTOS (parte inferior) =====
    let motoZoneH = 0;
    let motosPorFila = 0;
    let filasMotos = 0;
    
    if (totalMotos > 0) {
      motosPorFila = Math.max(1, Math.floor((roomW - MARGEN * 2) / (MOTO_ANCHO + ESPACIO_ENTRE)));
      filasMotos = Math.ceil(totalMotos / motosPorFila);
      motoZoneH = filasMotos * (MOTO_LARGO + ESPACIO_ENTRE) + 0.8 * scale;
    }
    
    // ===== ÁREA DISPONIBLE PARA VEHÍCULOS =====
    const areaVehiculosH = roomH - MARGEN * 2 - motoZoneH;
    const areaVehiculosW = roomW - MARGEN * 2;
    
    // ===== CALCULAR CUÁNTOS VEHÍCULOS POR FILA =====
    const vehiculosPorFila = Math.max(1, Math.floor(areaVehiculosW / (VEHICULO_ANCHO + ESPACIO_ENTRE)));
    
    // ===== CALCULAR BLOQUES NECESARIOS =====
    // Cada bloque = 2 filas de vehículos + 1 carril
    // Capacidad por bloque = 2 * vehiculosPorFila
    const capacidadPorBloque = 2 * vehiculosPorFila;
    const bloquesNecesarios = Math.ceil(totalCarros / capacidadPorBloque);
    
    // Altura de cada bloque
    const bloqueAlto = VEHICULO_LARGO * 2 + CARRIL_ANCHO;
    
    // Si no caben todos los bloques, ajustar la escala del bloque
    const alturaDisponible = areaVehiculosH;
    let bloqueAltoAjustado = bloqueAlto;
    let carrilAnchoAjustado = CARRIL_ANCHO;
    let vehiculoLargoAjustado = VEHICULO_LARGO;
    
    if (bloquesNecesarios * bloqueAlto > alturaDisponible) {
      // Reducir proporcionalmente
      const factorReduccion = alturaDisponible / (bloquesNecesarios * bloqueAlto);
      vehiculoLargoAjustado = VEHICULO_LARGO * factorReduccion;
      carrilAnchoAjustado = Math.max(2 * scale, CARRIL_ANCHO * factorReduccion); // Mínimo 2m de carril
      bloqueAltoAjustado = vehiculoLargoAjustado * 2 + carrilAnchoAjustado;
    }
    
    const numBloques = bloquesNecesarios;
    const alturaUsada = numBloques * bloqueAltoAjustado;
    const offsetY = roomY + MARGEN + Math.max(0, (alturaDisponible - alturaUsada) / 2);
    
    console.log(`Bloques necesarios: ${numBloques}, Por fila: ${vehiculosPorFila}, Capacidad total: ${numBloques * capacidadPorBloque}`);
    
    let drawnVeh = 0;
    let drawnDisc = 0;
    
    // ===== DIBUJAR BLOQUES =====
    for (let bloque = 0; bloque < numBloques; bloque++) {
      const bloqueY = offsetY + bloque * bloqueAltoAjustado;
      
      // === Fila superior del bloque ===
      const filaSupY = bloqueY;
      for (let col = 0; col < vehiculosPorFila; col++) {
        // Verificar si aún quedan vehículos por dibujar
        if (drawnVeh >= totalVehiculos && drawnDisc >= totalDisc) break;
        
        const x = roomX + MARGEN + col * (VEHICULO_ANCHO + ESPACIO_ENTRE);
        const y = filaSupY;
        
        // Espacio de estacionamiento
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(x, y, VEHICULO_ANCHO, vehiculoLargoAjustado);
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, VEHICULO_ANCHO, vehiculoLargoAjustado);
        
        // Colocar discapacitados primero (en las primeras posiciones)
        if (drawnDisc < totalDisc) {
          drawCarShape(ctx, x + 0.02*scale, y + 0.02*scale, VEHICULO_ANCHO - 0.04*scale, vehiculoLargoAjustado - 0.04*scale, '#60A5FA', drawnDisc + 1, showLabels, zoom, true);
          drawnDisc++;
        } else if (drawnVeh < totalVehiculos) {
          drawCarShape(ctx, x + 0.02*scale, y + 0.02*scale, VEHICULO_ANCHO - 0.04*scale, vehiculoLargoAjustado - 0.04*scale, '#6B7280', drawnVeh + 1, showLabels, zoom, false);
          drawnVeh++;
        }
      }
      
      // === Carril de circulación ===
      const carrilY = filaSupY + vehiculoLargoAjustado;
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(roomX + MARGEN, carrilY, areaVehiculosW, carrilAnchoAjustado);
      
      // Línea central amarilla discontinua
      ctx.strokeStyle = '#FCD34D';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 10]);
      ctx.beginPath();
      ctx.moveTo(roomX + MARGEN, carrilY + carrilAnchoAjustado / 2);
      ctx.lineTo(roomX + MARGEN + areaVehiculosW, carrilY + carrilAnchoAjustado / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Flechas de dirección
      ctx.fillStyle = '#9CA3AF';
      ctx.font = `bold ${Math.max(10, 12 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      const numFlechas = Math.max(2, Math.floor(areaVehiculosW / (4 * scale)));
      for (let i = 0; i < numFlechas; i++) {
        const flechaX = roomX + MARGEN + (i + 0.5) * (areaVehiculosW / numFlechas);
        ctx.fillText(bloque % 2 === 0 ? '→' : '←', flechaX, carrilY + carrilAnchoAjustado / 2 + 4);
      }
      
      // === Fila inferior del bloque ===
      const filaInfY = carrilY + carrilAnchoAjustado;
      for (let col = 0; col < vehiculosPorFila; col++) {
        if (drawnVeh >= totalVehiculos && drawnDisc >= totalDisc) break;
        
        const x = roomX + MARGEN + col * (VEHICULO_ANCHO + ESPACIO_ENTRE);
        const y = filaInfY;
        
        // Espacio de estacionamiento
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(x, y, VEHICULO_ANCHO, vehiculoLargoAjustado);
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, VEHICULO_ANCHO, vehiculoLargoAjustado);
        
        if (drawnDisc < totalDisc) {
          drawCarShape(ctx, x + 0.02*scale, y + 0.02*scale, VEHICULO_ANCHO - 0.04*scale, vehiculoLargoAjustado - 0.04*scale, '#60A5FA', drawnDisc + 1, showLabels, zoom, true);
          drawnDisc++;
        } else if (drawnVeh < totalVehiculos) {
          drawCarShape(ctx, x + 0.02*scale, y + 0.02*scale, VEHICULO_ANCHO - 0.04*scale, vehiculoLargoAjustado - 0.04*scale, '#6B7280', drawnVeh + 1, showLabels, zoom, false);
          drawnVeh++;
        }
      }
    }
    
    // ===== ZONA DE MOTOCICLETAS (parte inferior) =====
    if (totalMotos > 0) {
      const motoZoneY = roomY + roomH - motoZoneH - MARGEN;
      const motoZoneX = roomX + MARGEN;
      const motoZoneW = roomW - MARGEN * 2;
      
      // Fondo de zona
      ctx.fillStyle = '#F5F3FF';
      ctx.fillRect(motoZoneX, motoZoneY, motoZoneW, motoZoneH);
      
      // Borde
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(motoZoneX, motoZoneY, motoZoneW, motoZoneH);
      ctx.setLineDash([]);
      
      // Etiqueta
      ctx.fillStyle = '#7C3AED';
      ctx.font = `bold ${Math.max(10, 12 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('🏍️ ZONA DE MOTOCICLETAS', motoZoneX + motoZoneW / 2, motoZoneY + 0.3 * scale);
      
      // Dibujar motocicletas
      let drawnMotos = 0;
      for (let fila = 0; fila < filasMotos && drawnMotos < totalMotos; fila++) {
        for (let col = 0; col < motosPorFila && drawnMotos < totalMotos; col++) {
          const x = motoZoneX + ESPACIO_ENTRE + col * (MOTO_ANCHO + ESPACIO_ENTRE);
          const y = motoZoneY + 0.5 * scale + fila * (MOTO_LARGO + ESPACIO_ENTRE);
          drawMotorcycleShape(ctx, x, y, MOTO_ANCHO, MOTO_LARGO, '#A855F7', drawnMotos + 1, showLabels, zoom);
          drawnMotos++;
        }
      }
    }
    
    // ===== INFORMACIÓN =====
    ctx.fillStyle = '#374151';
    ctx.font = `bold ${Math.max(10, 12 * zoom)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`🚗 ${drawnVeh}/${totalVehiculos}  ♿ ${drawnDisc}/${totalDisc}  🏍️ ${totalMotos}`, roomX + MARGEN, roomY + roomH - 0.1 * scale);
  };

  // ============================================
  // LAYOUT ESPECIALIZADO: AUDITORIO
  // ============================================
  const drawAuditoriumLayout = (
    ctx: CanvasRenderingContext2D,
    elementos: LayoutElement[],
    roomX: number,
    roomY: number,
    roomW: number,
    roomH: number,
    scale: number,
    showLabels: boolean,
    zoom: number
  ) => {
    const butacas = elementos.find(e => e.tipo === 'butacas' || e.tipo === 'silla');
    const cantidad = butacas?.cantidad || 0;
    
    // Área del escenario (parte frontal)
    const escenarioH = 2.5 * scale;
    const escenarioW = roomW * 0.7;
    const escenarioX = roomX + (roomW - escenarioW) / 2;
    const escenarioY = roomY + 0.5 * scale;
    
    // Dibujar escenario
    ctx.fillStyle = '#7C2D12';
    ctx.fillRect(escenarioX, escenarioY, escenarioW, escenarioH);
    
    // Borde del escenario
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 3;
    ctx.strokeRect(escenarioX, escenarioY, escenarioW, escenarioH);
    
    // Gradiente para efecto de profundidad
    const gradiente = ctx.createLinearGradient(escenarioX, escenarioY, escenarioX, escenarioY + escenarioH);
    gradiente.addColorStop(0, '#92400E');
    gradiente.addColorStop(1, '#78350F');
    ctx.fillStyle = gradiente;
    ctx.fillRect(escenarioX + 0.1 * scale, escenarioY + 0.1 * scale, escenarioW - 0.2 * scale, escenarioH - 0.2 * scale);
    
    // Etiqueta del escenario
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(14, 18 * zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('🎭 ESCENARIO', roomX + roomW / 2, escenarioY + escenarioH / 2 + 5);
    
    // Cortinas laterales
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(escenarioX - 0.3 * scale, escenarioY, 0.3 * scale, escenarioH);
    ctx.fillRect(escenarioX + escenarioW, escenarioY, 0.3 * scale, escenarioH);
    
    // Área de butacas
    const butacasStartY = escenarioY + escenarioH + 1.0 * scale;
    const butacasEndY = roomY + roomH - 1.0 * scale;
    const butacasH = butacasEndY - butacasStartY;
    
    if (cantidad > 0 && butacasH > 0) {
      const butacaConfig = ELEMENT_CONFIG.butacas || ELEMENT_CONFIG.silla;
      const butacaW = (butacaConfig?.width || 0.6) * scale;
      const butacaH = (butacaConfig?.height || 0.6) * scale;
      
      const pasilloW = 1.5 * scale;
      const margenLateral = 0.5 * scale;
      const espacioEntreSillas = 0.1 * scale;
      const espacioEntreFilas = 0.3 * scale;
      
      // Calcular butacas por sección
      const seccionW = (roomW - pasilloW * 2 - margenLateral * 2) / 3;
      const butacasPorSeccion = Math.max(1, Math.floor(seccionW / (butacaW + espacioEntreSillas)));
      const filasDisponibles = Math.max(1, Math.floor(butacasH / (butacaH + espacioEntreFilas)));
      
      let drawnCount = 0;
      
      for (let fila = 0; fila < filasDisponibles && drawnCount < cantidad; fila++) {
        const y = butacasStartY + fila * (butacaH + espacioEntreFilas);
        
        // Número de fila
        if (showLabels) {
          ctx.fillStyle = '#6B7280';
          ctx.font = `${Math.max(10, 12 * zoom)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(`F${fila + 1}`, roomX + margenLateral / 2, y + butacaH / 2 + 4);
        }
        
        // Sección izquierda
        for (let col = 0; col < butacasPorSeccion && drawnCount < cantidad; col++) {
          const x = roomX + margenLateral + col * (butacaW + espacioEntreSillas);
          drawSeat(ctx, x, y, butacaW, butacaH, drawnCount + 1, showLabels, zoom);
          drawnCount++;
        }
        
        // Sección central
        const centroStartX = roomX + margenLateral + seccionW + pasilloW;
        for (let col = 0; col < butacasPorSeccion && drawnCount < cantidad; col++) {
          const x = centroStartX + col * (butacaW + espacioEntreSillas);
          drawSeat(ctx, x, y, butacaW, butacaH, drawnCount + 1, showLabels, zoom);
          drawnCount++;
        }
        
        // Sección derecha
        const derechaStartX = centroStartX + seccionW + pasilloW;
        for (let col = 0; col < butacasPorSeccion && drawnCount < cantidad; col++) {
          const x = derechaStartX + col * (butacaW + espacioEntreSillas);
          if (x + butacaW > roomX + roomW - margenLateral) break;
          drawSeat(ctx, x, y, butacaW, butacaH, drawnCount + 1, showLabels, zoom);
          drawnCount++;
        }
      }
      
      // Pasillos
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(roomX + margenLateral + seccionW, butacasStartY - 0.2 * scale, pasilloW, butacasH + 0.4 * scale);
      ctx.fillRect(roomX + margenLateral + seccionW * 2 + pasilloW, butacasStartY - 0.2 * scale, pasilloW, butacasH + 0.4 * scale);
    }
    
    // Salidas de emergencia
    ctx.fillStyle = '#16A34A';
    ctx.font = `bold ${Math.max(10, 12 * zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('🚪 SALIDA', roomX + 0.8 * scale, roomY + roomH - 0.3 * scale);
    ctx.fillText('🚪 SALIDA', roomX + roomW - 0.8 * scale, roomY + roomH - 0.3 * scale);
  };
  
  // Función auxiliar para dibujar butaca
  const drawSeat = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    numero: number,
    showLabels: boolean,
    zoom: number
  ) => {
    // Asiento
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h * 0.7, 3);
    ctx.fill();
    
    // Respaldo
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(x, y, w, h * 0.3);
    
    // Borde
    ctx.strokeStyle = '#7F1D1D';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    
    // Número
    if (showLabels && zoom >= 0.8) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${Math.max(8, 10 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`${numero}`, x + w / 2, y + h / 2 + 3);
    }
  };

  // ============================================
  // LAYOUT ESPECIALIZADO: OFICINA
  // ============================================
  const drawOfficeLayout = (
    ctx: CanvasRenderingContext2D,
    elementos: LayoutElement[],
    roomX: number,
    roomY: number,
    roomW: number,
    roomH: number,
    scale: number,
    showLabels: boolean,
    zoom: number
  ) => {
    const escritorios = elementos.find(e => e.tipo === 'escritorio_oficina' || e.tipo === 'escritorio_estudiante');
    const archivadores = elementos.find(e => e.tipo === 'archivador');
    
    const margen = 0.5 * scale;
    const pasilloW = 1.5 * scale;
    
    // Área de recepción (entrada)
    const recepcionH = 2.0 * scale;
    const recepcionW = 2.5 * scale;
    const recepcionX = roomX + margen;
    const recepcionY = roomY + roomH - recepcionH - margen;
    
    // Dibujar área de recepción
    ctx.fillStyle = '#DBEAFE';
    ctx.fillRect(recepcionX, recepcionY, recepcionW, recepcionH);
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.strokeRect(recepcionX, recepcionY, recepcionW, recepcionH);
    
    ctx.fillStyle = '#1D4ED8';
    ctx.font = `bold ${Math.max(10, 12 * zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('RECEPCIÓN', recepcionX + recepcionW / 2, recepcionY + recepcionH / 2);
    
    // Escritorios en configuración de oficina
    if (escritorios && escritorios.cantidad > 0) {
      const escConfig = ELEMENT_CONFIG.escritorio_oficina || ELEMENT_CONFIG.escritorio_estudiante;
      const escW = escConfig.width * scale;
      const escH = escConfig.height * scale;
      const sillaW = 0.5 * scale;
      const sillaH = 0.5 * scale;
      
      // Área de trabajo (excluyendo recepción)
      const trabajoStartY = roomY + margen;
      const trabajoEndY = recepcionY - pasilloW;
      const trabajoH = trabajoEndY - trabajoStartY;
      
      // Configuración de clusters de 4 escritorios
      const clusterW = escW * 2 + 0.2 * scale;
      const clusterH = escH * 2 + sillaH * 2 + 0.4 * scale;
      
      const clustersDisponiblesX = Math.max(1, Math.floor((roomW - margen * 2 - pasilloW) / (clusterW + pasilloW)));
      const clustersDisponiblesY = Math.max(1, Math.floor(trabajoH / (clusterH + 0.5 * scale)));
      
      let drawnEsc = 0;
      const totalEscritorios = escritorios.cantidad;
      
      for (let cy = 0; cy < clustersDisponiblesY && drawnEsc < totalEscritorios; cy++) {
        for (let cx = 0; cx < clustersDisponiblesX && drawnEsc < totalEscritorios; cx++) {
          const clusterX = roomX + margen + cx * (clusterW + pasilloW);
          const clusterY = trabajoStartY + cy * (clusterH + 0.5 * scale);
          
          // 4 escritorios por cluster
          const posiciones = [
            { x: 0, y: sillaH, rot: 0, sillaY: 0 },
            { x: escW + 0.2 * scale, y: sillaH, rot: 0, sillaY: 0 },
            { x: 0, y: sillaH + escH + 0.2 * scale, rot: 0, sillaY: sillaH + escH * 2 + 0.3 * scale },
            { x: escW + 0.2 * scale, y: sillaH + escH + 0.2 * scale, rot: 0, sillaY: sillaH + escH * 2 + 0.3 * scale }
          ];
          
          posiciones.forEach((pos) => {
            if (drawnEsc >= totalEscritorios) return;
            
            const ex = clusterX + pos.x;
            const ey = clusterY + pos.y;
            
            if (ey + escH > trabajoEndY) return;
            
            // Escritorio
            ctx.fillStyle = escConfig.fill;
            ctx.fillRect(ex, ey, escW, escH);
            ctx.strokeStyle = escConfig.stroke;
            ctx.lineWidth = 2;
            ctx.strokeRect(ex, ey, escW, escH);
            
            // Monitor/computador en el escritorio
            ctx.fillStyle = '#1F2937';
            ctx.fillRect(ex + escW * 0.35, ey + 0.1 * scale, escW * 0.3, 0.15 * scale);
            
            // Silla
            const sillaX = ex + (escW - sillaW) / 2;
            const sillaY = clusterY + pos.sillaY;
            ctx.fillStyle = '#374151';
            ctx.beginPath();
            ctx.arc(sillaX + sillaW / 2, sillaY + sillaH / 2, sillaW / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Número de puesto
            if (showLabels) {
              ctx.fillStyle = '#FFFFFF';
              ctx.font = `${Math.max(10, 12 * zoom)}px Arial`;
              ctx.textAlign = 'center';
              ctx.fillText(`${drawnEsc + 1}`, ex + escW / 2, ey + escH / 2 + 4);
            }
            
            drawnEsc++;
          });
        }
      }
    }
    
    // Archivadores a lo largo de la pared derecha
    if (archivadores && archivadores.cantidad > 0) {
      const archConfig = ELEMENT_CONFIG.archivador;
      const archW = archConfig.width * scale;
      const archH = archConfig.height * scale;
      
      const archX = roomX + roomW - archW - margen;
      let archY = roomY + margen;
      
      for (let i = 0; i < archivadores.cantidad; i++) {
        if (archY + archH > roomY + roomH - margen) break;
        
        ctx.fillStyle = archConfig.fill;
        ctx.fillRect(archX, archY, archW, archH);
        ctx.strokeStyle = archConfig.stroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(archX, archY, archW, archH);
        
        // Gavetas
        ctx.strokeStyle = '#9CA3AF';
        for (let g = 1; g < 4; g++) {
          ctx.beginPath();
          ctx.moveTo(archX, archY + (archH / 4) * g);
          ctx.lineTo(archX + archW, archY + (archH / 4) * g);
          ctx.stroke();
        }
        
        archY += archH + 0.1 * scale;
      }
    }
    
    // Planta decorativa
    ctx.fillStyle = '#22C55E';
    ctx.beginPath();
    ctx.arc(roomX + roomW - 1.0 * scale, roomY + roomH - 1.0 * scale, 0.3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#166534';
    ctx.font = `${Math.max(16, 20 * zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('🌱', roomX + roomW - 1.0 * scale, roomY + roomH - 0.9 * scale);
  };

  // ============================================
  // LAYOUT ESPECIALIZADO: SALA DE CONFERENCIAS
  // ============================================
  const drawConferenceRoomLayout = (
    ctx: CanvasRenderingContext2D,
    elementos: LayoutElement[],
    roomX: number,
    roomY: number,
    roomW: number,
    roomH: number,
    scale: number,
    showLabels: boolean,
    zoom: number,
    _areaStartY: number
  ) => {
    const sillas = elementos.find(e => e.tipo === 'silla');
    const cantidad = sillas?.cantidad || 10;
    
    // Mesa central grande de conferencias
    const mesaW = Math.min(roomW * 0.7, 6.0 * scale);
    const mesaH = Math.min(roomH * 0.4, 3.0 * scale);
    const mesaX = roomX + (roomW - mesaW) / 2;
    const mesaY = roomY + (roomH - mesaH) / 2;
    
    // Sombra de la mesa
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(mesaX + 5, mesaY + 5, mesaW, mesaH);
    
    // Mesa principal
    const gradiente = ctx.createLinearGradient(mesaX, mesaY, mesaX, mesaY + mesaH);
    gradiente.addColorStop(0, '#78350F');
    gradiente.addColorStop(0.5, '#92400E');
    gradiente.addColorStop(1, '#78350F');
    ctx.fillStyle = gradiente;
    ctx.beginPath();
    ctx.roundRect(mesaX, mesaY, mesaW, mesaH, 10);
    ctx.fill();
    
    // Borde de la mesa
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(mesaX, mesaY, mesaW, mesaH, 10);
    ctx.stroke();
    
    // Reflejo en la mesa
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(mesaX + mesaW * 0.1, mesaY + mesaH * 0.1, mesaW * 0.8, mesaH * 0.3, 5);
    ctx.fill();
    
    // Etiqueta de mesa
    ctx.fillStyle = '#FEF3C7';
    ctx.font = `bold ${Math.max(12, 14 * zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('MESA DE CONFERENCIAS', mesaX + mesaW / 2, mesaY + mesaH / 2);
    
    // Distribuir sillas alrededor de la mesa
    const sillaW = 0.5 * scale;
    const sillaH = 0.5 * scale;
    const separacion = 0.2 * scale;
    
    // Sillas en el lado largo superior
    const sillasArriba = Math.floor(mesaW / (sillaW + separacion));
    // Sillas en el lado largo inferior
    const sillasAbajo = sillasArriba;
    // Sillas en los lados cortos
    const sillasLado = Math.max(1, Math.floor(mesaH / (sillaW + separacion)));
    
    let drawnSillas = 0;
    
    // Sillas arriba de la mesa
    for (let i = 0; i < sillasArriba && drawnSillas < cantidad; i++) {
      const x = mesaX + (mesaW - sillasArriba * (sillaW + separacion) + separacion) / 2 + i * (sillaW + separacion);
      const y = mesaY - sillaH - separacion;
      
      drawConferenceChair(ctx, x, y, sillaW, sillaH, drawnSillas + 1, showLabels, zoom, 'down');
      drawnSillas++;
    }
    
    // Sillas abajo de la mesa
    for (let i = 0; i < sillasAbajo && drawnSillas < cantidad; i++) {
      const x = mesaX + (mesaW - sillasAbajo * (sillaW + separacion) + separacion) / 2 + i * (sillaW + separacion);
      const y = mesaY + mesaH + separacion;
      
      drawConferenceChair(ctx, x, y, sillaW, sillaH, drawnSillas + 1, showLabels, zoom, 'up');
      drawnSillas++;
    }
    
    // Silla cabecera izquierda
    if (drawnSillas < cantidad) {
      const x = mesaX - sillaW - separacion;
      const y = mesaY + (mesaH - sillaH) / 2;
      drawConferenceChair(ctx, x, y, sillaW, sillaH, drawnSillas + 1, showLabels, zoom, 'right');
      drawnSillas++;
    }
    
    // Silla cabecera derecha
    if (drawnSillas < cantidad) {
      const x = mesaX + mesaW + separacion;
      const y = mesaY + (mesaH - sillaH) / 2;
      drawConferenceChair(ctx, x, y, sillaW, sillaH, drawnSillas + 1, showLabels, zoom, 'left');
      drawnSillas++;
    }
    
    // Sillas adicionales en los lados
    for (let i = 0; i < sillasLado - 1 && drawnSillas < cantidad; i++) {
      // Lado izquierdo
      if (drawnSillas < cantidad) {
        const x = mesaX - sillaW - separacion;
        const y = mesaY + separacion + i * (sillaH + separacion);
        if (Math.abs(y - (mesaY + (mesaH - sillaH) / 2)) > sillaH) {
          drawConferenceChair(ctx, x, y, sillaW, sillaH, drawnSillas + 1, showLabels, zoom, 'right');
          drawnSillas++;
        }
      }
      
      // Lado derecho
      if (drawnSillas < cantidad) {
        const x = mesaX + mesaW + separacion;
        const y = mesaY + separacion + i * (sillaH + separacion);
        if (Math.abs(y - (mesaY + (mesaH - sillaH) / 2)) > sillaH) {
          drawConferenceChair(ctx, x, y, sillaW, sillaH, drawnSillas + 1, showLabels, zoom, 'left');
          drawnSillas++;
        }
      }
    }
    
    // Pantalla/TV en la pared
    const pantallaW = 2.0 * scale;
    const pantallaH = 0.1 * scale;
    const pantallaX = roomX + (roomW - pantallaW) / 2;
    const pantallaY = roomY + 0.3 * scale;
    
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(pantallaX, pantallaY, pantallaW, pantallaH);
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(pantallaX + 0.05 * scale, pantallaY + 0.02 * scale, pantallaW - 0.1 * scale, pantallaH - 0.04 * scale);
    
    ctx.fillStyle = '#6B7280';
    ctx.font = `${Math.max(10, 12 * zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('📺 PANTALLA', roomX + roomW / 2, pantallaY - 0.1 * scale);
  };
  
  // Función auxiliar para silla de conferencia
  const drawConferenceChair = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    numero: number,
    showLabels: boolean,
    zoom: number,
    facing: 'up' | 'down' | 'left' | 'right'
  ) => {
    // Base de la silla
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Respaldo según orientación
    ctx.fillStyle = '#374151';
    const respaldoSize = w * 0.3;
    switch (facing) {
      case 'up':
        ctx.fillRect(x + w * 0.2, y + h - respaldoSize, w * 0.6, respaldoSize);
        break;
      case 'down':
        ctx.fillRect(x + w * 0.2, y, w * 0.6, respaldoSize);
        break;
      case 'left':
        ctx.fillRect(x + w - respaldoSize, y + h * 0.2, respaldoSize, h * 0.6);
        break;
      case 'right':
        ctx.fillRect(x, y + h * 0.2, respaldoSize, h * 0.6);
        break;
    }
    
    // Número
    if (showLabels && zoom >= 0.8) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${Math.max(8, 10 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(`${numero}`, x + w / 2, y + h / 2 + 3);
    }
  };

  // ============================================
  // EFECTO PRINCIPAL DE RENDERIZADO
  // ============================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo general
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const roomX = margin;
    const roomY = margin;
    const roomW = roomLargo * scale;
    const roomH = roomAncho * scale;

    // Sombra del espacio
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Piso del espacio
    ctx.fillStyle = esViable ? '#FFFFFF' : '#FEF2F2';
    ctx.fillRect(roomX, roomY, roomW, roomH);
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Grid interno
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    for (let x = 0; x <= roomLargo; x++) {
      ctx.beginPath();
      ctx.moveTo(roomX + x * scale, roomY);
      ctx.lineTo(roomX + x * scale, roomY + roomH);
      ctx.stroke();
    }
    for (let y = 0; y <= roomAncho; y++) {
      ctx.beginPath();
      ctx.moveTo(roomX, roomY + y * scale);
      ctx.lineTo(roomX + roomW, roomY + y * scale);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Paredes
    ctx.strokeStyle = esViable ? '#059669' : '#DC2626';
    ctx.lineWidth = 4;
    ctx.strokeRect(roomX, roomY, roomW, roomH);

    // Puerta
    const puertaWidth = 1.0 * scale;
    const puertaX = roomX + 0.5 * scale;
    ctx.fillStyle = '#92400E';
    ctx.fillRect(puertaX, roomY + roomH - 2, puertaWidth, 6);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(puertaX, roomY + roomH, puertaWidth, -Math.PI, -Math.PI/2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ventanas
    const numVentanas = Math.floor(roomLargo / 3);
    ctx.fillStyle = '#BAE6FD';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2;
    for (let i = 0; i < numVentanas; i++) {
      const ventanaX = roomX + (roomW / (numVentanas + 1)) * (i + 1) - 0.4 * scale;
      ctx.fillRect(ventanaX, roomY - 3, 0.8 * scale, 6);
      ctx.strokeRect(ventanaX, roomY - 3, 0.8 * scale, 6);
    }

    // Área frontal (pizarra/pantalla/proyector)
    const tienePizarra = elementos.some(e => e.tipo === 'pizarra' || e.tipo === 'pantalla');
    const tieneProyector = elementos.some(e => e.tipo === 'proyector');
    const tipoNormalizado = tipoEspacio.toLowerCase().replace(/[_\s]+/g, '_');
    
    let areaEstudiantesY = roomY + 0.5 * scale;

    if (tienePizarra || !tipoNormalizado.includes('parqueadero')) {
      const pizarraW = Math.min(3.0, roomLargo * 0.6) * scale;
      const pizarraX = roomX + (roomW - pizarraW) / 2;
      const pizarraY = roomY + 0.1 * scale;
      
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(pizarraX, pizarraY, pizarraW, 0.15 * scale);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(10, 12 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('PIZARRA', roomX + roomW / 2, pizarraY + 0.1 * scale);
      
      areaEstudiantesY = roomY + 0.4 * scale;
    }

    // Proyector en el techo
    if (tieneProyector) {
      const proyectorX = roomX + roomW / 2;
      const proyectorY = roomY + 0.8 * scale;
      ctx.fillStyle = '#FEE2E2';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(proyectorX, proyectorY, 0.25 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#DC2626';
      ctx.font = `${Math.max(12, 16 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('📽️', proyectorX, proyectorY + 5);
      
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#FCA5A5';
      ctx.beginPath();
      ctx.moveTo(proyectorX - 0.4 * scale, proyectorY + 0.2 * scale);
      ctx.lineTo(roomX + roomW * 0.3, roomY + 0.2 * scale);
      ctx.moveTo(proyectorX + 0.4 * scale, proyectorY + 0.2 * scale);
      ctx.lineTo(roomX + roomW * 0.7, roomY + 0.2 * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Espacio del instructor
    let instructorAreaH = 0;
    if (incluirInstructor && !tipoNormalizado.includes('parqueadero')) {
      const instructorY = areaEstudiantesY + 0.3 * scale;
      const instructorW = Math.min(2.0, roomLargo * 0.3) * scale;
      const instructorH = 1.0 * scale;
      const instructorX = roomX + (roomW - instructorW) / 2;

      ctx.fillStyle = '#FEF3C7';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.fillRect(instructorX, instructorY, instructorW, instructorH);
      ctx.strokeRect(instructorX, instructorY, instructorW, instructorH);

      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(instructorX + instructorW / 2, instructorY + instructorH + 0.3 * scale, 0.25 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#D97706';
      ctx.stroke();

      ctx.fillStyle = '#92400E';
      ctx.font = `bold ${Math.max(10, 12 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('👨‍🏫 INSTRUCTOR', instructorX + instructorW / 2, instructorY + instructorH / 2 + 4);

      instructorAreaH = instructorH + 0.8 * scale;
      areaEstudiantesY += instructorAreaH;
    }

    // Pasillo central
    const pasilloW = anchoPasillo * scale;
    const pasilloX = roomX + (roomW - pasilloW) / 2;
    const pasilloY = areaEstudiantesY + 0.5 * scale;
    const pasilloH = roomH - (pasilloY - roomY) - 1.5 * scale;

    if (!tipoNormalizado.includes('parqueadero') && pasilloH > 0) {
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.fillRect(pasilloX, pasilloY, pasilloW, pasilloH);
      ctx.strokeRect(pasilloX, pasilloY, pasilloW, pasilloH);
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#94A3B8';
      ctx.font = `${Math.max(14, 18 * zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('↓', pasilloX + pasilloW / 2, pasilloY + pasilloH / 2);
    }

    // === DIBUJAR ELEMENTOS SEGÚN TIPO DE ESPACIO ===
    if (tipoNormalizado.includes('laboratorio') || tipoNormalizado.includes('computo') || tipoNormalizado.includes('computacion')) {
      drawLabComputerLayout(ctx, elementos, roomX, roomY, roomW, roomH, scale, showLabels, zoom, areaEstudiantesY, anchoPasillo);
    } else if (tipoNormalizado.includes('parqueadero') || tipoNormalizado.includes('estacionamiento')) {
      drawParkingLayout(ctx, elementos, roomX, roomY, roomW, roomH, scale, showLabels, zoom);
    } else if (tipoNormalizado.includes('auditorio') || tipoNormalizado.includes('teatro')) {
      drawAuditoriumLayout(ctx, elementos, roomX, roomY, roomW, roomH, scale, showLabels, zoom);
    } else if (tipoNormalizado.includes('oficina')) {
      drawOfficeLayout(ctx, elementos, roomX, roomY, roomW, roomH, scale, showLabels, zoom);
    } else if (tipoNormalizado.includes('conferencia') || tipoNormalizado.includes('reunion')) {
      drawConferenceRoomLayout(ctx, elementos, roomX, roomY, roomW, roomH, scale, showLabels, zoom, areaEstudiantesY);
    } else {
      drawGenericClassroomLayout(ctx, elementos, roomX, roomY, roomW, roomH, scale, showLabels, zoom, areaEstudiantesY, pasilloX, pasilloW, pasilloH);
    }

    // Leyenda
    drawLegend(ctx, elementos, canvasHeight);

    // Escala
    ctx.fillStyle = '#64748B';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${roomLargo.toFixed(1)}m × ${roomAncho.toFixed(1)}m | 1 cuadro = 1m²`, canvasWidth - 15, canvasHeight - 10);

    // Título
    const tipoIcon = getTipoIcon(tipoEspacio);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${tipoIcon} ${tipoEspacio.toUpperCase()}`, 15, 25);

  }, [elementos, zoom, showLabels, roomLargo, roomAncho, tipoEspacio, incluirInstructor, esViable, anchoPasillo, scale, canvasWidth, canvasHeight]);

  // ============================================
  // HANDLERS Y RENDER
  // ============================================

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `plano-${tipoEspacio}-${metrosCuadrados}m2.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const totalElementos = (elementos || []).reduce((acc: number, e) => acc + (e?.cantidad || 0), 0);

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          🏗️ Plano de Distribución Espacial
        </h4>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500"
            />
            Etiquetas
          </label>
          <div className="flex items-center gap-1 ml-2 bg-white dark:bg-slate-700 rounded-lg px-2 py-1">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400"
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-500 w-12 text-center font-mono">{(zoom * 100).toFixed(0)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.2))}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400"
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400"
              title="Restablecer zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 ml-2"
            title="Descargar imagen PNG"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400"
            title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className={`overflow-auto bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 ${isFullscreen ? 'h-[calc(100%-120px)]' : 'max-h-[500px]'}`}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="mx-auto my-2"
          style={{ minWidth: Math.min(canvasWidth, 800), minHeight: Math.min(canvasHeight, 450) }}
        />
      </div>

      {/* Info bar */}
      <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap justify-between items-center gap-2 text-sm">
          <div className="flex flex-wrap gap-4">
            <span className="text-slate-600 dark:text-slate-400">
              📐 <strong className="text-slate-800 dark:text-slate-200">{metrosCuadrados.toFixed(1)} m²</strong>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              📦 <strong className="text-slate-800 dark:text-slate-200">{totalElementos}</strong> elementos
            </span>
            {porcentajeOcupacion > 0 && (
              <span className="text-slate-600 dark:text-slate-400">
                📊 Ocupación: <strong className={`${porcentajeOcupacion > 85 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {porcentajeOcupacion.toFixed(0)}%
                </strong>
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
            esViable 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {esViable ? '✓ Distribución Viable' : '✗ Espacio Insuficiente'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceLayoutVisualization;
