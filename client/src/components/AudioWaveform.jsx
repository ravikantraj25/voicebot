import React, { useEffect, useRef } from 'react';

export default function AudioWaveform({ isSpeaking, color = '#6366f1', label }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bars = 15;
    const barWidth = 4;
    const gap = 3;
    const width = bars * (barWidth + gap);
    const height = 40;
    
    canvas.width = width;
    canvas.height = height;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < bars; i++) {
        // If speaking, randomize height between 20% and 100%. If silent, static tiny height.
        const barHeight = isSpeaking 
          ? Math.random() * (height * 0.8) + (height * 0.2) 
          : 3;
        
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2; // Center vertically
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      // Smooth ~15fps animation so it's not too jittery
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, 60);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isSpeaking, color]);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <canvas ref={canvasRef} className="h-10 opacity-80" />
    </div>
  );
}
