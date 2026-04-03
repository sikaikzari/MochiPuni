// ===== Draw =====
function wx(x) { return x - camX; }
function wy(y) { return y - camY; }

function drawBG() {
  const top = stage === 1 ? '#060618' : stage === 2 ? '#050e1a' : '#020810';
  const bot = stage === 1 ? '#101138' : stage === 2 ? '#071525' : '#040d1e';
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  for (const s of stars) {
    const sx = ((s.x - camX * 0.22) % W + W) % W;
    const sy = s.y - camY * 0.15;
    if (sy < -5 || sy > H + 5) continue;
    const a = 0.3 + 0.7 * Math.abs(Math.sin(s.ph + frame * 0.018));
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
    ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = stage === 1 ? '#0b0b2e' : stage === 2 ? '#091826' : '#050a14';
  for (let i = 0; i < 9; i++) {
    const mx = ((i * 220 - camX * 0.07) % (W + 220) + W + 220) % (W + 220) - 110;
    const mh = 50 + i * 8 % 50;
    ctx.beginPath(); ctx.moveTo(mx, H); ctx.lineTo(mx + 80, H - mh); ctx.lineTo(mx + 200, H); ctx.fill();
  }
}

function drawPlat(p) {
  const sx = wx(p.x), sy = wy(p.y);
  if (sx + p.w < 0 || sx > W || sy + p.h < 0 || sy > H) return;

  if (p.t === 'checkpoint') {
    // チェックポイント旗
    ctx.fillStyle = checkpoint.active ? '#ffdd00' : '#888888';
    ctx.fillRect(sx + 8, sy, 4, p.h);
    ctx.fillStyle = checkpoint.active ? '#ff8800' : '#aaaaaa';
    ctx.beginPath(); ctx.moveTo(sx + 12, sy); ctx.lineTo(sx + 28, sy + 10); ctx.lineTo(sx + 12, sy + 20); ctx.fill();
    return;
  }

  if (p.t === 'goal') {
    const cx = sx + p.w / 2;
    ctx.fillStyle = '#5a3010'; ctx.fillRect(cx - 5, sy + 35, 10, p.h - 35);
    [[0, sy + 30, 26, '#3a8c22'], [0, sy + 14, 21, '#2e7a1a'], [0, sy + 1, 15, '#27691a']].forEach(([dx, ly, r, col]) => {
      const gg = ctx.createRadialGradient(cx + dx, ly - r * 0.3, 2, cx + dx, ly, r);
      gg.addColorStop(0, col); gg.addColorStop(1, '#1a4a10');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx + dx, ly, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.save(); ctx.translate(cx + Math.sin(frame * 0.1) * 3, sy - 14);
    ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⭐', 0, 0); ctx.restore();
    ctx.fillStyle = '#ffe066'; ctx.font = `bold ${Math.max(6, Math.round(W * 0.017))}px 'Press Start 2P',monospace`;
    ctx.textAlign = 'center'; ctx.fillText('GOAL', cx, sy + p.h - 6);
    return;
  }
  if (p.t === 'g') {
    const col = stage === 1 ? '#122212' : stage === 2 ? '#101820' : '#0a1018';
    const top = stage === 1 ? '#276227' : stage === 2 ? '#183a48' : '#102030';
    const grass = stage === 1 ? '#2e8c2e' : stage === 2 ? '#246070' : '#1a4060';
    ctx.fillStyle = col; ctx.fillRect(sx, sy, p.w, p.h);
    ctx.fillStyle = top; ctx.fillRect(sx, sy, p.w, 8);
    ctx.fillStyle = grass;
    for (let gx = sx; gx < sx + p.w; gx += 8) { ctx.beginPath(); ctx.moveTo(gx, sy); ctx.lineTo(gx + 4, sy - 5); ctx.lineTo(gx + 8, sy); ctx.fill(); }
  } else {
    const col = stage === 1 ? '#1a2660' : stage === 2 ? '#26196a' : '#1a1040';
    const top = stage === 1 ? '#2a44aa' : stage === 2 ? '#4422aa' : '#3322aa';
    const det = stage === 1 ? '#3355cc' : stage === 2 ? '#5533cc' : '#4433cc';
    ctx.fillStyle = col; ctx.fillRect(sx, sy, p.w, p.h);
    ctx.fillStyle = top; ctx.fillRect(sx, sy, p.w, 5);
    ctx.fillStyle = det;
    for (let bx = sx + 3; bx < sx + p.w - 3; bx += 22) ctx.fillRect(bx, sy + 7, 18, 6);
  }
}

function drawCoin(c) {
  if (c.col) return;
  const sx = wx(c.x), sy = wy(c.y);
  if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) return;
  const bob = Math.sin(c.ph + frame * 0.07) * 3;
  const sc = 0.6 + 0.4 * Math.abs(Math.sin(c.ph + frame * 0.09));
  ctx.save(); ctx.translate(sx + 11, sy + 11 + bob); ctx.scale(sc, 1);
  const g = ctx.createRadialGradient(-2, -2, 0, 0, 0, 11);
  g.addColorStop(0, '#fff3a0'); g.addColorStop(1, '#cc8800');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#aa6600'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('¥', 0, 1);
  ctx.restore();
}

function drawEnm(e) {
  if (!e.alive) return;
  const sx = wx(e.x), sy = wy(e.y);
  if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) return;

  ctx.save();

  // ===== よちよち敵 =====
  if (e.type === 'yochi') {
    ctx.translate(sx + e.w / 2, sy + e.h / 2);
    if (e.vx > 0) ctx.scale(-1, 1);
    const bob = Math.sin(frame * 0.15) * 2;
    // 体
    const bg = ctx.createRadialGradient(-2, -4, 1, 0, -2, 13);
    bg.addColorStop(0, '#fffbe8'); bg.addColorStop(1, '#e8d080');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, bob, 12, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#aa8800'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, bob, 12, 13, 0, 0, Math.PI * 2); ctx.stroke();
    // 目
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-4, bob - 3, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, bob - 3, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(-3.2, bob - 3.5, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.8, bob - 3.5, 0.8, 0, Math.PI * 2); ctx.fill();
    // 足
    const legSwing = Math.sin(frame * 0.2) * 4;
    ctx.fillStyle = '#c8a020';
    ctx.beginPath(); ctx.ellipse(-4, bob + 10 + legSwing * 0.3, 3.5, 4, legSwing * 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, bob + 10 - legSwing * 0.3, 3.5, 4, -legSwing * 0.05, 0, Math.PI * 2); ctx.fill();
  }

  // ===== ゴースト =====
  else if (e.type === 'ghost') {
    ctx.translate(sx + e.w / 2, sy + e.h / 2);
    if (e.vx > 0) ctx.scale(-1, 1);
    const floatY = Math.sin((e.floatPh || 0) + frame * 0.04) * 5;
    ctx.translate(0, floatY);
    ctx.globalAlpha = 0.62 + Math.sin(frame * 0.04) * 0.1;
    const gg = ctx.createRadialGradient(0, -4, 2, 0, 0, 18);
    gg.addColorStop(0, '#eeeeff'); gg.addColorStop(0.65, '#99aadd'); gg.addColorStop(1, 'rgba(80,100,200,0)');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(0, -5, 16, Math.PI, 0);
    ctx.lineTo(16, 8);
    for (let gx = 16; gx >= -16; gx -= 8) ctx.lineTo(gx - 4, gx % 16 === 0 ? 2 : 10);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2a3a5a';
    ctx.beginPath(); ctx.ellipse(-5, -7, 3.2, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -7, 3.2, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,80,80,0.9)';
    ctx.beginPath(); ctx.arc(-5, -7, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -7, 2, 0, Math.PI * 2); ctx.fill();
  }

  // ===== ステップ敵（踏んで渡る足場） =====
  else if (e.type === 'step') {
    ctx.translate(sx + e.w / 2, sy + e.h / 2);
    const floatY = Math.sin((e.floatPh || 0) + frame * 0.03) * 4;
    ctx.translate(0, floatY);
    // 丸っこい雲みたいな体
    const sg = ctx.createRadialGradient(0, -2, 2, 0, 0, 20);
    sg.addColorStop(0, '#aaddff'); sg.addColorStop(1, '#4488cc');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2266aa'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2); ctx.stroke();
    // 顔
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-6, -2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -2, 2, 0, Math.PI * 2); ctx.fill();
    // にっこり
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 5, 0.2, Math.PI - 0.2); ctx.stroke();
  }

  // ===== 羽ウニ =====
  else if (e.type === 'uni') {
    ctx.translate(sx + e.w / 2, sy + e.h / 2);
    const floatY = Math.sin((e.floatPh || 0) + frame * 0.025) * (e.floatRange || 50);
    ctx.translate(0, floatY * 0.01); // 実際の移動はgame.jsで
    // 羽
    const wingFlap = Math.sin(frame * 0.2) * 0.3;
    ctx.save(); ctx.rotate(-0.3 + wingFlap);
    ctx.fillStyle = 'rgba(200,240,255,0.7)';
    ctx.beginPath(); ctx.ellipse(-12, -8, 10, 5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.rotate(0.3 - wingFlap);
    ctx.fillStyle = 'rgba(200,240,255,0.7)';
    ctx.beginPath(); ctx.ellipse(12, -8, 10, 5, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // 体
    const ub = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
    ub.addColorStop(0, '#ffaacc'); ub.addColorStop(1, '#cc2266');
    ctx.fillStyle = ub;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    // トゲ
    ctx.fillStyle = '#aa1144';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      const tx = Math.cos(a) * 13, ty = Math.sin(a) * 13;
      ctx.beginPath(); ctx.moveTo(tx, ty);
      ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
      ctx.lineTo(Math.cos(a + 0.25) * 13, Math.sin(a + 0.25) * 13);
      ctx.fill();
    }
    // 目
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-4, -2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-3.5, -2, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4.5, -2, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  // ===== 2面スパイク敵 =====
  else if (e.type === 'spike') {
    ctx.translate(sx + e.w / 2, sy + e.h / 2);
    if (e.knockvx !== 0 || e.vx > 0) ctx.scale(-1, 1);
    const t = frame * 0.07;
    const mojoA = [-65, -45, -25, -5, 15, 35, 55, 75, -75, -55, -35, -15, 5, 25, 45, 65];
    const mojoL = [17, 21, 23, 21, 23, 21, 19, 17, 13, 17, 19, 17, 19, 17, 15, 17];
    mojoA.forEach((deg, i) => {
      const rad = (deg - 90) * Math.PI / 180, len = mojoL[i];
      const wave = Math.sin(t + i * 0.6) * 1.2;
      const ex = Math.cos(rad + wave * 0.04) * len, ey = Math.sin(rad + wave * 0.04) * len - 6;
      ctx.strokeStyle = `hsl(${235 + i * 4},80%,52%)`; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(Math.cos(rad) * 5, Math.sin(rad) * 5 - 6);
      ctx.quadraticCurveTo(ex * 0.4 + wave, ey * 0.4, ex, ey); ctx.stroke();
    });
    const bg = ctx.createRadialGradient(-2, -8, 2, 0, -6, 12);
    bg.addColorStop(0, '#7788ff'); bg.addColorStop(1, '#2211bb');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, -6, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cc0022';
    [[-6, -17], [0, -20], [6, -17]].forEach(([tx, ty]) => { ctx.beginPath(); ctx.moveTo(tx - 3, ty + 5); ctx.lineTo(tx, ty - 3); ctx.lineTo(tx + 3, ty + 5); ctx.fill(); });
    ctx.fillStyle = '#ff1133';
    ctx.beginPath(); ctx.arc(-3.5, -8, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5, -8, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,220,0.85)';
    ctx.beginPath(); ctx.arc(-4.5, -9, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(2.5, -9, 1.1, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

function drawPlayer() {
  const sx = wx(pl.x), sy = wy(pl.y);
  if (pl.inv > 0 && Math.floor(pl.inv / 5) % 2 === 0) return;
  if (pl.kick > 0) {
    const kickProgress = pl.kick / 18;
    const kx = pl.face > 0 ? sx + PW + 4 : sx - 4;
    const ky = sy + PH * 0.5;
    const lineLen = 28 * kickProgress;
    ctx.save(); ctx.globalAlpha = kickProgress * 0.9;
    ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 8 * kickProgress; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + (pl.face > 0 ? lineLen : -lineLen), ky); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 * kickProgress;
    ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + (pl.face > 0 ? lineLen : -lineLen), ky); ctx.stroke();
    ctx.strokeStyle = '#ff6600'; ctx.lineWidth = 2 * kickProgress;
    for (let r = -1; r <= 1; r++) { ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + (pl.face > 0 ? lineLen : -lineLen), ky + r * 10 * kickProgress); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.restore();
  }
  const moving = Math.abs(pl.vx) > 0.5;
  const name = moving ? (pl.face > 0 ? 'walk_r' : 'walk_l') : (pl.face > 0 ? 'idle_r' : 'idle_l');
  const img = IMG[name];
  if (img && img.complete && imgsLoaded > 0) {
    const bnc = pl.ground ? Math.sin(frame * 0.28) * 1.5 : 0;
    if (pl.kick > 10) {
      ctx.save(); ctx.translate(sx + PW / 2, sy + PH / 2 + bnc);
      ctx.rotate(pl.face > 0 ? 0.15 : -0.15);
      ctx.drawImage(img, -PW / 2, -PH / 2, PW, PH); ctx.restore();
    } else {
      ctx.drawImage(img, sx, sy + bnc, PW, PH);
    }
  }
}

function drawParts() {
  for (const p of parts) {
    const sx = wx(p.x), sy = wy(p.y);
    if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
    ctx.globalAlpha = p.life / p.ml; ctx.fillStyle = p.col;
    ctx.beginPath(); ctx.arc(sx, sy, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawProgress() {
  const prog = Math.min(pl.x / WLEN, 1), bw = W - 32;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(16, H - 10, bw, 5);
  const g = ctx.createLinearGradient(16, 0, 16 + bw, 0);
  g.addColorStop(0, '#5c35cc'); g.addColorStop(1, '#ff6b9d');
  ctx.fillStyle = g; ctx.fillRect(16, H - 10, bw * prog, 5);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBG();
  for (const p of plats) drawPlat(p);
  for (const c of coinArr) drawCoin(c);
  for (const e of enms) drawEnm(e);
  drawPlayer();
  drawParts();
  drawProgress();
}
