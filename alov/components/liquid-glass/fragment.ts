export const fragmentShaderSource = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_background;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

// Liquid Glass Props
uniform float u_refractiveIndex;
uniform float u_dispersion;
uniform float u_fresnelBias;
uniform float u_fresnelScale;
uniform float u_fresnelPower;
uniform float u_glareIntensity;
uniform vec4 u_tint;
uniform float u_cornerRadius;

// SDF functions
float superellipse(vec2 p, vec2 b, float n) {
    p = abs(p);
    return pow(pow(p.x/b.x, n) + pow(p.y/b.y, n), 1.0/n) - 1.0;
}

float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * (1.0 / 4.0);
}

float circle(vec2 p, float r) {
    return length(p) - r;
}

float getDistance(vec2 p, vec2 size, float time) {
    // Main card shape
    float d = superellipse(p, size, 4.0);
    
    // Add some "liquid" blobs that morph with the main shape
    vec2 b1Pos = vec2(sin(time * 0.5) * 0.5, cos(time * 0.4) * 0.3);
    vec2 b2Pos = vec2(cos(time * 0.6) * 0.4, sin(time * 0.35) * 0.4);
    
    float b1 = circle(p - b1Pos, 0.2);
    float b2 = circle(p - b2Pos, 0.15);
    
    // Morph blobs together
    float blobs = smin(b1, b2, 0.2);
    
    // Morph blobs with main card slightly for "liquid" edge feel
    return smin(d, blobs, 0.15);
}

void main() {
    vec2 uv = v_uv;
    vec2 p = (uv * 2.0 - 1.0);
    float aspect = u_resolution.x / u_resolution.y;
    p.x *= aspect;
    
    vec2 size = vec2(aspect * 0.85, 0.85);
    float d = getDistance(p, size, u_time);
    
    // Smoothing for the edges - improved mask
    float mask = 1.0 - smoothstep(-0.02, 0.02, d);
    
    if (mask < 0.001) {
        discard;
    }

    // Normal approximation from SDF gradient - using the full morphed distance
    vec2 eps = vec2(0.005, 0.0);
    vec3 normal = normalize(vec3(
        getDistance(p + eps.xy, size, u_time) - getDistance(p - eps.xy, size, u_time),
        getDistance(p + eps.yx, size, u_time) - getDistance(p - eps.yx, size, u_time),
        0.05 // Simulated depth/thickness
    ));

    // Refraction with Dispersion
    vec3 refraction;
    float rIndex = u_refractiveIndex * 0.1;
    float disp = u_dispersion * 0.02;
    
    // Correct UV coordinates for aspect ratio and clamp to avoid edge artifacts
    vec2 refractedUV_R = clamp(uv + normal.xy * (rIndex + disp), 0.001, 0.999);
    vec2 refractedUV_G = clamp(uv + normal.xy * rIndex, 0.001, 0.999);
    vec2 refractedUV_B = clamp(uv + normal.xy * (rIndex - disp), 0.001, 0.999);
    
    refraction.r = texture(u_background, refractedUV_R).r;
    refraction.g = texture(u_background, refractedUV_G).g;
    refraction.b = texture(u_background, refractedUV_B).b;

    // Fresnel Reflection
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float fresnel = u_fresnelBias + u_fresnelScale * pow(1.0 + dot(normal, -viewDir), u_fresnelPower);
    
    // Glare / Specular - based on mouse position
    vec2 lightPos = (u_mouse * 2.0 - 1.0);
    lightPos.x *= aspect;
    vec3 lightDir = normalize(vec3(lightPos - p, 0.5));
    float spec = pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 32.0) * u_glareIntensity;

    // Final composition
    vec3 color = refraction;
    color = mix(color, vec3(1.0), fresnel * 0.4); // Add edge highlight
    color += spec * 0.6; // Add glare
    
    // Tint
    color = mix(color, u_tint.rgb, u_tint.a);

    outColor = vec4(color, mask);
}
`;
