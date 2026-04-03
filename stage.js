// ===== ステージ設定 =====
const WLEN = 3200;
const WORLD_H = 800;
const GND = () => WORLD_H - 36;

// ===== ワールド生成 =====
function genWorld() {
  plats = []; enms = []; coinArr = []; parts = [];

  // 地面（穴あきで生成）
  const holes = [600, 900, 1400, 1900, 2400]; // 穴の位置
  const holeW = 120; // 穴の幅
  let gx = -100;
  while (gx < WLEN + 200) {
    const isHole = holes.some(hx => gx + 190 > hx && gx < hx + holeW);
    if (!isHole) {
      plats.push({ x: gx, y: GND(), w: 190, h: WORLD_H, t: 'g' });
    }
    gx += 170;
  }

  // 空中足場（高低差バラバラ）
  const platforms = [
    { x: 150,  h: 160 },
    { x: 360,  h: 100 },
    { x: 530,  h: 180 },
    { x: 720,  h: 120 },
    { x: 900,  h: 150 },
    { x: 1080, h: 90  },
    { x: 1260, h: 170 },
    { x: 1430, h: 110 },
    { x: 1620, h: 140 },
    { x: 1800, h: 80  },
    { x: 1980, h: 160 },
    { x: 2160, h: 100 },
    { x: 2340, h: 130 },
    { x: 2520, h: 170 },
    { x: 2700, h: 90  },
    { x: 2880, h: 120 },
  ];

  platforms.forEach(({ x: bx, h: bh }, i) => {
    const by = GND() - bh - (stage - 1) * 15;
    // 足場の幅をバラバラに
    const bw = 80 + (i % 3) * 30;
    plats.push({ x: bx, y: by, w: bw, h: 16, t: 'b' });

    // コイン配置
    const coinCount = Math.floor(bw / 35);
    for (let c = 0; c < coinCount; c++) {
      coinArr.push({ x: bx + 8 + c * 32, y: by - 30, col: false, ph: Math.random() * Math.PI * 2 });
    }

    // 敵配置
    const spawnEvery = stage === 1 ? 4 : 3;
    const spawnAt = stage === 1 ? 3 : 2;
    if (i % spawnEvery === spawnAt) {
      const spd = stage === 1 ? -(0.5 + Math.random() * 0.3) : -(1.6 + Math.random() * 0.4);
      const ey = stage === 1 ? GND() - 30 : by - 34;
      enms.push({ x: bx + 20, y: ey, w: 30, h: 28, vx: spd, vy: 0, alive: true, flying: stage === 1, spiky: stage >= 2, knockvx: 0, knockvy: 0 });
    }
  });

  // ゴール
  plats.push({ x: WLEN - 90, y: GND() - 110, w: 80, h: 110, t: 'goal' });

  // 星
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * WLEN, y: Math.random() * (WORLD_H * 0.85), r: Math.random() * 1.8 + 0.3, ph: Math.random() * Math.PI * 2 });
  }
}
