import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './Lightfall.css';

const vertex = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uSpeed;
uniform float uDensity;
uniform float uGlow;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseEnabled;

float hash(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec3 color = vec3(0.0);
  float columns = 24.0 + uDensity * 28.0;
  for (int i = 0; i < 48; i++) {
    float fi = float(i);
    if (fi >= columns) break;
    float x = (hash(fi * 13.7) - 0.5) * aspect;
    float width = mix(0.0008, 0.003, hash(fi + 4.0));
    float fall = fract(hash(fi * 2.1) + uTime * uSpeed * (0.18 + hash(fi) * 0.3));
    float y = 1.15 - fall * 1.5;
    float tail = mix(0.08, 0.3, hash(fi + 2.0));
    float line = smoothstep(width, 0.0, abs(p.x - x));
    float streak = line * smoothstep(y + tail, y, p.y) * smoothstep(y - 0.02, y, p.y);
    vec3 c = fi < columns * 0.34 ? uColor0 : (fi < columns * 0.67 ? uColor1 : uColor2);
    color += c * streak * (1.2 + hash(fi + 8.0));
  }
  if (uMouseEnabled > 0.5) {
    vec2 mouse = (uMouse / uResolution - 0.5) * vec2(aspect, 1.0);
    color += mix(uColor1, uColor2, 0.5) * exp(-length(p - mouse) * 7.0) * 0.18;
  }
  color *= uGlow;
  gl_FragColor = vec4(color, clamp(length(color) * uOpacity, 0.0, 0.9));
}
`;

const hexToRgb = (hex) => {
  const value = hex.replace('#', '').padEnd(6, '0');
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
};

export default function Lightfall({
  className = '',
  colors = ['#A6C8FF', '#5227FF', '#FF9FFC'],
  backgroundColor = '#050308',
  speed = 1,
  streakCount = 8,
  glow = 1,
  density = 1,
  opacity = 1,
  mouseInteraction = true,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const renderer = new Renderer({ alpha: true, dpr: Math.min(window.devicePixelRatio || 1, 2) });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    const uniforms = {
      uResolution: { value: [1, 1] }, uTime: { value: 0 },
      uColor0: { value: hexToRgb(colors[0] || '#6c3ce9') },
      uColor1: { value: hexToRgb(colors[1] || '#d21784') },
      uColor2: { value: hexToRgb(colors[2] || '#f9a8d4') },
      uSpeed: { value: speed }, uDensity: { value: density * streakCount / 8 },
      uGlow: { value: glow }, uOpacity: { value: opacity },
      uMouse: { value: [0, 0] }, uMouseEnabled: { value: mouseInteraction ? 1 : 0 },
    };
    const program = new Program(gl, { vertex, fragment, uniforms, transparent: true });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      uniforms.uResolution.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const move = (event) => {
      const rect = canvas.getBoundingClientRect();
      uniforms.uMouse.value = [(event.clientX - rect.left) * renderer.dpr, (rect.bottom - event.clientY) * renderer.dpr];
    };
    if (mouseInteraction) canvas.addEventListener('pointermove', move);
    let frame;
    const render = (time) => { uniforms.uTime.value = time * 0.001; renderer.render({ scene: mesh }); frame = requestAnimationFrame(render); };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); if (mouseInteraction) canvas.removeEventListener('pointermove', move); canvas.remove(); renderer.gl.getExtension('WEBGL_lose_context')?.loseContext(); };
  }, [colors, density, glow, mouseInteraction, opacity, speed, streakCount]);

  return <div ref={containerRef} className={`lightfall-container ${className}`} style={{ backgroundColor }} />;
}
