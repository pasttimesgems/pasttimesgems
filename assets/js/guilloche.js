// Guilloché: the fine engraved line patterns found on watch dials and
// jewellers' cases. Each ring is a set of rotated wavy circles whose
// crossings form the lattice.

const f = (n) => Math.round(n * 10) / 10;

export function ring({ R, amp, waves, copies, steps = 360 }) {
  let d = '';
  for (let k = 0; k < copies; k++) {
    const phase = (k / copies) * Math.PI * 2;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const r = R + amp * Math.sin(waves * t + phase);
      d += `${i ? 'L' : 'M'}${f(Math.cos(t) * r)} ${f(Math.sin(t) * r)}`;
    }
  }
  return d;
}

export const circle = (r) => `M${r} 0A${r} ${r} 0 1 0 ${-r} 0A${r} ${r} 0 1 0 ${r} 0`;

