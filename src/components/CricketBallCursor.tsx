import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';

export interface CricketBallCursorProps {
  trailCount?: number;
  sizes?: number[];
  opacities?: number[];
  fastDuration?: number;
  slowDuration?: number;
  fastEase?: string;
  slowEase?: string;
  zIndex?: number;
}

const CricketBallSvg = () => (
  <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
    <defs>
      <radialGradient id="cbLeather" cx="35%" cy="28%" r="85%">
        <stop offset="0%" stopColor="#ff7a4f" />
        <stop offset="30%" stopColor="#e23416" />
        <stop offset="72%" stopColor="#b01c06" />
        <stop offset="100%" stopColor="#5f0d00" />
      </radialGradient>
      <filter id="cbInnerShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
        <feOffset dx="1" dy="2" result="off" />
        <feFlood floodColor="#000" floodOpacity="0.55" />
        <feComposite in2="off" operator="in" />
        <feComposite in2="SourceGraphic" operator="over" />
      </filter>
    </defs>
    <circle cx="50" cy="50" r="47" fill="url(#cbLeather)" filter="url(#cbInnerShadow)" />
    <path d="M 14 30 Q 50 52 86 70" fill="none" stroke="#f2e3c4" strokeWidth="3.4" strokeLinecap="round" />
    <path d="M 86 30 Q 50 52 14 70" fill="none" stroke="#f2e3c4" strokeWidth="3.4" strokeLinecap="round" />
    <path d="M 14 30 Q 50 52 86 70" fill="none" stroke="#7a3a12" strokeWidth="1" strokeLinecap="round" strokeDasharray="1.6 4" />
    <path d="M 86 30 Q 50 52 14 70" fill="none" stroke="#7a3a12" strokeWidth="1" strokeLinecap="round" strokeDasharray="1.6 4" />
    <path d="M 24 28 Q 20 40 25 44 M 76 70 Q 80 58 75 54 M 48 48 Q 52 52 48 56" fill="none" stroke="#f2e3c4" strokeWidth="1.4" strokeLinecap="round" />
    <ellipse cx="34" cy="26" rx="16" ry="9" fill="rgba(255,255,255,0.28)" transform="rotate(-28 34 26)" />
  </svg>
);

const CricketBallCursor = ({
  trailCount = 3,
  sizes = [42, 58, 78],
  opacities = [1, 0.85, 0.6],
  fastDuration = 0.1,
  slowDuration = 0.5,
  fastEase = 'power3.out',
  slowEase = 'power1.out',
  zIndex = 90,
}: CricketBallCursorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballsRef = useRef<(HTMLDivElement | null)[]>([]);

  const updateOffset = useCallback(() => {
    if (!containerRef.current) return { left: 0, top: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }, []);

  const handleMove = useCallback(
    (e: MouseEvent | React.TouchEvent) => {
      const { left, top } = updateOffset();
      const x = 'clientX' in e ? e.clientX : e.touches[0].clientX;
      const y = 'clientY' in e ? e.clientY : e.touches[0].clientY;

      ballsRef.current.forEach((el, i) => {
        if (!el) return;
        const isLead = i === 0;
        gsap.to(el, {
          x: x - left,
          y: y - top,
          duration: isLead ? fastDuration : slowDuration,
          ease: isLead ? fastEase : slowEase,
        });
      });
    },
    [updateOffset, fastDuration, slowDuration, fastEase, slowEase],
  );

  useEffect(() => {
    const onResize = () => updateOffset();
    const onMove = (e: MouseEvent) => handleMove(e);
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [updateOffset, handleMove]);

  return (
    <div
      ref={containerRef}
      className="cricket-ball-container"
      style={{ zIndex }}
      aria-hidden="true"
    >
      <div className="cricket-ball-main">
        {Array.from({ length: trailCount }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              ballsRef.current[i] = el;
            }}
            className="cricket-ball"
            style={{
              width: sizes[i],
              height: sizes[i],
              opacity: opacities[i],
            }}
          >
            <CricketBallSvg />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CricketBallCursor;