"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on desktop non-touch devices
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input") ||
        target.closest(".mota-btn-hover") ||
        target.closest(".square-feature-card") ||
        target.closest(".trust-floating-capsule") ||
        target.closest(".mota-process-card")
      ) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* OUTER AMBIENT GLOW AURA */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full border border-[#6E40FF]/40 bg-[#6E40FF]/15 backdrop-blur-[1px] shadow-[0_0_24px_rgba(110,64,255,0.4)]"
        animate={{
          x: mousePos.x - (isHovered ? 24 : 16),
          y: mousePos.y - (isHovered ? 24 : 16),
          width: isHovered ? 48 : 32,
          height: isHovered ? 48 : 32,
          scale: isHovered ? 1.25 : 1,
          backgroundColor: isHovered ? "rgba(110, 64, 255, 0.25)" : "rgba(110, 64, 255, 0.12)",
          borderColor: isHovered ? "rgba(110, 64, 255, 0.8)" : "rgba(110, 64, 255, 0.4)",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.4 }}
      />

      {/* INNER SOLID CORE DOT */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full bg-[#1D1D1B] border border-white shadow-xs"
        animate={{
          x: mousePos.x - 4,
          y: mousePos.y - 4,
          width: isHovered ? 10 : 8,
          height: isHovered ? 10 : 8,
          scale: isHovered ? 1.3 : 1,
          backgroundColor: isHovered ? "#6E40FF" : "#1D1D1B",
        }}
        transition={{ type: "spring", stiffness: 850, damping: 35 }}
      />
    </>
  );
}
