// Waldläufer – Open-World-Survival im Wald.
import * as THREE from 'three';
import { World, OBJ, WATER_LEVEL } from './world.js';
import { Environment } from './env.js';
import { Player } from './player.js';
import { Animals } from './animals.js';
import { Particles } from './particles.js';
import { Sound } from './audio.js';
import { UI } from './ui.js';
import { ITEMS, RECIPES, HOTBAR_ORDER, FOOD_PRIORITY } from './items.js';
import { makeCampfire, makeShelter, makeViewModels, makeGhost } from './models.js';
import { TouchControls, isTouchDevice } from './touch.js';

const SAVE_KEY = 'waldlaeufer-save-v1';
const DAY_LENGTH = 600; // Sekunden pro Spieltag
const START_TIME = 0.3;
const FIRE_START = 300;
const FIRE_MAX = 600;
const FIRE_PER_WOOD = 90;
const MAX_LIGHTS = 4;
const VM_POS = new THREE.Vector3(0.3, -0.3, -0.62);

const _v = new THREE.Vector3();
const FULL_STATS = () => ({ health: 100, hunger: 100, thirst: 100, warmth: 100, stamina: 100 });

class Game {
  constructor() {
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.isTouch = isTouchDevice();
    r.setPixelRatio(Math.min(window.devicePixelRatio, this.isTouch ? 1.3 : 1.75));
    r.setSize(innerWidth, innerHeight);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.autoClear = false;
    this.canvas = r.domElement;
    document.getElementById('game').appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 700);
    this.scene.add(this.camera);
    this.env = new Environment(this.scene);
    this.particles = new Particles(this.scene);

    // Gegenstand in der Hand wird in einer eigenen Szene gezeichnet (kein Clipping in Bäume).
    this.vmScene = new THREE.Scene();
    this.vmCamera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 10);
    this.vmHemi = new THREE.HemisphereLight(0xffffff, 0x404030, 1.5);
    this.vmSun = new THREE.DirectionalLight(0xffffff, 1.2);
    this.vmSun.position.set(1, 2, 1.5);
    this.vmScene.add(this.vmHemi, this.vmSun);
    this.vmRoot = new THREE.Group();
    this.vmRoot.position.copy(VM_POS);
    this.vmRoot.scale.setScalar(0.6);
    this.vmRoot.rotation.set(0.05, -0.2, 0);
    this.vmScene.add(this.vmRoot);
    this.viewModels = makeViewModels();
    for (const k in this.viewModels) {
      this.viewModels[k].visible = false;
      this.vmRoot.add(this.viewModels[k]);
    }

    this.lights = [];
    for (let i = 0; i < MAX_LIGHTS; i++) {
      const l = new THREE.PointLight(0xffa860, 0, 26, 1.5);
      this.scene.add(l);
      this.lights.push(l);
    }

    this.ghosts = { campfire: makeGhost(makeCampfire), shelter: makeGhost(makeShelter) };
    for (const k in this.ghosts) { this.ghosts[k].visible = false; this.scene.add(this.ghosts[k]); }

    this.sound = new Sound();
    this.ui = new UI(this);
    this.touch = this.isTouch ? new TouchControls(this) : null;
    this.keys = {};
    this.mouseDown = false;
    this.locked = false;
    this.state = 'menu';
    this.invOpen = false;
    this.world = null;
    this.structures = [];
    this.inv = {};
    this.stats = FULL_STATS();
    this.selected = 'hand';
    this.time = START_TIME;
    this.attackCD = 0;
    this.swingT = 0;
    this.sleepT = null;
    this.dead = false;
    this.warned = {};
    this.msgCD = {};
    this.ambientT = 3;
    this.saveT = 20;
    this.menuAngle = 0;

    this.bindInput();
    this.createPreviewWorld();
    this.ui.showMenu(this.hasSave(), false);
    this.clock = new THREE.Clock();
    r.setAnimationLoop(() => this.frame());
    window.game = this;
  }

  // ---------- Spielstart / Laden ----------

  setupWorld(seed) {
    if (this.world) {
      this.world.dispose();
      this.animals.clear();
      for (const s of this.structures) this.scene.remove(s.mesh);
    }
    this.seed = seed;
    this.world = new World(this.scene, seed);
    this.structures = [];
    this.world.structures = this.structures;
    this.player = new Player(this.camera, this.world);
    this.animals = new Animals(this.scene, this.world);
    this.previewWorld = false;
  }

  createPreviewWorld() {
    this.setupWorld(Math.floor(Math.random() * 1e9));
    const sp = this.world.findSpawn(0, 0);
    this.spawn = { x: sp.x, z: sp.z };
    this.player.pos.set(sp.x, this.world.height(sp.x, sp.z), sp.z);
    this.world.day = START_TIME;
    this.world.loadAround(sp.x, sp.z);
    this.previewWorld = true;
  }

  hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
  }

  startNew() {
    this.sound.init();
    this.ui.setLoading('Der Wald wird erschaffen …');
    setTimeout(() => {
      if (!this.previewWorld) this.createPreviewWorld();
      this.previewWorld = false;
      this.time = START_TIME;
      this.world.day = this.time;
      this.inv = {};
      this.stats = FULL_STATS();
      this.selected = 'hand';
      this.spawnIsShelter = false;
      this.player.pos.set(this.spawn.x, this.world.height(this.spawn.x, this.spawn.z), this.spawn.z);
      this.player.yaw = 0;
      this.player.pitch = 0;
      this.dead = false;
      this.warned = {};
      this.ui.setLoading('');
      this.begin();
      this.save();
      this.ui.message('Du erwachst allein im Wald …', 'info');
      const [pick, bag] = this.touch ? ['✋', '🎒'] : ['E', 'Tab'];
      setTimeout(() => this.ui.message(`Sammle Äste, Steine und Farne mit ${pick}.`, 'info'), 1500);
      setTimeout(() => this.ui.message(`Stelle mit ${bag} eine Steinaxt her – vor der Nacht brauchst du ein Feuer!`, 'info'), 4000);
    }, 30);
  }

  continueGame() {
    this.sound.init();
    if (this.state === 'paused') { this.begin(); return; }
    let data;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { data = null; }
    if (!data) { this.startNew(); return; }
    this.ui.setLoading('Spielstand wird geladen …');
    setTimeout(() => {
      this.load(data);
      this.ui.setLoading('');
      this.begin();
      this.ui.message(`Willkommen zurück – Tag ${Math.floor(this.time) + 1}.`, 'info');
    }, 30);
  }

  load(d) {
    this.setupWorld(d.seed);
    this.time = d.time;
    this.world.day = d.time;
    this.inv = d.inv || {};
    this.stats = Object.assign(FULL_STATS(), d.stats);
    this.selected = d.selected && (d.selected === 'hand' || this.inv[d.selected]) ? d.selected : 'hand';
    this.spawn = d.spawn;
    this.spawnIsShelter = !!d.spawnIsShelter;
    this.world.removed = new Map(d.removed || []);
    for (const s of d.structures || []) this.addStructure(s.type, s.x, s.z, s.rot, s.fuel);
    const p = d.player;
    this.player.pos.set(p.x, p.y, p.z);
    this.player.yaw = p.yaw;
    this.player.pitch = p.pitch;
    this.dead = false;
    this.warned = {};
    this.world.loadAround(p.x, p.z);
  }

  save() {
    if (!this.world || this.previewWorld || this.dead) return;
    const p = this.player;
    const data = {
      v: 1, seed: this.seed, time: this.time, inv: this.inv, stats: this.stats, selected: this.selected,
      spawn: this.spawn, spawnIsShelter: this.spawnIsShelter,
      player: { x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw, pitch: p.pitch },
      removed: [...this.world.removed],
      structures: this.structures.map(s => ({ type: s.type, x: s.x, z: s.z, rot: s.rot, fuel: s.fuel })),
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* Speicher voll oder gesperrt */ }
  }

  begin() {
    this.sound.init();
    this.ui.showHud();
    this.state = 'playing';
    this.keys = {};
    this.clock.getDelta();
    this.requestLock();
  }

  pause() {
    if (this.touch) this.touch.reset();
    this.state = 'paused';
    this.keys = {};
    this.mouseDown = false;
    this.save();
    this.ui.showMenu(true, true);
  }

  requestLock() {
    if (this.touch) return;
    try {
      const res = this.canvas.requestPointerLock();
      if (res && res.catch) res.catch(() => {});
    } catch { /* z. B. ohne Benutzergeste */ }
  }

  // ---------- Eingabe ----------

  bindInput() {
    addEventListener('keydown', e => {
      if (e.code === 'Tab') {
        e.preventDefault();
        if (this.state === 'playing' && this.sleepT === null) this.toggleInventory();
        return;
      }
      if (this.state !== 'playing') return;
      if (this.invOpen) {
        if (['KeyI', 'KeyC', 'Escape'].includes(e.code)) this.toggleInventory(false);
        return;
      }
      if (e.code === 'Space') e.preventDefault();
      this.keys[e.code] = true;
      if (e.repeat || this.sleepT !== null) return;
      if (e.code === 'KeyE') this.interact();
      else if (e.code === 'KeyR') this.secondary();
      else if (e.code === 'KeyF') this.quickEat();
      else if (e.code === 'KeyI' || e.code === 'KeyC') this.toggleInventory(true);
      else if (/^Digit\d$/.test(e.code)) {
        const n = +e.code.slice(5);
        this.selectIndex(n === 0 ? 9 : n - 1);
      }
    });
    addEventListener('keyup', e => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; this.mouseDown = false; });
    addEventListener('mousemove', e => {
      if (this.locked && this.state === 'playing' && this.sleepT === null) this.player.look(e.movementX, e.movementY);
    });
    this.canvas.addEventListener('mousedown', e => {
      if (this.state !== 'playing' || this.invOpen) return;
      if (!this.locked) { this.requestLock(); return; }
      if (e.button === 0) { this.mouseDown = true; this.primary(); }
    });
    addEventListener('mouseup', e => { if (e.button === 0) this.mouseDown = false; });
    addEventListener('wheel', e => {
      if (this.state !== 'playing' || this.invOpen || !this.locked) return;
      const slots = this.hotbarSlots();
      const i = slots.indexOf(this.selected);
      this.selectIndex((i + (e.deltaY > 0 ? 1 : -1) + slots.length) % slots.length);
    }, { passive: true });
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === this.canvas;
      if (was && !this.locked && this.state === 'playing' && !this.invOpen && this.sleepT === null) this.pause();
    });
    addEventListener('resize', () => {
      this.renderer.setSize(innerWidth, innerHeight);
      for (const c of [this.camera, this.vmCamera]) { c.aspect = innerWidth / innerHeight; c.updateProjectionMatrix(); }
    });
    addEventListener('pagehide', () => this.save());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
  }

  toggleInventory(open = !this.invOpen) {
    this.invOpen = open;
    if (this.touch) this.touch.reset();
    this.ui.show('inventory', open);
    this.keys = {};
    this.mouseDown = false;
    if (open) {
      this.ui.renderInventory();
      if (document.pointerLockElement) document.exitPointerLock();
    } else {
      this.requestLock();
    }
  }

  // ---------- Inventar ----------

  hotbarSlots() {
    return HOTBAR_ORDER.filter(id => id === 'hand' || (this.inv[id] || 0) > 0);
  }

  selectIndex(i) {
    const slots = this.hotbarSlots();
    if (i >= 0 && i < slots.length) this.selected = slots[i];
  }

  add(id, n = 1, quiet = false) {
    this.inv[id] = (this.inv[id] || 0) + n;
    if (!quiet) this.ui.message(`+${n} ${ITEMS[id].name}`, 'good');
    if (this.invOpen) this.ui.renderInventory();
  }

  take(id, n = 1) {
    this.inv[id] = (this.inv[id] || 0) - n;
    if (this.inv[id] <= 0) delete this.inv[id];
    if (this.selected !== 'hand' && !this.inv[this.selected]) this.selected = 'hand';
    if (this.invOpen) this.ui.renderInventory();
  }

  hint(key, text, kind = 'bad') {
    const now = performance.now();
    if ((this.msgCD[key] || 0) > now) return;
    this.msgCD[key] = now + 2500;
    this.ui.message(text, kind);
  }

  craft(id) {
    const r = RECIPES.find(x => x.id === id);
    if (!r) return;
    const it = ITEMS[id];
    if (it.unique && this.inv[id]) return;
    for (const [k, n] of Object.entries(r.needs)) if ((this.inv[k] || 0) < n) return;
    for (const [k, n] of Object.entries(r.needs)) this.take(k, n);
    this.add(id, 1, true);
    this.ui.message(`${it.icon} ${it.name} hergestellt!`, 'good');
    this.sound.play('craft');
    if (it.tool || it.place) this.selected = id;
    if (id === 'flask') { this.ui.message('Fülle die Feldflasche am Wasser mit R.', 'info'); }
    this.ui.renderInventory();
  }

  // ---------- Aktionen ----------

  primary() {
    if (this.attackCD > 0 || this.sleepT !== null) return;
    const sel = this.selected;
    const it = ITEMS[sel];
    if (it.place) return this.place();
    if (it.food) { this.attackCD = 0.5; return this.eat(sel); }

    const t = this.target;
    if (t && t.kind === 'obj' && ['pickup', 'bush'].includes(OBJ[t.ref.type].kind)) return this.interact();

    this.attackCD = sel === 'spear' ? 0.7 : 0.5;
    this.swingT = 0.0001;
    this.sound.play('swing');
    if (!t) return;
    const p = this.player.pos;

    if (t.kind === 'animal') {
      const a = t.ref;
      const drops = this.animals.damage(a, it.damage, p.x, p.z);
      this.sound.play('hit');
      this.particles.emit(a.x, a.y + a.def.height * 0.6, a.z, 0xa01818, 8, 3);
      if (drops) {
        const parts = [];
        for (const [k, n] of Object.entries(drops)) { this.add(k, n, true); parts.push(`+${n} ${ITEMS[k].name}`); }
        this.ui.message(`${a.def.name} erlegt: ${parts.join(', ')}`, 'good');
      }
      return;
    }
    if (t.kind !== 'obj') return;
    const o = t.ref, def = OBJ[o.type];
    if (def.kind === 'tree') {
      if (sel !== 'axe') {
        this.sound.play('hit');
        this.hint('needaxe', this.inv.axe ? 'Rüste die Steinaxt aus, um Bäume zu fällen.' : 'Du brauchst eine Steinaxt, um Bäume zu fällen.');
        return;
      }
      o.hp -= 1;
      this.add('wood', 1);
      this.sound.play('chop');
      this.particles.emit(o.x - (o.x - p.x) * 0.15, this.camera.position.y - 0.3, o.z - (o.z - p.z) * 0.15, 0xb08a5a, 7, 3);
      if (o.hp <= 0) {
        this.world.fellTree(o, p.x, p.z);
        this.add('wood', 2);
        setTimeout(() => this.sound.play('fall'), 900);
      }
    } else if (def.kind === 'rock') {
      if (sel !== 'pickaxe') {
        this.sound.play('hit');
        this.hint('needpick', this.inv.pickaxe ? 'Rüste die Spitzhacke aus, um Felsen abzubauen.' : 'Du brauchst eine Spitzhacke für große Felsen.');
        return;
      }
      o.hp -= 1;
      this.add('stone', 1);
      this.sound.play('mine');
      this.particles.emit(o.x - (o.x - p.x) * 0.3, o.y + 0.6 * o.s, o.z - (o.z - p.z) * 0.3, 0x9a9890, 8, 3.5);
      if (o.hp <= 0) {
        this.world.hideObject(o);
        this.add('stone', 2);
        this.particles.emit(o.x, o.y + 0.5, o.z, 0x8a8880, 20, 5);
      }
    }
  }

  interact() {
    const t = this.target;
    if (!t || this.sleepT !== null) return;
    const s = this.stats;
    if (t.kind === 'obj') {
      const o = t.ref, def = OBJ[o.type];
      if (def.kind === 'pickup') {
        for (const [k, n] of Object.entries(def.give)) this.add(k, n);
        this.world.hideObject(o);
        this.sound.play('pickup');
      } else if (def.kind === 'bush') {
        if (o.berries) {
          this.add('berries', 2 + Math.floor(Math.random() * 3));
          this.world.takeBerries(o);
          this.sound.play('pickup');
        } else {
          this.hint('nob', 'Hier sind keine Beeren mehr – sie wachsen nach.', 'info');
        }
      } else if (def.kind === 'tree') {
        this.hint('tree', 'Bäume fällst du mit der Steinaxt (Linksklick).', 'info');
      } else if (def.kind === 'rock') {
        this.hint('rock', 'Felsen baust du mit der Spitzhacke ab (Linksklick).', 'info');
      }
    } else if (t.kind === 'struct') {
      const st = t.ref;
      if (st.type === 'campfire') {
        if (!this.inv.rawMeat) { this.hint('nomeat', 'Du hast kein rohes Fleisch zum Braten.', 'info'); return; }
        if (st.fuel <= 0) { this.hint('fireout', 'Das Feuer ist aus – lege Holz nach (R).'); return; }
        this.take('rawMeat');
        this.add('cookedMeat', 1);
        this.sound.play('sizzle');
        this.particles.emit(st.x, st.y + 0.7, st.z, 0xdddddd, 6, 1.2, -1);
      } else {
        this.sleep(st);
      }
    } else if (t.kind === 'water') {
      if (s.thirst >= 99) { this.hint('full', 'Du hast keinen Durst.', 'info'); return; }
      s.thirst = Math.min(100, s.thirst + 20);
      this.sound.play('drink');
      this.hint('drink', 'Du trinkst frisches Wasser.', 'good');
    }
  }

  secondary() {
    const t = this.target;
    if (!t) return;
    if (t.kind === 'struct' && t.ref.type === 'campfire') {
      const st = t.ref;
      if (!this.inv.wood) { this.hint('nowood', 'Du hast kein Holz.'); return; }
      if (st.fuel >= FIRE_MAX - 5) { this.hint('fullfire', 'Das Feuer brennt bereits kräftig.', 'info'); return; }
      this.take('wood');
      const wasOut = st.fuel <= 0;
      st.fuel = Math.min(FIRE_MAX, st.fuel + FIRE_PER_WOOD);
      this.sound.play('place');
      this.particles.emit(st.x, st.y + 0.5, st.z, 0xffa030, 12, 2.5, 2);
      this.ui.message(wasOut ? 'Das Feuer brennt wieder.' : 'Holz nachgelegt.', 'good');
    } else if (t.kind === 'water') {
      if (!this.inv.flask) { this.hint('noflask', 'Du brauchst eine Feldflasche (Fell + Fasern).', 'info'); return; }
      const have = this.inv.water || 0;
      if (have >= 3) { this.hint('flaskfull', 'Die Feldflasche ist voll.', 'info'); return; }
      this.add('water', 3 - have, true);
      this.sound.play('drink');
      this.ui.message('Feldflasche gefüllt (3/3).', 'good');
    }
  }

  eat(id) {
    const f = ITEMS[id].food;
    if (!this.inv[id]) return;
    const s = this.stats;
    if (!f.thirst && s.hunger > 97) { this.hint('full', 'Du bist satt.', 'info'); return; }
    if (!f.hunger && s.thirst > 97) { this.hint('full', 'Du hast keinen Durst.', 'info'); return; }
    this.take(id);
    s.hunger = Math.min(100, s.hunger + (f.hunger || 0));
    s.thirst = Math.min(100, s.thirst + (f.thirst || 0));
    s.health = Math.max(1, Math.min(100, s.health + (f.health || 0)));
    this.sound.play(id === 'water' ? 'drink' : 'eat');
    this.swingT = 0.0001;
    if (id === 'rawMeat') this.hint('raw', 'Rohes Fleisch bekommt dir nicht gut … brate es am Feuer!');
    else this.hint('eat' + id, `${ITEMS[id].name} ${id === 'water' ? 'getrunken' : 'gegessen'}.`, 'good');
  }

  quickEat() {
    const id = FOOD_PRIORITY.find(k => this.inv[k] > 0);
    if (!id) { this.hint('nofood', 'Du hast nichts zu essen.'); return; }
    this.eat(id);
  }

  place() {
    const sel = this.selected;
    if (!this.ghostValid) { this.hint('noplace', 'Hier kann nicht gebaut werden.'); return; }
    const g = this.ghosts[sel];
    this.take(sel);
    this.addStructure(sel, g.position.x, g.position.z, g.rotation.y);
    this.sound.play('place');
    this.attackCD = 0.5;
    if (sel === 'campfire') this.ui.message('Lagerfeuer entzündet! Mit R legst du Holz nach.', 'good');
    else this.ui.message('Unterschlupf gebaut! Mit E schläfst du nachts und wachst hier wieder auf.', 'good');
  }

  addStructure(type, x, z, rot = 0, fuel) {
    const mesh = type === 'campfire' ? makeCampfire() : makeShelter();
    const y = this.world.height(x, z);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rot;
    this.scene.add(mesh);
    const s = { type, x, z, y, rot, mesh, fuel: fuel ?? (type === 'campfire' ? FIRE_START : 0), col: type === 'campfire' ? 0.75 : 0 };
    this.structures.push(s);
    return s;
  }

  sleep(st) {
    this.spawn = { x: st.x, z: st.z };
    this.spawnIsShelter = true;
    if (!this.isNight()) {
      this.hint('spawnset', 'Wiedereinstiegspunkt gesetzt. Schlafen kannst du erst nachts.', 'info');
      return;
    }
    const near = this.animals.list.some(a => a.type === 'wolf' && !a.dead &&
      Math.hypot(a.x - this.player.pos.x, a.z - this.player.pos.z) < 15);
    if (near) { this.hint('wolfnear', 'Du kannst nicht schlafen – Wölfe sind in der Nähe!'); return; }
    this.sleepT = 0;
    this.sleepDone = false;
  }

  updateSleep(dt) {
    this.sleepT += dt;
    const t = this.sleepT;
    this.ui.setFade(t < 1 ? t : t < 1.8 ? 1 : Math.max(0, 1 - (t - 1.8)));
    if (t >= 1 && !this.sleepDone) {
      this.sleepDone = true;
      const frac = this.time % 1;
      const target = Math.floor(this.time) + (frac > 0.5 ? 1.26 : 0.26);
      const skipped = (target - this.time) * DAY_LENGTH;
      this.time = target;
      this.world.day = target;
      const s = this.stats;
      s.hunger = Math.max(5, s.hunger - 22);
      s.thirst = Math.max(5, s.thirst - 28);
      s.health = Math.min(100, s.health + 35);
      s.warmth = Math.max(s.warmth, 70);
      s.stamina = 100;
      for (const f of this.structures) if (f.type === 'campfire') f.fuel = Math.max(0, f.fuel - skipped);
      for (const a of this.animals.list) if (a.type === 'wolf') a.dead = true, a.deadT = 3;
      this.ui.message(`Du bist ausgeschlafen. Tag ${Math.floor(this.time) + 1} beginnt.`, 'good');
      this.warned.night = false;
      this.save();
    }
    if (t > 2.8) { this.sleepT = null; this.ui.setFade(0); }
  }

  damagePlayer(amount, cause) {
    if (this.dead || this.sleepT !== null || this.state !== 'playing') return;
    this.stats.health -= amount;
    this.lastCause = cause;
    this.ui.flashDamage();
    this.sound.play('hurt');
    this.shake = 0.25;
    if (this.stats.health <= 0) this.die(cause);
  }

  die(cause) {
    if (this.dead) return;
    this.dead = true;
    this.state = 'dead';
    this.keys = {};
    this.mouseDown = false;
    if (this.invOpen) this.toggleInventory(false);
    if (document.pointerLockElement) document.exitPointerLock();
    this.ui.showDeath(cause || 'Gestorben', Math.floor(this.time) + 1);
  }

  respawn() {
    this.sound.init();
    for (const id of Object.keys(this.inv)) {
      const it = ITEMS[id];
      if (it.food) delete this.inv[id];
      else if (!it.unique && !it.place) {
        this.inv[id] = Math.floor(this.inv[id] / 2);
        if (!this.inv[id]) delete this.inv[id];
      }
    }
    if (!this.inv[this.selected]) this.selected = 'hand';
    this.stats = { health: 70, hunger: 60, thirst: 60, warmth: 80, stamina: 100 };
    const sp = this.spawn;
    this.player.pos.set(sp.x + 1.5, this.world.height(sp.x + 1.5, sp.z + 1.5), sp.z + 1.5);
    this.player.vy = 0;
    for (const a of this.animals.list) {
      if (a.type === 'wolf' && Math.hypot(a.x - sp.x, a.z - sp.z) < 60) { a.dead = true; a.deadT = 3; }
    }
    this.world.loadAround(this.player.pos.x, this.player.pos.z);
    this.dead = false;
    this.warned = {};
    this.begin();
    this.save();
    this.ui.message('Du wachst erschöpft wieder auf …', 'info');
  }

  // ---------- Abfragen ----------

  isNight() {
    const f = this.time % 1;
    return f < 0.22 || f > 0.78;
  }

  nearestFire(x, z) {
    let best = null;
    for (const s of this.structures) {
      if (s.type !== 'campfire' || s.fuel <= 0) continue;
      const d = Math.hypot(s.x - x, s.z - z);
      if (!best || d < best.d) best = { x: s.x, z: s.z, d };
    }
    return best;
  }

  playerNearFire(r) {
    const f = this.nearestFire(this.player.pos.x, this.player.pos.z);
    return !!f && f.d < r;
  }

  // ---------- Pro Frame ----------

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.state === 'playing') this.update(dt);
    else if (this.state === 'menu' && this.world) this.updateMenuCamera(dt);
    this.render();
  }

  updateMenuCamera(dt) {
    this.menuAngle += dt * 0.05;
    const p = this.player.pos;
    this.camera.position.set(p.x, p.y + 6, p.z);
    this.camera.rotation.set(-0.08, this.menuAngle, 0, 'YXZ');
    this.world.update(p.x, p.z);
    this.env.update(0.33, p);
    this.updateLights(dt);
  }

  render() {
    const r = this.renderer;
    r.clear();
    r.render(this.scene, this.camera);
    if (this.state === 'playing' || this.state === 'paused') {
      r.clearDepth();
      r.render(this.vmScene, this.vmCamera);
    }
  }

  update(dt) {
    const p = this.player;
    const s = this.stats;
    const prevFrac = this.time % 1;
    this.time += dt / DAY_LENGTH;
    this.world.day = this.time;
    const frac = this.time % 1;

    const blocked = this.invOpen || this.sleepT !== null;
    const input = blocked ? {} : this.touch ? { ...this.keys, ...this.touch.input } : this.keys;
    const landing = p.update(dt, input, s.stamina > 3 && !this.exhausted);
    if (landing > 13) this.damagePlayer((landing - 13) * 6, 'Zu tief gestürzt');

    if (p.sprinting) s.stamina -= 20 * dt;
    else if (p.swimming && p.moving) s.stamina -= 3 * dt;
    else s.stamina += (s.hunger > 10 ? 14 : 5) * dt;
    if (s.stamina <= 0) this.exhausted = true;
    if (s.stamina > 25) this.exhausted = false;

    if (this.shake > 0) {
      this.shake -= dt;
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.4;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.4;
    }

    this.world.update(p.pos.x, p.pos.z);
    this.world.updateEffects(dt);
    this.env.update(frac, p.pos);
    this.animals.update(dt, this);
    this.particles.update(dt);
    this.updateStructures(dt);
    this.updateStats(dt);
    if (this.sleepT !== null) this.updateSleep(dt);
    this.updateTarget();
    this.updateGhost();
    this.updateViewModel(dt);
    this.updateLights(dt);
    this.updateAmbience(dt);

    this.attackCD -= dt;
    if (this.mouseDown && (this.locked || this.touch) && this.attackCD <= 0 && ITEMS[this.selected].tool) this.primary();

    if (prevFrac < 0.75 && frac >= 0.75) {
      this.ui.message('Die Nacht bricht herein … Wölfe streifen umher.', 'bad');
    }
    if (prevFrac < 0.25 && frac >= 0.25 && this.sleepT === null) {
      this.ui.message(`Die Sonne geht auf – Tag ${Math.floor(this.time) + 1}.`, 'info');
    }

    this.ui.updateStats(s);
    this.ui.renderHotbar(this.hotbarSlots(), this.selected, this.inv);
    this.ui.updateClock(Math.floor(this.time) + 1, frac, this.temperatureText());
    this.ui.drawMinimap(dt);

    this.saveT -= dt;
    if (this.saveT <= 0) { this.saveT = 20; this.save(); }
  }

  heatAt(x, z) {
    let heat = 0;
    for (const st of this.structures) {
      if (st.type !== 'campfire' || st.fuel <= 0) continue;
      const d = Math.hypot(st.x - x, st.z - z);
      if (d < 7) heat = Math.max(heat, 1 - d / 7);
    }
    return heat;
  }

  nearShelter() {
    const p = this.player.pos;
    return this.structures.some(st => st.type === 'shelter' && Math.hypot(st.x - p.x, st.z - p.z) < 2.6);
  }

  temperatureText() {
    const p = this.player.pos;
    let t = 2 + this.env.daylight * 15 - Math.max(0, p.y - 20) * 0.25;
    const heat = this.heatAt(p.x, p.z);
    t += heat * 22;
    let txt = `🌡️ ${Math.round(t)} °C`;
    if (heat > 0) txt += ' · 🔥 Feuer wärmt';
    else if (this.nearShelter()) txt += ' · ⛺ geschützt';
    else if (p.swimming) txt += ' · 🌊 nass';
    return txt;
  }

  updateStats(dt) {
    const s = this.stats, p = this.player;
    if (this.sleepT !== null) return;
    const mult = p.sprinting ? 1.7 : 1;
    s.hunger -= 0.17 * mult * dt;
    s.thirst -= 0.25 * mult * dt;

    const night = 1 - this.env.daylight;
    let cold = night * 0.55 + (p.swimming ? 1.2 : p.wading ? 0.3 : 0) + Math.max(0, (p.pos.y - 28) / 30);
    if (this.inv.coat) cold *= 0.5;
    if (this.nearShelter()) cold *= 0.6;
    if (this.selected === 'torch') cold = Math.max(0, cold - 0.25);
    const warm = this.env.daylight * 0.5 + this.heatAt(p.pos.x, p.pos.z) * 4;
    s.warmth += (warm - cold) * dt;

    for (const k in s) s[k] = Math.max(0, Math.min(100, s[k]));

    let dmg = 0, cause = null;
    if (s.hunger <= 0) { dmg += 0.6; cause = 'Verhungert'; }
    if (s.thirst <= 0) { dmg += 0.9; cause = 'Verdurstet'; }
    if (s.warmth <= 0) { dmg += 0.7; cause = 'Erfroren'; }
    if (dmg > 0) {
      s.health -= dmg * dt;
      this.lastCause = cause;
      if (s.health <= 0) this.die(cause);
    } else if (s.hunger > 35 && s.thirst > 35 && s.warmth > 25) {
      s.health = Math.min(100, s.health + 0.4 * dt);
    }

    const warn = (key, cond, reset, text) => {
      if (cond && !this.warned[key]) { this.warned[key] = true; this.ui.message(text, 'bad'); }
      else if (reset) this.warned[key] = false;
    };
    warn('hunger', s.hunger < 25, s.hunger > 40, 'Du hast Hunger. Iss etwas (F).');
    warn('thirst', s.thirst < 25, s.thirst > 40, 'Du hast Durst. Trink an einem See (E).');
    warn('cold', s.warmth < 30, s.warmth > 45, 'Dir ist kalt! Wärm dich an einem Feuer.');
  }

  updateStructures(dt) {
    const p = this.player.pos;
    const t = performance.now() / 1000;
    for (const st of this.structures) {
      if (st.type !== 'campfire') continue;
      const burning = st.fuel > 0;
      if (burning) {
        st.fuel -= dt;
        if (st.fuel <= 0 && Math.hypot(st.x - p.x, st.z - p.z) < 20) this.ui.message('Dein Lagerfeuer ist erloschen.', 'bad');
      }
      const { flame, embers } = st.mesh.userData;
      flame.visible = burning;
      embers.material.emissive.setHex(burning ? 0x8a2a00 : 0x000000);
      if (burning) {
        const k = Math.min(1, 0.45 + st.fuel / 240);
        flame.scale.set(k * (1 + Math.sin(t * 11 + st.x) * 0.08), k * (1 + Math.sin(t * 17 + st.z) * 0.15), k);
        flame.rotation.y = t * 1.5;
        if (Math.random() < dt * 3) this.particles.emit(st.x, st.y + 0.7, st.z, 0xffb040, 1, 0.8, -1.5);
      }
    }
  }

  updateLights() {
    const p = this.player.pos;
    const t = performance.now() / 1000;
    const cands = [];
    if (this.selected === 'torch' && this.state === 'playing') {
      this.camera.getWorldDirection(_v);
      cands.push({ x: p.x + _v.x * 0.6, y: this.camera.position.y - 0.1, z: p.z + _v.z * 0.6, i: 6 + Math.sin(t * 13) * 0.6, d: -1, dist: 16 });
    }
    for (const st of this.structures) {
      if (st.type !== 'campfire' || st.fuel <= 0) continue;
      const d = Math.hypot(st.x - p.x, st.z - p.z);
      if (d > 90) continue;
      const k = Math.min(1, 0.45 + st.fuel / 240);
      cands.push({ x: st.x, y: st.y + 0.9, z: st.z, i: 20 * k * (0.9 + Math.sin(t * 9 + st.x) * 0.06 + Math.random() * 0.06), d, dist: 28 });
    }
    cands.sort((a, b) => a.d - b.d);
    for (let i = 0; i < MAX_LIGHTS; i++) {
      const l = this.lights[i], c = cands[i];
      if (c) { l.position.set(c.x, c.y, c.z); l.intensity = c.i; l.distance = c.dist; }
      else l.intensity = 0;
    }
  }

  updateTarget() {
    const eye = this.camera.position;
    const dir = this.camera.getWorldDirection(_v);
    const p = this.player.pos;
    let best = null, bestD = Infinity;
    const reach = ITEMS[this.selected].reach || 2.8;
    const consider = (kind, ref, x, yMin, yMax, z, r, maxD) => {
      const cy = Math.max(yMin, Math.min(yMax, eye.y));
      const vx = x - eye.x, vy = cy - eye.y, vz = z - eye.z;
      const d = Math.hypot(vx, vy, vz) || 1e-4;
      if (d - r > maxD || d >= bestD) return;
      const cos = (vx * dir.x + vy * dir.y + vz * dir.z) / d;
      const ang = Math.acos(Math.max(-1, Math.min(1, cos)));
      if (ang > Math.atan2(r, d) + 0.05) return;
      bestD = d;
      best = { kind, ref };
    };
    for (const a of this.animals.list) {
      if (a.dead || Math.abs(a.x - p.x) > 6 || Math.abs(a.z - p.z) > 6) continue;
      consider('animal', a, a.x, a.y + 0.1, a.y + a.def.height, a.z, a.def.radius + 0.15, reach);
    }
    this.world.forEachNear(p.x, p.z, o => {
      if (Math.abs(o.x - p.x) > 5 || Math.abs(o.z - p.z) > 5) return;
      const def = OBJ[o.type];
      const big = def.kind === 'tree' || def.kind === 'rock';
      consider('obj', o, o.x, o.y, o.y + def.top * o.s * o.sy, o.z, def.r * o.s, big ? reach : 2.7);
    });
    for (const st of this.structures) {
      const fire = st.type === 'campfire';
      consider('struct', st, st.x, st.y, st.y + (fire ? 0.8 : 1.8), st.z, fire ? 0.8 : 1.5, 3);
    }
    if (dir.y < -0.05) {
      const t = (WATER_LEVEL - eye.y) / dir.y;
      if (t > 0 && t < 3.6 && t < bestD) {
        const hx = eye.x + dir.x * t, hz = eye.z + dir.z * t;
        if (this.world.height(hx, hz) < WATER_LEVEL - 0.1) best = { kind: 'water' };
      }
    }
    if (!best && (this.player.swimming || this.player.wading)) best = { kind: 'water' };
    this.target = best;
    this.ui.setPrompt(this.ghostPrompt || this.promptFor(best));
  }

  promptFor(t) {
    if (!t) return '';
    const hpbar = (v, max) => `<div class="hpbar"><div style="width:${Math.max(0, v / max) * 100}%"></div></div>`;
    if (t.kind === 'animal') {
      const a = t.ref;
      return `<div class="t">${a.def.name}</div><kbd>LMB</kbd> Angreifen${hpbar(a.hp, a.def.hp)}`;
    }
    if (t.kind === 'water') {
      let s = `<div class="t">Wasser</div><kbd>E</kbd> Trinken`;
      if (this.inv.flask) s += ` &nbsp; <kbd>R</kbd> Flasche füllen (${this.inv.water || 0}/3)`;
      return s;
    }
    if (t.kind === 'struct') {
      const st = t.ref;
      if (st.type === 'shelter') {
        return `<div class="t">Unterschlupf</div><kbd>E</kbd> ${this.isNight() ? 'Schlafen bis zum Morgen' : 'Wiedereinstieg setzen'}`;
      }
      const m = Math.floor(st.fuel / 60), sec = String(Math.floor(st.fuel % 60)).padStart(2, '0');
      let s = `<div class="t">Lagerfeuer</div>${st.fuel > 0 ? `brennt noch ${m}:${sec}` : '<span class="warn">erloschen</span>'}<br>`;
      if (this.inv.rawMeat) s += `<kbd>E</kbd> Fleisch braten (${this.inv.rawMeat}) &nbsp; `;
      s += `<kbd>R</kbd> Holz nachlegen (${this.inv.wood || 0})`;
      return s;
    }
    const o = t.ref, def = OBJ[o.type];
    if (def.kind === 'tree' || def.kind === 'rock') {
      const tool = def.kind === 'tree' ? 'axe' : 'pickaxe';
      const verb = def.kind === 'tree' ? 'Fällen' : 'Abbauen';
      let s = `<div class="t">${def.name}</div>`;
      if (this.selected === tool) s += `<kbd>LMB</kbd> ${verb}${hpbar(o.hp, def.hp)}`;
      else if (this.inv[tool]) s += `<span class="warn">${ITEMS[tool].name} ausrüsten</span>`;
      else s += `<span class="warn">Benötigt: ${ITEMS[tool].name}</span>`;
      return s;
    }
    if (def.kind === 'bush') {
      return `<div class="t">${def.name}</div>` + (o.berries ? '<kbd>E</kbd> Beeren pflücken' : '<span class="warn">leer – wächst nach</span>');
    }
    const give = Object.entries(def.give).map(([k, n]) => `${n} ${ITEMS[k].name}`).join(', ');
    return `<div class="t">${def.name}</div><kbd>E</kbd> Aufheben (${give})`;
  }

  updateGhost() {
    this.ghostPrompt = '';
    for (const k in this.ghosts) this.ghosts[k].visible = false;
    const sel = this.selected;
    if (!ITEMS[sel].place || this.invOpen) return;
    const g = this.ghosts[sel];
    const p = this.player;
    const dist = sel === 'shelter' ? 3.5 : 2.6;
    const x = p.pos.x - Math.sin(p.yaw) * dist, z = p.pos.z - Math.cos(p.yaw) * dist;
    const h = this.world.height(x, z);
    let valid = h > WATER_LEVEL + 0.3 && this.world.slopeAt(x, z).ny > 0.82;
    const clear = sel === 'shelter' ? 2.2 : 1.3;
    if (valid) {
      this.world.forEachNear(x, z, o => {
        if (OBJ[o.type].col > 0 && Math.hypot(o.x - x, o.z - z) < clear + OBJ[o.type].col * o.s) valid = false;
      });
      for (const st of this.structures) if (Math.hypot(st.x - x, st.z - z) < 2.5) valid = false;
    }
    g.visible = true;
    g.position.set(x, h, z);
    g.rotation.y = p.yaw;
    g.userData.ghostMat.color.setHex(valid ? 0x80ff80 : 0xff6060);
    this.ghostValid = valid;
    this.ghostPrompt = valid
      ? `<div class="t">${ITEMS[sel].name}</div><kbd>LMB</kbd> Platzieren`
      : `<div class="t">${ITEMS[sel].name}</div><span class="warn">Hier nicht möglich</span>`;
  }

  updateViewModel(dt) {
    const sel = this.selected;
    for (const k in this.viewModels) this.viewModels[k].visible = k === sel;
    const root = this.vmRoot;
    let swing = 0;
    if (this.swingT > 0) {
      this.swingT += dt / 0.3;
      if (this.swingT >= 1) this.swingT = 0;
      swing = Math.sin(Math.min(1, this.swingT) * Math.PI);
    }
    const p = this.player;
    const bob = p.moving && p.onGround ? Math.sin(p.bob) * 0.012 : 0;
    const bobY = p.moving && p.onGround ? Math.abs(Math.cos(p.bob)) * 0.012 : 0;
    root.position.set(VM_POS.x + bob, VM_POS.y + bobY + (this.sleepT !== null ? -1 : 0), VM_POS.z);
    if (sel === 'spear') {
      root.rotation.set(0.05, -0.2, 0);
      root.position.z = VM_POS.z - swing * 0.45;
    } else if (ITEMS[sel].food) {
      root.rotation.set(0.05 + swing * 0.6, -0.2 - swing * 0.4, 0);
      root.position.x -= swing * 0.15;
      root.position.y += swing * 0.12;
    } else {
      root.rotation.set(0.05 - swing * 1.25, -0.2 + swing * 0.15, swing * 0.2);
    }
    const flame = this.viewModels.torch.userData.flame;
    flame.scale.set(1, 1 + Math.sin(performance.now() / 70) * 0.15, 1);
    const d = this.env.daylight;
    const near = this.heatAt(p.pos.x, p.pos.z);
    this.vmHemi.intensity = 0.25 + d * 1.3 + near * 0.8 + (sel === 'torch' ? 0.6 : 0);
    this.vmSun.intensity = 0.2 + d * 1.0;
  }

  updateAmbience(dt) {
    this.ambientT -= dt;
    if (this.ambientT <= 0) {
      this.ambientT = 2 + Math.random() * 5;
      if (this.env.daylight > 0.5) this.sound.play('chirp');
      else if (this.env.daylight < 0.2) this.sound.play('cricket');
    }
    const f = this.nearestFire(this.player.pos.x, this.player.pos.z);
    if (f && f.d < 10 && Math.random() < dt * 6 * (1 - f.d / 10)) this.sound.play('fire');
  }
}

new Game();
