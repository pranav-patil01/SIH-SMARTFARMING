// src/three/shaders/packet.glsl
// Glowing energy trail shader for MQTT packets

uniform vec3 uColor;
uniform float uGlowIntensity;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    
    // Fresnel rim light effect
    float rim = 1.0 - max(0.0, dot(normal, viewDir));
    rim = pow(rim, 2.0);
    
    vec3 glowColor = uColor * (1.0 + rim * uGlowIntensity);
    gl_FragColor = vec4(glowColor, 0.9);
}
