// ===== ステージ設定 =====
const WLEN = 3200;
const WORLD_H = 800;
const GND = () => WORLD_H - 36;

// チェックポイント（将来用）
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

function genStage1() {
  const holes = [700, 1200, 1900, 2500];
  const holeW = 130;
  let gx = -100;
  while (gx < WLEN + 200) {
    const isHole = holes.some(hx => gx + 190 > hx && gx < hx + holeW);
    if (!isHole) plats.push({ x: gx, y: GND(), w: 190, h: WORLD_H, t: 'g' });
    gx += 170;
  }

  const platforms = [
    { x: 150, h: 140, w: 110 }, { x: 370, h: 100, w: 90 },
    { x: 560, h: 170, w: 120 }, { x: 760, h: 120, w: 100 },
    { x: 950, h: 150, w: 80 },  { x: 1130, h: 90, w: 110 },
    { x: 1320, h: 160, w: 90 }, { x: 1500, h: 110, w: 100 },
    { x: 1700, h: 140, w: 120 },{ x: 1880, h: 80, w: 90 },
    { x: 2080, h: 155, w: 100 },{ x: 2260, h: 100, w: 110 },
    { x: 2450, h: 130, w: 90 }, { x: 2640, h: 160, w: 100 },
    { x: 2820, h: 90, w: 110 },
  ];

  platforms.forEach(({ x: bx, h: bh, w: bw }, i) => {
    const by = GND() - bh;
    plats.push({ x: bx, y: by, w: bw, h: 16, t: 'b' });
    const coinCount = Math.floor(bw / 35);
    for (let c = 0; c < coinCount; c++) {
      coinArr.push({ x: bx + 8 + c * 32, y: by - 30, col: false, ph: Math.random() * Math.PI * 2 });
    }
    // よちよち敵（地面歩き）
    if (i % 5 === 2) {
      enms.push({ x: bx + 30, y: GND() - 28, w: 26, h: 26, vx: -(0.4 + Math.random() * 0.3), vy: 0, alive: true, flying: false, spiky: false, type: 'yochi', knockvx: 0, knockvy: 0 });
    }
    // ゴースト（空中浮遊・触ると痛い）
    if (i % 4 === 1) {
      enms.push({ x: bx + 20, y: by - 50, w: 36, h: 34, vx: -(0.5 + Math.random() * 0.3), vy: 0, alive: true, flying: true, spiky: true, type: 'ghost', knockvx: 0, knockvy: 0, floatPh: Math.random() * Math.PI * 2 });
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
    if (i % 3 === 2) {
      enms.push({ x: bx + 20, y: by - 34, w: 30, h: 28, vx: -(1.6 + Math.random() * 0.4), vy: 0, alive: true, flying: false, spiky: true, type: 'spike', knockvx: 0, knockvy: 0 });
    }
  });

plats.push({ x: 1450, y: GND(), w: 20, h: 60, t: 'checkpoint' });
}

function genStage3() {
  // 最初と最後だけ地面
  for (let x = -100; x < 400; x += 170) plats.push({ x, y: GND(), w: 190, h: WORLD_H, t: 'g' });
  for (let x = 2800; x < WLEN + 200; x += 170) plats.push({ x, y: GND(), w: 190, h: WORLD_H, t: 'g' });
  plats.push({ x: 1400, y: GND(), w: 200, h: WORLD_H, t: 'g' });

  // ステップ敵（踏んで渡る一回限り足場）
  const stepPositions = [500, 620, 750, 880, 1020, 1150, 1280, 1650, 1780, 1900, 2030, 2160, 2290, 2430, 2560, 2680];
  stepPositions.forEach((sx, i) => {
    const sy = GND() - 120 - Math.sin(i * 0.8) * 60;
    enms.push({ x: sx, y: sy, w: 44, h: 22, vx: 0, vy: 0, alive: true, flying: true, spiky: false, type: 'step', knockvx: 0, knockvy: 0, floatPh: Math.random() * Math.PI * 2 });
    coinArr.push({ x: sx + 10, y: sy - 30, col: false, ph: Math.random() * Math.PI * 2 });
  });

  // 羽ウニ（上下動・触れると死）
  const uniPositions = [570, 820, 960, 1210, 1720, 1980, 2100, 2500];
  uniPositions.forEach((ux, i) => {
    const uy = GND() - 150 - i * 10 % 80;
    enms.push({ x: ux, y: uy, w: 30, h: 30, vx: 0, vy: 0, alive: true, flying: true, spiky: true, type: 'uni', knockvx: 0, knockvy: 0, floatPh: Math.random() * Math.PI * 2, floatRange: 60 + Math.random() * 40 });
  });

  for (let i = 0; i < 20; i++) {
    coinArr.push({ x: 400 + i * 120, y: GND() - 180 - Math.random() * 80, col: false, ph: Math.random() * Math.PI * 2 });
  }

  plats.push({ x: 1400, y: GND() - 60, w: 20, h: 60, t: 'checkpoint' });
}
