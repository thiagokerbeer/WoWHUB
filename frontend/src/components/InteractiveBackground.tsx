import { useEffect, useRef } from "react";

export function InteractiveBackground() {
  const glowRef = useRef<HTMLDivElement | null>(null);
  const auraRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const glowElement = glowRef.current;
    const auraElement = auraRef.current;

    if (!glowElement || !auraElement) {
      return;
    }

    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;
    let animationFrame = 0;

    const move = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      glowElement.style.transform = `translate(${currentX - 180}px, ${currentY - 180}px)`;
      auraElement.style.transform = `translate(${currentX - 260}px, ${currentY - 260}px)`;

      animationFrame = window.requestAnimationFrame(move);
    };

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const handleTouchMove = (event: globalThis.TouchEvent) => {
      const touch = event.touches[0];

      if (!touch) {
        return;
      }

      targetX = touch.clientX;
      targetY = touch.clientY;
    };

    const handleResize = () => {
      targetX = window.innerWidth / 2;
      targetY = window.innerHeight / 2;
    };

    animationFrame = window.requestAnimationFrame(move);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="interactive-background" aria-hidden="true">
      <div className="interactive-glow interactive-glow-primary" ref={glowRef} />
      <div className="interactive-glow interactive-glow-secondary" ref={auraRef} />
      <div className="interactive-noise" />
    </div>
  );
}