import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, SkinConfig } from '../../store/gameStore';
import { ClassicDinoModel } from '../../models/dino/skins/ClassicDinoModel';
import { DinoAnimationState } from '../../models/dino/types';
import { spawnParticles } from '../../components/VFXRenderer';

// Background life for the lava biome: a running dino herd, pterosaurs, volcano eruptions, meteor
// showers and lane-side props. Everything here is scenery — none of it can hurt the player.

export interface LavaVolcano {
  x: number;
  height: number;
  width: number;
  z: number;
}

const dummy = new THREE.Object3D();
const rand = (a: number, b: number) => a + Math.random() * (b - a);

const isLive = () => {
  const s = useGameStore.getState().status;
  return s === 'playing' || s === 'menu';
};

// ---------------------------------------------------------------------------------------------
// Running herd (random event): several dinos sprint through the background one after another
// ---------------------------------------------------------------------------------------------

const HERD_MAX = { low: 4, medium: 6, high: 7 } as const;
const HERD_SCALE = 1.3; // the player's rig is drawn at 0.85; these run deeper in the scene

// Same rig as the player's dino (ClassicDinoModel), just recoloured.
const HERD_SKINS: SkinConfig[] = [
  { id: 'herd-orange', name: 'Herd', rarity: 'common', price: 0, baseColor: '#c2683c', spotsColor: '#fde047', spikesColor: '#7c2d12', collarColor: '#dc2626' },
  { id: 'herd-crimson', name: 'Herd', rarity: 'common', price: 0, baseColor: '#b03a2e', spotsColor: '#fbbf24', spikesColor: '#451a03', collarColor: '#f97316' },
  { id: 'herd-sand', name: 'Herd', rarity: 'common', price: 0, baseColor: '#d9a05b', spotsColor: '#fff7ed', spikesColor: '#92400e', collarColor: '#b91c1c' },
  { id: 'herd-olive', name: 'Herd', rarity: 'common', price: 0, baseColor: '#8a9a3a', spotsColor: '#fde68a', spikesColor: '#3f6212', collarColor: '#ef4444' },
  { id: 'herd-plum', name: 'Herd', rarity: 'common', price: 0, baseColor: '#9d4a7a', spotsColor: '#fbcfe8', spikesColor: '#581c87', collarColor: '#fbbf24' },
  { id: 'herd-teal', name: 'Herd', rarity: 'common', price: 0, baseColor: '#2f8f83', spotsColor: '#a7f3d0', spikesColor: '#134e4a', collarColor: '#f97316' },
  { id: 'herd-gold', name: 'Herd', rarity: 'common', price: 0, baseColor: '#e0a82e', spotsColor: '#fef3c7', spikesColor: '#b45309', collarColor: '#ffffff' },
];

const makeRunningAnim = (): DinoAnimationState => ({
  runPhase: 0,
  velocity: 0,
  isGrounded: true,
  isCrouching: false,
  isUnderground: false,
  isEating: false,
  activePowerup: 'none',
  status: 'playing',
  speed: 10,
  isGhost: false,
  baseScale: 1,
});

interface Runner {
  x: number;
  z: number;
  speed: number;
  phase: number;
  dust: number;
}

function RunningHerd() {
  const quality = useGameStore((s) => s.graphicsQuality);
  const max = HERD_MAX[quality];
  const groups = useRef<(THREE.Group | null)[]>([]);
  const anims = useMemo(
    () => Array.from({ length: HERD_MAX.high }, () => ({ current: makeRunningAnim() })),
    []
  );
  const herd = useRef({ active: false, dir: 1 as 1 | -1, timer: 5, runners: [] as Runner[] });

  useFrame((_, delta) => {
    if (!isLive()) return;
    const store = useGameStore.getState();
    const move = store.getCurrentSpeed() * delta;
    const h = herd.current;

    if (!h.active) {
      h.timer -= delta;
      if (h.timer > 0) return;
      h.active = true;
      h.dir = Math.random() < 0.5 ? 1 : -1;
      const count = Math.min(max, 4 + Math.floor(Math.random() * 4));
      const lead = h.dir === 1 ? -30 : 46;
      h.runners = Array.from({ length: count }, (_, i) => ({
        x: lead - h.dir * i * rand(3.2, 5.5),
        z: rand(-16, -11),
        speed: rand(13, 17),
        phase: Math.random() * 6,
        dust: 0,
      }));
      return;
    }

    let remaining = 0;
    h.runners.forEach((r, i) => {
      const g = groups.current[i];
      if (!g) return;
      r.x += h.dir * r.speed * delta - move * 0.75;
      // Same run-cycle phase the player's rig uses, just a little faster
      r.phase += delta * r.speed * 0.6;
      anims[i].current.runPhase = r.phase;
      anims[i].current.speed = r.speed;
      const done = h.dir === 1 ? r.x > 52 : r.x < -38;
      g.visible = !done;
      if (done) return;
      remaining++;

      g.position.set(r.x, Math.abs(Math.sin(r.phase)) * 0.22, r.z);
      g.rotation.y = h.dir === 1 ? 0 : Math.PI;

      r.dust -= delta;
      if (r.dust <= 0 && r.x > -12 && r.x < 28) {
        r.dust = rand(0.2, 0.4);
        spawnParticles('dust', [r.x - h.dir * 1.5, 0.2, r.z], 1, '#f97316');
      }
    });

    if (remaining === 0) {
      h.active = false;
      groups.current.forEach((g) => { if (g) g.visible = false; });
      // Occasionally a second stampede follows right behind the first
      h.timer = Math.random() < 0.25 ? rand(3, 5) : rand(18, 40);
    }
  });

  return (
    <group>
      {Array.from({ length: max }, (_, i) => (
        <group key={i} ref={(g) => { groups.current[i] = g; }} visible={false} scale={HERD_SCALE}>
          <ClassicDinoModel animState={anims[i]} skinConfig={HERD_SKINS[i % HERD_SKINS.length]} ignoreHurt />
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// Pterosaurs gliding across the ember sky
// ---------------------------------------------------------------------------------------------

const PTERO_COUNTS = { low: 2, medium: 3, high: 4 } as const;
const pteroMaterial = new THREE.MeshStandardMaterial({ color: '#5a2216', roughness: 0.9 });
const pteroWingMaterial = new THREE.MeshStandardMaterial({ color: '#7a3320', roughness: 0.9, side: THREE.DoubleSide });
const pteroBodyGeo = new THREE.BoxGeometry(1.5, 0.4, 0.5);
const pteroHeadGeo = new THREE.BoxGeometry(1.0, 0.22, 0.22);
const pteroCrestGeo = new THREE.BoxGeometry(0.5, 0.35, 0.1);
const pteroWingGeo = new THREE.BoxGeometry(1.1, 0.06, 2.4);

interface Flyer {
  x: number;
  y: number;
  z: number;
  speed: number;
  dir: 1 | -1;
  phase: number;
}

function newFlyer(startAnywhere: boolean): Flyer {
  const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
  return {
    x: startAnywhere ? rand(-30, 40) : dir === 1 ? -50 : 60,
    y: rand(8, 17),
    z: rand(-38, -22),
    speed: rand(3, 6),
    dir,
    phase: Math.random() * 6,
  };
}

function Pterosaurs() {
  const quality = useGameStore((s) => s.graphicsQuality);
  const count = PTERO_COUNTS[quality];
  const groups = useRef<(THREE.Group | null)[]>([]);
  const wingsL = useRef<(THREE.Group | null)[]>([]);
  const wingsR = useRef<(THREE.Group | null)[]>([]);
  const flyers = useMemo(() => Array.from({ length: PTERO_COUNTS.high }, () => newFlyer(true)), []);

  useFrame((_, delta) => {
    if (!isLive()) return;
    const move = useGameStore.getState().getCurrentSpeed() * delta;
    for (let i = 0; i < count; i++) {
      const f = flyers[i];
      const g = groups.current[i];
      if (!g) continue;
      f.x += f.dir * f.speed * delta - move * 0.35;
      f.phase += delta * 5;
      if ((f.dir === 1 && f.x > 60) || (f.dir === -1 && f.x < -55)) {
        flyers[i] = newFlyer(false);
        continue;
      }
      g.position.set(f.x, f.y + Math.sin(f.phase * 0.5) * 0.7, f.z);
      g.rotation.y = f.dir === 1 ? 0 : Math.PI;
      g.rotation.z = Math.cos(f.phase * 0.5) * 0.08;
      const flap = Math.sin(f.phase * 2) * 0.55;
      const l = wingsL.current[i];
      const r = wingsR.current[i];
      if (l) l.rotation.x = flap;
      if (r) r.rotation.x = -flap;
    }
  });

  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} ref={(g) => { groups.current[i] = g; }} scale={1.6} position={[0, -100, 0]}>
          <mesh material={pteroMaterial} geometry={pteroBodyGeo} />
          <mesh position={[1.1, 0, 0]} material={pteroMaterial} geometry={pteroHeadGeo} />
          <mesh position={[-0.55, 0.28, 0]} material={pteroMaterial} geometry={pteroCrestGeo} />
          <group ref={(g) => { wingsL.current[i] = g; }} position={[0, 0.1, 0.2]}>
            <mesh position={[-0.1, 0, 1.2]} material={pteroWingMaterial} geometry={pteroWingGeo} />
          </group>
          <group ref={(g) => { wingsR.current[i] = g; }} position={[0, 0.1, -0.2]}>
            <mesh position={[-0.1, 0, -1.2]} material={pteroWingMaterial} geometry={pteroWingGeo} />
          </group>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// Volcano eruptions (random event): fireballs arc out of a visible crater under a rising ash column
// ---------------------------------------------------------------------------------------------

const FIRE_POOL = 56;
const ASH_POOL = 12;
const ERUPTION_S = 3.2;
const GRAVITY = 20;

interface Fireball {
  x: number; y: number; vx: number; vy: number; size: number; z: number; alive: boolean;
}
interface AshPuff {
  x: number; y: number; z: number; age: number; alive: boolean; size: number;
}

function Eruptions({ volcanoes }: { volcanoes: LavaVolcano[] }) {
  const quality = useGameStore((s) => s.graphicsQuality);
  const poolSize = quality === 'low' ? 30 : FIRE_POOL;
  const fireRef = useRef<THREE.InstancedMesh>(null);
  const ashRef = useRef<THREE.InstancedMesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);

  const fireballs = useMemo<Fireball[]>(
    () => Array.from({ length: FIRE_POOL }, () => ({ x: 0, y: -100, vx: 0, vy: 0, size: 1, z: 0, alive: false })),
    []
  );
  const ash = useMemo<AshPuff[]>(
    () => Array.from({ length: ASH_POOL }, () => ({ x: 0, y: -100, z: 0, age: 0, alive: false, size: 1 })),
    []
  );
  const st = useRef({ timer: 7, active: false, t: 0, vi: -1, emit: 0, ashEmit: 0, k: 1 });

  useFrame((_, delta) => {
    const fire = fireRef.current;
    const ashMesh = ashRef.current;
    if (!fire || !ashMesh || !isLive()) return;
    const store = useGameStore.getState();
    const move = store.getCurrentSpeed() * delta;
    const s = st.current;

    if (!s.active) {
      s.timer -= delta;
      if (s.timer <= 0) {
        // Only an on-screen volcano is worth erupting
        const visible = volcanoes.map((_, i) => i).filter((i) => volcanoes[i].x > -14 && volcanoes[i].x < 28);
        if (visible.length === 0) {
          s.timer = 2;
        } else {
          s.active = true;
          s.t = 0;
          s.vi = visible[Math.floor(Math.random() * visible.length)];
          s.k = volcanoes[s.vi].height / 20;
          if (store.status === 'playing') store.triggerCameraShake(0.25);
        }
      }
    }

    const v = s.active ? volcanoes[s.vi] : null;
    let envelope = 0;
    if (s.active && v) {
      s.t += delta;
      envelope = Math.sin(Math.min(1, s.t / ERUPTION_S) * Math.PI);
      const tipY = v.height - 1 + 0.4;

      s.emit -= delta;
      while (s.emit <= 0) {
        s.emit += 1 / (28 * Math.max(0.2, envelope));
        const b = fireballs.slice(0, poolSize).find((f) => !f.alive);
        if (!b) break;
        b.alive = true;
        b.x = v.x + rand(-1, 1) * s.k;
        b.y = tipY;
        b.z = v.z + rand(-2, 2);
        b.vx = rand(-9, 9) * s.k;
        b.vy = rand(9, 17) * Math.sqrt(s.k);
        b.size = rand(0.7, 1.7) * s.k;
      }

      s.ashEmit -= delta;
      if (s.ashEmit <= 0) {
        s.ashEmit = 0.3;
        const p = ash.find((a) => !a.alive);
        if (p) {
          p.alive = true;
          p.age = 0;
          p.x = v.x + rand(-1, 1);
          p.y = tipY;
          p.z = v.z;
          p.size = rand(3, 5) * s.k;
        }
      }

      if (s.t >= ERUPTION_S) {
        s.active = false;
        s.timer = rand(14, 30);
      }
    }

    for (let i = 0; i < FIRE_POOL; i++) {
      const b = fireballs[i];
      if (!b.alive) {
        dummy.position.set(0, -200, 0);
        dummy.scale.setScalar(0.0001);
      } else {
        b.vy -= GRAVITY * delta;
        b.x += b.vx * delta - move * 0.18;
        b.y += b.vy * delta;
        if (b.y < 5 || b.x < -110) b.alive = false;
        dummy.position.set(b.x, b.y, b.z);
        dummy.scale.setScalar(b.size);
      }
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      fire.setMatrixAt(i, dummy.matrix);
    }
    fire.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < ASH_POOL; i++) {
      const p = ash[i];
      if (p.alive) {
        p.age += delta;
        p.x -= move * 0.18;
        if (p.age > 4.5) p.alive = false;
      }
      if (!p.alive) {
        dummy.position.set(0, -200, 0);
        dummy.scale.setScalar(0.0001);
      } else {
        const life = p.age / 4.5;
        dummy.position.set(p.x + life * 6, p.y + life * 16, p.z);
        dummy.scale.setScalar(p.size * (0.6 + life * 1.6));
      }
      dummy.rotation.set(0, p.age, 0);
      dummy.updateMatrix();
      ashMesh.setMatrixAt(i, dummy.matrix);
    }
    ashMesh.instanceMatrix.needsUpdate = true;

    // Bright flare over the crater while it is erupting
    const flash = flashRef.current;
    if (flash) {
      if (s.active && v) {
        flash.visible = true;
        flash.position.set(v.x, v.height - 1 + 1, v.z + 3);
        flash.scale.setScalar((6 + Math.sin(s.t * 30) * 0.8) * s.k * envelope + 0.01);
      } else {
        flash.visible = false;
      }
    }
  });

  return (
    <group>
      <instancedMesh frustumCulled={false} ref={fireRef} args={[undefined, undefined, FIRE_POOL]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshBasicMaterial color="#ffb03a" toneMapped={false} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={ashRef} args={[undefined, undefined, ASH_POOL]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshBasicMaterial color="#2b1714" transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>
      <mesh ref={flashRef} visible={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial color="#ff8a2a" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// Meteor shower (random event): streaks fall onto the far plain and burst on impact
// ---------------------------------------------------------------------------------------------

const METEOR_POOL = 14;
const IMPACT_POOL = 14;
const SHOWER_S = 3.6;

interface Meteor { x: number; y: number; z: number; vx: number; vy: number; alive: boolean }
interface Impact { x: number; z: number; age: number; alive: boolean }

function MeteorShower() {
  const headRef = useRef<THREE.InstancedMesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const impactRef = useRef<THREE.InstancedMesh>(null);
  const meteors = useMemo<Meteor[]>(() => Array.from({ length: METEOR_POOL }, () => ({ x: 0, y: -100, z: 0, vx: 0, vy: 0, alive: false })), []);
  const impacts = useMemo<Impact[]>(() => Array.from({ length: IMPACT_POOL }, () => ({ x: 0, z: 0, age: 0, alive: false })), []);
  const st = useRef({ timer: 16, active: false, t: 0, spawn: 0 });

  useFrame((_, delta) => {
    const head = headRef.current;
    const trail = trailRef.current;
    const impact = impactRef.current;
    if (!head || !trail || !impact || !isLive()) return;
    const move = useGameStore.getState().getCurrentSpeed() * delta;
    const s = st.current;

    if (!s.active) {
      s.timer -= delta;
      if (s.timer <= 0) {
        s.active = true;
        s.t = 0;
        s.spawn = 0;
      }
    } else {
      s.t += delta;
      s.spawn -= delta;
      while (s.spawn <= 0) {
        s.spawn += rand(0.2, 0.45);
        const m = meteors.find((q) => !q.alive);
        if (!m) break;
        m.alive = true;
        m.x = rand(14, 48);
        m.y = rand(30, 42);
        m.z = rand(-48, -20);
        m.vx = -rand(15, 22);
        m.vy = -rand(15, 20);
      }
      if (s.t >= SHOWER_S) {
        s.active = false;
        s.timer = rand(28, 50);
      }
    }

    for (let i = 0; i < METEOR_POOL; i++) {
      const m = meteors[i];
      if (m.alive) {
        m.x += m.vx * delta - move * 0.9;
        m.y += m.vy * delta;
        if (m.y <= 0.3) {
          m.alive = false;
          const im = impacts.find((q) => !q.alive);
          if (im) { im.alive = true; im.age = 0; im.x = m.x; im.z = m.z; }
        }
      }
      if (!m.alive) {
        dummy.position.set(0, -200, 0);
        dummy.scale.setScalar(0.0001);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        head.setMatrixAt(i, dummy.matrix);
        trail.setMatrixAt(i, dummy.matrix);
        continue;
      }
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(m.x, m.y, m.z);
      dummy.scale.setScalar(0.7);
      dummy.updateMatrix();
      head.setMatrixAt(i, dummy.matrix);

      const len = Math.hypot(m.vx, m.vy);
      dummy.position.set(m.x - (m.vx / len) * 2.6, m.y - (m.vy / len) * 2.6, m.z);
      dummy.rotation.set(0, 0, Math.atan2(m.vy, m.vx));
      dummy.scale.set(5.2, 0.28, 0.28);
      dummy.updateMatrix();
      trail.setMatrixAt(i, dummy.matrix);
    }
    head.instanceMatrix.needsUpdate = true;
    trail.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < IMPACT_POOL; i++) {
      const im = impacts[i];
      if (im.alive) {
        im.age += delta;
        im.x -= move * 0.9;
        if (im.age > 0.7) im.alive = false;
      }
      dummy.rotation.set(0, 0, 0);
      if (!im.alive) {
        dummy.position.set(0, -200, 0);
        dummy.scale.setScalar(0.0001);
      } else {
        const u = im.age / 0.7;
        dummy.position.set(im.x, 0.6, im.z);
        dummy.scale.set(1 + u * 4.5, (1 - u) * 2.2 + 0.1, 1 + u * 4.5);
      }
      dummy.updateMatrix();
      impact.setMatrixAt(i, dummy.matrix);
    }
    impact.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh frustumCulled={false} ref={headRef} args={[undefined, undefined, METEOR_POOL]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshBasicMaterial color="#ffe08a" toneMapped={false} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={trailRef} args={[undefined, undefined, METEOR_POOL]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ff6a1a" transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={impactRef} args={[undefined, undefined, IMPACT_POOL]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#ff9a3a" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------------------------
// Lane-side props: charred rocks and glowing vents behind the track, scrolling with the ground
// ---------------------------------------------------------------------------------------------

const ROCK_COUNTS = { low: 8, medium: 14, high: 18 } as const;
const VENT_COUNTS = { low: 4, medium: 6, high: 8 } as const;
const PROP_LENGTH = 100;

function LaneProps() {
  const quality = useGameStore((s) => s.graphicsQuality);
  const rocks = ROCK_COUNTS[quality];
  const vents = VENT_COUNTS[quality];
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const moundRef = useRef<THREE.InstancedMesh>(null);
  const ventRef = useRef<THREE.InstancedMesh>(null);

  const rockData = useMemo(
    () => Array.from({ length: ROCK_COUNTS.high }, (_, i) => ({
      x: ((i + Math.random() * 0.8) / ROCK_COUNTS.high - 0.5) * PROP_LENGTH,
      z: rand(-9, -3.5),
      sx: rand(0.8, 2.0), sy: rand(0.5, 1.5), sz: rand(0.8, 1.6), ry: Math.random() * Math.PI,
    })),
    []
  );
  const ventData = useMemo(
    () => Array.from({ length: VENT_COUNTS.high }, (_, i) => ({
      x: ((i + Math.random() * 0.6) / VENT_COUNTS.high - 0.5) * PROP_LENGTH,
      z: rand(-11, -6.5),
      r: rand(0.6, 1.0), h: rand(0.7, 1.3), offset: Math.random() * 6,
    })),
    []
  );

  useFrame(({ clock }, delta) => {
    if (!isLive()) return;
    const move = useGameStore.getState().getCurrentSpeed() * delta;
    const t = clock.elapsedTime;
    const rk = rockRef.current;
    const md = moundRef.current;
    const vt = ventRef.current;
    if (!rk || !md || !vt) return;

    for (let i = 0; i < rocks; i++) {
      const r = rockData[i];
      r.x -= move;
      if (r.x < -PROP_LENGTH / 2) r.x += PROP_LENGTH;
      dummy.rotation.set(0, r.ry, 0);
      dummy.position.set(r.x, r.sy / 2 - 0.05, r.z);
      dummy.scale.set(r.sx, r.sy, r.sz);
      dummy.updateMatrix();
      rk.setMatrixAt(i, dummy.matrix);
    }
    rk.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < vents; i++) {
      const v = ventData[i];
      v.x -= move;
      if (v.x < -PROP_LENGTH / 2) v.x += PROP_LENGTH;
      dummy.rotation.set(0, 0, 0);
      dummy.position.set(v.x, v.h / 2 - 0.05, v.z);
      dummy.scale.set(v.r * 1.6, v.h, v.r * 1.6);
      dummy.updateMatrix();
      md.setMatrixAt(i, dummy.matrix);

      const pulse = 0.85 + Math.sin(t * 4 + v.offset) * 0.15;
      dummy.position.set(v.x, v.h * 0.92, v.z);
      dummy.scale.set(v.r * 0.7 * pulse, v.h * 0.35 * pulse, v.r * 0.7 * pulse);
      dummy.updateMatrix();
      vt.setMatrixAt(i, dummy.matrix);
    }
    md.instanceMatrix.needsUpdate = true;
    vt.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh frustumCulled={false} ref={rockRef} args={[undefined, undefined, ROCK_COUNTS.high]} count={rocks}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#6b3f30" emissive="#4a1a08" emissiveIntensity={0.35} roughness={1} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={moundRef} args={[undefined, undefined, VENT_COUNTS.high]} count={vents}>
        <coneGeometry args={[1, 1, 6]} />
        <meshStandardMaterial color="#5a3426" roughness={1} />
      </instancedMesh>
      <instancedMesh frustumCulled={false} ref={ventRef} args={[undefined, undefined, VENT_COUNTS.high]} count={vents}>
        <coneGeometry args={[1, 1, 6]} />
        <meshBasicMaterial color="#ff7a1a" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------------------------

export function LavaLife({ volcanoes }: { volcanoes: LavaVolcano[] }) {
  return (
    <group>
      <LaneProps />
      <RunningHerd />
      <Pterosaurs />
      <Eruptions volcanoes={volcanoes} />
      <MeteorShower />
    </group>
  );
}
