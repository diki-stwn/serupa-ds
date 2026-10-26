// The spring easings (ease-spring-soft, ease-spring-snappy) as CSS linear() curves: a damped spring released from 0
// toward 1, sampled until it settles. tokens.json holds the result; tools/test/motion-tokens.mjs checks it still
// matches these springs, so a curve is changed here and copied over, never edited by hand.
//   node tools/tokens/spring.mjs            prints each spring's linear()
//
// A spring is its damping ratio: below 1 it overshoots once and settles (0.85 barely, 0.6 by about 9%). Its
// stiffness is chosen so it has settled to within 0.5% at the end of the curve, so the curve fits whatever
// duration a transition gives it. Points are dropped where a straight line between their neighbours is within
// 0.2% of the spring, which keeps each curve to a few dozen points.

export const SPRINGS = {
  'ease-spring-soft': 0.85,
  'ease-spring-snappy': 0.6,
};

const position = (zeta, w, t) => {
  const wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
};

/** The CSS linear() for a spring with damping ratio `zeta`. */
export function spring(zeta) {
  // The envelope e^(-ζωt) falls to 0.005 at t = 1: what is left is under a pixel on anything a component moves.
  const w = Math.log(200) / zeta;
  const N = 200;
  const pts = Array.from({ length: N + 1 }, (_, i) => [i / N, i === N ? 1 : position(zeta, w, i / N)]);
  const keep = [pts[0]];
  let a = 0;
  for (let b = 2; b <= N; b++) {
    const [x0, y0] = pts[a], [x1, y1] = pts[b];
    const off = pts.slice(a + 1, b).some(([x, y]) => Math.abs(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0) - y) > 0.002);
    if (off) { keep.push(pts[b - 1]); a = b - 1; }
  }
  keep.push(pts[N]);
  const r = (n, d) => String(Number(n.toFixed(d)));
  return `linear(${keep.map(([x, y], i) => (i === 0 ? '0' : i === keep.length - 1 ? '1' : `${r(y, 3)} ${r(x * 100, 1)}%`)).join(', ')})`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [name, zeta] of Object.entries(SPRINGS)) console.log(`${name}: ${spring(zeta)}`);
}
