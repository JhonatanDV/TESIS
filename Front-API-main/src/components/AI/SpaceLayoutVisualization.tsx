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

// Colores por tipo de elemento
const ELEMENT_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  computador: { fill: '#3B82F6', stroke: '#1D4ED8', label: 'PC' },
  escritorio_estudiante: { fill: '#10B981', stroke: '#059669', label: 'Esc' },
  silla: { fill: '#F59E0B', stroke: '#D97706', label: 'S' },
  pupitre: { fill: '#8B5CF6', stroke: '#7C3AED', label: 'Pup' },
  mesa_laboratorio: { fill: '#EC4899', stroke: '#DB2777', label: 'Mesa' },
  proyector: { fill: '#EF4444', stroke: '#DC2626', label: 'Proy' },
  pantalla: { fill: '#6366F1', stroke: '#4F46E5', label: 'Pant' },
  pizarra: { fill: '#14B8A6', stroke: '#0D9488', label: 'Piz' },
  espacio_instructor: { fill: '#F97316', stroke: '#EA580C', label: 'Prof' },
  vehiculo: { fill: '#6B7280', stroke: '#4B5563', label: '🚗' },
  motocicleta: { fill: '#A855F7', stroke: '#9333EA', label: '🏍️' },
  vehiculo_discapacitado: { fill: '#3B82F6', stroke: '#1D4ED8', label: '♿' },
  butacas: { fill: '#F59E0B', stroke: '#D97706', label: 'But' },
  escritorio_oficina: { fill: '#10B981', stroke: '#059669', label: 'Esc' },
  archivador: { fill: '#6B7280', stroke: '#4B5563', label: 'Arch' },
  mesa_trabajo: { fill: '#EC4899', stroke: '#DB2777', label: 'Mesa' },
  televisor: { fill: '#EF4444', stroke: '#DC2626', label: 'TV' },
  default: { fill: '#9CA3AF', stroke: '#6B7280', label: '?' },
};

const SpaceLayoutVisualization: React.FC<SpaceLayoutVisualizationProps> = ({ layoutData }) => {
  // Extraer datos con valores por defecto seguros
  const tipoEspacio = layoutData?.tipoEspacio || 'aula';
  const largo = layoutData?.largo || 10;
  const ancho = layoutData?.ancho || 8;
  const elementos = layoutData?.elementos || [];
  const incluirInstructor = layoutData?.incluyeInstructor ?? false;
  const esViable = layoutData?.esViable ?? true;
  const porcentajeOcupacion = layoutData?.porcentajeOcupacion || 0;
  const metrosCuadrados = largo * ancho;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dimensiones del espacio
  const roomLargo = largo;
  const roomAncho = ancho;

  // Escala para el canvas (pixels por metro)
  const baseScale = 40;
  const scale = baseScale * zoom;

  // Dimensiones del canvas
  const canvasWidth = Math.max(400, roomLargo * scale + 100);
  const canvasHeight = Math.max(300, roomAncho * scale + 100);

  // Padding del room
  const padding = 50;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.5;
    for (let x = padding; x <= padding + roomLargo * scale; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + roomAncho * scale);
      ctx.stroke();
    }
    for (let y = padding; y <= padding + roomAncho * scale; y += scale) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + roomLargo * scale, y);
      ctx.stroke();
    }

    // Dibujar contorno del espacio
    ctx.strokeStyle = esViable ? '#10B981' : '#EF4444';
    ctx.lineWidth = 3;
    ctx.fillStyle = esViable ? '#ECFDF5' : '#FEF2F2';
    
    // Dibujar rectángulo del espacio
    ctx.beginPath();
    ctx.rect(padding, padding, roomLargo * scale, roomAncho * scale);
    ctx.fill();
    ctx.stroke();

    // Dibujar puerta (en la parte inferior izquierda)
    ctx.fillStyle = '#92400E';
    ctx.fillRect(padding + 20, padding + roomAncho * scale - 5, 40, 10);
    ctx.fillStyle = '#78350F';
    ctx.font = '10px Arial';
    ctx.fillText('Puerta', padding + 22, padding + roomAncho * scale + 15);

    // Dibujar ventanas (en la parte superior)
    ctx.fillStyle = '#7DD3FC';
    for (let i = 0; i < 3; i++) {
      const x = padding + (roomLargo * scale * 0.25) + (i * roomLargo * scale * 0.25);
      ctx.fillRect(x, padding - 5, 30, 8);
    }

    // Calcular y dibujar elementos
    let currentY = padding + 30; // Margen superior para pizarra/pantalla
    let currentX = padding + 20;
    const elementSpacing = 5;

    // Primero dibujar pizarra/pantalla si existe
    const pantalla = elementos.find(e => e.tipo === 'pizarra' || e.tipo === 'pantalla');
    if (pantalla) {
      ctx.fillStyle = '#1F2937';
      ctx.fillRect(padding + roomLargo * scale * 0.2, padding + 10, roomLargo * scale * 0.6, 15);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PIZARRA / PANTALLA', padding + roomLargo * scale * 0.5, padding + 22);
      ctx.textAlign = 'left';
      currentY = padding + 50;
    }

    // Dibujar espacio del instructor si aplica
    if (incluirInstructor && tipoEspacio !== 'parqueadero') {
      const instructorX = padding + roomLargo * scale * 0.35;
      const instructorY = currentY;
      const instructorW = roomLargo * scale * 0.3;
      const instructorH = 40;

      ctx.fillStyle = '#FEF3C7';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.fillRect(instructorX, instructorY, instructorW, instructorH);
      ctx.strokeRect(instructorX, instructorY, instructorW, instructorH);

      ctx.fillStyle = '#92400E';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👨‍🏫 INSTRUCTOR', instructorX + instructorW / 2, instructorY + 25);
      ctx.textAlign = 'left';

      currentY += 60;
    }

    // Dibujar los demás elementos
    elementos.forEach((elemento) => {
      if (elemento.tipo === 'pizarra' || elemento.tipo === 'pantalla' || elemento.tipo === 'espacio_instructor') {
        return; // Ya dibujados
      }

      const color = ELEMENT_COLORS[elemento.tipo] || ELEMENT_COLORS.default;
      const filas = elemento.filas || Math.ceil(Math.sqrt(elemento.cantidad));
      const columnas = elemento.columnas || Math.ceil(elemento.cantidad / filas);

      // Calcular tamaño de cada elemento según tipo
      let elemWidth = 25;
      let elemHeight = 25;

      if (elemento.tipo === 'vehiculo') {
        elemWidth = 50;
        elemHeight = 25;
      } else if (elemento.tipo === 'motocicleta') {
        elemWidth = 20;
        elemHeight = 40;
      } else if (elemento.tipo === 'vehiculo_discapacitado') {
        elemWidth = 60;
        elemHeight = 25;
      } else if (elemento.tipo === 'mesa_laboratorio' || elemento.tipo === 'mesa_trabajo') {
        elemWidth = 40;
        elemHeight = 30;
      } else if (elemento.tipo === 'computador') {
        elemWidth = 30;
        elemHeight = 25;
      }

      // Ajustar a la escala
      elemWidth *= (scale / baseScale) * 0.8;
      elemHeight *= (scale / baseScale) * 0.8;

      let drawnCount = 0;
      const maxX = padding + roomLargo * scale - elemWidth - 20;
      const maxY = padding + roomAncho * scale - elemHeight - 30;

      // Resetear X al inicio de cada tipo de elemento
      if (currentX > maxX) {
        currentX = padding + 20;
        currentY += elemHeight + elementSpacing + 20;
      }

      for (let fila = 0; fila < filas && drawnCount < elemento.cantidad; fila++) {
        for (let col = 0; col < columnas && drawnCount < elemento.cantidad; col++) {
          const x = currentX + col * (elemWidth + elementSpacing);
          const y = currentY + fila * (elemHeight + elementSpacing);

          if (x > maxX || y > maxY) continue;

          // Dibujar elemento
          ctx.fillStyle = color.fill;
          ctx.strokeStyle = color.stroke;
          ctx.lineWidth = 1.5;

          if (elemento.tipo === 'vehiculo' || elemento.tipo === 'vehiculo_discapacitado') {
            // Dibujar como auto
            ctx.beginPath();
            ctx.roundRect(x, y, elemWidth, elemHeight, 5);
            ctx.fill();
            ctx.stroke();
          } else if (elemento.tipo === 'motocicleta') {
            // Dibujar como moto (más alargado)
            ctx.beginPath();
            ctx.ellipse(x + elemWidth/2, y + elemHeight/2, elemWidth/2, elemHeight/2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (elemento.tipo === 'silla' || elemento.tipo === 'butacas') {
            // Dibujar como círculo
            ctx.beginPath();
            ctx.arc(x + elemWidth/2, y + elemHeight/2, Math.min(elemWidth, elemHeight)/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            // Rectángulo estándar
            ctx.fillRect(x, y, elemWidth, elemHeight);
            ctx.strokeRect(x, y, elemWidth, elemHeight);
          }

          // Label
          if (showLabels && zoom >= 0.8) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${Math.max(8, 10 * zoom)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(color.label, x + elemWidth/2, y + elemHeight/2);
          }

          drawnCount++;
        }
      }

      // Actualizar posición para el siguiente grupo de elementos
      currentY += filas * (elemHeight + elementSpacing) + 15;
      if (currentY > maxY) {
        currentX += columnas * (elemWidth + elementSpacing) + 20;
        currentY = padding + (pantalla ? 50 : 30) + (incluirInstructor ? 60 : 0);
      }
    });

    // Dibujar leyenda
    const legendX = 10;
    let legendY = canvasHeight - 80;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(legendX, legendY - 10, 200, 85);
    ctx.strokeStyle = '#E2E8F0';
    ctx.strokeRect(legendX, legendY - 10, 200, 85);

    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Leyenda:', legendX + 5, legendY + 5);

    const usedTypes = [...new Set(elementos.map(e => e.tipo))];
    usedTypes.slice(0, 4).forEach((tipo, idx) => {
      const color = ELEMENT_COLORS[tipo] || ELEMENT_COLORS.default;
      const lx = legendX + 5 + (idx % 2) * 95;
      const ly = legendY + 20 + Math.floor(idx / 2) * 25;

      ctx.fillStyle = color.fill;
      ctx.fillRect(lx, ly, 15, 15);
      ctx.strokeStyle = color.stroke;
      ctx.strokeRect(lx, ly, 15, 15);

      ctx.fillStyle = '#4B5563';
      ctx.font = '10px Arial';
      ctx.fillText(tipo.replace('_', ' '), lx + 20, ly + 12);
    });

    // Indicador de escala
    ctx.fillStyle = '#1F2937';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Escala: 1m = ${scale.toFixed(0)}px | ${roomLargo.toFixed(1)}m x ${roomAncho.toFixed(1)}m`, canvasWidth - 10, canvasHeight - 10);

  }, [elementos, zoom, showLabels, roomLargo, roomAncho, tipoEspacio, incluirInstructor, esViable, scale, canvasWidth, canvasHeight]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `plano-${tipoEspacio}-${metrosCuadrados}m2.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <h4 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          🗺️ Plano de Distribución
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
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-500 w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.2))}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
              title="Restablecer zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 ml-2"
            title="Descargar imagen"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
            title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className={`overflow-auto bg-slate-100 dark:bg-slate-900 ${isFullscreen ? 'h-[calc(100%-60px)]' : 'max-h-[500px]'}`}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="mx-auto"
          style={{ minWidth: canvasWidth, minHeight: canvasHeight }}
        />
      </div>

      {/* Info bar */}
      <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
        <span>
          Tipo: <strong className="text-slate-700 dark:text-slate-300">{tipoEspacio}</strong> | 
          Área: <strong className="text-slate-700 dark:text-slate-300">{metrosCuadrados.toFixed(1)} m²</strong> | 
          Elementos: <strong className="text-slate-700 dark:text-slate-300">{(elementos || []).reduce((acc, e) => acc + (e?.cantidad || 0), 0)}</strong>
          {porcentajeOcupacion > 0 && <> | Ocupación: <strong className="text-slate-700 dark:text-slate-300">{porcentajeOcupacion.toFixed(0)}%</strong></>}
        </span>
        <span className={esViable ? 'text-emerald-600' : 'text-red-600'}>
          {esViable ? '✓ Distribución viable' : '✗ Espacio insuficiente'}
        </span>
      </div>
    </div>
  );
};

export default SpaceLayoutVisualization;
