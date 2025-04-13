'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './SimpleMap.module.css';

export default function SimpleMap({ onLocationSelect, initialLocation }) {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [marker, setMarker] = useState(initialLocation || { x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size to match container size
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Draw background grid
    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Grid
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      
      const gridSize = 50 * zoom;
      const offsetX = offset.x % gridSize;
      const offsetY = offset.y % gridSize;
      
      for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Draw marker
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(marker.x + offset.x, marker.y + offset.y, 8, 0, Math.PI * 2);
      ctx.fill();
    };

    drawGrid();

    // Handle window resize
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawGrid();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [marker, offset, zoom]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setOffset(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e) => {
    if (!isDragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - offset.x;
      const y = e.clientY - rect.top - offset.y;
      setMarker({ x, y });
      
      // Convert to latitude/longitude-like coordinates
      const lat = ((rect.height/2 - y) / (rect.height/2)) * 90;
      const lng = ((x - rect.width/2) / (rect.width/2)) * 180;
      
      if (onLocationSelect) {
        onLocationSelect({ lat, lng });
      }
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 2));
  };

  return (
    <div className={styles.mapContainer}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      <div className={styles.zoomControl}>
        Zoom: {Math.round(zoom * 100)}%
      </div>
      <div className={styles.instructions}>
        Click to place marker • Drag to pan • Scroll to zoom
      </div>
    </div>
  );
} 