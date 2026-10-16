// Live 3D hero. The pre-rendered poster shows instantly; the WebGL scene
// fades in over it once it has drawn its first frame.

import { reducedMotion } from './effects.js';

export async function hero3d(holder) {
  if (!holder) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  let lib;
  try {
    lib = await import('./jewels3d.js');
  } catch (e) {
    return; // offline or blocked: the poster stays
  }
  const { makeRenderer, setupStudio, stage, heroPiece } = lib;
  let renderer;
  try {
    renderer = makeRenderer(canvas, { alpha: true, dpr: Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.5 : 2) });
  } catch (e) {
    return; // no WebGL
  }
  renderer.shadowMap.enabled = false;
  setupStudio(renderer);
  const piece = heroPiece();
  // At hero size, a slightly softer view of the lights keeps the diamond from looking grainy.
  piece.traverse((o) => { if (o.material?.uniforms?.blur) o.material.uniforms.blur.value = 1.4; });
  const { scene, camera } = stage(renderer, piece, { tilt: .18, distance: 6.4, shadow: false });
  holder.append(canvas);

  const size = () => {
    const w = holder.clientWidth, h = holder.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  size();
  new ResizeObserver(size).observe(holder);

  let px = 0, py = 0, visible = true, t = 0, last = performance.now();
  addEventListener('pointermove', (e) => { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; }, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(holder);

  const draw = (now) => {
    t += Math.min(50, now - last) / 1000;
    last = now;
    piece.userData.update(t, px, py);
    renderer.render(scene, camera);
  };
  draw(last);
  requestAnimationFrame(() => holder.classList.add('live'));
  if (reducedMotion) return;
  const frame = (now) => {
    if (visible && !document.hidden) draw(now); else last = now;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
