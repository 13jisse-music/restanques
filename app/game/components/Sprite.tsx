"use client";

import React from "react";

interface SpriteProps {
  src: string;
  bgPos: string;
  bgSize: string;
  width: number;
  height: number;
  fallback?: string; // emoji fallback
  className?: string;
  style?: React.CSSProperties;
}

// Render a sprite from a spritesheet using CSS background
export function Sprite({ src, bgPos, bgSize, width, height, fallback, className, style }: SpriteProps) {
  return (
    <div
      className={className}
      style={{
        width, height,
        backgroundImage: `url(${src})`,
        backgroundPosition: bgPos,
        backgroundSize: bgSize,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        overflow: "hidden",
        ...style,
      }}
    />
  );
}

// Sprite with emoji fallback if image fails to load
export function SpriteWithFallback({ src, bgPos, bgSize, width, height, fallback, className, style }: SpriteProps) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onerror = () => setFailed(true);
  }, [src]);

  if (failed && fallback) {
    return (
      <span style={{ fontSize: Math.min(width, height) * 0.7, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", width, height, ...style }}>
        {fallback}
      </span>
    );
  }

  return <Sprite src={src} bgPos={bgPos} bgSize={bgSize} width={width} height={height} className={className} style={style} />;
}
