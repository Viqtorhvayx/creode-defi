/* Credit this code to Viqtorhvayx on GitHub */
"use client";

import React, { useEffect, useRef } from 'react';

interface HeartbeatMonitorProps {
  healthFactor: number; // 0 to 100
  xp: number; // 0 to 100
  isActive: boolean;
  color: string;
}

export const HeartbeatMonitor: React.FC<HeartbeatMonitorProps> = ({ healthFactor, xp, isActive, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerY = height / 2;

    // State array for points
    const points: number[] = new Array(Math.floor(width)).fill(centerY);
    
    let frame = 0;
    let animationFrameId: number;

    const render = () => {
      frame++;
      
      // Calculate dynamic variables based on props
      const isHealthy = healthFactor >= 50;
      const bpm = isActive ? (isHealthy ? 60 + (100 - healthFactor) * 0.4 : 120 + (50 - healthFactor) * 1.5) : 30; 
      const framesPerBeat = Math.max(20, Math.floor((60 * 60) / bpm));
      
      const phi = (frame % framesPerBeat) / framesPerBeat;
      
      let newY = centerY;

      if (isActive) {
        // Base heartbeat signal
        let signal = 0;
        
        // P wave
        if (phi > 0.85 && phi < 0.95) {
          signal -= Math.sin((phi - 0.85) / 0.1 * Math.PI) * 6;
        }
        // Q dip
        if (phi > 0.06 && phi < 0.08) {
          signal += Math.sin((phi - 0.06) / 0.02 * Math.PI) * 4;
        }
        // R spike (amplitude scales slightly with health)
        if (phi > 0.08 && phi < 0.12) {
          const spikeAmp = isHealthy ? 35 : 45;
          signal -= Math.sin((phi - 0.08) / 0.04 * Math.PI) * spikeAmp;
        }
        // S dip
        if (phi > 0.12 && phi < 0.15) {
          signal += Math.sin((phi - 0.12) / 0.03 * Math.PI) * 12;
        }
        // T wave
        if (phi > 0.25 && phi < 0.38) {
          signal -= Math.sin((phi - 0.25) / 0.13 * Math.PI) * 8;
        }

        // Add noise for low health (erratic heartbeat)
        if (!isHealthy) {
          const noiseLevel = (50 - healthFactor) * 0.1;
          signal += (Math.random() - 0.5) * noiseLevel;
        }

        newY += signal;
      } else {
        // Flatline / very weak pulse if inactive
        if (phi > 0.1 && phi < 0.15) {
          newY -= Math.sin((phi - 0.1) / 0.05 * Math.PI) * 4;
        }
      }

      // Shift points left and add new point
      points.shift();
      points.push(newY);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Set styling using the passed color prop
      const glowBlur = isActive ? 5 + (xp / 100) * 15 : 2; // XP increases glow
      const lineWidth = isActive ? 2 + (xp / 100) * 1.5 : 1.5;

      ctx.beginPath();
      ctx.moveTo(0, points[0]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(i, points[i]);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.shadowBlur = glowBlur;
      ctx.shadowColor = color;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [healthFactor, xp, isActive]);

  return (
    <div className="w-full h-full relative group">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
      {/* Overlay gradient for fade out effect on the left edge */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
    </div>
  );
};
