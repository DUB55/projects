export const blurShaderSource = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_direction;
uniform float u_radius;

float gaussian(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma)) / (sqrt(2.0 * 3.14159) * sigma);
}

void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;
    
    float sigma = max(u_radius / 2.0, 1.0);
    int kernelSize = int(u_radius * 2.0);
    
    for (int i = -kernelSize; i <= kernelSize; i++) {
        float weight = gaussian(float(i), sigma);
        vec2 offset = u_direction * float(i) * texelSize;
        color += texture(u_texture, v_uv + offset).rgb * weight;
        totalWeight += weight;
    }
    
    outColor = vec4(color / totalWeight, 1.0);
}
`;
