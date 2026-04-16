import React, { useEffect, useRef } from 'react';

export default function AmbientBackground({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    // Handle resize and particle generation

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5; // very slow drift
        this.vy = (Math.random() - 0.5) * 0.5;
        this.baseRadius = Math.random() * 1.5 + 1; // 1 to 2.5px
      }

      update() {
        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Mouse interaction (repulse slightly)
        if (mouse.x != null && mouse.y != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          
          // prevent NaN division if exceptionally close
          if (distance > 0.1 && distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= forceDirectionX * force * 2.5;
            this.y -= forceDirectionY * force * 2.5;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.25)';
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      // Adjust density based on screen size (~100 particles for standard HD)
      const numberOfParticles = (canvas.width * canvas.height) / 12000;
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    const connect = () => {
      const connectDistance = 120;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let distance = 
            ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x)) + 
            ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
            
          if (distance < connectDistance * connectDistance) {
            const opacity = 1 - Math.sqrt(distance) / connectDistance;
            ctx.strokeStyle = isDark 
              ? `rgba(255, 255, 255, ${opacity * 0.15})` 
              : `rgba(0, 0, 0, ${opacity * 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
        
        // Also connect to mouse
        if (mouse.x != null && mouse.y != null) {
          let mouseDist = 
            ((particles[a].x - mouse.x) * (particles[a].x - mouse.x)) + 
            ((particles[a].y - mouse.y) * (particles[a].y - mouse.y));
            
          if (mouseDist < mouse.radius * mouse.radius) {
             const opacity = 1 - Math.sqrt(mouseDist) / mouse.radius;
             ctx.strokeStyle = isDark 
              ? `rgba(255, 255, 255, ${opacity * 0.3})` 
              : `rgba(0, 122, 255, ${opacity * 0.3})`; // subtle blue tint on hover line
             ctx.beginPath();
             ctx.moveTo(particles[a].x, particles[a].y);
             ctx.lineTo(mouse.x, mouse.y);
             ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    // Handle mouse dynamically
    let mouse = { x: null, y: null, radius: 140 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Initialize
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <>
      {/* Fallback solid background color */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: isDark ? '#08080a' : '#f4f5f7',
        }}
      />
      {/* Canvas for interactive dots */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', inset: 0,
          zIndex: 1, pointerEvents: 'none',
        }}
      />
    </>
  );
}
