/**
 * SDF Superellipse and Smooth Minimum functions for Liquid Glass
 */

export function superellipseSDF(uv: [number, number], size: [number, number], cornerRadius: number, n: number = 4.0): number {
  // Normalize UV to -1..1 range relative to center
  const p: [number, number] = [
    Math.abs(uv[0] - 0.5) * 2.0,
    Math.abs(uv[1] - 0.5) * 2.0
  ];

  // Superellipse equation: |x/a|^n + |y/b|^n = 1
  // We use a simplified version for signed distance approximation
  const nx = Math.pow(p[0], n);
  const ny = Math.pow(p[1], n);
  
  return Math.pow(nx + ny, 1.0 / n) - (1.0 - cornerRadius / Math.max(size[0], size[1]));
}

export function smoothMin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0.0) / k;
  return Math.min(a, b) - h * h * k * (1.0 / 4.0);
}
