import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Minimize2, Maximize2, Sparkles, Search, MessageSquare } from 'lucide-react';

interface LayoutData {
  largo: number;
  ancho: number;
  tipoEspacio: string;
  elementos: Array<{ tipo: string; cantidad: number }>;
  esViable: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  spacesFound?: Array<{
    id: number;
    nombre: string;
    tipo: string;
    disponible: boolean;
  }>;
  layoutData?: LayoutData;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

const Chatbot = ({ isOpen, onClose }: ChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy el asistente virtual de SpaceIQ. Puedo ayudarte a:\n\n• Encontrar espacios disponibles según tus necesidades\n• Informarte sobre equipos y características de los espacios\n• Dar recomendaciones basadas en capacidad y tipo\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date(),
      suggestions: [
        '¿Qué espacios tienen proyector?',
        '¿Cuál es el aula más grande?',
        'Buscar laboratorio disponible'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Función para detectar y limpiar planos ASCII de la respuesta
  const processResponse = (response: string): { cleanedContent: string; layoutData?: LayoutData } => {
    // Detectar si hay un plano ASCII (patrones típicos)
    const asciiPatterns = [
      /[-]{10,}/g,  // Líneas de guiones
      /[|]+.*[|]+/g, // Líneas con barras verticales
      /\[.*\]/g,     // Corchetes
      /[MVPC\s]{20,}/g, // Patrones repetitivos de letras
    ];
    
    let hasAsciiPlan = false;
    for (const pattern of asciiPatterns) {
      if (pattern.test(response) && response.includes('Plano')) {
        hasAsciiPlan = true;
        break;
      }
    }

    if (hasAsciiPlan) {
      // Eliminar el plano ASCII de la respuesta
      let cleanedContent = response;
      
      // Eliminar bloques que parezcan planos ASCII
      cleanedContent = cleanedContent.replace(/🗺️\s*Plano de Distribución[\s\S]*?(?=\n\n[A-Z🔹💡⚠️]|$)/gi, '');
      cleanedContent = cleanedContent.replace(/[-|]{5,}[\s\S]*?[-|]{5,}/g, '');
      cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n');
      cleanedContent = cleanedContent.trim();

      // Agregar nota sobre visualización gráfica
      if (cleanedContent && !cleanedContent.includes('visualización gráfica')) {
        cleanedContent += '\n\n📊 *Usa el Asistente IA en el menú lateral para ver la distribución gráfica del espacio.*';
      }

      return { cleanedContent };
    }

    return { cleanedContent: response };
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const getAuthToken = (): string | null => {
    // Get token from localStorage - matches AuthContext implementation
    const token = localStorage.getItem('access_token');
    if (token) {
      return token;
    }
    return null;
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      
      if (!token) {
        // If no token, show a mock response or prompt to login
        const mockResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Para usar el chatbot con IA, necesitas iniciar sesión. Por ahora, puedo mostrarte información básica del sistema.\n\n¿Te gustaría iniciar sesión para acceder a todas las funcionalidades?',
          timestamp: new Date(),
          suggestions: ['Ver espacios disponibles', 'Información del sistema']
        };
        setMessages(prev => [...prev, mockResponse]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageText.trim(),
          context: null
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        if (response.status === 503) {
          throw new Error('El servicio de IA no está disponible en este momento.');
        }
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al procesar el mensaje');
      }

      const data = await response.json();

      // Procesar y limpiar la respuesta (eliminar planos ASCII)
      const { cleanedContent, layoutData } = processResponse(data.response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanedContent,
        timestamp: new Date(data.timestamp),
        suggestions: data.suggestions,
        spacesFound: data.spaces_mentioned,
        layoutData: layoutData
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Lo siento, hubo un problema: ${errorMessage}\n\nPor favor, intenta de nuevo en unos momentos.`,
        timestamp: new Date(),
        suggestions: ['Intentar de nuevo', 'Ver ayuda']
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-72' : 'w-96'
    }`}>
      {/* Chat Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Asistente SpaceIQ</h3>
              <p className="text-white/70 text-xs">Powered by Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4 text-white" />
              ) : (
                <Minimize2 className="h-4 w-4 text-white" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        {!isMinimized && (
          <>
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`p-1.5 rounded-full flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-blue-600' 
                          : 'bg-gradient-to-br from-violet-500 to-purple-600'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md shadow-sm border border-slate-200 dark:border-slate-700'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 ml-8">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Spaces Found */}
                    {message.spacesFound && message.spacesFound.length > 0 && (
                      <div className="mt-2 ml-8 space-y-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Espacios mencionados:</p>
                        {message.spacesFound.map((space) => (
                          <div
                            key={space.id}
                            className="flex items-center gap-2 text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg"
                          >
                            <span className={`w-2 h-2 rounded-full ${space.disponible ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="font-medium">{space.nombre}</span>
                            <span className="text-slate-400">({space.tipo})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                    <span className="text-sm text-slate-500">Pensando...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => handleSuggestionClick('¿Qué espacios están disponibles?')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-green-50 text-green-700 rounded-full hover:bg-green-100 whitespace-nowrap dark:bg-green-900/30 dark:text-green-300"
                >
                  <Search className="h-3 w-3" />
                  Disponibles
                </button>
                <button
                  onClick={() => handleSuggestionClick('Recomiéndame un espacio para 30 personas')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 whitespace-nowrap dark:bg-purple-900/30 dark:text-purple-300"
                >
                  <Sparkles className="h-3 w-3" />
                  Recomendar
                </button>
                <button
                  onClick={() => handleSuggestionClick('¿Qué laboratorios hay disponibles?')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 whitespace-nowrap dark:bg-orange-900/30 dark:text-orange-300"
                >
                  <MessageSquare className="h-3 w-3" />
                  Laboratorios
                </button>
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-slate-400"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900">
            <p className="text-xs text-slate-500 text-center">
              Click para expandir el chat
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
