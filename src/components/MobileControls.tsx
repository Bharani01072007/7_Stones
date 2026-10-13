import React, { useState, useRef, useEffect } from 'react';
import { Target, Hand, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface MobileControlsProps {
  onMove: (dx: number, dz: number) => void;
  onThrow: () => void;
  onInteract: () => void;
  isThrowPhase: boolean;
  canInteract: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onThrow,
  onInteract,
  isThrowPhase,
  canInteract
}) => {
  const [touchActive, setTouchActive] = useState(false);
  const stickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchActive(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!stickBaseRef.current) return;
    const rect = stickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const touch = e.touches[0];

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxRadius = rect.width / 2;
    const distance = Math.hypot(dx, dy);

    const clampedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;
    setKnobPos({ x: knobX, y: knobY });

    // Normalized dx, dz (y on screen is z in 3D: down on screen is +Z, up is -Z)
    const normX = knobX / maxRadius;
    const normZ = -knobY / maxRadius; // inverted so pushing up moves toward stones (+Z)
    onMove(normX, -normZ);
  };

  const handleTouchEnd = () => {
    setTouchActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none p-4 pb-6 flex justify-between items-end z-30 select-none md:hidden">
      {/* Virtual Joystick */}
      <div
        ref={stickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-28 h-28 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-slate-700/80 pointer-events-auto relative flex items-center justify-center touch-none shadow-xl"
      >
        <div
          className="w-12 h-12 rounded-full bg-amber-500/80 border border-amber-300 shadow-md transition-transform duration-75"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        {/* Interact / Stack button */}
        <button
          onTouchStart={() => onInteract()}
          className="w-16 h-16 rounded-full bg-emerald-600/90 active:bg-emerald-500 border-2 border-emerald-300 text-white flex flex-col items-center justify-center font-bold text-[10px] shadow-lg shadow-emerald-600/30"
        >
          <Hand className="w-6 h-6 mb-0.5" />
          <span>STACK</span>
        </button>

        {/* Throw / Aim button */}
        <button
          onTouchStart={() => onThrow()}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 active:from-amber-400 active:to-orange-400 border-2 border-amber-200 text-slate-950 flex flex-col items-center justify-center font-black text-xs shadow-xl shadow-orange-500/40"
        >
          <Target className="w-7 h-7 mb-0.5" />
          <span>{isThrowPhase ? 'THROW' : 'ACTION'}</span>
        </button>
      </div>
    </div>
  );
};
