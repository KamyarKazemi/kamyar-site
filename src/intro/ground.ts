import { FLOOR_END, type Camera } from './scene';

/**
 * The floor and the red route on a phone, drawn flat on one canvas the size of the screen instead of as 3D planes. A phone's graphics
 * memory cannot hold the floor's big 3D tiles at its pixel density: it starts dropping layers, and titles vanish mid-greeting. The
 * canvas projects every line through the same camera the 3D world uses, so the stations still stand exactly on it.
 */
const GRID = 160, FAR = FLOOR_END - 100, NEAR = 30, SIDE = 2400;
const LINE = 'rgba(24, 22, 20, 0.26)', FLOOR = '#dcd8cf', RED = '#ce261e';

interface View { width: number; height: number; scale: number; perspective: number }

// a point in the world as the camera sees it: moved, turned, then tipped (the CSS lens, in the same order)
function eye(cam: Camera, x: number, y: number, z: number) {
  const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
  const ry = (cam.ry * Math.PI) / 180, rx = (cam.rx * Math.PI) / 180;
  const x1 = dx * Math.cos(ry) + dz * Math.sin(ry), z1 = -dx * Math.sin(ry) + dz * Math.cos(ry);
  return { x: x1, y: dy * Math.cos(rx) - z1 * Math.sin(rx), z: dy * Math.sin(rx) + z1 * Math.cos(rx) };
}
const onScreen = (v: View, p: { x: number; y: number; z: number }) => {
  const f = (v.perspective / -p.z) * v.scale;
  return { x: v.width / 2 + p.x * f, y: v.height / 2 + p.y * f, f };
};

// a stretch of floor between two points, cut where it passes behind the eye
function segment(v: View, cam: Camera, ax: number, az: number, bx: number, bz: number, y = 0) {
  let a = eye(cam, ax, y, az), b = eye(cam, bx, y, bz);
  if (a.z > -NEAR && b.z > -NEAR) return null;
  if (a.z > -NEAR || b.z > -NEAR) {
    const t = (-NEAR - a.z) / (b.z - a.z), cut = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: -NEAR };
    if (a.z > -NEAR) a = cut; else b = cut;
  }
  return [onScreen(v, a), onScreen(v, b)] as const;
}

/** Draws the floor, its ruled grid and as much of the route as has been drawn (`drawn(i)`, 0–1 for each stretch, near end first). */
export function drawGround(ctx: CanvasRenderingContext2D, v: View, cam: Camera, route: [number, number][], drawn: (i: number) => number): void {
  ctx.clearRect(0, 0, v.width, v.height);
  // the floor runs from under the camera to its far edge; above that is the wall behind
  const edge = onScreen(v, eye(cam, cam.x, 0, FAR));
  ctx.fillStyle = FLOOR;
  ctx.fillRect(0, Math.max(0, edge.y), v.width, v.height);

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const x0 = Math.floor((cam.x - SIDE) / GRID) * GRID, z0 = Math.min(1600, Math.ceil(cam.z / GRID) * GRID);
  for (let x = x0; x <= cam.x + SIDE; x += GRID) {
    const s = segment(v, cam, x, z0, x, FAR);
    if (s) { ctx.moveTo(s[0].x, s[0].y); ctx.lineTo(s[1].x, s[1].y); }
  }
  for (let z = z0; z >= FAR; z -= GRID) {
    const s = segment(v, cam, cam.x - SIDE, z, cam.x + SIDE, z);
    if (s) { ctx.moveTo(s[0].x, s[0].y); ctx.lineTo(s[1].x, s[1].y); }
  }
  ctx.stroke();

  // the route: red dashes 44 long every 80, as wide as on the big screen, drawn on from the near end of each stretch
  ctx.strokeStyle = RED;
  ctx.lineCap = 'butt';
  for (let i = 0; i < route.length - 1; i++) {
    const [nx, nz] = route[i]!, [fx, fz] = route[i + 1]!, len = Math.hypot(fx - nx, fz - nz), shown = len * drawn(i);
    for (let d = 0; d < shown; d += 80) {
      const a = d / len, b = Math.min(d + 44, shown) / len;
      const s = segment(v, cam, nx + (fx - nx) * a, nz + (fz - nz) * a, nx + (fx - nx) * b, nz + (fz - nz) * b, -1);
      if (!s) continue;
      ctx.lineWidth = Math.max(1, 14 * (s[0].f + s[1].f) / 2);
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      ctx.lineTo(s[1].x, s[1].y);
      ctx.stroke();
    }
  }
}
