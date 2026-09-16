import { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle } from 'ogl';
import './WebThreads.css';

const FAN_MODE = { center: 0, left: 1, right: 2 };

const hexToRgb = (hex) => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return match
    ? [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255]
    : [1, 1, 1];
};

const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime, uSpeed, uThreadCount, uFrequency, uSpread, uTaper, uPosition;
uniform float uFanMode, uGlow, uFalloff, uThickness, uBrightness, uOpacity;
uniform float uMirror, uShimmer, uGrain, uGrainIntensity;
uniform vec3 uColor1, uColor2, uColor3, uBackgroundColor;
uniform bool uLightMode;
uniform vec2 uMouse;
uniform float uMouseStrength, uEnableMouse, uMouseActive;
out vec4 fragColor;
#define TAU 6.28318530718
#define MAX_THREADS 10

float glow(float distanceToThread, float falloff, float strength) {
  return strength / pow(max(distanceToThread, 1e-4), falloff);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float count = max(uThreadCount, 1.0);
  float pinch = uFanMode < 0.5 ? 0.5 : (uFanMode < 1.5 ? 0.0 : 1.0);
  if (uEnableMouse > 0.5) pinch = mix(pinch, uMouse.x, clamp(uMouseStrength, 0.0, 1.0) * uMouseActive);
  float spread = uSpread * abs(uv.x - pinch);
  float phaseBase = iTime * uSpeed;
  float direction = uMirror > 0.5 ? sign(pinch - uv.x) : 1.0;
  float yOffset = uv.y - uPosition;
  float indexScale = count > 1.0 ? 1.0 / (count - 1.0) : 0.0;
  vec3 color = vec3(0.0);
  float energy = 0.0;

  for (int index = 0; index < MAX_THREADS; index++) {
    float i = float(index);
    if (i >= count) break;
    float amplitude = spread * (1.0 + i * uTaper);
    float shimmer = uShimmer > 0.5 ? sin(iTime * 1.7 + i * 1.3) * 0.35 : 0.0;
    float phase = (phaseBase + i * TAU / count) * direction + shimmer;
    float distanceToThread = abs(yOffset + sin(uv.x * uFrequency + phase) * amplitude) / max(uThickness, 0.01);
    float threadEnergy = glow(distanceToThread, uFalloff, uGlow);
    color += threadEnergy * mix(uColor1, uColor2, i * indexScale);
    energy += threadEnergy;
  }

  color = mix(color, uColor3 * energy, smoothstep(0.5, 2.2, energy) * 0.5);
  float brightness = uBrightness;
  if (uEnableMouse > 0.5) brightness += clamp(uMouseStrength, 0.0, 1.0) * uMouseActive * exp(-dot(uv - uMouse, uv - uMouse) * 6.0) * 0.6;
  color *= brightness;
  float alpha = clamp(energy, 0.0, 1.0) * uOpacity;

  if (uLightMode) {
    vec3 mapped = vec3(1.0) - exp(-max(color, vec3(0.0)) * 1.3);
    float coverage = smoothstep(0.18, 0.72, clamp(max(mapped.r, max(mapped.g, mapped.b)) * uOpacity, 0.0, 1.0));
    coverage *= coverage;
    vec3 hue = mapped / max(max(mapped.r, max(mapped.g, mapped.b)), 1e-4);
    vec3 pigment = mix(pow(clamp(hue, 0.0, 1.0), vec3(0.78)), vec3(0.08), 0.12);
    vec3 ink = mix(vec3(0.9), pigment, 0.82 + coverage * 0.18);
    fragColor = vec4(mix(uBackgroundColor, ink, coverage), 1.0);
  } else {
    if (uGrain > 0.5) color += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
    fragColor = vec4(clamp(color, 0.0, 1.0) * alpha, alpha);
  }
}`;

export default function WebThreads({
  color1 = '#5227FF', color2 = '#FF9FFC', color3 = '#FFFFFF', speed = 0.2,
  threadCount = 6, frequency = 5, spread = 0.18, taper = 1, position = 0.5,
  fanMode = 'center', glow = 0.02, falloff = 0.6, thickness = 1.1,
  brightness = 0.6, opacity = 1, mirror = true, shimmer = false, grain = true,
  grainIntensity = 0.05, mouseInteraction = true, mouseStrength = 0.3,
  backgroundColor = '#FFFFFF', lightMode = false, className = '',
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let renderer;
    try {
      renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    } catch {
      return undefined;
    }
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 1);
    const canvas = gl.canvas;
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    const program = new Program(gl, {
      vertex, fragment,
      uniforms: {
        iTime: { value: 0 }, iResolution: { value: new Float32Array([1, 1]) },
        uSpeed: { value: speed }, uThreadCount: { value: threadCount }, uFrequency: { value: frequency },
        uSpread: { value: spread }, uTaper: { value: taper }, uPosition: { value: position },
        uFanMode: { value: FAN_MODE[fanMode] ?? 0 }, uGlow: { value: glow }, uFalloff: { value: falloff },
        uThickness: { value: thickness }, uBrightness: { value: brightness }, uOpacity: { value: opacity },
        uMirror: { value: mirror ? 1 : 0 }, uShimmer: { value: shimmer ? 1 : 0 }, uGrain: { value: grain ? 1 : 0 },
        uGrainIntensity: { value: grainIntensity }, uColor1: { value: new Float32Array(hexToRgb(color1)) },
        uColor2: { value: new Float32Array(hexToRgb(color2)) }, uColor3: { value: new Float32Array(hexToRgb(color3)) },
        uBackgroundColor: { value: new Float32Array(hexToRgb(backgroundColor)) }, uLightMode: { value: lightMode },
        uMouse: { value: new Float32Array([0.5, 0.5]) }, uMouseStrength: { value: mouseStrength },
        uEnableMouse: { value: mouseInteraction ? 1 : 0 }, uMouseActive: { value: 0 },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height));
      program.uniforms.iResolution.value[0] = gl.drawingBufferWidth;
      program.uniforms.iResolution.value[1] = gl.drawingBufferHeight;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const mouse = [0.5, 0.5];
    const target = [0.5, 0.5];
    let active = 0;
    let targetActive = 0;
    const onMouseMove = (event) => { const rect = canvas.getBoundingClientRect(); target[0] = (event.clientX - rect.left) / rect.width; target[1] = 1 - (event.clientY - rect.top) / rect.height; targetActive = 1; };
    const onMouseEnter = () => { targetActive = 1; };
    const onMouseLeave = () => { targetActive = 0; };
    canvas.addEventListener('mousemove', onMouseMove); canvas.addEventListener('mouseenter', onMouseEnter); canvas.addEventListener('mouseleave', onMouseLeave);
    let frame = 0; const start = performance.now();
    const loop = (time) => {
      program.uniforms.iTime.value = (time - start) * 0.001;
      mouse[0] += 0.05 * (target[0] - mouse[0]); mouse[1] += 0.05 * (target[1] - mouse[1]); active += 0.05 * (targetActive - active);
      program.uniforms.uMouse.value[0] = mouse[0]; program.uniforms.uMouse.value[1] = mouse[1]; program.uniforms.uMouseActive.value = active;
      renderer.render({ scene: mesh }); frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('mousemove', onMouseMove); canvas.removeEventListener('mouseenter', onMouseEnter); canvas.removeEventListener('mouseleave', onMouseLeave); container.removeChild(canvas); gl.getExtension('WEBGL_lose_context')?.loseContext(); };
  // The Home hero supplies a stable configuration; the WebGL context should not restart on render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className={`web-threads-container ${className}`.trim()} />;
}
