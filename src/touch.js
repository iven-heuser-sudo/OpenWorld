// Touch-Steuerung für Tablets und Handys: Joystick, Wischen zum Umsehen, Aktionsknöpfe.

export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1;
}

const STICK_RADIUS = 60;
const LOOK_SPEED = 1.9;

export class TouchControls {
  constructor(game) {
    this.g = game;
    this.input = { axisX: 0, axisY: 0, ShiftLeft: false, Space: false };
    this.stickId = null;
    this.lookId = null;
    document.body.classList.add('touch');

    const root = document.createElement('div');
    root.id = 'touch';
    root.innerHTML = `
      <div id="t-look"></div>
      <div id="t-stick" class="hidden"><div id="t-knob"></div></div>
      <div id="t-top">
        <button data-a="pause" title="Pause">⏸</button>
        <button data-a="inv" title="Rucksack">🎒</button>
        <button data-a="eat" title="Essen">🍖</button>
      </div>
      <div id="t-actions">
        <button id="t-jump" data-a="jump">⤒</button>
        <button id="t-r" data-a="r">R</button>
        <button id="t-e" data-a="e">✋</button>
        <button id="t-attack" data-a="attack">⚔️</button>
      </div>`;
    document.getElementById('hud').appendChild(root);
    this.stick = root.querySelector('#t-stick');
    this.knob = root.querySelector('#t-knob');

    const look = root.querySelector('#t-look');
    look.addEventListener('touchstart', e => this.onStart(e), { passive: false });
    look.addEventListener('touchmove', e => this.onMove(e), { passive: false });
    look.addEventListener('touchend', e => this.onEnd(e));
    look.addEventListener('touchcancel', e => this.onEnd(e));

    for (const btn of root.querySelectorAll('button[data-a]')) {
      btn.addEventListener('touchstart', e => { e.preventDefault(); btn.classList.add('down'); this.press(btn.dataset.a, true); }, { passive: false });
      const up = e => { e.preventDefault(); btn.classList.remove('down'); this.press(btn.dataset.a, false); };
      btn.addEventListener('touchend', up, { passive: false });
      btn.addEventListener('touchcancel', up, { passive: false });
    }

    document.getElementById('hotbar').addEventListener('touchstart', e => {
      const slot = e.target.closest('.slot');
      if (!slot) return;
      e.preventDefault();
      this.g.selectIndex(+slot.dataset.i);
    }, { passive: false });

    // Kein Zoomen oder Scrollen der Seite durch Gesten.
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('touchmove', e => { if (e.touches.length > 1 || this.g.state === 'playing') e.preventDefault(); }, { passive: false });
  }

  press(action, down) {
    const g = this.g;
    if (action === 'attack') {
      g.mouseDown = down;
      if (down) g.primary();
      return;
    }
    if (action === 'jump') { this.input.Space = down; return; }
    if (!down || g.state !== 'playing') return;
    if (action === 'e') g.interact();
    else if (action === 'r') g.secondary();
    else if (action === 'eat') g.quickEat();
    else if (action === 'inv') { if (g.sleepT === null) g.toggleInventory(); }
    else if (action === 'pause') g.pause();
  }

  onStart(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (this.stickId === null && t.clientX < innerWidth * 0.42) {
        this.stickId = t.identifier;
        this.sx = t.clientX;
        this.sy = t.clientY;
        this.stick.style.left = t.clientX + 'px';
        this.stick.style.top = t.clientY + 'px';
        this.stick.classList.remove('hidden');
        this.setStick(0, 0);
      } else if (this.lookId === null) {
        this.lookId = t.identifier;
        this.lx = t.clientX;
        this.ly = t.clientY;
      }
    }
  }

  onMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this.stickId) {
        this.setStick(t.clientX - this.sx, t.clientY - this.sy);
      } else if (t.identifier === this.lookId) {
        if (this.g.state === 'playing' && this.g.sleepT === null) {
          this.g.player.look((t.clientX - this.lx) * LOOK_SPEED, (t.clientY - this.ly) * LOOK_SPEED);
        }
        this.lx = t.clientX;
        this.ly = t.clientY;
      }
    }
  }

  onEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this.stickId) {
        this.stickId = null;
        this.stick.classList.add('hidden');
        this.setStick(0, 0);
      } else if (t.identifier === this.lookId) {
        this.lookId = null;
      }
    }
  }

  setStick(dx, dy) {
    const d = Math.hypot(dx, dy);
    if (d > STICK_RADIUS) { dx *= STICK_RADIUS / d; dy *= STICK_RADIUS / d; }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const mag = Math.min(1, d / STICK_RADIUS);
    const dead = mag < 0.15;
    this.input.axisX = dead ? 0 : dx / STICK_RADIUS;
    this.input.axisY = dead ? 0 : -dy / STICK_RADIUS;
    this.input.ShiftLeft = mag > 0.92;
  }

  reset() {
    this.stickId = this.lookId = null;
    this.stick.classList.add('hidden');
    this.setStick(0, 0);
    this.input.Space = false;
    this.g.mouseDown = false;
  }
}
