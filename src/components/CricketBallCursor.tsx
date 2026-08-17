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
            <span className="cb-seam cb-seam-h" />
            <span className="cb-seam cb-seam-v" />
            <span className="cb-shine" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CricketBallCursor;