import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

//
// ===== Config (tune here) =====
//
const HALL = {
  width: 8,
  height: 3.2,
  length: 42
};

const PLAYER = {
  speed: 2.4,          // m/s
  accel: 8.0,          // higher = snappier, keep moderate
  damping: 10.0,       // velocity damping
  radius: 0.25
};

const CAMERA = {
  height: 1.35,
  back: 2.6,
  lookAhead: 2.0,
  smooth: 0.08         // lower = more cinematic (slower)
};

const FRAMES = {
  countPerSide: 5,
  y: 1.55,
  zStart: 6,
  zStep: 6.5,
  proximity: 1.7,
  scaleUp: 1.06
};

//
// ===== DOM =====
//
const canvas = document.getElementById("c");
const hintEl = document.getElementById("hint");
const overlayEl = document.getElementById("overlay");
const overlayImg = document.getElementById("overlayImg");
const closeBtn = document.getElementById("closeBtn");

//
// ===== Renderer(s) =====
//
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = "absolute";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.left = "0";
labelRenderer.domElement.style.pointerEvents = "none";
document.getElementById("app").appendChild(labelRenderer.domElement);

//
// ===== Scene / Camera =====
//
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xff0000);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  120
);

//
// ===== Lighting (soft, cheap) =====
//
scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const hallLight = new THREE.PointLight(0xffffff, 1.2, HALL.length * 1.2);
hallLight.position.set(0, HALL.height - 0.3, HALL.length * 0.5);
scene.add(hallLight);

//
// ===== Hall geometry (matte, neutral) =====
//
const hallGroup = new THREE.Group();
scene.add(hallGroup);

const wallMat = new THREE.MeshStandardMaterial({
  color: 0x2f3237,
  roughness: 0.95,
  metalness: 0.0
});
const lightWallMat = new THREE.MeshStandardMaterial({
  color: 0x2a2d31,
  roughness: 0.95,
  metalness: 0.0
});
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x101113,
  roughness: 0.98,
  metalness: 0.0
});

function addBox(w, h, d, mat, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  hallGroup.add(mesh);
  return mesh;
}

const floor = addBox(HALL.width, 0.15, HALL.length, floorMat, 0, -0.075, HALL.length * 0.5);
const ceiling = addBox(HALL.width, 0.12, HALL.length, wallMat, 0, HALL.height, HALL.length * 0.5);

const leftWall = addBox(0.15, HALL.height, HALL.length, lightWallMat, -HALL.width * 0.5, HALL.height * 0.5, HALL.length * 0.5);
const rightWall = addBox(0.15, HALL.height, HALL.length, lightWallMat, HALL.width * 0.5, HALL.height * 0.5, HALL.length * 0.5);
const endWall = addBox(HALL.width, HALL.height, 0.15, wallMat, 0, HALL.height * 0.5, HALL.length);

//
// ===== Bio text (REAL TEXT, not texture) =====
//
const bioDiv = document.createElement("div");
bioDiv.className = "bio";
bioDiv.style.cssText = `
  max-width: 520px;
  padding: 12px 16px;
  color: rgba(255,255,255,0.88);
  font-size: 15px;
  line-height: 1.35;
  letter-spacing: 0.2px;
  text-align: center;
`;
bioDiv.innerHTML = `
  <div style="font-size:18px; margin-bottom:8px; color:rgba(255,255,255,0.92)">Welcome to my portfolio.</div>
  <div>
    I’m a photographer and videographer with a focus on calm, cinematic moments.
    Through my lens, I tell stories that evoke emotion and inspire.
    <br><br>
    Explore my work and enjoy the journey.
  </div>
`;

const bioLabel = new CSS2DObject(bioDiv);
bioLabel.position.set(0, FRAMES.y, HALL.length - 0.25);
scene.add(bioLabel);

//
// ===== Player (minimal silhouette) =====
//
const player = new THREE.Group();
scene.add(player);

const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x0a0b0d,
  roughness: 1.0,
  metalness: 0.0
});

// Body
const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.9, 10), bodyMat);
torso.position.set(0, 0.45, 0);
player.add(torso);

// Head
const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), bodyMat);
head.position.set(0, 0.98, 0);
player.add(head);

// Simple “camera” block
const camBlock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.22), bodyMat);
camBlock.position.set(0.18, 0.72, 0.18);
player.add(camBlock);

// Initial position
player.position.set(0, 0, 1.2);

//
// ===== Frames + photos (lazy textures) =====
// Provide your own images in /assets (or URLs). Keep them optimized.
// Example paths:
//
const photoSources = [
  "./assets/p1.jpg", "./assets/p2.jpg", "./assets/p3.jpg", "./assets/p4.jpg", "./assets/p5.jpg",
  "./assets/p6.jpg", "./assets/p7.jpg", "./assets/p8.jpg", "./assets/p9.jpg", "./assets/p10.jpg"
];

const framesGroup = new THREE.Group();
hallGroup.add(framesGroup);

const frameMat = new THREE.MeshStandardMaterial({
  color: 0x0f1114,
  roughness: 0.9,
  metalness: 0.0
});

const loader = new THREE.TextureLoader();
loader.setCrossOrigin("anonymous");

// Cache loaded textures
const textureCache = new Map();

function getTextureLazy(src) {
  if (textureCache.has(src)) return textureCache.get(src);

  // Put a placeholder marker so we don't double-load
  textureCache.set(src, null);

  loader.load(
    src,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      textureCache.set(src, tex);
    },
    undefined,
    () => {
      // Keep null on error (don’t crash)
      textureCache.set(src, null);
    }
  );

  return null;
}

function makeFrame({ side, index, src }) {
  const frame = new THREE.Group();

  // Frame mesh
  const border = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.95, 0.07), frameMat);
  frame.add(border);

  // Photo plane (starts dark; texture assigned when loaded)
  const photoMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.0,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.25
  });

  const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.82), photoMat);
  photo.position.set(0, 0, 0.041);
  frame.add(photo);

  // Placement on wall
  const x = side === "left" ? (-HALL.width * 0.5 + 0.14) : (HALL.width * 0.5 - 0.14);
  const z = FRAMES.zStart + index * FRAMES.zStep;
  frame.position.set(x, FRAMES.y, z);

  // Rotate to face inward
  frame.rotation.y = side === "left" ? Math.PI / 2 : -Math.PI / 2;

  // Soft point light near frame (cheap, low intensity)
  const light = new THREE.PointLight(0xffffff, 0.9, 4.0, 2.0);
  light.position.set(side === "left" ? -HALL.width * 0.5 + 0.9 : HALL.width * 0.5 - 0.9, FRAMES.y + 0.2, z);
  scene.add(light);

  // Metadata for interaction
  frame.userData = {
    src,
    photo,
    baseScale: 1.0,
    targetScale: 1.0,
    baseEmissive: 0.25,
    targetEmissive: 0.25,
    loaded: false
  };

  framesGroup.add(frame);
  return frame;
}

const frames = [];
for (let i = 0; i < FRAMES.countPerSide; i++) {
  frames.push(makeFrame({ side: "left", index: i, src: photoSources[i] }));
  frames.push(makeFrame({ side: "right", index: i, src: photoSources[i + FRAMES.countPerSide] }));
}

//
// ===== Joystick (analog vector) =====
//
const joyBase = document.getElementById("joyBase");
const joyKnob = document.getElementById("joyKnob");

const joystick = {
  active: false,
  pointerId: null,
  value: new THREE.Vector2(0, 0), // x,y in [-1..1]
  center: new THREE.Vector2(),
  radius: 46
};

function setKnob(x, y) {
  joyKnob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
}

function onJoyDown(e) {
  joystick.active = true;
  joystick.pointerId = e.pointerId ?? "mouse";
  joyBase.setPointerCapture?.(e.pointerId);

  const rect = joyBase.getBoundingClientRect();
  joystick.center.set(rect.left + rect.width / 2, rect.top + rect.height / 2);
  onJoyMove(e);
}

function onJoyMove(e) {
  if (!joystick.active) return;
  if ((e.pointerId ?? "mouse") !== joystick.pointerId) return;

  const dx = (e.clientX - joystick.center.x);
  const dy = (e.clientY - joystick.center.y);

  const v = new THREE.Vector2(dx, dy);
  const len = v.length();
  const clamped = len > joystick.radius ? v.multiplyScalar(joystick.radius / len) : v;

  // UI knob position
  setKnob(clamped.x, clamped.y);

  // Value (invert Y so up = +1 forward)
  joystick.value.set(clamped.x / joystick.radius, -clamped.y / joystick.radius);
}

function onJoyUp(e) {
  if ((e.pointerId ?? "mouse") !== joystick.pointerId) return;
  joystick.active = false;
  joystick.pointerId = null;
  joystick.value.set(0, 0);
  setKnob(0, 0);
}

joyBase.addEventListener("pointerdown", onJoyDown);
window.addEventListener("pointermove", onJoyMove, { passive: true });
window.addEventListener("pointerup", onJoyUp);

//
// ===== Movement + Camera follow (smooth) =====
//
const clock = new THREE.Clock();
const velocity = new THREE.Vector3();

function clampToHall(pos) {
  const marginX = 0.75;
  const marginZ = 0.9;

  pos.x = THREE.MathUtils.clamp(pos.x, -HALL.width * 0.5 + marginX, HALL.width * 0.5 - marginX);
  pos.z = THREE.MathUtils.clamp(pos.z, 0.7, HALL.length - marginZ);
}

function updatePlayer(dt) {
  // Joystick drives direction in X/Z plane
  const input = joystick.value; // x=strafe, y=forward

  const desired = new THREE.Vector3(input.x, 0, input.y);

  // Normalize only if above tiny threshold (avoid jitter)
  if (desired.lengthSq() > 0.0001) desired.normalize();

  // Smooth acceleration towards desired velocity
  const targetVel = desired.multiplyScalar(PLAYER.speed);

  velocity.x = THREE.MathUtils.damp(velocity.x, targetVel.x, PLAYER.accel, dt);
  velocity.z = THREE.MathUtils.damp(velocity.z, targetVel.z, PLAYER.accel, dt);

  // Damping when no input (calm stop)
  if (joystick.value.lengthSq() < 0.0005) {
    velocity.x = THREE.MathUtils.damp(velocity.x, 0, PLAYER.damping, dt);
    velocity.z = THREE.MathUtils.damp(velocity.z, 0, PLAYER.damping, dt);
  }

  player.position.addScaledVector(velocity, dt);
  clampToHall(player.position);

  // Face direction of motion (subtle)
  const planarSpeed = Math.hypot(velocity.x, velocity.z);
  if (planarSpeed > 0.2) {
    const yaw = Math.atan2(velocity.x, velocity.z);
    player.rotation.y = THREE.MathUtils.damp(player.rotation.y, yaw, 8.0, dt);
  }
}

const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();

function updateCamera(dt) {
  // Camera behind player based on facing direction
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(player.quaternion);
  const desiredPos = player.position.clone()
    .addScaledVector(forward, -CAMERA.back)
    .add(new THREE.Vector3(0, CAMERA.height, 0));

  const desiredLook = player.position.clone()
    .addScaledVector(forward, CAMERA.lookAhead)
    .add(new THREE.Vector3(0, 0.9, 0));

  camPos.lerp(desiredPos, 1 - Math.pow(1 - CAMERA.smooth, dt * 60));
  camLook.lerp(desiredLook, 1 - Math.pow(1 - CAMERA.smooth, dt * 60));

  camera.position.copy(camPos);
  camera.lookAt(camLook);
}

//
// ===== Proximity interaction + lazy textures =====
//
let activeFrame = null;
let overlayOpen = false;

function setHintVisible(v) {
  hintEl.classList.toggle("hidden", !v);
}

function openOverlay(src) {
  overlayOpen = true;
  overlayImg.src = src;
  overlayEl.classList.remove("hidden");
}

function closeOverlay() {
  overlayOpen = false;
  overlayEl.classList.add("hidden");
  overlayImg.src = "";
}

closeBtn.addEventListener("click", closeOverlay);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlayOpen) closeOverlay();
});

function updateFrames(dt) {
  activeFrame = null;
  let bestDist = Infinity;

  for (const frame of framesGroup.children) {
    const d = frame.position.distanceTo(player.position);

    const ud = frame.userData;

    // Lazy-load: start loading when within a wider radius
    if (!ud.loaded && d < FRAMES.proximity + 4.0) {
      const tex = getTextureLazy(ud.src);
      if (tex) {
        ud.photo.material.map = tex;
        ud.photo.material.needsUpdate = true;
        ud.loaded = true;
      }
    }

    // Proximity highlight
    const inRange = d < FRAMES.proximity;
    ud.targetScale = inRange ? FRAMES.scaleUp : 1.0;
    ud.targetEmissive = inRange ? 0.55 : ud.baseEmissive;

    // Smooth transitions
    const s = THREE.MathUtils.damp(frame.scale.x, ud.targetScale, 10.0, dt);
    frame.scale.setScalar(s);

    ud.photo.material.emissiveIntensity =
      THREE.MathUtils.damp(ud.photo.material.emissiveIntensity, ud.targetEmissive, 10.0, dt);

    if (inRange && d < bestDist) {
      bestDist = d;
      activeFrame = frame;
    }
  }

  setHintVisible(!overlayOpen && !!activeFrame);
}

//
// ===== Click to open active frame =====
//
window.addEventListener("pointerdown", (e) => {
  // If overlay open, ignore (close button / ESC handles)
  if (overlayOpen) return;

  // If click is on joystick, ignore (prevents accidental open)
  const joyRect = document.getElementById("joystick").getBoundingClientRect();
  const inJoy = e.clientX >= joyRect.left && e.clientX <= joyRect.right && e.clientY >= joyRect.top && e.clientY <= joyRect.bottom;
  if (inJoy) return;

  if (activeFrame) {
    openOverlay(activeFrame.userData.src);
  }
});

//
// ===== Render loop =====
//
function animate() {
  const dt = Math.min(clock.getDelta(), 0.033); // clamp dt to avoid spikes

  if (!overlayOpen) {
    updatePlayer(dt);
  } else {
    // Freeze player when viewing fullscreen
    velocity.set(0, 0, 0);
  }

  updateFrames(dt);
  updateCamera(dt);

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  requestAnimationFrame(animate);
}
animate();

//
// ===== Resize =====
//
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
