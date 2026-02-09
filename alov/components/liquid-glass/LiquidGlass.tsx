"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useSpring, useMotionValue } from 'framer-motion';
import { LiquidGlassProps } from './types';
import { createShader, createProgram, createTexture, createFBO } from './utils';
import { vertexShaderSource } from './vertex';
import { fragmentShaderSource } from './fragment';
import { blurShaderSource } from './blur';
import { cn } from '@/lib/utils';
import './liquid-glass.css';

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  width = 320,
  height = 180,
  cornerRadius = 24,
  refractiveIndex = 0.4,
  dispersion = 0.3,
  fresnelBias = 0.1,
  fresnelScale = 1.0,
  fresnelPower = 2.0,
  glareIntensity = 0.5,
  blurRadius = 20,
  tint = { r: 1, g: 1, b: 1, a: 0.1 },
  backgroundUrl,
  className,
  style,
  onReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const requestRef = useRef<number>();
  
  // Use Motion values and springs for smooth interaction
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  // Smoother, more linear-feeling springs for professional UX
  const springX = useSpring(mouseX, { stiffness: 40, damping: 30, restDelta: 0.001 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 30, restDelta: 0.001 });

  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true });
    if (!gl) {
      console.error('WebGL2 not supported');
      setWebglSupported(false);
      return;
    }
    glRef.current = gl;

    // Compile shaders and link programs
    let mainProgram: WebGLProgram;
    let blurProgram: WebGLProgram;

    try {
      const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
      const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
      const bShader = createShader(gl, gl.FRAGMENT_SHADER, blurShaderSource);

      mainProgram = createProgram(gl, vShader, fShader);
      blurProgram = createProgram(gl, vShader, bShader);
    } catch (err) {
      console.error('Shader compilation error:', err);
      return;
    }

    // Quad geometry
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(mainProgram, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Textures and Framebuffers for blur
    const backgroundTexture = createTexture(gl, width, height);
    const blurTempTexture = createTexture(gl, width, height);
    const blurResultTexture = createTexture(gl, width, height);
    const blurTempFBO = createFBO(gl, blurTempTexture);
    const blurResultFBO = createFBO(gl, blurResultTexture);

    // Load background image
    if (backgroundUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = backgroundUrl;
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      };
    }

    const render = (time: number) => {
      if (!gl) return;

      gl.viewport(0, 0, width, height);

      // 1. Horizontal Blur Pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, blurTempFBO);
      gl.useProgram(blurProgram);
      gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
      gl.uniform2f(gl.getUniformLocation(blurProgram, 'u_resolution'), width, height);
      gl.uniform2f(gl.getUniformLocation(blurProgram, 'u_direction'), 1, 0);
      gl.uniform1f(gl.getUniformLocation(blurProgram, 'u_radius'), blurRadius);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // 2. Vertical Blur Pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, blurResultFBO);
      gl.bindTexture(gl.TEXTURE_2D, blurTempTexture);
      gl.uniform2f(gl.getUniformLocation(blurProgram, 'u_direction'), 0, 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // 3. Main Render Pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(mainProgram);
      gl.bindTexture(gl.TEXTURE_2D, blurResultTexture);
      
      // Set Uniforms
      gl.uniform2f(gl.getUniformLocation(mainProgram, 'u_resolution'), width, height);
      gl.uniform1f(gl.getUniformLocation(mainProgram, 'u_time'), time * 0.001);
      
      // Use spring values for smooth interaction
      gl.uniform2f(gl.getUniformLocation(mainProgram, 'u_mouse'), springX.get(), springY.get());
      
      gl.uniform1f(gl.getUniformLocation(mainProgram, 'u_refractiveIndex'), refractiveIndex);
      gl.uniform1f(gl.getUniformLocation(mainProgram, 'u_dispersion'), dispersion);
      gl.uniform1f(gl.getUniformLocation(mainProgram, 'u_fresnelBias'), fresnelBias);
      gl.uniform1f(gl.getUniformLocation(mainProgram, 'u_fresnelScale'), fresnelScale);
      gl.uniform1f(gl.getUniformLocation(mainProgram, 'u_fresnelPower'), fresnelPower);
      gl.uniform1f(gl.getUniformLocation(mainProgram, 'u_glareIntensity'), glareIntensity);
      gl.uniform4f(gl.getUniformLocation(mainProgram, 'u_tint'), tint.r, tint.g, tint.b, tint.a);
      gl.uniform1f(gl.getUniformLocation(mainProgram, 'u_cornerRadius'), cornerRadius);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    onReady?.();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [width, height, backgroundUrl, blurRadius, cornerRadius, refractiveIndex, dispersion, fresnelBias, fresnelScale, fresnelPower, glareIntensity, tint, onReady, springX, springY]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set(1.0 - (e.clientY - rect.top) / rect.height);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div 
      className={cn(
        "liquid-glass-container", 
        !webglSupported && "webgl-failed",
        className
      )}
      style={{ ...style, width, height }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="liquid-glass-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div 
        className="liquid-glass-fallback"
        style={{ borderRadius: cornerRadius }}
      />
    </div>
  );
};
