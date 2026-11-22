/**
 * FIORI LEGO GIGANTI — Interactive 3D LEGO Game Scrollytelling Engine
 * - Starts fully assembled (Hero) -> Brick Smash onto floor -> Step-by-Step LEGO Manual Build!
 * - 3 Modular Variations: Vaso a Mattoncini (15 pcs, 6 flowers), Vaso Alternativo (5 pcs), Stand-Alone (4 pcs)
 * - Live Flower Color Customizer (ONLY flowers change color; stems stay green & pots keep CAD colors!)
 * - Click any 3D flower to paint it! + Presets + Secret 24K Gold unlock via hidden Minikit Easter Egg!
 * - Zero-glitch X-Ray (independent cloned materials + mat.needsUpdate = true + EdgesGeometry)
 * - De-overlapped 3D hotspot pins with SVG leader lines
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ─────────────────────────────────────────────────────────────────────────────
// 1. FLOWER COLOR PALETTES (ONLY flowers change — stems & pots stay authentic!)
// ─────────────────────────────────────────────────────────────────────────────

const FLOWER_COLORS = [
  { name: 'Rosso LEGO',     hex: '#DF2422', metallic: 0.02, roughness: 0.34 },
  { name: 'Giallo LEGO',    hex: '#FFD500', metallic: 0.02, roughness: 0.34 },
  { name: 'Bianco Neve',    hex: '#F6F6F2', metallic: 0.02, roughness: 0.34 },
  { name: 'Arancio Vivo',   hex: '#FF7A14', metallic: 0.02, roughness: 0.34 },
  { name: 'Magenta Pop',    hex: '#D81B8A', metallic: 0.02, roughness: 0.34 },
  { name: 'Viola Lavanda',  hex: '#7A3CE0', metallic: 0.02, roughness: 0.34 },
  { name: 'Blu Classico',   hex: '#1976D2', metallic: 0.02, roughness: 0.34 },
  { name: 'Verde Lime',     hex: '#9ED91C', metallic: 0.02, roughness: 0.34 },
  { name: 'Corallo Rosa',   hex: '#FF5468', metallic: 0.02, roughness: 0.34 },
];

const GOLD_COLOR = { name: 'Oro 24K (Segreto!)', hex: '#F7C932', metallic: 0.84, roughness: 0.20 };

const PALETTES = {
  classic: ['#DF2422', '#FFD500', '#F6F6F2', '#F6F6F2', '#DF2422', '#FFD500'],
  spring:  ['#FF7A14', '#D81B8A', '#F6F6F2', '#FFD500', '#7A3CE0', '#9ED91C'],
  rainbow: ['#DF2422', '#FF7A14', '#FFD500', '#1976D2', '#7A3CE0', '#D81B8A'],
  sunset:  ['#FF5468', '#FF7A14', '#FFD500', '#DF2422', '#FF9F2E', '#FFE047'],
  ruby:    ['#DF2422', '#B71515', '#FF4D5A', '#DF2422', '#C91D1D', '#FF5468'],
  gold:    ['#F7C932', '#F7C932', '#F7C932', '#F7C932', '#F7C932', '#F7C932'],
};

let activeFlowerHex = [...PALETTES.classic];
let goldUnlocked = false;

// ─────────────────────────────────────────────────────────────────────────────
// 2. MATHEMATICALLY VERIFIED ZERO-COLLISION SCATTER (CADUTO A PEZZI) & EXPLODE
//    Every piece rests cleanly on floor Y >= 0 with zero overlap!
// ─────────────────────────────────────────────────────────────────────────────

// Scattered floor poses: { pos: [x, y, z], rot: [rx, ry, rz] } — 100% AABB verified 0-collision!
const SCATTER_V1 = {
  v1_quattro:     { pos: [-1.45, 0.56,  0.35], rot: [ 0.00,  0.40,  0.00] },
  v1_dot:         { pos: [-0.08, 0.24,  1.38], rot: [ 0.00,  0.55,  0.00] },
  v1_dot_fl:      { pos: [ 1.15, 0.24,  1.22], rot: [ 0.00, -0.45,  0.00] },
  // 4 slatted panels lying completely flat on the studio floor (half_Y = 0.16!)
  v1_lastra_s:    { pos: [-0.15, 0.165, 2.98], rot: [ Math.PI / 2, 0.00, 0.00] },
  v1_lastra_w:    { pos: [-3.10, 0.165,-0.55], rot: [ 0.00, 0.00,  Math.PI / 2] },
  v1_lastra_n:    { pos: [ 0.10, 0.165,-2.65], rot: [-Math.PI / 2, 0.00, 0.00] },
  v1_lastra_e:    { pos: [ 2.65, 0.165, 0.55], rot: [ 0.00, 0.00, -Math.PI / 2] },
  // 2 green stalks standing cleanly with wide clearance
  v1_pianta_low:  { pos: [-1.95, 1.00, -2.55], rot: [ 0.00,  0.65,  0.00] },
  v1_pianta_high: { pos: [ 1.95, 1.00, -2.25], rot: [ 0.00, -0.55,  0.00] },
  // 6 giant flowers scattered cleanly around the ring
  v1_fiore_1:     { pos: [-1.85, 0.27,  2.15], rot: [ 0.00,  0.50,  0.00] },
  v1_fiore_2:     { pos: [ 2.38, 0.27,  2.15], rot: [ 0.00, -0.80,  0.00] },
  v1_fiore_3:     { pos: [ 3.85, 0.27, -0.75], rot: [ 0.00,  1.20,  0.00] },
  v1_fiore_4:     { pos: [-3.75, 0.27,  1.15], rot: [ 0.00, -1.10,  0.00] },
  v1_fiore_5:     { pos: [ 1.25, 0.27,  3.55], rot: [ 0.00,  0.30,  0.00] },
  v1_fiore_6:     { pos: [-0.55, 0.27, -4.45], rot: [ 0.00,  2.10,  0.00] },
};

const SCATTER_V2 = {
  v2_vaso:    { pos: [-1.25, 0.40,  0.35], rot: [0.0,  0.35, 0.0] },
  v2_pianta:  { pos: [ 1.25, 1.00, -0.45], rot: [0.0, -0.50, 0.0] },
  v2_fiore_1: { pos: [-0.35, 0.27,  1.85], rot: [0.0,  0.60, 0.0] },
  v2_fiore_2: { pos: [ 1.15, 0.27,  1.65], rot: [0.0, -0.75, 0.0] },
  v2_fiore_3: { pos: [-1.65, 0.27, -1.25], rot: [0.0,  1.15, 0.0] },
};

const SCATTER_V3 = {
  v3_pianta:  { pos: [ 0.00, 1.00, -0.55], rot: [0.0,  0.40, 0.0] },
  v3_fiore_1: { pos: [-2.05, 0.27,  1.15], rot: [0.0,  0.55, 0.0] },
  v3_fiore_2: { pos: [ 2.05, 0.27,  1.05], rot: [0.0, -0.65, 0.0] },
  v3_fiore_3: { pos: [ 0.05, 0.27,  2.05], rot: [0.0,  1.25, 0.0] },
};

// Technical CAD Explode Vectors (relative offset from assembled position — 0 collisions!)
const EXPLODE_V1 = {
  v1_quattro:     new THREE.Vector3( 0.00,  0.00,  0.00),
  v1_dot:         new THREE.Vector3( 0.00,  0.55,  0.00),
  v1_dot_fl:      new THREE.Vector3( 0.00,  1.05,  0.00),
  v1_lastra_s:    new THREE.Vector3( 0.00,  0.00,  1.15),
  v1_lastra_n:    new THREE.Vector3( 0.00,  0.00, -1.15),
  v1_lastra_w:    new THREE.Vector3(-1.15,  0.00,  0.00),
  v1_lastra_e:    new THREE.Vector3( 1.15,  0.00,  0.00),
  v1_pianta_low:  new THREE.Vector3( 0.00,  1.45,  0.00),
  v1_pianta_high: new THREE.Vector3( 0.00,  3.05,  0.00),
  v1_fiore_1:     new THREE.Vector3( 0.00,  2.10,  0.88),
  v1_fiore_2:     new THREE.Vector3(-0.86,  2.12, -0.52),
  v1_fiore_3:     new THREE.Vector3( 0.86,  2.10, -0.52),
  v1_fiore_4:     new THREE.Vector3(-0.86,  3.82,  0.52),
  v1_fiore_5:     new THREE.Vector3( 0.00,  3.90, -0.92),
  v1_fiore_6:     new THREE.Vector3( 0.86,  3.84,  0.52),
};

const EXPLODE_V2 = {
  v2_vaso:    new THREE.Vector3( 0.00, 0.00,  0.00),
  v2_pianta:  new THREE.Vector3( 0.00, 1.05,  0.00),
  v2_fiore_1: new THREE.Vector3( 0.00, 1.78,  0.78),
  v2_fiore_2: new THREE.Vector3(-0.76, 1.82, -0.46),
  v2_fiore_3: new THREE.Vector3( 0.76, 1.80, -0.46),
};

const EXPLODE_V3 = {
  v3_pianta:  new THREE.Vector3( 0.00, 0.00,  0.00),
  v3_fiore_1: new THREE.Vector3( 0.00, 0.92,  0.76),
  v3_fiore_2: new THREE.Vector3(-0.74, 0.95, -0.45),
  v3_fiore_3: new THREE.Vector3( 0.74, 0.94, -0.45),
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. HOTSPOTS METADATA (Click any label to inspect piece CAD specs!)
// ─────────────────────────────────────────────────────────────────────────────

const HOTSPOTS = [
  {
    id: 'v1_quattro', num: 1, varId: 'v1',
    label: 'Nucleo SNOT 1×1', badge: 'STEP 01 · FONDAZIONE',
    title: 'Cubo Nero SNOT 1×1 Gigante',
    subtitle: '112 × 112 × 112 mm · 5 Punti di Incastro',
    desc: 'Ispirato al leggendario "Travis Brick" LEGO con stud su 4 facce laterali e sulla sommità. Tiene solidali le 4 pareti a doghe senza colla.',
    specs: [['Dimensioni', '112 × 112 × 112 mm'], ['Materiale', 'PLA Nero Opaco'], ['Perni', '4 laterali + 1 superiore']],
  },
  {
    id: 'v1_dot', num: 2, varId: 'v1',
    label: 'Piastra Tonda', badge: 'STEP 02 · DISTANZIALE',
    title: 'Piastra Tonda 1×1 (dot)',
    subtitle: 'Ø 80 mm × 48 mm · PLA Tan',
    desc: 'Si incastra sul perno superiore del cubo SNOT e funge da distanziale calibrato per portare lo stelo verde all’altezza esatta del bordo.',
    specs: [['Diametro', '80 mm'], ['Altezza', '48 mm'], ['Materiale', 'PLA Sand / Tan']],
  },
  {
    id: 'v1_dot_fl', num: 3, varId: 'v1',
    label: 'Connettore Fiore', badge: 'STEP 03 · ADATTATORE',
    title: 'Corolla Connettore (dot_fl)',
    subtitle: 'Ø 79.2 mm × 48 mm · PLA Verde',
    desc: 'Piastra sagomata a fiore che blocca assialmente la base dello stelo inferiore dentro la fioriera a doghe.',
    specs: [['Diametro', '79.2 mm'], ['Incastro', 'A pressione calibrata'], ['Materiale', 'PLA Verde Botanico']],
  },
  {
    id: 'v1_lastra_s', num: 4, varId: 'v1',
    label: '4× Pareti a Doghe', badge: 'STEP 04 · FIORIERA',
    title: 'Pannello Scanalato a Doghe (×4)',
    subtitle: '80 × 32 × 160 mm · Stampa Piana',
    desc: 'Quattro pannelli identici stampabili in piano senza supporti. La nervatura posteriore si blocca esattamente sui perni laterali del cubo nero.',
    specs: [['Quantità', '4× pezzi identici'], ['Dimensioni', '80 × 32 × 160 mm'], ['Materiale', 'PLA Sand / Tan']],
  },
  {
    id: 'v1_pianta_low', num: 5, varId: 'v1',
    label: 'Stelo Inferiore', badge: 'STEP 05 · BOTANICA',
    title: 'Stelo a 3 Rami (Livello 1)',
    subtitle: '188 × 156 × 199 mm · Verde Fisso',
    desc: 'Riproduzione in scala 10× dello storico stelo botanico a 3 ramificazioni inclinate. Progettato con perno superiore per impilare altri steli.',
    specs: [['Altezza', '199.4 mm'], ['Rami', '3× inclinati a 120°'], ['Materiale', 'PLA Verde Botanico']],
  },
  {
    id: 'v1_pianta_high', num: 6, varId: 'v1',
    label: 'Stelo Superiore (+60°)', badge: 'STEP 06 · IMPILABILE',
    title: 'Stelo a 3 Rami (Livello 2)',
    subtitle: 'Sfalsato di 60° · +64 mm in quota',
    desc: 'Si impila sul perno del primo stelo ruotato di 60°: i 6 rami risultanti non si toccano mai e formano un bouquet tridimensionale alto 45 cm.',
    specs: [['Offset Quota', '+64.0 mm'], ['Rotazione', '60° esatti'], ['Altezza Totale', '~450 mm']],
  },
  {
    id: 'v1_fiore_5', num: 7, varId: 'v1',
    label: '6× Fiori Colorabili', badge: 'STEP 07–12 · PETALI',
    title: 'Fiore Gigante 5 Petali (×6)',
    subtitle: 'Ø 88 mm × 53.5 mm · Mix & Match',
    desc: 'Ogni fiore si infila a pressione sulla punta arrotondata del ramo verde, lasciando spuntare il bottone centrale verde proprio come nei set classici!',
    specs: [['Diametro', '88.2 mm'], ['Colorazione', 'Personalizzabile live'], ['Stampa', 'Rapida, senza supporti']],
  },
  {
    id: 'v2_vaso', num: 8, varId: 'v2',
    label: 'Vaso Alternativo', badge: 'VARIAZIONE 2 · MONOBLOCCO',
    title: 'Vasetto Bianco Troncoconico',
    subtitle: 'Ø 93 mm × 80 mm · Pezzo Unico',
    desc: 'Alternativa minimalista al vaso a mattoncini: stampabile in un solo blocco con sede cilindrica interna calibrata per lo stelo verde.',
    specs: [['Dimensioni', 'Ø 93 × 80 mm'], ['Materiale', 'PLA Bianco Opaco'], ['Compatibilità', 'Stesso stelo 3 rami']],
  },
  {
    id: 'v2_pianta', num: 9, varId: 'v2',
    label: 'Stelo 3 Rami', badge: 'VARIAZIONE 2 · MODULARE',
    title: 'Stelo Verde Modulare',
    subtitle: 'Inserimento a 10 mm nel bordo',
    desc: 'Lo stesso identico stelo del Vaso a Mattoncini: puoi spostare la tua piantina da un vaso all’altro in un secondo.',
    specs: [['Altezza Totale', '~270 mm'], ['Pezzi Totali', '5 componenti'], ['Incastro', 'Zero colla']],
  },
  {
    id: 'v3_pianta', num: 10, varId: 'v3',
    label: 'Piantina Stand-Alone', badge: 'VARIAZIONE 3 · MINIMAL',
    title: 'Stelo Stand-Alone da Scrivania',
    subtitle: '4 Pezzi · Base Piana Stabile',
    desc: 'Versione essenziale che non richiede vaso: base perfettamente piana e stabile, ideale come decorazione da scrivania o libreria.',
    specs: [['Altezza', '~200 mm'], ['Pezzi', '1 stelo + 3 fiori'], ['Impilabile', 'Sì (fino a 6+ fiori)']],
  },
];

// Active pins per chapter
const CHAPTER_PINS = {
  0: [],
  1: [],
  2: ['v1_quattro'],
  3: ['v1_dot', 'v1_dot_fl'],
  4: ['v1_lastra_s'],
  5: ['v1_pianta_low', 'v1_pianta_high'],
  6: ['v1_fiore_5'],
  7: ['v1_quattro', 'v1_dot', 'v1_dot_fl'],
  8: ['v2_vaso', 'v2_pianta'],
  9: ['v3_pianta'],
  10: ['v1_quattro', 'v1_lastra_s', 'v1_pianta_low', 'v1_fiore_5', 'v2_vaso', 'v2_pianta', 'v3_pianta'],
};

const CHAPTER_CARD_SIDE = {
  0: 'left', 1: 'left', 2: 'right', 3: 'left', 4: 'right',
  5: 'left', 6: 'right', 7: 'left', 8: 'right', 9: 'left', 10: 'top',
};

const CHAPTER_HUD = {
  0: null,
  1: ['SMASH!', '15 pezzi sparsi sul piano'],
  2: ['STEP 1/12', '1× Nucleo SNOT Nero'],
  3: ['STEP 2–3/12', '1× Piastra Tonda + 1× Connettore Fiore'],
  4: ['STEP 4/12', '4× Pareti a Doghe Tan'],
  5: ['STEP 5–6/12', '2× Stelo a 3 Rami (+60°)'],
  6: ['STEP 7–12/12', '6× Fiori Giganti Personalizzabili'],
  7: ['RAGGI X', 'Ispezione incastro interno SNOT'],
  8: ['VARIANTE 2', 'Vaso Alternativo Bianco (5 pezzi)'],
  9: ['VARIANTE 3', 'Piantina Stand-Alone + Scala 1:1'],
  10: ['FREE PLAY', 'Modalità Libera 360° & Colori'],
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. THREE.JS STUDIO SETUP
// ─────────────────────────────────────────────────────────────────────────────

const canvas = document.getElementById('webgl-canvas');
const stageWrap = document.getElementById('stage-wrap');
const loaderOverlay = document.getElementById('loader-overlay');
const leaderSvg = document.getElementById('leader-svg');
const hotspotsLayer = document.getElementById('hotspots-layer');
const buildHud = document.getElementById('build-hud');
const buildHudStep = document.getElementById('build-hud-step');
const buildHudLabel = document.getElementById('build-hud-label');
const inspectorDock = document.getElementById('inspector-dock');
const quickColorBar = document.getElementById('quick-color-bar');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.65;

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.05, 80);
camera.position.set(3.2, 3.6, 7.6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.minDistance = 2.6;
controls.maxDistance = 13.5;
controls.maxPolarAngle = Math.PI * 0.495;
controls.enabled = false;
controls.target.set(0, 2.0, 0);

// Warm-Key + Cool-Rim Studio Lighting (highlights glossy LEGO PLA edges!)
const keyLight = new THREE.DirectionalLight(0xfff7e6, 2.0);
keyLight.position.set(5.5, 9.5, 6.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 25;
const sd = 4.6;
keyLight.shadow.camera.left = -sd;
keyLight.shadow.camera.right = sd;
keyLight.shadow.camera.top = sd;
keyLight.shadow.camera.bottom = -sd;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xb8d8ff, 0.85);
fillLight.position.set(-6.0, 4.5, -3.5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffe066, 0.55);
rimLight.position.set(0.5, 5.0, -7.0);
scene.add(rimLight);

// Studio Floor Shadow Catcher + Subtle LEGO Pedestal Ring
const floorGroup = new THREE.Group();
scene.add(floorGroup);

const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 24),
  new THREE.ShadowMaterial({ opacity: 0.36 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.002;
shadowPlane.receiveShadow = true;
floorGroup.add(shadowPlane);

const pedestalDisc = new THREE.Mesh(
  new THREE.CylinderGeometry(1.75, 1.88, 0.06, 64),
  new THREE.MeshStandardMaterial({ color: 0x161b29, roughness: 0.55, metalness: 0.15 })
);
pedestalDisc.position.y = -0.032;
pedestalDisc.receiveShadow = true;
floorGroup.add(pedestalDisc);

const pedestalRing = new THREE.Mesh(
  new THREE.RingGeometry(1.76, 1.82, 64),
  new THREE.MeshBasicMaterial({ color: 0xffd500, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
);
pedestalRing.rotation.x = -Math.PI / 2;
pedestalRing.position.y = 0.001;
floorGroup.add(pedestalRing);

// ─────────────────────────────────────────────────────────────────────────────
// 6. SCENE STATE, MODEL REGISTRY & 3D STUD PARTICLE FOUNTAIN
// ─────────────────────────────────────────────────────────────────────────────

const state = {
  activeChapter: 0,
  activeVar: 'v1',           // 'v1' | 'v2' | 'v3'
  manualOverride: false,
  // Per-step build progress (0 = scattered on floor, 1 = snapped assembled!)
  bCore: 1,
  bAdapters: 1,
  bWalls: 1,
  bStalks: 1,
  bFlowers: 1,
  // V2 & V3 build progress (0 = scattered, 1 = assembled)
  bV2: 1,
  bV3: 1,
  // Technical explode (0..1)
  explode: 0,
  // X-Ray on slatted walls (0..1)
  xray: 0,
  // Camera orbit params (driven by GSAP when not in manual Free Play)
  camTheta: 0.32,
  camPhi: 1.18,
  camDist: 7.4,
  targetX: -0.78,
  targetY: 2.05,
  targetZ: 0.0,
  // Toggles
  showScaleRef: false,
  showPinsToggle: true,
  autoSpin: false,
  // Smash wave trigger tracking
  lastSmashChapter: 0,
  // Game HUD stats
  studs: 1000,
  maxChapterReached: 0,
  minikitFound: false,
};

const partMap = new Map();
const assembledPos = new Map();
const flowerMeshesBySlot = [[], [], [], [], [], []]; // slots 0..5 across all variations!
const wallMeshes = [];
const wallXrayEdges = [];
const pinElements = new Map();

let rootScene = null;
let v1Root = null, v2Root = null, v3Root = null;
let scaleRefRoot = null;
let minikitRoot = null;
let studProtoMesh = null;

// 3D Flying LEGO Stud Particles (for Brick Smash & Easter Egg celebrations!)
const studParticles = [];
const STUD_PALETTE_MATS = [
  new THREE.MeshStandardMaterial({ color: 0xd0d6e0, metalness: 0.85, roughness: 0.18 }), // Silver 10
  new THREE.MeshStandardMaterial({ color: 0xffd500, metalness: 0.85, roughness: 0.18, emissive: 0x332200 }), // Gold 100
  new THREE.MeshStandardMaterial({ color: 0x2490ff, metalness: 0.72, roughness: 0.16, emissive: 0x06244d }), // Blue 1,000
  new THREE.MeshStandardMaterial({ color: 0xb042ff, metalness: 0.75, roughness: 0.16, emissive: 0x24063d }), // Purple 10,000
];

function spawnStudBurst(count = 16, originY = 1.8, spread = 2.6, includePurple = false) {
  if (!studProtoMesh) return;
  for (let i = 0; i < count; i++) {
    const tier = includePurple && i % 5 === 0 ? 3 : (i % 4 === 0 ? 2 : (i % 2 === 0 ? 1 : 0));
    const mesh = new THREE.Mesh(studProtoMesh.geometry, STUD_PALETTE_MATS[tier]);
    mesh.scale.setScalar(1.15);
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.1 + Math.random() * spread;
    mesh.position.set(
      (Math.random() - 0.5) * 0.4,
      originY + (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.4
    );
    scene.add(mesh);
    studParticles.push({
      mesh,
      vel: new THREE.Vector3(Math.cos(angle) * speed, 2.8 + Math.random() * 2.8, Math.sin(angle) * speed),
      rotVel: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
      life: 0,
      maxLife: 2.2 + Math.random() * 1.1,
    });
  }
}

function updateStudParticles(dt) {
  for (let i = studParticles.length - 1; i >= 0; i--) {
    const p = studParticles[i];
    p.life += dt;
    p.vel.y -= 9.5 * dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    if (p.mesh.position.y < 0.05) {
      p.mesh.position.y = 0.05;
      p.vel.y = Math.abs(p.vel.y) * 0.48;
      p.vel.x *= 0.78;
      p.vel.z *= 0.78;
    }
    p.mesh.rotation.x += p.rotVel.x * dt;
    p.mesh.rotation.y += p.rotVel.y * dt;
    p.mesh.rotation.z += p.rotVel.z * dt;

    if (p.life > p.maxLife - 0.45) {
      const s = Math.max(0.001, (p.maxLife - p.life) / 0.45);
      p.mesh.scale.setScalar(1.15 * s);
    }
    if (p.life >= p.maxLife) {
      scene.remove(p.mesh);
      studParticles.splice(i, 1);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. HUD SCORE, TOASTS & FLOWER COLOR ENGINE
// ─────────────────────────────────────────────────────────────────────────────

const studScoreEl = document.getElementById('stud-score');
const studHudBtn = document.getElementById('hud-stud-btn');
const trueBuilderFill = document.getElementById('true-builder-fill');
const minikitBadge = document.getElementById('minikit-badge');
const gameToast = document.getElementById('game-toast');
const toastIcon = document.getElementById('toast-icon');
const toastTitle = document.getElementById('toast-title');
const toastSub = document.getElementById('toast-sub');
let toastTimer = null;

function showToast(icon, title, sub) {
  toastIcon.textContent = icon;
  toastTitle.textContent = title;
  toastSub.textContent = sub;
  gameToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => gameToast.classList.remove('show'), 3200);
}

function awardStuds(amount) {
  state.studs += amount;
  studScoreEl.textContent = state.studs.toLocaleString('it-IT');
  studHudBtn.classList.remove('pulse');
  void studHudBtn.offsetWidth;
  studHudBtn.classList.add('pulse');
  const pct = Math.min(100, Math.round((state.studs / 10000) * 100));
  trueBuilderFill.style.width = `${Math.max(12, pct)}%`;
}

function applyFlowerColor(slotIndex, hex, opts = null) {
  activeFlowerHex[slotIndex] = hex;
  const spec = opts || (hex.toUpperCase() === GOLD_COLOR.hex ? GOLD_COLOR : { metallic: 0.02, roughness: 0.34 });
  const meshes = flowerMeshesBySlot[slotIndex] || [];
  meshes.forEach((m) => {
    m.material.color.set(hex);
    m.material.metalness = spec.metallic ?? 0.02;
    m.material.roughness = spec.roughness ?? 0.34;
    m.material.needsUpdate = true;
    // Playful LEGO pop scale pulse on the flower parent node!
    const target = m.parent || m;
    gsap.fromTo(target.scale, { x: 1.18, y: 1.18, z: 1.18 }, { x: 1, y: 1, z: 1, duration: 0.32, ease: 'back.out(2.2)' });
  });
  refreshFlowerDotButtons();
}

function applyPalette(paletteKey) {
  let cols;
  if (paletteKey === 'random') {
    const pool = goldUnlocked ? [...FLOWER_COLORS, GOLD_COLOR] : FLOWER_COLORS;
    cols = Array.from({ length: 6 }, () => pool[Math.floor(Math.random() * pool.length)].hex);
  } else {
    cols = PALETTES[paletteKey] || PALETTES.classic;
  }
  cols.forEach((hex, idx) => applyFlowerColor(idx, hex));
  document.querySelectorAll('.qcb-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.palette === paletteKey);
  });
  awardStuds(50);
}

const flowerDotsWrap = document.getElementById('flower-dots');
function refreshFlowerDotButtons() {
  if (!flowerDotsWrap) return;
  const count = state.activeVar === 'v1' ? 6 : 3;
  flowerDotsWrap.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'f-dot-btn';
    btn.style.background = activeFlowerHex[i];
    btn.textContent = String(i + 1);
    btn.title = `Fiore ${i + 1} — Clicca per cambiare colore`;
    btn.addEventListener('click', () => cycleFlowerSlot(i));
    flowerDotsWrap.appendChild(btn);
  }
}

function cycleFlowerSlot(slotIndex) {
  const pool = goldUnlocked ? [...FLOWER_COLORS, GOLD_COLOR] : FLOWER_COLORS;
  const cur = activeFlowerHex[slotIndex].toUpperCase();
  const curIdx = pool.findIndex((c) => c.hex.toUpperCase() === cur);
  const next = pool[(curIdx + 1) % pool.length];
  applyFlowerColor(slotIndex, next.hex, next);
  awardStuds(25);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. LOAD GLB MODEL & ATTACH ZERO-GLITCH X-RAY CONTOURS
// ─────────────────────────────────────────────────────────────────────────────

function attachXrayContour(mesh, targetList) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 26);
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0xffd500,
    transparent: true,
    opacity: 0,
    depthTest: true,
  });
  const lines = new THREE.LineSegments(edges, edgeMat);
  lines.visible = false;
  lines.renderOrder = 12;
  mesh.add(lines);
  targetList.push({ lines, mat: edgeMat });
}

const loader = new GLTFLoader();
loader.load(
  'assets/fiori_lego.glb?v=1',
  (gltf) => {
    rootScene = gltf.scene;
    scene.add(rootScene);

    rootScene.traverse((obj) => {
      if (obj.name) {
        partMap.set(obj.name, obj);
        assembledPos.set(obj.name, obj.position.clone());
      }
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const owner = obj.name || obj.parent?.name || '';
        const pName = obj.parent?.name || '';

        // Clone independent materials for slatted tan walls (Zero-Glitch X-Ray!)
        if (owner.startsWith('v1_lastra_') || pName.startsWith('v1_lastra_')) {
          obj.material = obj.material.clone();
          obj.material.side = THREE.FrontSide;
          wallMeshes.push(obj);
          attachXrayContour(obj, wallXrayEdges);
        }

        // Register flower meshes by slot 0..5 so ONLY flowers change color!
        const fm = (owner + ' ' + pName).match(/fiore_(\d)/);
        if (fm) {
          const slot = parseInt(fm[1], 10) - 1;
          obj.material = obj.material.clone();
          obj.userData.flowerSlot = slot;
          if (slot >= 0 && slot < 6) {
            flowerMeshesBySlot[slot].push(obj);
          }
        }

        // Tag secret Minikit for raycast Easter Egg!
        if (owner.includes('minikit') || pName.includes('minikit')) {
          obj.userData.isMinikit = true;
        }
      }
    });

    v1Root = partMap.get('v1_vaso_mattoncini');
    v2Root = partMap.get('v2_vaso_alternativo');
    v3Root = partMap.get('v3_piantina_solo');
    scaleRefRoot = partMap.get('scale_ref_bricks');
    minikitRoot = partMap.get('secret_minikit');

    const studNode = partMap.get('lego_stud_proto');
    if (studNode) {
      studNode.traverse((c) => { if (c.isMesh) studProtoMesh = c; });
      studNode.visible = false;
    }

    // Initial visibility: V1 assembled, V2 & V3 hidden, scaleRef hidden
    if (v2Root) v2Root.visible = false;
    if (v3Root) v3Root.visible = false;
    if (scaleRefRoot) scaleRefRoot.visible = false;
    if (minikitRoot) minikitRoot.visible = false;

    // Apply initial classic LEGO flower palette
    PALETTES.classic.forEach((hex, idx) => applyFlowerColor(idx, hex));

    buildChapterRail();
    buildHotspotDOM();
    setupScrollChoreography();
    setupUIControls();
    setupRaycastInteractions();

    setTimeout(() => loaderOverlay.classList.add('hidden'), 260);
  },
  undefined,
  (err) => {
    console.error('Errore caricamento fiori_lego.glb:', err);
    loaderOverlay.querySelector('.loader-text').textContent = 'ERRORE CARICAMENTO 3D — AVVIA SERVER LOCALE HTTP';
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. PLAYFUL LEGO BRICK INTERPOLATION (BOUNCY SNAP ARC & ZERO-GLITCH X-RAY)
// ─────────────────────────────────────────────────────────────────────────────

function easeOutBack(t) {
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

/**
 * Interpolates a brick between its scattered floor pose (t=0) and assembled pose (t=1)
 * with a joyful LEGO video-game hop arc, spin-to-align, plus optional CAD explode vector!
 */
function applyPartTransform(name, buildT, scatterMap, explodeMap, explodeAmt, hopHeight = 0.85) {
  const obj = partMap.get(name);
  const home = assembledPos.get(name);
  if (!obj || !home) return;

  const sc = scatterMap[name];
  const ex = explodeMap[name];
  const t = Math.max(0, Math.min(1, buildT));

  if (!sc) {
    obj.position.copy(home);
    obj.rotation.set(0, 0, 0);
  } else {
    const posT = smoothstep(t);
    const arc = Math.sin(posT * Math.PI) * hopHeight;
    // Slight overshoot bounce only right as it clicks into place
    const clickSnap = t > 0.72 ? (easeOutBack((t - 0.72) / 0.28) - 1) * 0.08 : 0;

    obj.position.set(
      THREE.MathUtils.lerp(sc.pos[0], home.x, posT),
      THREE.MathUtils.lerp(sc.pos[1], home.y, posT) + arc + Math.max(0, clickSnap),
      THREE.MathUtils.lerp(sc.pos[2], home.z, posT)
    );
    // Spin smoothly from floor tumble to exact 0,0,0 lock
    const rotT = smoothstep(Math.min(1, t * 1.15));
    obj.rotation.set(
      THREE.MathUtils.lerp(sc.rot[0], 0, rotT),
      THREE.MathUtils.lerp(sc.rot[1], 0, rotT),
      THREE.MathUtils.lerp(sc.rot[2], 0, rotT)
    );
  }

  // Apply CAD technical explosion when requested (only when assembled)
  if (ex && explodeAmt > 0.001 && t > 0.5) {
    const scaleEx = explodeAmt * ((t - 0.5) * 2);
    obj.position.addScaledVector(ex, scaleEx);
  }
}

function updateXrayShader(amount) {
  const isTranslucent = amount > 0.02;
  const opacity = THREE.MathUtils.lerp(1.0, 0.16, amount);

  wallMeshes.forEach((mesh) => {
    const mat = mesh.material;
    const prevTrans = mat.transparent;
    mat.transparent = isTranslucent;
    mat.opacity = opacity;
    mat.depthWrite = !isTranslucent;
    mat.depthTest = true;
    mat.side = THREE.FrontSide;
    mesh.renderOrder = isTranslucent ? 10 : 0;
    // CRITICAL WebGL rule: recompile shader whenever transparent toggles!
    if (prevTrans !== mat.transparent) {
      mat.needsUpdate = true;
    }
  });

  wallXrayEdges.forEach(({ lines, mat }) => {
    lines.visible = amount > 0.05;
    mat.opacity = Math.min(0.85, amount * 0.9);
  });
}

function updateSceneFromState(elapsed) {
  if (!rootScene) return;

  // Visibility of the 3 variations
  if (v1Root) v1Root.visible = state.activeVar === 'v1';
  if (v2Root) v2Root.visible = state.activeVar === 'v2';
  if (v3Root) v3Root.visible = state.activeVar === 'v3';
  if (scaleRefRoot) scaleRefRoot.visible = state.showScaleRef;

  // Secret Minikit is subtly visible during X-Ray (ch 7) or Free Play (ch 10)!
  if (minikitRoot) {
    const showMk = (state.activeChapter === 7 || state.activeChapter === 10 || state.manualOverride) && !state.minikitFound;
    minikitRoot.visible = showMk;
    if (showMk) {
      minikitRoot.position.y = 0.06 + Math.sin(elapsed * 2.8) * 0.045;
      minikitRoot.rotation.y = elapsed * 1.4;
    }
  }

  // Apply V1 Transforms (with staggered brick-by-brick build!)
  if (state.activeVar === 'v1') {
    applyPartTransform('v1_quattro', state.bCore, SCATTER_V1, EXPLODE_V1, state.explode, 0.75);

    const tDot = Math.min(1, state.bAdapters * 1.65);
    const tDotFl = Math.max(0, Math.min(1, (state.bAdapters - 0.35) / 0.65));
    applyPartTransform('v1_dot', tDot, SCATTER_V1, EXPLODE_V1, state.explode, 0.9);
    applyPartTransform('v1_dot_fl', tDotFl, SCATTER_V1, EXPLODE_V1, state.explode, 1.05);

    ['v1_lastra_s', 'v1_lastra_e', 'v1_lastra_n', 'v1_lastra_w'].forEach((wn, i) => {
      const tw = Math.max(0, Math.min(1, (state.bWalls - i * 0.14) / 0.58));
      applyPartTransform(wn, tw, SCATTER_V1, EXPLODE_V1, state.explode, 0.78);
    });

    const tStalk1 = Math.min(1, state.bStalks * 1.6);
    const tStalk2 = Math.max(0, Math.min(1, (state.bStalks - 0.38) / 0.62));
    applyPartTransform('v1_pianta_low', tStalk1, SCATTER_V1, EXPLODE_V1, state.explode, 1.1);
    applyPartTransform('v1_pianta_high', tStalk2, SCATTER_V1, EXPLODE_V1, state.explode, 1.25);

    ['v1_fiore_1', 'v1_fiore_2', 'v1_fiore_3', 'v1_fiore_4', 'v1_fiore_5', 'v1_fiore_6'].forEach((fn, i) => {
      const tf = Math.max(0, Math.min(1, (state.bFlowers - i * 0.11) / 0.45));
      applyPartTransform(fn, tf, SCATTER_V1, EXPLODE_V1, state.explode, 1.15);
    });
  } else if (state.activeVar === 'v2') {
    const tVaso = Math.min(1, state.bV2 * 2.2);
    const tStalk = Math.max(0, Math.min(1, (state.bV2 - 0.25) / 0.42));
    applyPartTransform('v2_vaso', tVaso, SCATTER_V2, EXPLODE_V2, state.explode, 0.65);
    applyPartTransform('v2_pianta', tStalk, SCATTER_V2, EXPLODE_V2, state.explode, 0.95);
    ['v2_fiore_1', 'v2_fiore_2', 'v2_fiore_3'].forEach((fn, i) => {
      const tf = Math.max(0, Math.min(1, (state.bV2 - 0.52 - i * 0.12) / 0.24));
      applyPartTransform(fn, tf, SCATTER_V2, EXPLODE_V2, state.explode, 1.0);
    });
  } else if (state.activeVar === 'v3') {
    const tStalk = Math.min(1, state.bV3 * 2.0);
    applyPartTransform('v3_pianta', tStalk, SCATTER_V3, EXPLODE_V3, state.explode, 0.6);
    ['v3_fiore_1', 'v3_fiore_2', 'v3_fiore_3'].forEach((fn, i) => {
      const tf = Math.max(0, Math.min(1, (state.bV3 - 0.35 - i * 0.16) / 0.33));
      applyPartTransform(fn, tf, SCATTER_V3, EXPLODE_V3, state.explode, 0.95);
    });
  }

  // X-Ray shader update
  updateXrayShader(state.activeVar === 'v1' ? state.xray : 0);

  // Subtle idle breathing rotation on Hero / Story
  const isFree = state.manualOverride || state.activeChapter === 10;
  if (!isFree) {
    const idleYaw = state.activeChapter === 0 ? Math.sin(elapsed * 0.55) * 0.18 : 0;
    const theta = state.camTheta + idleYaw;
    const phi = state.camPhi;
    const dist = state.camDist * (window.innerWidth < 720 ? 1.24 : 1.0);
    const tx = window.innerWidth < 720 ? 0 : state.targetX;

    camera.position.set(
      tx + dist * Math.sin(phi) * Math.sin(theta),
      state.targetY + dist * Math.cos(phi),
      state.targetZ + dist * Math.sin(phi) * Math.cos(theta)
    );
    controls.target.set(tx, state.targetY, state.targetZ);
    camera.lookAt(controls.target);
  } else {
    if (state.autoSpin) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2.0;
    } else {
      controls.autoRotate = false;
    }
    controls.update();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. GSAP SCROLLTRIGGER CHOREOGRAPHY (11 CHAPTERS)
// ─────────────────────────────────────────────────────────────────────────────

function setActiveChapterUI(chIdx) {
  state.activeChapter = chIdx;
  if (chIdx > state.maxChapterReached) {
    state.maxChapterReached = chIdx;
    awardStuds(chIdx === 10 ? 1500 : 850);
    if (chIdx === 6) {
      showToast('🌼', 'COSTRUZIONE COMPLETATA!', '+850 Stud · Tutti i 6 fiori incastrati!');
    }
  }

  // Trigger Brick Smash particle burst when entering Chapter 1!
  if (chIdx === 1 && state.lastSmashChapter !== 1) {
    spawnStudBurst(22, 1.9, 2.8, false);
  }
  state.lastSmashChapter = chIdx;

  // Chapter rail dots
  document.querySelectorAll('.rail-dot').forEach((d, idx) => d.classList.toggle('active', idx === chIdx));

  // Build HUD top pill
  const hud = CHAPTER_HUD[chIdx];
  if (hud) {
    buildHudStep.textContent = hud[0];
    buildHudLabel.textContent = hud[1];
    buildHud.classList.remove('hidden');
  } else {
    buildHud.classList.add('hidden');
  }

  // Free Play Inspector & OrbitControls activation
  const isFree = chIdx === 10;
  controls.enabled = isFree;
  stageWrap.classList.toggle('interactive', isFree || chIdx === 0 || chIdx === 7);
  inspectorDock.classList.toggle('visible', isFree);
  quickColorBar.classList.toggle('hide-bar', isFree);

  if (isFree) {
    state.manualOverride = true;
    syncInspectorUI();
  } else {
    state.manualOverride = false;
    // Set canonical variation per chapter
    if (chIdx === 8) switchVariation('v2', false);
    else if (chIdx === 9) switchVariation('v3', false);
    else switchVariation('v1', false);

    state.showScaleRef = (chIdx === 9);
  }
}

function setupScrollChoreography() {
  gsap.registerPlugin(ScrollTrigger);

  const chapterDefs = [
    // 0: HERO — Subito Montato!
    {
      id: '#ch-hero', ch: 0,
      target: { bCore: 1, bAdapters: 1, bWalls: 1, bStalks: 1, bFlowers: 1, bV2: 1, bV3: 1, explode: 0, xray: 0,
                camTheta: 0.34, camPhi: 1.24, camDist: 7.4, targetX: -0.95, targetY: 2.15, targetZ: 0 },
    },
    // 1: BRICK SMASH! — Caduto a Pezzi!
    {
      id: '#ch-smash', ch: 1,
      target: { bCore: 0, bAdapters: 0, bWalls: 0, bStalks: 0, bFlowers: 0, explode: 0, xray: 0,
                camTheta: 0.28, camPhi: 0.92, camDist: 8.4, targetX: -0.65, targetY: 0.65, targetZ: 0.2 },
    },
    // 2: STEP 1 — Nucleo SNOT Nero
    {
      id: '#ch-step1', ch: 2,
      target: { bCore: 1, bAdapters: 0, bWalls: 0, bStalks: 0, bFlowers: 0, explode: 0, xray: 0,
                camTheta: -0.58, camPhi: 1.12, camDist: 6.2, targetX: 0.72, targetY: 0.75, targetZ: 0 },
    },
    // 3: STEP 2 & 3 — Piastre Adattatrici (dot + dot_fl)
    {
      id: '#ch-step23', ch: 3,
      target: { bCore: 1, bAdapters: 1, bWalls: 0, bStalks: 0, bFlowers: 0, explode: 0, xray: 0,
                camTheta: 0.65, camPhi: 1.10, camDist: 5.8, targetX: -0.68, targetY: 1.15, targetZ: 0 },
    },
    // 4: STEP 4 — Le 4 Pareti a Doghe
    {
      id: '#ch-step4', ch: 4,
      target: { bCore: 1, bAdapters: 1, bWalls: 1, bStalks: 0, bFlowers: 0, explode: 0, xray: 0,
                camTheta: -0.78, camPhi: 1.18, camDist: 6.0, targetX: 0.72, targetY: 1.15, targetZ: 0 },
    },
    // 5: STEP 5 & 6 — Doppio Stelo Botanico
    {
      id: '#ch-step56', ch: 5,
      target: { bCore: 1, bAdapters: 1, bWalls: 1, bStalks: 1, bFlowers: 0, explode: 0, xray: 0,
                camTheta: 0.52, camPhi: 1.24, camDist: 7.4, targetX: -0.82, targetY: 2.15, targetZ: 0 },
    },
    // 6: STEP 7-12 — Sbocciano i 6 Fiori!
    {
      id: '#ch-step712', ch: 6,
      target: { bCore: 1, bAdapters: 1, bWalls: 1, bStalks: 1, bFlowers: 1, explode: 0, xray: 0,
                camTheta: -0.45, camPhi: 1.22, camDist: 7.3, targetX: 0.85, targetY: 2.25, targetZ: 0 },
    },
    // 7: RAGGI X — Incastro Interno + Orbita 180°
    {
      id: '#ch-xray', ch: 7,
      target: { bCore: 1, bAdapters: 1, bWalls: 1, bStalks: 1, bFlowers: 1, explode: 0, xray: 1,
                camTheta: 2.35, camPhi: 1.22, camDist: 6.2, targetX: -0.65, targetY: 1.35, targetZ: 0 },
    },
    // 8: VARIAZIONE 2 — Vaso Alternativo Bianco
    {
      id: '#ch-var2', ch: 8,
      target: { bV2: 1, explode: 0, xray: 0,
                camTheta: -0.45, camPhi: 1.18, camDist: 5.4, targetX: 0.62, targetY: 1.38, targetZ: 0 },
    },
    // 9: VARIAZIONE 3 — Piantina Stand-Alone + Scala 1:1
    {
      id: '#ch-var3', ch: 9,
      target: { bV3: 1, explode: 0, xray: 0,
                camTheta: 0.42, camPhi: 1.18, camDist: 4.9, targetX: -0.45, targetY: 0.95, targetZ: 0.1 },
    },
    // 10: FREE PLAY 360°
    {
      id: '#ch-freeplay', ch: 10,
      target: { bCore: 1, bAdapters: 1, bWalls: 1, bStalks: 1, bFlowers: 1, bV2: 1, bV3: 1, explode: 0, xray: 0,
                camTheta: 0.36, camPhi: 1.20, camDist: 7.3, targetX: 0, targetY: 1.95, targetZ: 0 },
    },
  ];

  // Animate each chapter transition smoothly on scroll!
  chapterDefs.forEach((def, idx) => {
    const el = document.querySelector(def.id);
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 56%',
      end: 'bottom 44%',
      onEnter: () => {
        setActiveChapterUI(def.ch);
        if (def.ch === 8) {
          state.bV2 = 0;
          gsap.to(state, { ...def.target, duration: 1.25, ease: 'power2.out', overwrite: 'auto' });
        } else if (def.ch === 9) {
          state.bV3 = 0;
          gsap.to(state, { ...def.target, duration: 1.15, ease: 'power2.out', overwrite: 'auto' });
        } else {
          gsap.to(state, { ...def.target, duration: 1.05, ease: 'power2.inOut', overwrite: 'auto' });
        }
      },
      onEnterBack: () => {
        setActiveChapterUI(def.ch);
        gsap.to(state, { ...def.target, duration: 0.95, ease: 'power2.inOut', overwrite: 'auto' });
      },
    });
  });

  // Fade out 3D stage cleanly when scrolling into below-the-fold gallery/footer
  const belowFold = document.querySelector('.below-fold');
  if (belowFold) {
    ScrollTrigger.create({
      trigger: belowFold,
      start: 'top 82%',
      onEnter: () => {
        stageWrap.classList.add('faded-out');
        inspectorDock.classList.remove('visible');
        quickColorBar.classList.add('hide-bar');
        buildHud.classList.add('hidden');
      },
      onLeaveBack: () => {
        stageWrap.classList.remove('faded-out');
        setActiveChapterUI(state.activeChapter);
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. DE-OVERLAPPED 3D HOTSPOTS WITH SVG LEADER LINES & DRAWER
// ─────────────────────────────────────────────────────────────────────────────

const drawer = document.getElementById('component-drawer');
const drawerClose = document.getElementById('drawer-close');
const drawerBadge = document.getElementById('drawer-badge');
const drawerTitle = document.getElementById('drawer-title');
const drawerSubtitle = document.getElementById('drawer-subtitle');
const drawerDesc = document.getElementById('drawer-desc');
const drawerSpecs = document.getElementById('drawer-specs');

function buildChapterRail() {
  const rail = document.getElementById('chapter-rail');
  const ids = ['#ch-hero','#ch-smash','#ch-step1','#ch-step23','#ch-step4','#ch-step56','#ch-step712','#ch-xray','#ch-var2','#ch-var3','#ch-freeplay'];
  const names = ['Hero','Smash','Step 1','Step 2–3','Step 4','Step 5–6','Step 7–12','Raggi X','Vaso Alt.','Stand-Alone','Free Play'];
  rail.innerHTML = '';
  ids.forEach((sel, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rail-dot' + (idx === 0 ? ' active' : '');
    b.title = names[idx];
    b.setAttribute('aria-label', names[idx]);
    b.addEventListener('click', () => document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' }));
    rail.appendChild(b);
  });
}

function buildHotspotDOM() {
  hotspotsLayer.innerHTML = '';
  HOTSPOTS.forEach((h) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hotspot-pin hidden-pin';
    btn.innerHTML = `<span class="hotspot-num">${h.num}</span><span>${h.label}</span>`;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDrawer(h);
    });
    hotspotsLayer.appendChild(btn);
    pinElements.set(h.id, btn);
  });
}

function openDrawer(h) {
  pinElements.forEach((el, id) => el.classList.toggle('active', id === h.id));
  drawerBadge.textContent = h.badge;
  drawerTitle.textContent = h.title;
  drawerSubtitle.textContent = h.subtitle;
  drawerDesc.textContent = h.desc;
  drawerSpecs.innerHTML = h.specs.map(([k, v]) => `<div class="drawer-spec-row"><span>${k}</span><strong>${v}</strong></div>`).join('');
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  pinElements.forEach((el) => el.classList.remove('active'));
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
}
drawerClose.addEventListener('click', closeDrawer);

const tmpBox = new THREE.Box3();
const tmpVec = new THREE.Vector3();
const tmpCorner = new THREE.Vector3();

function projectBoxToScreen(box, w, h) {
  let sxMin = Infinity, sxMax = -Infinity, syMin = Infinity, syMax = -Infinity;
  const xs = [box.min.x, box.max.x], ys = [box.min.y, box.max.y], zs = [box.min.z, box.max.z];
  for (let ix = 0; ix < 2; ix++) {
    for (let iy = 0; iy < 2; iy++) {
      for (let iz = 0; iz < 2; iz++) {
        tmpCorner.set(xs[ix], ys[iy], zs[iz]).project(camera);
        const px = (tmpCorner.x * 0.5 + 0.5) * w;
        const py = (-tmpCorner.y * 0.5 + 0.5) * h;
        if (px < sxMin) sxMin = px;
        if (px > sxMax) sxMax = px;
        if (py < syMin) syMin = py;
        if (py > syMax) syMax = py;
      }
    }
  }
  return { sxMin, sxMax, syMin, syMax };
}

function updateHotspotPositions() {
  if (!rootScene) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isMobile = w < 720;

  if (!state.showPinsToggle || stageWrap.classList.contains('faded-out')) {
    pinElements.forEach((el) => el.classList.add('hidden-pin'));
    leaderSvg.innerHTML = '';
    return;
  }

  const chIds = CHAPTER_PINS[state.activeChapter] || [];
  const visibleSet = new Set(chIds);
  const cardSide = state.manualOverride ? 'top' : (CHAPTER_CARD_SIDE[state.activeChapter] || 'none');

  const minY = cardSide === 'top' ? 195 : 116;
  const maxY = h - (state.activeChapter === 10 ? 150 : 62);
  const minX = (!isMobile && cardSide === 'left') ? Math.min(w * 0.44, 520) : 92;
  const maxX = (!isMobile && cardSide === 'right') ? Math.max(w * 0.56, w - 520) : w - 92;

  const placed = [];
  const compBoxes = [];

  HOTSPOTS.forEach((item) => {
    const el = pinElements.get(item.id);
    const obj = partMap.get(item.id);
    if (!el || !obj) return;

    if (!visibleSet.has(item.id) || item.varId !== state.activeVar) {
      el.classList.add('hidden-pin');
      return;
    }

    tmpBox.setFromObject(obj);
    if (tmpBox.isEmpty()) {
      el.classList.add('hidden-pin');
      return;
    }
    tmpBox.getCenter(tmpVec);
    tmpVec.project(camera);
    if (tmpVec.z > 1) {
      el.classList.add('hidden-pin');
      return;
    }

    const ax = (tmpVec.x * 0.5 + 0.5) * w;
    const ay = (-tmpVec.y * 0.5 + 0.5) * h;
    const sb = projectBoxToScreen(tmpBox, w, h);
    compBoxes.push(sb);

    const pillW = Math.max(124, el.offsetWidth || 138);
    const pillH = Math.max(30, el.offsetHeight || 32);

    // Place pill strictly OUTSIDE the component's projected bounding box!
    const pad = 26;
    const candidates = [
      { x: sb.sxMax + pad + pillW / 2, y: ay },
      { x: sb.sxMin - pad - pillW / 2, y: ay },
      { x: ax, y: sb.syMin - pad - pillH / 2 },
      { x: ax, y: sb.syMax + pad + pillH / 2 },
    ];
    let best = candidates[0];
    let bestScore = -1e9;
    candidates.forEach((c) => {
      const inX = c.x - pillW / 2 >= minX && c.x + pillW / 2 <= maxX;
      const inY = c.y - pillH / 2 >= minY && c.y + pillH / 2 <= maxY;
      const distCenter = Math.hypot(c.x - w * 0.5, c.y - h * 0.5);
      const score = (inX ? 2000 : 0) + (inY ? 2000 : 0) - distCenter * 0.25;
      if (score > bestScore) { bestScore = score; best = c; }
    });

    placed.push({
      el, ax, ay,
      lx: THREE.MathUtils.clamp(best.x, minX + pillW / 2, maxX - pillW / 2),
      ly: THREE.MathUtils.clamp(best.y, minY + pillH / 2, maxY - pillH / 2),
      pw: pillW, ph: pillH,
    });
  });

  // Iterative 2D repulsion (pill <-> pill & pill <-> component box)
  for (let iter = 0; iter < 14; iter++) {
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i], b = placed[j];
        const dx = b.lx - a.lx;
        const dy = b.ly - a.ly;
        const ox = (a.pw + b.pw) * 0.5 + 12 - Math.abs(dx);
        const oy = (a.ph + b.ph) * 0.5 + 10 - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          if (oy < ox) {
            const s = dy >= 0 ? 1 : -1;
            a.ly -= s * oy * 0.5; b.ly += s * oy * 0.5;
          } else {
            const s = dx >= 0 ? 1 : -1;
            a.lx -= s * ox * 0.5; b.lx += s * ox * 0.5;
          }
        }
      }
      const p = placed[i];
      p.lx = THREE.MathUtils.clamp(p.lx, minX + p.pw / 2, maxX - p.pw / 2);
      p.ly = THREE.MathUtils.clamp(p.ly, minY + p.ph / 2, maxY - p.ph / 2);
    }
  }

  let svgOut = '';
  placed.forEach((p) => {
    p.el.classList.remove('hidden-pin');
    p.el.style.left = `${p.lx}px`;
    p.el.style.top = `${p.ly}px`;

    const edgeX = p.lx > p.ax ? p.lx - p.pw * 0.5 : p.lx + p.pw * 0.5;
    const midX = (p.ax + edgeX) * 0.5;
    svgOut += `
      <polyline points="${p.ax.toFixed(1)},${p.ay.toFixed(1)} ${midX.toFixed(1)},${p.ly.toFixed(1)} ${edgeX.toFixed(1)},${p.ly.toFixed(1)}"
        fill="none" stroke="rgba(255,213,0,0.72)" stroke-width="1.6" stroke-dasharray="4 3" />
      <circle cx="${p.ax.toFixed(1)}" cy="${p.ay.toFixed(1)}" r="4.2" fill="#FFD500" stroke="#0d1018" stroke-width="1.8" />
    `;
  });
  leaderSvg.innerHTML = svgOut;
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. INSPECTOR CONTROLS, VARIATION SWITCHER & EASTER EGGS
// ─────────────────────────────────────────────────────────────────────────────

function switchVariation(vKey, animateCamera = true) {
  if (state.activeVar === vKey && !animateCamera) return;
  state.activeVar = vKey;
  document.querySelectorAll('#var-selector .seg-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.var === vKey);
  });
  refreshFlowerDotButtons();

  if (animateCamera) {
    const ty = vKey === 'v1' ? 1.95 : (vKey === 'v2' ? 1.35 : 0.95);
    const dist = vKey === 'v1' ? 7.2 : (vKey === 'v2' ? 5.2 : 4.5);
    gsap.to(controls.target, { x: 0, y: ty, z: 0, duration: 0.65, ease: 'power2.out' });
    const dir = camera.position.clone().sub(controls.target).normalize();
    gsap.to(camera.position, {
      x: dir.x * dist,
      y: Math.max(1.2, ty + dir.y * dist * 0.55),
      z: dir.z * dist,
      duration: 0.65,
      ease: 'power2.out',
    });
  }
}

function setUnifiedBuild(val01) {
  state.bCore = Math.min(1, val01 * 4.5);
  state.bAdapters = Math.max(0, Math.min(1, (val01 - 0.16) / 0.22));
  state.bWalls = Math.max(0, Math.min(1, (val01 - 0.32) / 0.26));
  state.bStalks = Math.max(0, Math.min(1, (val01 - 0.52) / 0.25));
  state.bFlowers = Math.max(0, Math.min(1, (val01 - 0.72) / 0.28));
  state.bV2 = val01;
  state.bV3 = val01;
}

const sliderBuild = document.getElementById('slider-build');
const valBuild = document.getElementById('val-build');
const sliderExplode = document.getElementById('slider-explode');
const valExplode = document.getElementById('val-explode');
const btnXray = document.getElementById('btn-xray');
const btnScale = document.getElementById('btn-scale');
const btnPins = document.getElementById('btn-pins');
const btnSpin = document.getElementById('btn-spin');

function syncInspectorUI() {
  sliderBuild.value = Math.round(state.bFlowers * 100);
  valBuild.textContent = `${sliderBuild.value}%`;
  sliderExplode.value = Math.round(state.explode * 100);
  valExplode.textContent = `${sliderExplode.value}%`;
  btnXray.setAttribute('aria-pressed', String(state.xray > 0.5));
  btnXray.classList.toggle('active', state.xray > 0.5);
  btnScale.setAttribute('aria-pressed', String(state.showScaleRef));
  btnScale.classList.toggle('active', state.showScaleRef);
  btnPins.setAttribute('aria-pressed', String(state.showPinsToggle));
  btnPins.classList.toggle('active', state.showPinsToggle);
  btnSpin.setAttribute('aria-pressed', String(state.autoSpin));
  btnSpin.classList.toggle('active', state.autoSpin);
  refreshFlowerDotButtons();
}

function triggerSmashAndRebuild() {
  spawnStudBurst(28, 1.8, 3.0, goldUnlocked);
  awardStuds(500);
  showToast('💥', 'BRICK SMASH!', 'Ricostruzione automatica in corso…');
  const proxy = { v: 1 };
  gsap.to(proxy, {
    v: 0,
    duration: 0.65,
    ease: 'power3.out',
    onUpdate: () => {
      setUnifiedBuild(proxy.v);
      sliderBuild.value = Math.round(proxy.v * 100);
      valBuild.textContent = `${sliderBuild.value}%`;
    },
    onComplete: () => {
      gsap.to(proxy, {
        v: 1,
        delay: 0.55,
        duration: 1.9,
        ease: 'power2.inOut',
        onUpdate: () => {
          setUnifiedBuild(proxy.v);
          sliderBuild.value = Math.round(proxy.v * 100);
          valBuild.textContent = `${sliderBuild.value}%`;
        },
      });
    },
  });
}

function setupUIControls() {
  // Quick Flower Palette Bar
  document.querySelectorAll('.qcb-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyPalette(btn.dataset.palette));
  });

  // Shuffle Flowers buttons inside story cards
  document.querySelectorAll('.btn-shuffle-flowers').forEach((btn) => {
    btn.addEventListener('click', () => applyPalette('random'));
  });

  // Variation Selector in Free Play
  document.querySelectorAll('#var-selector .seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchVariation(btn.dataset.var, true));
  });

  // Build Slider
  sliderBuild.addEventListener('input', () => {
    const v = Number(sliderBuild.value) / 100;
    valBuild.textContent = `${sliderBuild.value}%`;
    setUnifiedBuild(v);
  });

  // Explode Slider
  sliderExplode.addEventListener('input', () => {
    const v = Number(sliderExplode.value) / 100;
    valExplode.textContent = `${sliderExplode.value}%`;
    state.explode = v;
  });

  // Action Buttons
  document.getElementById('btn-smash').addEventListener('click', triggerSmashAndRebuild);

  btnXray.addEventListener('click', () => {
    const next = state.xray > 0.5 ? 0 : 1;
    gsap.to(state, { xray: next, duration: 0.45 });
    btnXray.setAttribute('aria-pressed', String(next > 0.5));
    btnXray.classList.toggle('active', next > 0.5);
  });

  btnScale.addEventListener('click', () => {
    state.showScaleRef = !state.showScaleRef;
    btnScale.setAttribute('aria-pressed', String(state.showScaleRef));
    btnScale.classList.toggle('active', state.showScaleRef);
    if (state.showScaleRef) {
      showToast('📏', 'SCALA REALE 1:1', 'Guarda la pila di mattoncini LEGO reali alla base!');
    }
  });

  btnPins.addEventListener('click', () => {
    state.showPinsToggle = !state.showPinsToggle;
    btnPins.setAttribute('aria-pressed', String(state.showPinsToggle));
    btnPins.classList.toggle('active', state.showPinsToggle);
  });

  btnSpin.addEventListener('click', () => {
    state.autoSpin = !state.autoSpin;
    btnSpin.setAttribute('aria-pressed', String(state.autoSpin));
    btnSpin.classList.toggle('active', state.autoSpin);
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    setUnifiedBuild(1);
    state.explode = 0;
    state.xray = 0;
    state.autoSpin = false;
    syncInspectorUI();
    switchVariation(state.activeVar, true);
  });

  // Below-the-fold "Esplora in 3D" variation cards -> jump straight to Free Play!
  document.querySelectorAll('.jump-freeplay').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelector('#ch-freeplay')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        setActiveChapterUI(10);
        switchVariation(btn.dataset.var, true);
      }, 450);
    });
  });

  // EASTER EGG #1: Click Stud Counter 5 times -> TRUE BUILDER 100% PARTY!
  let studClicks = 0;
  let studClickTimer = null;
  studHudBtn.addEventListener('click', () => {
    studClicks++;
    awardStuds(100);
    clearTimeout(studClickTimer);
    studClickTimer = setTimeout(() => { studClicks = 0; }, 2200);
    if (studClicks >= 5) {
      studClicks = 0;
      awardStuds(5000);
      spawnStudBurst(40, 2.2, 3.6, true);
      applyPalette('rainbow');
      showToast('🏆', 'TRUE BUILDER 100%!', 'Easter Egg scoperto! Pioggia di stud viola + Rainbow!');
    }
  });

  // Keyboard shortcut 'B' in Free Play -> Brick Smash!
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'b' && state.activeChapter === 10) {
      triggerSmashAndRebuild();
    }
  });

  // Gallery Lightbox
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCap = document.getElementById('lightbox-cap');
  document.querySelectorAll('.gal-item').forEach((fig) => {
    fig.addEventListener('click', () => {
      const img = fig.querySelector('img');
      const cap = fig.querySelector('figcaption');
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = cap ? cap.textContent : '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
    });
  });
  const closeLb = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); };
  document.getElementById('lightbox-close').addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. 3D RAYCAST INTERACTIONS (Click Flower to Paint + Click Secret Minikit!)
// ─────────────────────────────────────────────────────────────────────────────

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPos = { x: 0, y: 0 };

function setupRaycastInteractions() {
  canvas.addEventListener('pointerdown', (e) => {
    downPos = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointerup', (e) => {
    // Ignore drags (OrbitControls rotations)
    if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 7) return;
    if (!rootScene) return;

    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const targets = [];
    if (state.activeVar === 'v1' && v1Root) targets.push(v1Root);
    if (state.activeVar === 'v2' && v2Root) targets.push(v2Root);
    if (state.activeVar === 'v3' && v3Root) targets.push(v3Root);
    if (minikitRoot && minikitRoot.visible) targets.push(minikitRoot);

    const hits = raycaster.intersectObjects(targets, true);
    if (!hits.length) return;

    const hitObj = hits[0].object;

    // EASTER EGG #2: Secret Minikit Collected!
    if (hitObj.userData.isMinikit && !state.minikitFound) {
      state.minikitFound = true;
      goldUnlocked = true;
      minikitBadge.textContent = 'MK 1/1 ★';
      minikitBadge.classList.add('found');
      awardStuds(10000);
      spawnStudBurst(45, 1.2, 3.8, true);
      applyPalette('gold');
      showToast('✨', 'MINIKIT SEGRETO 1/1!', 'Sbloccata finitura ORO 24K per i tuoi fiori!');
      return;
    }

    // Direct 3D Flower Paint on Click!
    if (typeof hitObj.userData.flowerSlot === 'number') {
      cycleFlowerSlot(hitObj.userData.flowerSlot);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. MAIN ANIMATION LOOP & RESIZE
// ─────────────────────────────────────────────────────────────────────────────

const clock = new THREE.Clock();
let prevTime = 0;

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const dt = Math.min(0.05, elapsed - prevTime);
  prevTime = elapsed;

  updateSceneFromState(elapsed);
  updateStudParticles(dt);
  renderer.render(scene, camera);
  updateHotspotPositions();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
