"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";

interface DesmosCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Desmos: any;
  }
}

export default function DesmosCalculator({ isOpen, onClose }: DesmosCalculatorProps) {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const [calculator, setCalculator] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isExpanded) return;
    if ((e.target as HTMLElement).closest("button")) return;

    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isExpanded) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (!isOpen) return;

    const initCalculator = () => {
      if (window.Desmos && calculatorRef.current && !calculator) {
        const calc = window.Desmos.GraphingCalculator(calculatorRef.current, {
          keypad: true,
          expressions: true,
          settingsMenu: true,
          zoomButtons: true,
          expressionsTopbar: true,
          lockViewport: false,
        });
        setCalculator(calc);
      }
    };

    const existingScript = document.getElementById("desmos-script");
    if (existingScript) {
      initCalculator();
    } else {
      const script = document.createElement("script");
      script.src = "https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
      script.id = "desmos-script";
      script.async = true;
      script.onload = () => {
        initCalculator();
      };
      document.body.appendChild(script);
    }

    return () => {
      // Calculator state preserved across hides
    };
  }, [isOpen, calculator]);

  if (!isOpen) return null;

  return (
    <div
      style={
        isExpanded
          ? { top: 0, left: 0, width: "100vw", height: "100vh" }
          : { transform: `translate3d(${position.x}px, ${position.y}px, 0)` }
      }
      className={`fixed z-50 flex flex-col bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--ui-radius-lg)] shadow-[var(--ui-shadow-lg)] overflow-hidden ${
        isExpanded
          ? "!rounded-none z-[100]"
          : "top-20 right-8 w-[92vw] sm:w-[540px] h-[520px]"
      }`}
    >
      {/* Header bar */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="h-10 bg-[var(--bg-canvas)] border-b border-[var(--border-subtle)] px-3 flex items-center justify-between cursor-move select-none"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
          Desmos Graphing Calculator · Digital SAT
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] cursor-pointer"
            aria-label={isExpanded ? "Restore" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--state-danger)] hover:bg-[#fdede8] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calculator Mount Area */}
      <div ref={calculatorRef} className="flex-1 w-full h-full bg-white" />
    </div>
  );
}
