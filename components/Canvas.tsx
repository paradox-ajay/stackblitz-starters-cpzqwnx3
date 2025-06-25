'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawData } from '@/types/game';

interface CanvasProps {
  isDrawing: boolean;
  onDraw: (drawData: DrawData) => void;
  onClear: () => void;
  drawingData: DrawData[];
}

const Canvas: React.FC<CanvasProps> = ({ isDrawing, onDraw, onClear, drawingData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState(3);

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A'
  ];

  const sizes = [1, 3, 5, 8, 12];

  const getCanvasCoordinates = useCallback((e: MouseEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }, []);

  const drawLine = useCallback((ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, color: string, size: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    setIsMouseDown(true);
    const coords = getCanvasCoordinates(e);
    
    const drawData: DrawData = {
      type: 'start',
      x: coords.x,
      y: coords.y,
      color: currentColor,
      size: currentSize
    };
    
    onDraw(drawData);
  }, [isDrawing, getCanvasCoordinates, currentColor, currentSize, onDraw]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !isMouseDown) return;
    
    const coords = getCanvasCoordinates(e);
    
    const drawData: DrawData = {
      type: 'draw',
      x: coords.x,
      y: coords.y,
      color: currentColor,
      size: currentSize
    };
    
    onDraw(drawData);
  }, [isDrawing, isMouseDown, getCanvasCoordinates, currentColor, currentSize, onDraw]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    setIsMouseDown(false);
  }, [isDrawing]);

  // Redraw canvas from drawing data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw from data
    let lastPoint: { x: number; y: number } | null = null;
    
    drawingData.forEach((data) => {
      if (data.type === 'start') {
        lastPoint = { x: data.x, y: data.y };
      } else if (data.type === 'draw' && lastPoint) {
        drawLine(ctx, lastPoint, { x: data.x, y: data.y }, data.color, data.size);
        lastPoint = { x: data.x, y: data.y };
      }
    });
  }, [drawingData, drawLine]);

  const handleClear = () => {
    if (!isDrawing) return;
    onClear();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Drawing Tools */}
      {isDrawing && (
        <div className="flex flex-col space-y-2 p-4 bg-white rounded-lg shadow-md">
          {/* Colors */}
          <div className="flex space-x-2">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full border-2 ${
                  currentColor === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>
          
          {/* Brush Sizes */}
          <div className="flex space-x-2 items-center">
            {sizes.map((size) => (
              <button
                key={size}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                  currentSize === size ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                }`}
                onClick={() => setCurrentSize(size)}
              >
                <div
                  className="rounded-full bg-black"
                  style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
                />
              </button>
            ))}
          </div>
          
          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Clear Canvas
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="border-4 border-gray-800 rounded-lg overflow-hidden shadow-lg">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className={`bg-white ${isDrawing ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default Canvas;