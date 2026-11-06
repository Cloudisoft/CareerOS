import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Segmenter } = require('../lib/segmenter.js');

/* Feeds levels every 100ms: [level, ms] pairs. Returns the actions with their times. */
function run(seg, plan) {
  let t = 0;
  const out = [];
  for (const [level, ms] of plan) {
    for (let i = 0; i < ms; i += 100) {
      t += 100;
      const a = seg.feed(level, t);
      if (a) out.push([a, t]);
    }
  }
  return out;
}

describe('Live Copilot speech segmenter', () => {
  it('cuts one clip per question, at the pause after it', () => {
    const out = run(Segmenter(), [[0.003, 2000], [0.08, 3000], [0.003, 1500], [0.09, 2500], [0.003, 1500]]);
    expect(out.map((o) => o[0])).toEqual(['cut', 'cut']);
    expect(out[0][1]).toBeGreaterThanOrEqual(5900);
    expect(out[0][1]).toBeLessThanOrEqual(6100);
  });

  it("doesn't cut mid-sentence on a short breath", () => {
    const out = run(Segmenter(), [[0.08, 1500], [0.003, 400], [0.08, 1500], [0.003, 1200]]);
    expect(out.map((o) => o[0])).toEqual(['cut']);
  });

  it('drops silence and short clicks instead of sending them', () => {
    const out = run(Segmenter(), [[0.003, 16000], [0.2, 100], [0.003, 16000]]);
    expect(out.every((o) => o[0] === 'discard')).toBe(true);
    expect(out.length).toBeGreaterThanOrEqual(1);
  });

  it('cuts a long monologue so help is never far behind', () => {
    const out = run(Segmenter({ maxMs: 20000 }), [[0.08, 45000]]);
    expect(out.map((o) => o[0])).toEqual(['cut', 'cut']);
  });

  it('adapts to a noisy line', () => {
    const seg = Segmenter();
    // Steady background hiss at 0.02 should not count as speech once learned.
    const out = run(seg, [[0.008, 3000], [0.02, 20000]]);
    expect(out.every((o) => o[0] === 'discard')).toBe(true);
  });
});
