"use client"

import React from 'react';
import { LiquidGlass } from '@/components/liquid-glass/LiquidGlass';

export default function LiquidGlassDemo() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white tracking-tight">Liquid Glass UI</h1>
        <p className="text-muted-foreground">Apple-style WebGL2 refraction and dispersion effects</p>
      </div>

      <div className="relative group">
        {/* Background content to be refracted */}
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="grid grid-cols-4 gap-4 w-[600px]">
            {Array.from({ length: 16 }).map((_, i) => (
              <div 
                key={i} 
                className="h-24 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/5 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* The Liquid Glass Component */}
        <div className="relative z-10">
          <LiquidGlass
            width={800}
            height={500}
            cornerRadius={48}
            refractiveIndex={0.4}
            dispersion={0.5}
            fresnelBias={0.1}
            fresnelScale={1.2}
            glareIntensity={0.6}
            blurRadius={40}
            backgroundUrl="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
            tint={{ r: 0.9, g: 0.9, b: 1.0, a: 0.1 }}
            className="shadow-2xl"
          />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20">
              <span className="text-3xl">💎</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Premium Glass</h2>
            <p className="text-white/60 max-w-xs">
              This component uses WebGL2 shaders to simulate real-time light refraction, 
              chromatic dispersion, and Fresnel reflection.
            </p>
            <div className="pt-4">
              <button className="px-6 py-2 bg-white text-black rounded-full font-bold text-sm pointer-events-auto hover:scale-105 transition-transform">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl pt-12">
        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2">
          <h3 className="font-bold text-white">Refraction</h3>
          <p className="text-sm text-muted-foreground">Simulates light bending through high-index glass material using SDF gradients.</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2">
          <h3 className="font-bold text-white">Dispersion</h3>
          <p className="text-sm text-muted-foreground">Splits light into RGB channels (chromatic aberration) for a realistic prism effect.</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2">
          <h3 className="font-bold text-white">Multipass Blur</h3>
          <p className="text-sm text-muted-foreground">Optimized separable Gaussian blur pipeline for smooth background diffusion.</p>
        </div>
      </div>
    </div>
  );
}
