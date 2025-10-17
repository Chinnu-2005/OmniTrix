import { useRef, useEffect, useState } from 'react';
import { Pencil, Eraser, Square, Circle, Type, Palette, Download, FileImage, FileText, MessageCircle } from 'lucide-react';
import { socketClient } from '../lib/socket';
import { apiClient } from '../lib/api';

// Extend Window interface for timeout
declare global {
  interface Window {
    saveBoardTimeout?: NodeJS.Timeout;
  }
}

interface WhiteboardProps {
  roomId: string;
}

interface DrawingData {
  type: 'draw' | 'clear' | 'shape' | 'cursor';
  x?: number;
  y?: number;
  prevX?: number;
  prevY?: number;
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  tool?: string;
  userId?: string;
  username?: string;
}

export const Whiteboard = ({ roomId }: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'rectangle' | 'circle' | 'text'>('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [lastPoint, setLastPoint] = useState<{x: number, y: number} | null>(null);
  const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [remoteCursors, setRemoteCursors] = useState<{[userId: string]: {x: number, y: number, username: string}}>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set overlay canvas size
    if (overlayCanvas) {
      overlayCanvas.width = canvas.offsetWidth;
      overlayCanvas.height = canvas.offsetHeight;
    }

    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing board state
    loadBoardState();

    // Listen for drawing updates from other users
    const handleDrawingUpdate = (data: DrawingData) => {
      if (data.type === 'draw' && data.x !== undefined && data.y !== undefined) {
        drawOnCanvas(data.x, data.y, data.prevX, data.prevY, data.color || '#000000', data.strokeWidth || 2, data.tool || 'pen');
      } else if (data.type === 'shape' && data.x !== undefined && data.y !== undefined) {
        drawShape(data.x, data.y, data.width || 0, data.height || 0, data.color || '#000000', data.strokeWidth || 2, data.tool || 'rectangle');
      } else if (data.type === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (data.type === 'cursor' && data.userId && data.x !== undefined && data.y !== undefined) {
        setRemoteCursors(prev => ({
          ...prev,
          [data.userId!]: { x: data.x!, y: data.y!, username: data.username || 'User' }
        }));
      }
    };

    // Set up socket listener
    const socket = socketClient.getSocket();
    if (socket) {
      socket.on('drawing-update', handleDrawingUpdate);
    }

    return () => {
      // Cleanup socket listeners
      if (socket) {
        socket.off('drawing-update', handleDrawingUpdate);
      }
    };
  }, [roomId]);

  const drawOnCanvas = (x: number, y: number, prevX?: number, prevY?: number, drawColor = color, drawStrokeWidth = strokeWidth, drawTool = tool) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawTool === 'eraser' ? '#ffffff' : drawColor;
    ctx.lineWidth = drawTool === 'eraser' ? drawStrokeWidth * 3 : drawStrokeWidth;
    
    if (prevX !== undefined && prevY !== undefined) {
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const drawShape = (x: number, y: number, width: number, height: number, drawColor = color, drawStrokeWidth = strokeWidth, shapeType = tool) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawStrokeWidth;
    ctx.beginPath();

    if (shapeType === 'rectangle') {
      ctx.rect(x, y, width, height);
    } else if (shapeType === 'circle') {
      const radius = Math.sqrt(width * width + height * height) / 2;
      ctx.arc(x + width / 2, y + height / 2, radius, 0, 2 * Math.PI);
    }
    
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setLastPoint({ x, y });
    setStartPoint({ x, y });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Send cursor position to other users
    socketClient.sendDrawingUpdate({
      type: 'cursor',
      x,
      y
    });

    if (!isDrawing) return;

    if (tool === 'pen' || tool === 'eraser') {
      if (!lastPoint) return;
      // Draw locally
      drawOnCanvas(x, y, lastPoint.x, lastPoint.y);
      
      // Send to other users immediately
      socketClient.sendDrawingUpdate({
        type: 'draw' as const,
        x,
        y,
        prevX: lastPoint.x,
        prevY: lastPoint.y,
        color,
        strokeWidth,
        tool
      });
      
      setLastPoint({ x, y });
      
      // Auto-save after drawing
      saveBoardState();
    } else if ((tool === 'rectangle' || tool === 'circle') && startPoint && overlayCanvas) {
      // Clear overlay and draw preview shape
      const overlayCtx = overlayCanvas.getContext('2d');
      if (overlayCtx) {
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        const width = x - startPoint.x;
        const height = y - startPoint.y;
        
        overlayCtx.strokeStyle = color;
        overlayCtx.lineWidth = strokeWidth;
        overlayCtx.beginPath();
        
        if (tool === 'rectangle') {
          overlayCtx.rect(startPoint.x, startPoint.y, width, height);
        } else if (tool === 'circle') {
          const radius = Math.sqrt(width * width + height * height) / 2;
          overlayCtx.arc(startPoint.x + width / 2, startPoint.y + height / 2, radius, 0, 2 * Math.PI);
        }
        
        overlayCtx.stroke();
      }
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      setIsDrawing(false);
      setLastPoint(null);
      setStartPoint(null);
      return;
    }

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if ((tool === 'rectangle' || tool === 'circle') && startPoint) {
      const width = x - startPoint.x;
      const height = y - startPoint.y;
      
      // Clear overlay
      if (overlayCanvas) {
        const overlayCtx = overlayCanvas.getContext('2d');
        if (overlayCtx) {
          overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
      }
      
      // Draw final shape on main canvas
      drawShape(startPoint.x, startPoint.y, width, height);
      
      // Send to other users
      const shapeData = {
        type: 'shape' as const,
        x: startPoint.x,
        y: startPoint.y,
        width,
        height,
        color,
        strokeWidth,
        tool
      };
      socketClient.sendDrawingUpdate(shapeData);
      
      // Save board state after shape
      saveBoardState();
    }

    setIsDrawing(false);
    setLastPoint(null);
    setStartPoint(null);
  };

  const loadBoardState = async () => {
    try {
      // Check if we have cached board data
      const cachedData = sessionStorage.getItem(`board-${roomId}`);
      if (cachedData) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = cachedData;
        return;
      }

      const response = await apiClient.getBoard(roomId);
      if (response.success && response.data.imageData) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          // Cache the board data
          sessionStorage.setItem(`board-${roomId}`, response.data.imageData);
        };
        img.src = response.data.imageData;
      }
    } catch (error) {
      console.log('No existing board state or error loading:', error);
    }
  };

  const saveBoardState = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const imageData = canvas.toDataURL();
      // Update cache immediately
      sessionStorage.setItem(`board-${roomId}`, imageData);
      
      // Debounce server save to reduce API calls
      if (window.saveBoardTimeout) {
        clearTimeout(window.saveBoardTimeout);
      }
      
      window.saveBoardTimeout = setTimeout(async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/boards/${roomId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            credentials: 'include',
            body: JSON.stringify({ imageData })
          });
          
          if (!response.ok) {
            console.error('Failed to save board:', response.statusText);
          } else {
            console.log('Board saved successfully');
          }
        } catch (error) {
          console.error('Error saving board:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Error saving board state:', error);
    }
  };

  const exportAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const link = document.createElement('a');
      link.download = `whiteboard-${roomId}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };

  const exportAsPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const { jsPDF } = await import('jspdf');
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Convert pixels to mm (jsPDF default unit)
      const pdfWidth = imgWidth * 0.264583;
      const pdfHeight = imgHeight * 0.264583;
      
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`whiteboard-${roomId}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save cleared state
    saveBoardState();
    
    // Send clear command to other users
    socketClient.sendDrawingUpdate({
      type: 'clear'
    });
  };

  const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];

  return (
    <div className="flex-1 flex">
      {/* Left Sidebar - Miro Style */}
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2">
        {/* Tools */}
        <button
          onClick={() => setTool('pen')}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'pen' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Pen"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'eraser' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Eraser"
        >
          <Eraser className="w-5 h-5" />
        </button>
        <button
          onClick={() => setTool('rectangle')}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'rectangle' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Rectangle"
        >
          <Square className="w-5 h-5" />
        </button>
        <button
          onClick={() => setTool('circle')}
          className={`p-2 rounded-lg transition-colors ${
            tool === 'circle' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
          }`}
          title="Circle"
        >
          <Circle className="w-5 h-5" />
        </button>
        
        {/* Divider */}
        <div className="w-8 h-px bg-gray-300 my-2"></div>
        
        {/* Color Palette */}
        <div className="w-6 h-6 rounded border-2 border-gray-300 cursor-pointer" 
             style={{ backgroundColor: color }}
             title="Current Color"
        ></div>
        
        {/* Divider */}
        <div className="w-8 h-px bg-gray-300 my-2"></div>
        
        {/* Clear */}
        <button
          onClick={clearCanvas}
          className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
          title="Clear Canvas"
        >
          <Eraser className="w-5 h-5" />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
          {/* Colors */}
          <div className="flex items-center gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded border-2 transition-all ${
                  color === c ? 'border-gray-800 scale-110' : 'border-gray-300'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 w-6 h-6 opacity-0 cursor-pointer"
                title="Choose custom color"
              />
              <div className="w-6 h-6 flex items-center justify-center cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="url(#colorGradient)" />
                  <path d="M8 16L16 8M16 8H12M16 8V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="colorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff0000" />
                      <stop offset="16.66%" stopColor="#ff8800" />
                      <stop offset="33.33%" stopColor="#ffff00" />
                      <stop offset="50%" stopColor="#00ff00" />
                      <stop offset="66.66%" stopColor="#0088ff" />
                      <stop offset="83.33%" stopColor="#8800ff" />
                      <stop offset="100%" stopColor="#ff0088" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Stroke Width */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{strokeWidth}px</span>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-4">
            <canvas
              ref={canvasRef}
              className="w-full h-full bg-white shadow-sm cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={(e) => {
                const overlayCanvas = overlayCanvasRef.current;
                if (overlayCanvas) {
                  const overlayCtx = overlayCanvas.getContext('2d');
                  if (overlayCtx) {
                    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                  }
                }
                setIsDrawing(false);
                setLastPoint(null);
                setStartPoint(null);
              }}
            />
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            
            {/* Remote Cursors */}
            {Object.entries(remoteCursors).map(([userId, cursor]) => (
              <div
                key={userId}
                className="absolute pointer-events-none z-10"
                style={{
                  left: cursor.x - 12,
                  top: cursor.y - 12,
                  transform: 'translate(0, 0)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 3L19 12L12 13L8 19L5 3Z" fill="#3B82F6" stroke="white" strokeWidth="1"/>
                </svg>
                <div className="absolute top-6 left-6 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {cursor.username}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};