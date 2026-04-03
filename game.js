// ===== スプライト読み込み =====
const IMG = {};
const SPRITE_NAMES = ['idle_r', 'idle_l', 'walk_r', 'walk_l'];
let imgsLoaded = 0;
SPRITE_NAMES.forEach(name => {
  IMG[name] = new Image();
  IMG[name].onload = () => imgsLoaded++;
  IMG[name].src = `mochipuni_${name}.png`;
});

// ===== Canvas =====
const canvas = document.getElementById('gc'), ctx = canvas.getContext('2d');
let W = 0, H = 0;
function resize() {
  const hudH = document.getElementById('hud').offsetHeight || 28;
  const ctrlH = document.getElementById('controls').offsetHeight || 90;
  H = window.innerHeight - hudH - ctrlH; W = window.innerWidth;
  canvas.width = W; canvas.height = H;
}
resize(); window.addEventListener('resize', resize);

// ===== 入力 =====
const inp = { left: false, right: false };
function setupBtn(id, key) {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', e => { e.preventDefault(); inp[key] = true; el.classList.add('pressed'); }, { passive: false });
  el.addEventListener('touchend', e => { e.preventDefault(); inp[key] = false; el.classList.remove('pressed'); }, { passive: false });
  el.addEventListener('touchcancel', e => { inp[key] = false; el.classList.remove('pressed'); }, { passive: false });
}
setupBtn('bL', 'left'); setupBtn('bR', 'right');

const bJ = document.getElementById('bJ');
bJ.addEventListener('touchstart', e => {
  e.preventDefault(); bJ.classList.add('pressed');
  if (gState === 'playing' && pl.jumps > 0) { pl.vy = -15; pl.jumps--; sfxJump(); }
}, { passive: false });
bJ.addEventListener('touchend', e => { e.preventDefault(); bJ.classList.remove('pressed'); }, { passive: false });

const bK = document.getElementById('bK');
bK.addEventListener('touchstart', e => {
  e.preventDefault(); bK.classList.add('pressed');
  if (gState === 'playing' && pl.kick <= 0) { pl.kick = 18; sfxKick(); }
}, { passive: false });
bK.addEventListener('touchend', e => { e.preventDefault(); bK.classList.remove('pressed'); }, { passive: false });

const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if ((e.code === 'Space' || e.code === 'ArrowUp') && gState === 'playing') { e.preventDefault(); if (pl.jumps > 0) { pl.vy = -15; pl.jumps--; sfxJump(); } }
  if (e.code === 'KeyZ' && gState === 'playing' && pl.kick <= 0) { pl.kick = 18; sfxKick(); }
});
document.addEventListener('keyup', e => keys[e.code] = false);

// ===== ゲーム変数 =====
let gState = 'menu', score = 0, coins = 0, lives = 3, frame = 0;
let camX = 0, camY = 0;
let stage = 1;
const PW = 48, PH = 60;
const pl = { x: 80, y: 0, w: PW, h: PH, vx: 0, vy: 0, ground: false, jumps: 2, face: 1, inv: 0, kick: 0, leg: 0 };
let plats = [], enms = [], coinArr = [], parts = [], stars = [];

// ===== パーティクル =====
function coinFx(x, y) { for (let i = 0; i < 6; i++) parts.push({ x, y, vx: (Math.random() - .5) * 5, vy: -(Math.random() * 4 + 2), life: 22, ml: 22, col: '#ffd700', r: 3 }); }
function dieFx(x, y, col = '#ff4455') { for (let i = 0; i < 10; i++) parts.push({ x, y, vx: (Math.random() - .5) * 7, vy: -(Math.random() * 5 + 2), life: 28, ml: 28, col, r: 4 }); }
function kickFx(x, y) { for (let i = 0; i < 8; i++) parts.push({ x, y, vx: (Math.random() - .5) * 8, vy: -(Math.random() * 3 + 1), life: 20, ml: 20, col: '#ff9900', r: 3 }); }

// ===== 安全なリスポーン位置を探す =====
function safeRespawnX() {
  // チェックポイントが有効ならそこから
  if (checkpoint && checkpoint.active) return checkpoint.x;
  // なければカメラ位置か80の大きい方、かつ地面がある場所を探す
  const baseX = Math.max(camX + 40, 80);
  for (let tx = baseX; tx < baseX + 400; tx += 20) {
    const onGround = plats.some(p => p.t === 'g' && tx >= p.x && tx <= p.x + p.w);
    if (onGround) return tx;
  }
  return 80;
}

// ===== UI =====
function hit(ax, ay, aw, ah, bx, by, bw, bh) { return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by; }
function ui() { document.getElementById('sc').textContent = score; document.getElementById('co').textContent = coins; document.getElementById('li').textContent = lives; }
function showBanner(t) { const b = document.getElementById('stage-banner'); b.textContent = t; b.style.opacity = 1; setTimeout(() => b.style.opacity = 0, 2000); }
function showOv(title, desc, btn) {
  stopBGM();
  const ov = document.getElementById('overlay'); ov.classList.remove('hidden');
  ov.querySelector('h1').innerHTML = title; ov.querySelector('p').innerHTML = desc; ov.querySelector('button').textContent = btn;
}

function loseLife() {
  sfxDamage(); lives--; ui();
  if (lives <= 0) { gState = 'over'; showOv('GAME OVER', `SCORE: ${score}<br>COIN: ${coins}<br><br>またがんばるゆ！`, '▶ TRY AGAIN'); }
  else {
    const rx = safeRespawnX();
    pl.x = rx; pl.y = GND() - PH - 10; pl.vx = 0; pl.vy = 0; pl.inv = 120;
  }
}

function nextStage() {
  stage++; gState = 'playing';
  pl.x = 80; pl.y = GND() - PH - 10; pl.vx = 0; pl.vy = 0; pl.ground = false; pl.jumps = 2; pl.inv = 0; pl.kick = 0;
  camX = 0; camY = 0; genWorld(); showBanner(`STAGE ${stage}`);
  if (!bgmPlaying) startBGM();
  requestAnimationFrame(loop);
}

function startGame() {
  try { getAudio().resume(); } catch (e) { }
  score = 0; coins = 0; lives = 3; frame = 0; camX = 0; camY = 0; stage = 1;
  pl.x = 80; pl.y = GND() - PH - 10; pl.vx = 0; pl.vy = 0; pl.ground = false; pl.jumps = 2; pl.inv = 0; pl.kick = 0; pl.leg = 0;
  stopBGM(); genWorld();
  document.getElementById('overlay').classList.add('hidden');
  gState = 'playing'; ui(); requestAnimationFrame(loop);
}
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('overlay').querySelector('button').addEventListener('click', startGame);

// ===== カメラ =====
function updateCamera() {
  const tgtX = pl.x - W * 0.3;
  camX += (tgtX - camX) * 0.12;
  if (camX < 0) camX = 0;
  const plScreenY = pl.y - camY;
  const topMargin = H * 0.22;
  const botMargin = H * 0.75;
  let tgtY = camY;
  if (plScreenY < topMargin) { tgtY = pl.y - topMargin; }
  else if (plScreenY + PH > botMargin) { tgtY = pl.y + PH - botMargin; }
  tgtY = Math.max(0, Math.min(tgtY, WORLD_H - H));
  camY += (tgtY - camY) * 0.1;
}

// ===== Update =====
function update() {
  frame++;
  const ml = inp.left || keys['ArrowLeft'] || keys['KeyA'];
  const mr = inp.right || keys['ArrowRight'] || keys['KeyD'];
  if (ml) { pl.vx = -5; pl.face = -1; } else if (mr) { pl.vx = 5; pl.face = 1; } else pl.vx *= 0.75;
  if (Math.abs(pl.vx) > 0.5) pl.leg += Math.abs(pl.vx) * 0.1;
  pl.vy += 0.65; if (pl.vy > 20) pl.vy = 20;
  pl.x += pl.vx; pl.y += pl.vy; pl.ground = false;

  for (const p of plats) {
    if (!hit(pl.x, pl.y, pl.w, pl.h, p.x, p.y, p.w, p.h)) continue;

    // チェックポイント
    if (p.t === 'checkpoint') {
      if (!checkpoint.active) { checkpoint.active = true; checkpoint.x = p.x; }
      continue;
    }

    if (p.t === 'goal') {
      const tx = p.x + p.w / 2 - 6;
      if (hit(pl.x, pl.y, pl.w, pl.h, tx, p.y, 12, p.h)) {
        if (stage < 3) {
          gState = 'transit';
          const msgs = ['', 'ステージ2へ行くゆ〜！🥹', 'ステージ3へ行くゆ〜！🥹'];
          showOv(`STAGE ${stage} CLEAR! 🎉`, `SCORE: ${score}<br>COIN: ${coins}<br><br>${msgs[stage]}`, '▶ NEXT STAGE!');
          const btn = document.getElementById('overlay').querySelector('button');
          btn.removeEventListener('click', startGame);
          btn.addEventListener('click', () => { document.getElementById('overlay').classList.add('hidden'); nextStage(); }, { once: true });
          btn.addEventListener('click', () => btn.addEventListener('click', startGame), { once: true });
        } else {
          gState = 'over';
          showOv('ALL CLEAR!! 🏆', `TOTAL: ${score + coins * 10}<br>COIN: ${coins}<br><br>すごいゆ〜！🥹🥹`, '▶ PLAY AGAIN');
        }
        return;
      }
      const ox2 = Math.min(pl.x + pl.w, p.x + p.w) - Math.max(pl.x, p.x);
      const oy2 = Math.min(pl.y + pl.h, p.y + p.h) - Math.max(pl.y, p.y);
      if (ox2 < oy2) { pl.vx = 0; pl.x += pl.x < p.x ? -ox2 : ox2; }
      else if (pl.vy > 0 && pl.y + pl.h - pl.vy <= p.y + 4) { pl.y = p.y - pl.h; pl.vy = 0; pl.ground = true; pl.jumps = 2; }
      continue;
    }
    const ox = Math.min(pl.x + pl.w, p.x + p.w) - Math.max(pl.x, p.x);
    const oy = Math.min(pl.y + pl.h, p.y + p.h) - Math.max(pl.y, p.y);
    if (ox < oy) { pl.vx = 0; pl.x += pl.x < p.x ? -ox : ox; }
    else {
      if (pl.vy > 0 && pl.y + pl.h - pl.vy <= p.y + 4) { pl.y = p.y - pl.h; pl.vy = 0; pl.ground = true; pl.jumps = 2; }
      else if (pl.vy < 0) { pl.y = p.y + p.h; pl.vy = 0; }
    }
  }
  if (pl.y > WORLD_H + 100) { loseLife(); return; }

  for (const c of coinArr) {
    if (!c.col && hit(pl.x, pl.y, pl.w, pl.h, c.x, c.y, 22, 22)) { c.col = true; coins++; score += 10; coinFx(c.x + 11, c.y); sfxCoin(); ui(); }
  }

  for (const e of enms) {
    if (!e.alive) continue;

    // 羽ウニの上下移動
    if (e.type === 'uni') {
      e.y = (e.baseY || (e.baseY = e.y)) + Math.sin((e.floatPh || 0) + frame * 0.025) * (e.floatRange || 50);
    }

    // ステップ敵のふわふわ
    if (e.type === 'step') {
      e.y = (e.baseY || (e.baseY = e.y)) + Math.sin((e.floatPh || 0) + frame * 0.03) * 4;
    }

    // ゴーストのふわふわ
    if (e.type === 'ghost') {
      e.y = (e.baseY || (e.baseY = e.y)) + Math.sin((e.floatPh || 0) + frame * 0.04) * 5;
    }

    if (e.knockvx !== 0 || e.knockvy !== 0) {
      e.x += e.knockvx; e.y += e.knockvy; e.knockvy += 0.7;
      for (const e2 of enms) {
        if (!e2.alive || e2 === e) continue;
        if (hit(e.x, e.y, e.w, e.h, e2.x, e2.y, e2.w, e2.h)) { e2.alive = false; score += 80; dieFx(e2.x + 15, e2.y + 14, '#aa44ff'); sfxChain(); ui(); }
      }
      if (e.y > WORLD_H + 60 || e.x < -200 || e.x > WLEN + 200) e.alive = false;
      continue;
    }

    // flying以外は重力・床判定
    if (!e.flying) {
      e.vy += 0.6;
      e.x += e.vx; e.y += e.vy;
      let onPlat = false;
      for (const p of plats) {
        if (p.t === 'goal' || p.t === 'checkpoint') continue;
        if (!hit(e.x, e.y, e.w, e.h, p.x, p.y, p.w, p.h)) continue;
        const ox = Math.min(e.x + e.w, p.x + p.w) - Math.max(e.x, p.x);
        const oy = Math.min(e.y + e.h, p.y + p.h) - Math.max(e.y, p.y);
        if (ox < oy) e.vx *= -1;
        else { e.y = p.y - e.h; e.vy = 0; onPlat = true; }
      }
      // 地面の端で折り返す（穴に落ちないように）
      if (onPlat) {
        const ahead = e.x + (e.vx > 0 ? e.w + 2 : -2);
        const edgeCheck = plats.some(p => p.t === 'g' && ahead >= p.x && ahead <= p.x + p.w);
        if (!edgeCheck) e.vx *= -1;
      }
      if (e.y > WORLD_H + 60) e.alive = false;
    } else {
      // flyingは水平移動のみ
      if (e.type !== 'uni' && e.type !== 'step' && e.type !== 'ghost') {
        e.x += e.vx; e.y += e.vy;
      } else {
        e.x += e.vx;
      }
    }

    if (pl.inv <= 0 && hit(pl.x, pl.y, pl.w, pl.h, e.x, e.y, e.w, e.h)) {
      // ステップ敵：上から踏んだら倒せる（一回限り足場）
      if (e.type === 'step') {
        if (pl.vy > 0 && pl.y + pl.h < e.y + e.h * 0.6) {
          e.alive = false; pl.vy = -12; score += 50; dieFx(e.x + 15, e.y + 10, '#44aaff'); sfxStomp(); ui();
        } else { loseLife(); return; }
      }
      // ゴーストと羽ウニ：触れたら即死
      else if (e.type === 'ghost' || e.type === 'uni') {
        loseLife(); return;
      }
      // スパイク：触れたら即死
      else if (e.spiky) {
        loseLife(); return;
      }
      // よちよち：上から踏めば倒せる
      else {
        if (pl.vy > 0 && pl.y + pl.h < e.y + e.h * 0.52) {
          e.alive = false; pl.vy = -12; score += 50; dieFx(e.x + 13, e.y + 13); sfxStomp(); ui();
        } else { loseLife(); return; }
      }
    }

    if (pl.kick > 0 && e.type !== 'ghost') {
      const kx = pl.face > 0 ? pl.x + pl.w - 4 : pl.x - 12;
      if (hit(kx, pl.y + pl.h * 0.25, 16, pl.h * 0.55, e.x, e.y, e.w, e.h)) {
        e.knockvx = pl.face * 13; e.knockvy = -7; e.vx = 0; e.vy = 0;
        score += 100; kickFx(e.x + 15, e.y + 14); sfxKick(); ui();
      }
    }
  }

  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
    if (p.life <= 0) parts.splice(i, 1);
  }

  if (pl.kick > 0) pl.kick--;
  if (pl.inv > 0) pl.inv--;
  score++; if (frame % 30 === 0) ui();
  updateCamera();
}

function loop() {
  if (gState !== 'playing') return;
  update(); draw();
  requestAnimationFrame(loop);
}

genWorld(); drawBG();
