export type LiquidGlassProps = {
  width?: number;               // default 320
  height?: number;              // default 180
  cornerRadius?: number;        // px, used for SDF superellipse
  refractiveIndex?: number;     // e.g., 1.3 – 1.6
  dispersion?: number;          // 0..1 rainbow intensity
  fresnelBias?: number;         // 0..1
  fresnelScale?: number;        // 0..3
  fresnelPower?: number;        // 1..8
  glareAngle?: number;          // radians
  glareIntensity?: number;      // 0..2
  blurRadius?: number;          // pixels for Gaussian (do separable blur)
  tint?: { r: number; g: number; b: number; a: number } | null;
  animate?: boolean;            // springs for blob morph
  asCard?: boolean;             // render a card-like panel
  backgroundSource?: 'live' | 'image' | 'video';
  backgroundUrl?: string;       // for image/video mode
  className?: string;
  style?: React.CSSProperties;
  onReady?: () => void;
};
