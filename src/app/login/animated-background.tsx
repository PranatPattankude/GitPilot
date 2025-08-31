"use client"

import React, { useRef, useEffect } from 'react';

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[];

    const options = {
      particleColor: 'rgba(255, 255, 255, 0.5)',
      lineColor: 'rgba(255, 255, 255, 0.1)',
      particleAmount: 50,
      defaultRadius: 2,
      variantRadius: 2,
      defaultSpeed: 0.5,
      variantSpeed: 1,
      linkRadius: 200,
    };

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const handleResize = () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', handleResize);


    class Particle {
      x: number;
      y: number;
      radius: number;
      speed: number;
      directionAngle: number;
      vector: { x: number; y: number; };

      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.radius = options.defaultRadius + Math.random() * options.variantRadius;
        this.speed = options.defaultSpeed + Math.random() * options.variantSpeed;
        this.directionAngle = Math.floor(Math.random() * 360);
        this.vector = {
          x: Math.cos(this.directionAngle) * this.speed,
          y: Math.sin(this.directionAngle) * this.speed
        };
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = options.particleColor;
        ctx.fill();
      }

      update() {
        this.border();
        this.x += this.vector.x;
        this.y += this.vector.y;
      }

      border() {
        if (this.x >= w || this.x <= 0) {
          this.vector.x *= -1;
        }
        if (this.y >= h || this.y <= 0) {
          this.vector.y *= -1;
        }
        if (this.x > w) this.x = w;
        if (this.y > h) this.y = h;
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
      }
    }

    function linkParticles() {
        if (!ctx) return;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(particles[i].x - particles[j].x, 2) +
                    Math.pow(particles[i].y - particles[j].y, 2)
                );
                
                if (distance < options.linkRadius) {
                    const opacity = 1 - (distance / options.linkRadius);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        }
    }

    function setup() {
      particles = [];
      for (let i = 0; i < options.particleAmount; i++) {
        particles.push(new Particle());
      }
      animate();
    }

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      linkParticles();
      animationFrameId = requestAnimationFrame(animate);
    };

    setup();
    
    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
    };

  }, []);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover" />;
};

export default AnimatedBackground;
