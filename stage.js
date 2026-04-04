// ===== ステージ設定 =====
const WLEN = 3200;
const WORLD_H = 800;
const GND = () => WORLD_H - 36;

let checkpoint = { x: 80, active: false };

function genWorld() {
  plats = []; enms = []; coinArr = []; parts = [];
  checkpoint = { x: 80, active: false };

  if (stage === 1) genStage1();
  else if (stage === 2) genStage2();
  else if (stage === 3) genStage3();

  plats.push({ x: WLEN - 90, y: GND() - 110, w: 80, h: 110, t: 'goal' });

  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * WLEN, y: Math.random() * (WORLD_H * 0.85), r: Math.random() * 1.8 + 0.3, ph: Math.random() * Math.PI * 2 });
  }
}

// よちよちを生成するヘルパー（浮き床上・地面上どちらでも使う）
function makeYochi(x, y, platX, platW) {
  return {
    x, y, w: 26, h: 26,
    vx: -(0.4 + Math.random() * 0.3), vy: 0,
    alive: true, flying: true, spiky: false, type: 'yochi',
    knockvx: 0, knockvy: 0,
    platX, platW,
    baseY: y
  };
}

function genStage1() {
  const holes = [900, 2000];
  const holeW = 110;
  let gx = -100;
  while (gx < WLEN + 200) {
    const isHole = holes.some(hx => gx + 190 > hx && gx < hx + holeW);
    if (!isHole) plats.push({ x: gx, y: GND(), w: 190, h: WORLD_H, t: 'g' });
    gx += 170;
  }

  // 浮き床9個
  const platforms = [
    { x: 200,  h: 130, w: 110 },
    { x: 500,  h: 100, w: 90  },
    { x: 820,  h: 150, w: 100 },
    { x: 1150, h: 110, w: 90  },
    { x: 1480, h: 140, w: 110 },
    { x: 1780, h: 100, w: 90  },
    { x: 2100, h: 160, w: 100 },
    { x: 2420, h: 120, w: 90  },
    { x: 2720, h: 90,  w: 110 },
  ];

  platforms.forEach(({ x: bx, h: bh, w: bw }, i) => {
    const by = GND() - bh;
    plats.push({ x: bx, y: by, w: bw, h: 16, t: 'b' });
    const coinCount = Math.floor(bw / 35);
    for (let c = 0; c < coinCount; c++) {
      coinArr.push({ x: bx + 8 + c * 32, y: by - 30, col: false, ph: Math.random() * Math.PI * 2 });
    }

    if (Math.random() > 0.3) {
      const startX = bx + Math.floor(bw / 2) - 13;
      enms.push(makeYochi(startX, by - 30, bx, bw));
    }

    // ふわゴースト（よちよちサイズ、1面用）
    if (i % 3 === 1) {
      enms.push({ x: bx + 10, y: by - 55, w: 26, h: 26, vx: -(0.4 + Math.random() * 0.25), vy: 0, alive: true, flying: true, spiky: false, type: 'fuwaghost', knockvx: 0, knockvy: 0, floatPh: Math.random() * Math.PI * 2 });
    }
  });

  // 地面を歩くよちよち：各個体が自分のいるタイル範囲内だけ歩く
  const gndRanges = [
    { left: 200,  right: 770  },  // スタート〜穴1前タイル右端(580+190)
    { left: 1090, right: 1960 },  // 穴1後タイル左端(1090)〜穴2前タイル右端(1770+190)
    { left: 2110, right: 3150 },  // 穴2後タイル左端(2110)〜ゴール手前
  ];
  gndRanges.forEach(({ left, right }) => {
    const rangeW = right - left;
    const count = Math.max(1, Math.floor(rangeW / 300));
    for (let n = 0; n < count; n++) {
      const gndX = left + 40 + n * Math.floor(rangeW / count) + Math.random() * 60;
      if (gndX + 26 > right) continue;
      enms.push(makeYochi(gndX, GND() - 26, left, rangeW));
    }
  });

  plats.push({ x: 1600, y: GND() - 60, w: 20, h: 60, t: 'checkpoint' });
}

function genStage2() {
  const holes = [500, 800, 1300, 1700, 2100, 2600];
  const holeW = 140;
  let gx = -100;
  while (gx < WLEN + 200) {
    const isHole = holes.some(hx => gx + 190 > hx && gx < hx + holeW);
    if (!isHole) plats.push({ x: gx, y: GND(), w: 190, h: WORLD_H, t: 'g' });
    gx += 170;
  }

  const platforms = [
    { x: 150, h: 160, w: 100 }, { x: 360, h: 100, w: 80 },
    { x: 530, h: 180, w: 110 }, { x: 720, h: 120, w: 90 },
    { x: 900, h: 150, w: 100 }, { x: 1080, h: 90, w: 80 },
    { x: 1260, h: 170, w: 110 },{ x: 1430, h: 110, w: 90 },
    { x: 1620, h: 140, w: 100 },{ x: 1800, h: 80, w: 80 },
    { x: 1980, h: 160, w: 110 },{ x: 2160, h: 100, w: 90 },
    { x: 2340, h: 130, w: 100 },{ x: 2520, h: 170, w: 80 },
    { x: 2700, h: 90, w: 110 }, { x: 2880, h: 120, w: 90 },
  ];

  platforms.forEach(({ x: bx, h: bh, w: bw }, i) => {
    const by = GND() - bh;
    plats.push({ x: bx, y: by, w: bw, h: 16, t: 'b' });
    const coinCount = Math.floor(bw / 35);
    for (let c = 0; c < coinCount; c++) {
      coinArr.push({ x: bx + 8 + c * 32, y: by - 30, col: false, ph: Math.random() * Math.PI * 2 });
    }
    // スパイク：よちよちと同じ仕組みで浮き床上を歩く
    if (i % 3 === 2) {
      enms.push({
        x: bx + bw * 0.3, y: by - 16,
        w: 30, h: 28,
        vx: -(1.6 + Math.random() * 0.4), vy: 0,
        alive: true, flying: true, spiky: true, type: 'spike',
        knockvx: 0, knockvy: 0,
        platX: bx, platW: bw,
        baseY: by - 16
      });
    }
  });

  plats.push({ x: 1465, y: GND() - 110 - 60, w: 20, h: 60, t: 'checkpoint' });
}

function genStage3() {
  for (let x = -100; x < 400; x += 170) plats.push({ x, y: GND(), w: 190, h: WORLD_H, t: 'g' });
  for (let x = 2800; x < WLEN + 200; x += 170) plats.push({ x, y: GND(), w: 190, h: WORLD_H, t: 'g' });
  plats.push({ x: 1400, y: GND(), w: 200, h: WORLD_H, t: 'g' });

  const rng = (min, max) => min + Math.random() * (max - min);

  const fuwaPositions = [];
  let fx = 480;
  while (fx < 1380) { fuwaPositions.push(fx + rng(-20, 30)); fx += rng(100, 160); }
  fx = 1610;
  while (fx < 2780) { fuwaPositions.push(fx + rng(-20, 30)); fx += rng(95, 165); }

  fuwaPositions.forEach((fpx) => {
    const heightOpts = [GND() - 80, GND() - 120, GND() - 160, GND() - 100, GND() - 200];
    const fpy = heightOpts[Math.floor(Math.random() * heightOpts.length)] + rng(-25, 25);
    const ph = Math.random() * Math.PI * 2;
    enms.push({
      x: fpx, y: fpy, w: 44, h: 32, vx: 0, vy: 0,
      alive: true, flying: true, spiky: false, type: 'fuwaghost',
      knockvx: 0, knockvy: 0, floatPh: ph,
      initX: fpx, initY: fpy, initPh: ph, respawnable: true
    });
    coinArr.push({ x: fpx + 10, y: fpy - 30, col: false, ph: Math.random() * Math.PI * 2 });
  });

  [570, 820, 960, 1210, 1720, 1980, 2100, 2500].forEach((ux) => {
    enms.push({
      x: ux + rng(-30, 30), y: GND() - 140 - rng(0, 100),
      w: 30, h: 30, vx: 0, vy: 0,
      alive: true, flying: true, spiky: true, type: 'uni',
      knockvx: 0, knockvy: 0,
      floatPh: Math.random() * Math.PI * 2,
      floatRange: 55 + Math.random() * 55
    });
  });

  for (let i = 0; i < 20; i++) {
    coinArr.push({ x: 400 + i * 115 + rng(-20, 20), y: GND() - 170 - rng(0, 100), col: false, ph: Math.random() * Math.PI * 2 });
  }

  plats.push({ x: 1400, y: GND() - 60, w: 20, h: 60, t: 'checkpoint' });
}
