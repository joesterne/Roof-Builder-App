import React, { useEffect, useRef } from 'react';

interface WeatherOverlayProps {
  type: 'rain' | 'snow' | 'cats' | 'party';
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

    // Easter egg emojis
    const catsAndDogs = ['🐱', '🐶', '🐈', '🐕', '🐩'];
    const confetti = ['🎉', '✨', '🎊', '🎈', '⭐', '🟩', '🟨', '🟦', '🟥'];

    const createParticles = () => {
      particles = [];
      const numParticles = type === 'rain' ? intensity * 15 : (type === 'snow' ? intensity * 5 : intensity * 1.5);
      
      for (let i = 0; i < numParticles; i++) {
        let speedY, speedX, size, char = '';
        
        if (type === 'rain') {
          speedY = 10 + Math.random() * 10;
          speedX = -1 + Math.random() * 2;
          size = 1 + Math.random() * 1.5;
        } else if (type === 'snow') {
          speedY = 1 + Math.random() * 3;
          speedX = -2 + Math.random() * 4;
          size = 2 + Math.random() * 3;
        } else if (type === 'cats') {
          speedY = 4 + Math.random() * 6;
          speedX = -1 + Math.random() * 2;
          size = 16 + Math.random() * 16;
          char = catsAndDogs[Math.floor(Math.random() * catsAndDogs.length)];
        } else {
          // party
          speedY = 2 + Math.random() * 5;
          speedX = -3 + Math.random() * 6;
          size = 12 + Math.random() * 12;
          char = confetti[Math.floor(Math.random() * confetti.length)];
        }

        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speedY,
          speedX,
          size,
          char,
          rotation: Math.random() * 360,
          rotationSpeed: -2 + Math.random() * 4,
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
      } else if (type === 'snow') {
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
        } else if (type === 'snow') {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Emojis (cats or party)
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.font = `${p.size}px Arial`;
          ctx.globalAlpha = p.opacity + 0.5;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.char, 0, 0);
          ctx.restore();
          
          p.rotation += p.rotationSpeed;
        }

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x > w + 20) p.x = -20;
        if (p.x < -20) p.x = w + 20;
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
      style={{ mixBlendMode: type === 'rain' ? 'normal' : (type === 'snow' ? 'screen' : 'normal') }}
    />
  );
}
