// src/three/shaders/water.glsl
// Procedural water flow shader along pipe UV coordinates

uniform float uTime;
uniform vec3 uColor;
uniform float uSpeed;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
    float flow = sin(vUv.x * 20.0 - uTime * uSpeed) * 0.5 + 0.5;
    float pulse = sin(uTime * 3.0) * 0.2 + 0.8;
    vec3 finalColor = mix(uColor * 0.5, uColor * 1.5, flow * pulse);
    gl_FragColor = vec4(finalColor, 0.85);
}
