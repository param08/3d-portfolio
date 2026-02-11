/* ========= BASIC SETUP ========= */
const canvas = document.getElementById("webgl");
const yearEl = document.getElementById("year");
yearEl.textContent = new Date().getFullYear();

const gate = document.getElementById("gate");
const startBtn = document.getElementById("startBtn");
const soundBtn = document.getElementById("soundBtn");
const scrollEl = document.getElementById("scroll");

/* ========= OPTIONAL SOUND ========= */
let audioCtx = null;
let soundOn = false;

function beep() {
  if (!soundOn) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "sine";
  o.frequency.value = 220;
  g.gain.value = 0.03;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  setTimeout(() => { o.stop(); }, 80);
}

soundBtn.addEventListener("click", async () => {
  soundOn = !soundOn;
  soundBtn.setAttribute("aria-pressed", String(soundOn));
  soundBtn.textContent = soundOn ? "SOUND: ON" : "SOUND: OFF";
  if (soundOn) {
    beep();
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume?.();
  }
});

/* ========= START GATE ========= */
startBtn.addEventListener("click", async () => {
  gate.style.opacity = "0";
  gate.style.pointerEvents = "none";
  setTimeout(() => gate.remove(), 450);
  beep();
});

/* ========= THREE.JS SCENE ========= */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0.2, 6);

/* Lights */
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dir = new THREE.DirectionalLight(0xffffff, 1.1);
dir.position.set(5, 6, 4);
scene.add(dir);

/* Starfield (background particles) */
const starCount = 1600;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const i3 = i * 3;
  starPos[i3 + 0] = (Math.random() - 0.5) * 60;
  starPos[i3 + 1] = (Math.random() - 0.5) * 40;
  starPos[i3 + 2] = -Math.random() * 80;
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ size: 0.05, transparent: true, opacity: 0.9 });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

/* A simple “scene object” (replace later with GLB model) */
const core = new THREE.Group();
scene.add(core);

const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.8, 0.22, 180, 18),
  new THREE.MeshStandardMaterial({ metalness: 0.6, roughness: 0.35 })
);
core.add(knot);

/* Floating glass panels in 3D */
function makePanel(z, x, y) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.0, 0.02),
    new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.18, metalness: 0.2, roughness: 0.05 })
  );
  mesh.position.set(x, y, z);
  core.add(mesh);
  return mesh;
}
const p1 = makePanel(-2.5, -2.2, 0.7);
const p2 = makePanel(-8.0,  2.2, -0.2);
const p3 = makePanel(-14.0, -2.2, 0.2);

/* ========= SCROLL -> CAMERA STORY ========= */
function clamp01(n){ return Math.max(0, Math.min(1, n)); }

function getScrollProgress() {
  const max = scrollEl.scrollHeight - scrollEl.clientHeight;
  if (max <= 0) return 0;
  return clamp01(scrollEl.scrollTop / max);
}

/* A cinematic path based on scroll progress */
function applyStory(t) {
  // t: 0..1
  // Move camera forward through “chapters”
  const z = 6 - t * 20;     // from 6 to -14
  const x = Math.sin(t * Math.PI * 2) * 0.9;
  const y = 0.2 + Math.sin(t * Math.PI) * 0.25;

  camera.position.set(x, y, z);
  camera.lookAt(0, 0, z - 6);

  // Rotate core object for life
  core.rotation.y = t * Math.PI * 1.4;
  core.rotation.x = Math.sin(t * Math.PI) * 0.12;

  // Parallax stars
  stars.position.z = -t * 8;
}

/* ========= LOOP ========= */
const clock = new THREE.Clock();

function tick() {
  const elapsed = clock.getElapsedTime();
  const t = getScrollProgress();

  knot.rotation.x = elapsed * 0.2;
  knot.rotation.z = elapsed * 0.16;

  // subtle float
  p1.position.y = 0.7 + Math.sin(elapsed * 0.7) * 0.08;
  p2.position.y = -0.2 + Math.sin(elapsed * 0.8 + 1.2) * 0.08;
  p3.position.y = 0.2 + Math.sin(elapsed * 0.9 + 2.0) * 0.08;

  applyStory(t);

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

/* ========= RESIZE ========= */
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

/* ========= NAV ANCHORS (smooth jump) ========= */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth" });
    beep();
  });
});
