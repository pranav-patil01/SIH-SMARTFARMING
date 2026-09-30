// src/three/shaders/wind.glsl
// Vertex displacement wind sway shader for instanced crops

uniform float uTime;
uniform float uWindStrength;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vec3 transformed = position;
    
    // Displace upper vertices based on height (position.y > 0)
    float heightFactor = max(0.0, position.y);
    float swayX = sin(uTime * 2.0 + position.x * 0.5 + position.z * 0.5) * uWindStrength * heightFactor;
    float swayZ = cos(uTime * 1.5 + position.x * 0.3) * uWindStrength * 0.5 * heightFactor;
    
    transformed.x += swayX;
    transformed.z += swayZ;
    
    vPosition = transformed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
