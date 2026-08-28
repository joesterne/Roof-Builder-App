import React, { useEffect, useRef } from 'react';

interface WeatherOverlayProps {
  type: 'rain' | 'snow';
  intensity: number; // 1-100
}

export default function WeatherOverlay({ type, intensity }: WeatherOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    let particles: any[] = [];
    let animationFrameId: number;

    const createParticles = () => {
      particles = [];
      const numParticles = type === 'rain' ? intensity * 15 : intensity * 5;
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speedY: type === 'rain' ? 10 + Math.random() * 10 : 1 + Math.random() * 3,
          speedX: type === 'rain' ? -1 + Math.random() * 2 : -2 + Math.random() * 4,
          size: type === 'rain' ? 1 + Math.random() * 1.5 : 2 + Math.random() * 3,
          opacity: Math.random() * 0.5 + 0.3
        });
      }
    };

    createParticles();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      
      // Optional background effect
      if (type === 'rain') {
        ctx.fillStyle = `rgba(15, 23, 42, ${intensity * 0.003})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = `rgba(226, 232, 240, ${intensity * 0.0015})`;
        ctx.fillRect(0, 0, w, h);
      }

      particles.forEach(p => {
        if (type === 'rain') {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(148, 163, 184, ${p.opacity})`;
          ctx.lineWidth = p.size;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.speedY * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y > h) {
          p.y = -10;
          p.x = Math.random() * w;
        }
        if (p.x > w) p.x = -10;
        if (p.x < -10) p.x = w;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      createParticles();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type, intensity]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0" 
      style={{ mixBlendMode: type === 'rain' ? 'normal' : 'screen' }}
    />
  );
}
