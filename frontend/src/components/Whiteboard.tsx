import { useRef, useEffect, useState } from 'react';
import { Pencil, Eraser, Square, Circle, Type, Palette, Download, FileImage, FileText, MessageCircle } from 'lucide-react';
import { socketClient } from '../lib/socket';
import { apiClient } from '../lib/api';

interface WhiteboardProps {
  roomId: string;
}

interface DrawingData {
  type: 'draw' | 'clear' | 'shape';
  x?: number;
  y?: number;
  prevX?: number;
  prevY?: number;
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  tool?: string;
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
      console.log('Received drawing update:', data);
      if (data.type === 'draw' && data.x !== undefined && data.y !== undefined) {
        drawOnCanvas(data.x, data.y, data.prevX, data.prevY, data.color || '#000000', data.strokeWidth || 2, data.tool || 'pen');
      } else if (data.type === 'shape' && data.x !== undefined && data.y !== undefined) {
        drawShape(data.x, data.y, data.width || 0, data.height || 0, data.color || '#000000', data.strokeWidth || 2, data.tool || 'rectangle');
      } else if (data.type === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen' || tool === 'eraser') {
      if (!lastPoint) return;
      // Draw locally
      drawOnCanvas(x, y, lastPoint.x, lastPoint.y);
      
      // Send to other users
      const drawingData = {
        type: 'draw' as const,
        x,
        y,
        prevX: lastPoint.x,
        prevY: lastPoint.y,
        color,
        strokeWidth,
        tool
      };
      socketClient.sendDrawingUpdate(drawingData);
      
      // Save board state periodically (every 10th stroke)
      if (Math.random() < 0.1) {
        setTimeout(saveBoardState, 100);
      }
      
      setLastPoint({ x, y });
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
      setTimeout(saveBoardState, 100);
    }

    setIsDrawing(false);
    setLastPoint(null);
    setStartPoint(null);
  };

  const loadBoardState = async () => {
    try {
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
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/boards/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ imageData })
      });
    } catch (error) {
      console.error('Error saving board state:', error);
    }
  };

  const exportAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whiteboard-${roomId}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const exportAsPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dynamic import for jsPDF to reduce bundle size
    const { jsPDF } = await import('jspdf');
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`whiteboard-${roomId}-${new Date().toISOString().split('T')[0]}.pdf`);
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
          </div>
        </div>
      </div>
    </div>
  );
};