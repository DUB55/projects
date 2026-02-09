# Liquid Glass UI Implementation

Implement an Apple-style "Liquid Glass" component with the following features:

## Technical Requirements
- WebGL2 + GLSL Shaders
- Multipass blur pipeline (Separable Gaussian Blur)
- Refraction & Chromatic Dispersion
- Fresnel Reflection
- Glare Highlight
- SDF Superellipse shape masking
- Smooth Minimum for blob morphing
- Spring animations for interaction

## File Structure
- `components/liquid-glass/`
  - `types.ts`: Props and common types
  - `sdf.ts`: SDF utility functions
  - `utils.ts`: WebGL2 helpers
  - `LiquidGlass.tsx`: Core React component
  - `vertex.glsl`: Common vertex shader
  - `fragment.glsl`: Main rendering shader
  - `blur.glsl`: Gaussian blur pass shader
  - `liquid-glass.css`: Fallback and base styles

## Shader Features
- **Refraction**: Use a displacement map based on SDF gradient.
- **Dispersion**: Three-tap refraction for RGB channels with slight offset.
- **Fresnel**: Edge highlight based on view vector.
- **Glare**: Directional highlight based on mouse position.
- **Blur**: Masked separable Gaussian blur for background.
