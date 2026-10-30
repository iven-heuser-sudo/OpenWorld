// HUD, Hotbar, Inventar/Herstellen, Minikarte und Menüs.
import { ITEMS, RECIPES } from './items.js';

const $ = id => document.getElementById(id);
const STAT_KEYS = ['health', 'hunger', 'thirst', 'warmth', 'stamina'];

export class UI {
  constructor(game) {
    this.g = game;
    this.bars = {};
    for (const k of STAT_KEYS) this.bars[k] = { fill: $(`bar-${k}`), row: $(`bar-${k}`).closest('.stat') };
    this.hotbarSig = '';
    this.promptHtml = '';
    this.mapCtx = $('minimap').getContext('2d');
    this.mapBuf = document.createElement('canvas');
    this.mapBuf.width = this.mapBuf.height = 64;
    this.mapBufCtx = this.mapBuf.getContext('2d');
    this.mapImg = this.mapBufCtx.createImageData(64, 64);
    this.mapTimer = 0;
    this.mapCenter = null;

    $('inv-close').addEventListener('click', () => this.g.toggleInventory(false));
    $('btn-new').addEventListener('click', () => this.g.startNew());
    $('btn-continue').addEventListener('click', () => this.g.continueGame());
    $('btn-respawn').addEventListener('click', () => this.g.respawn());
    $('btn-death-new').addEventListener('click', () => this.g.startNew());
    $('craft-list').addEventListener('click', e => {
      const btn = e.target.closest('button[data-craft]');
      if (btn) this.g.craft(btn.dataset.craft);
    });
  }

  show(id, on) { $(id).classList.toggle('hidden', !on); }

  showMenu(hasSave, paused) {
    this.show('menu', true);
    this.show('hud', false);
    $('btn-continue').classList.toggle('hidden', !hasSave);
    $('btn-continue').textContent = paused ? 'Weiterspielen' : 'Spielstand laden';
    $('menu-sub').textContent = paused ? 'Pausiert' : 'Überlebe in der endlosen Wildnis';
  }

  showHud() {
    this.show('menu', false);
    this.show('death', false);
    this.show('hud', true);
  }

  setLoading(text) {
    $('loading').textContent = text || '';
    this.show('loading', !!text);
  }

  showDeath(cause, days) {
    this.show('death', true);
    this.show('hud', false);
    $('death-cause').textContent = cause;
    $('death-days').textContent = `Du hast ${days} ${days === 1 ? 'Tag' : 'Tage'} überlebt.`;
    $('btn-respawn').textContent = this.g.spawnIsShelter ? 'Im Unterschlupf aufwachen' : 'Am Startpunkt aufwachen';
  }

  updateStats(s) {
    for (const k of STAT_KEYS) {
      const v = Math.max(0, Math.min(100, s[k]));
      this.bars[k].fill.style.width = v + '%';
      this.bars[k].row.classList.toggle('low', v < 22);
    }
  }

  renderHotbar(slots, selected, inv) {
    const sig = slots.map(id => id + ':' + (inv[id] || 0)).join('|') + '#' + selected;
    if (sig === this.hotbarSig) return;
    this.hotbarSig = sig;
    $('hotbar').innerHTML = slots.map((id, i) => {
      const it = ITEMS[id];
      const count = it.tool || it.unique ? '' : `<span class="count">${inv[id] || 0}</span>`;
      const key = i < 9 ? i + 1 : i === 9 ? 0 : '';
      return `<div class="slot${id === selected ? ' sel' : ''}" data-i="${i}" title="${it.name}">
        <span class="key">${key}</span><span class="icon">${it.icon}</span>${count}</div>`;
    }).join('');
    $('held-name').textContent = ITEMS[selected].name;
  }

  setPrompt(html) {
    if (html === this.promptHtml) return;
    this.promptHtml = html;
    if (this.g.touch) html = html.replace(/<kbd>LMB<\/kbd>/g, '<kbd>⚔️</kbd>').replace(/<kbd>E<\/kbd>/g, '<kbd>✋</kbd>');
    $('prompt').innerHTML = html;
    $('prompt').classList.toggle('hidden', !html);
  }

  message(text, kind = '') {
    const box = $('messages');
    const last = box.lastElementChild;
    if (last && last.dataset.text === text) {
      last.dataset.n = (+last.dataset.n || 1) + 1;
      last.textContent = `${text} ×${last.dataset.n}`;
      clearTimeout(last._t);
      last._t = setTimeout(() => last.remove(), 4000);
      return;
    }
    const el = document.createElement('div');
    el.className = 'msg ' + kind;
    el.dataset.text = text;
    el.textContent = text;
    box.appendChild(el);
    while (box.children.length > 6) box.firstElementChild.remove();
    el._t = setTimeout(() => el.remove(), 4000);
  }

  updateClock(day, frac, temp) {
    const mins = Math.floor(frac * 24 * 60);
    const hh = String(Math.floor(mins / 60)).padStart(2, '0');
    const mm = String(mins % 60).padStart(2, '0');
    const icon = frac > 0.23 && frac < 0.77 ? '☀️' : '🌙';
    $('clock').textContent = `Tag ${day} · ${hh}:${mm} ${icon}`;
    $('temp').textContent = temp;
  }

  flashDamage() {
    const el = $('damage-flash');
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
  }

  setFade(a) {
    $('fade').style.opacity = a;
  }

  // ---------- Inventar & Herstellen ----------

  renderInventory() {
    const inv = this.g.inv;
    const ids = Object.keys(ITEMS).filter(id => id !== 'hand' && (inv[id] || 0) > 0);
    $('inv-grid').innerHTML = ids.length
      ? ids.map(id => `<div class="inv-item" title="${ITEMS[id].name}"><span class="icon">${ITEMS[id].icon}</span>
          <span class="name">${ITEMS[id].name}</span><span class="n">${ITEMS[id].unique ? '' : inv[id]}</span></div>`).join('')
      : '<div class="empty">Dein Rucksack ist leer. Sammle Äste, Steine und Farne!</div>';
    $('craft-list').innerHTML = RECIPES.map(r => {
      const it = ITEMS[r.id];
      const owned = it.unique && inv[r.id] > 0;
      const can = !owned && Object.entries(r.needs).every(([k, n]) => (inv[k] || 0) >= n);
      const needs = Object.entries(r.needs).map(([k, n]) =>
        `<span class="need ${(inv[k] || 0) >= n ? 'ok' : 'no'}">${ITEMS[k].icon} ${inv[k] || 0}/${n}</span>`).join('');
      return `<div class="recipe ${can ? 'can' : ''}">
        <div class="r-icon">${it.icon}</div>
        <div class="r-body"><div class="r-name">${it.name}${owned ? ' <em>(vorhanden)</em>' : ''}</div>
          <div class="r-desc">${r.desc}</div><div class="r-needs">${needs}</div></div>
        <button data-craft="${r.id}" ${can ? '' : 'disabled'}>Herstellen</button></div>`;
    }).join('');
  }

  // ---------- Minikarte ----------

  drawMinimap(dt) {
    const g = this.g, p = g.player.pos;
    const SCALE = 3;
    this.mapTimer -= dt;
    const moved = !this.mapCenter || Math.hypot(p.x - this.mapCenter.x, p.z - this.mapCenter.z) > 6;
    if (this.mapTimer <= 0 && moved) {
      this.mapTimer = 0.4;
      this.mapCenter = { x: p.x, z: p.z };
      const d = this.mapImg.data;
      for (let j = 0; j < 64; j++) {
        for (let i = 0; i < 64; i++) {
          const c = g.world.mapColor(p.x + (i - 32) * SCALE, p.z + (j - 32) * SCALE);
          const o = (j * 64 + i) * 4;
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
        }
      }
      this.mapBufCtx.putImageData(this.mapImg, 0, 0);
    }
    if (!this.mapCenter) return;
    const ctx = this.mapCtx, W = 160, k = W / (64 * SCALE);
    const ox = (this.mapCenter.x - p.x) * k, oz = (this.mapCenter.z - p.z) * k;
    ctx.fillStyle = '#123';
    ctx.fillRect(0, 0, W, W);
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = g.env.daylight * 0.5 + 0.5;
    ctx.drawImage(this.mapBuf, ox, oz, W, W);
    ctx.globalAlpha = 1;
    const toMap = (x, z) => [W / 2 + (x - p.x) * k, W / 2 + (z - p.z) * k];
    for (const s of g.structures) {
      const [mx, my] = toMap(s.x, s.z);
      if (mx < 0 || my < 0 || mx > W || my > W) continue;
      ctx.fillStyle = s.type === 'campfire' ? (s.fuel > 0 ? '#ff9a2a' : '#7a5a3a') : '#f0e0b0';
      ctx.beginPath();
      ctx.arc(mx, my, s.type === 'campfire' ? 3.5 : 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(W / 2, W / 2);
    ctx.rotate(-g.player.yaw);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(0, 2); ctx.lineTo(-5, 5); ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', W / 2, 13);
  }
}
