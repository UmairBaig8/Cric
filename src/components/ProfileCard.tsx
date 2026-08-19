import { useEffect, useMemo, useRef } from 'react';
import { Pencil } from 'lucide-react';

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

type ProfileCardProps = {
  avatarUrl?: string | null;
  name: string;
  title: string;
  handle: string;
  status: string;
  fallbackInitials: string;
  onEdit: () => void;
};

export default function ProfileCard({ avatarUrl, name, title, handle, status, fallbackInitials, onEdit }: ProfileCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const tiltEngine = useMemo(() => {
    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const setVarsFromXY = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;
      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;
      const properties: Record<string, string> = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 5))}deg`,
        '--rotate-y': `${round(centerY / 4)}deg`,
      };
      for (const [k, v] of Object.entries(properties)) wrap.style.setProperty(k, v);
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const k = 1 - Math.exp(-dt / 0.14);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      setVarsFromXY(currentX, currentY);
      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (stillFar) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    };

    return {
      setTarget(x: number, y: number) {
        targetX = x;
        targetY = y;
        if (!running) {
          running = true;
          rafId = requestAnimationFrame(step);
        }
      },
      toCenter() {
        const shell = shellRef.current;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
    };
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const onEnter = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      tiltEngine.setTarget(event.clientX - rect.left, event.clientY - rect.top);
    };
    const onMove = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      tiltEngine.setTarget(event.clientX - rect.left, event.clientY - rect.top);
    };
    const onLeave = () => tiltEngine.toCenter();

    shell.addEventListener('pointerenter', onEnter);
    shell.addEventListener('pointermove', onMove);
    shell.addEventListener('pointerleave', onLeave);
    return () => {
      shell.removeEventListener('pointerenter', onEnter);
      shell.removeEventListener('pointermove', onMove);
      shell.removeEventListener('pointerleave', onLeave);
    };
  }, [tiltEngine]);

  return (
    <div ref={wrapRef} className="pc-card-wrapper" style={{ '--inner-gradient': 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)' } as React.CSSProperties}>
      <div className="pc-behind" />
      <div ref={shellRef} className="pc-card-shell">
        <section className="pc-card">
          <div className="pc-inside">
            <div className="pc-shine" />
            <div className="pc-glare" />
            <div className="pc-content pc-avatar-content">
              {avatarUrl ? (
                <img className="avatar" src={avatarUrl} alt={`${name} avatar`} loading="lazy" />
              ) : (
                <div className="avatar avatar-fallback">{fallbackInitials}</div>
              )}
              <div className="pc-user-info">
                <div className="pc-user-details">
                  <div className="pc-mini-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={`${name} mini avatar`} loading="lazy" />
                    ) : (
                      <span className="mini-fallback">{fallbackInitials}</span>
                    )}
                  </div>
                  <div className="pc-user-text">
                    <div className="pc-handle">@{handle}</div>
                    <div className="pc-status">{status}</div>
                  </div>
                </div>
                <button className="pc-contact-btn" type="button" onClick={onEdit} aria-label={`Edit ${name}`}>
                  <Pencil className="size-3.5" /> EDIT
                </button>
              </div>
            </div>
            <div className="pc-content">
              <div className="pc-details">
                <h3>{name}</h3>
                <p>{title}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}