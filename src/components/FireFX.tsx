import { useEffect, useRef } from 'react';

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

interface FireFXProps {
  className?: string;
}

export default function FireFX({ className }: FireFXProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const el = canvas;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const c2d: CanvasRenderingContext2D = ctx;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    let t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const embers: Ember[] = [];

    function resize() {
      const rect = el.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const palette = [18, 32, 42, 178];

    function spawn(amount: number) {
      for (let i = 0; i < amount; i++) {
        embers.push({
          x: width * (0.05 + Math.random() * 0.9),
          y: height + Math.random() * 10,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -(0.35 + Math.random() * 1.1),
          life: 0,
          maxLife: 120 + Math.random() * 160,
          size: 0.8 + Math.random() * 2.2,
          hue: palette[Math.floor(Math.random() * palette.length)],
        });
      }
    }

    spawn(60);

    function frame(now: number) {
      if (!running) return;
      t = now / 1000;
      c2d.clearRect(0, 0, width, height);

      if (embers.length < 90 && Math.random() < 0.4) spawn(2);

      const grad = c2d.createLinearGradient(0, height, 0, 0);
      grad.addColorStop(0, 'rgba(255,110,20,0.35)');
      grad.addColorStop(0.5, 'rgba(255,64,20,0.12)');
      grad.addColorStop(1, 'rgba(255,40,10,0)');
      c2d.fillStyle = grad;
      c2d.beginPath();
      c2d.ellipse(width / 2, height, width * 0.7, height * 0.55, 0, 0, Math.PI * 2);
      c2d.fill();

      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.life++;
        if (e.life >= e.maxLife || e.y < -10) {
          embers.splice(i, 1);
          continue;
        }
        e.x += e.vx + Math.sin(t * 2 + e.life * 0.05) * 0.2;
        e.y += e.vy;
        const fade = 1 - e.life / e.maxLife;
        const flicker = 0.65 + 0.35 * Math.sin(t * 9 + e.life * 0.4);
        c2d.globalCompositeOperation = 'lighter';
        c2d.beginPath();
        c2d.fillStyle = `hsla(${e.hue},100%,${52 + (1 - fade) * 12}%,${fade * 0.8 * flicker})`;
        c2d.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        c2d.fill();
      }
      c2d.globalCompositeOperation = 'source-over';

      raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver((entries) => {
      const visible = entries[entries.length - 1]?.isIntersecting ?? true;
      if (visible && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      } else if (!visible) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(el);

    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}