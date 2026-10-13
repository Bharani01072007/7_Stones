import * as THREE from 'three';
import { StoneData } from './types';
import { STONE_CONFIGS, TOTAL_STONES } from './constants';
import { soundManager } from './audio';

export class StonesSystem {
  public stones: StoneData[] = [];
  public meshes: THREE.Mesh[] = [];
  public group: THREE.Group;
  public rebuiltCount: number = 0;
  private stackHeights: number[] = [];

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.calculateStackHeights();
    this.createStones();
  }

  private calculateStackHeights() {
    let currentY = 0;
    this.stackHeights = [];
    for (let i = 0; i < TOTAL_STONES; i++) {
      const cfg = STONE_CONFIGS[i];
      const stoneCenterY = currentY + cfg.height / 2;
      this.stackHeights.push(stoneCenterY);
      currentY += cfg.height + 0.01;
    }
  }

  private createStoneGeometry(radius: number, height: number): THREE.BufferGeometry {
    // Irregular natural stone shape
    const geo = new THREE.CylinderGeometry(radius * 0.9, radius, height, 16);
    const posAttr = geo.attributes.position;
    const vertex = new THREE.Vector3();

    // Subtle organic rock jitter
    for (let i = 0; i < posAttr.count; i++) {
      vertex.fromBufferAttribute(posAttr, i);
      const angle = Math.atan2(vertex.z, vertex.x);
      const radiusNoise = 1.0 + Math.sin(angle * 5) * 0.08 + Math.cos(angle * 3) * 0.05;
      if (Math.abs(vertex.y) < height * 0.45) {
        vertex.x *= radiusNoise;
        vertex.z *= radiusNoise;
      }
      posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geo.computeVertexNormals();
    return geo;
  }

  private createStones() {
    this.group.clear();
    this.meshes = [];
    this.stones = [];
    this.rebuiltCount = TOTAL_STONES; // Initially fully stacked

    for (let i = 0; i < TOTAL_STONES; i++) {
      const cfg = STONE_CONFIGS[i];
      const geo = this.createStoneGeometry(cfg.radius, cfg.height);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.85,
        metalness: 0.1
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const yPos = this.stackHeights[i];
      mesh.position.set(0, yPos, 0);

      this.meshes.push(mesh);
      this.group.add(mesh);

      this.stones.push({
        id: i,
        sizeRadius: cfg.radius,
        height: cfg.height,
        color: cfg.color,
        position: [0, yPos, 0],
        velocity: [0, 0, 0],
        rotation: [0, Math.random() * Math.PI, 0],
        angularVelocity: [0, 0, 0],
        isStacked: true,
        stackIndex: i
      });
    }
  }

  // Scatter stones when ball knocks them down
  public scatterStones(impactPos: THREE.Vector3, ballVelocity: THREE.Vector3) {
    this.rebuiltCount = 0;
    soundManager.playStoneCrash();

    const speed = ballVelocity.length();
    const forwardDir = ballVelocity.clone().normalize();

    this.stones.forEach((stone, idx) => {
      stone.isStacked = false;
      stone.stackIndex = null;

      // Calculate blast direction: away from impact point + ball momentum
      const stonePos = new THREE.Vector3(...stone.position);
      const blastDir = stonePos.clone().sub(impactPos).normalize();
      if (blastDir.length() < 0.1) blastDir.set(Math.random() - 0.5, 0.5, Math.random() - 0.5).normalize();

      // Combine forward push and outward blast
      const spreadX = blastDir.x * 3.5 + (Math.random() - 0.5) * 4;
      const spreadY = 2.5 + Math.random() * 3.0 + (6 - idx) * 0.4;
      const spreadZ = forwardDir.z * (speed * 0.35) + blastDir.z * 3.0 + (Math.random() - 0.5) * 3;

      stone.velocity = [spreadX, spreadY, spreadZ];
      stone.angularVelocity = [
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 12
      ];
    });
  }

  // Update physics for scattered stones (sliding, ground bounce, friction)
  public updatePhysics(delta: number) {
    const gravity = -18;
    const friction = 0.88;
    const groundBounce = 0.32;

    this.stones.forEach((stone, idx) => {
      if (stone.isStacked) {
        // Keep in stack position
        const y = this.stackHeights[stone.stackIndex!];
        stone.position = [0, y, 0];
        stone.velocity = [0, 0, 0];
        stone.rotation[0] = 0;
        stone.rotation[2] = 0;

        const mesh = this.meshes[idx];
        mesh.position.set(...stone.position);
        mesh.rotation.set(...stone.rotation);
        return;
      }

      // In air or moving on ground
      stone.velocity[1] += gravity * delta;
      stone.position[0] += stone.velocity[0] * delta;
      stone.position[1] += stone.velocity[1] * delta;
      stone.position[2] += stone.velocity[2] * delta;

      // Angular rotation
      stone.rotation[0] += stone.angularVelocity[0] * delta;
      stone.rotation[1] += stone.angularVelocity[1] * delta;
      stone.rotation[2] += stone.angularVelocity[2] * delta;

      // Ground collision
      const halfH = stone.height / 2;
      if (stone.position[1] <= halfH) {
        stone.position[1] = halfH;
        if (Math.abs(stone.velocity[1]) > 0.8) {
          stone.velocity[1] = -stone.velocity[1] * groundBounce;
        } else {
          stone.velocity[1] = 0;
        }

        // Ground friction
        stone.velocity[0] *= friction;
        stone.velocity[2] *= friction;
        stone.angularVelocity[0] *= 0.8;
        stone.angularVelocity[1] *= 0.8;
        stone.angularVelocity[2] *= 0.8;
      }

      const mesh = this.meshes[idx];
      mesh.position.set(...stone.position);
      mesh.rotation.set(...stone.rotation);
    });
  }

  // Rebuild next stone into the stack
  public stackNextStone(): boolean {
    if (this.rebuiltCount >= TOTAL_STONES) return false;

    // Find the next unstacked stone from bottom (0) to top (6)
    const targetStone = this.stones.find(s => s.id === this.rebuiltCount);
    if (!targetStone) return false;

    targetStone.isStacked = true;
    targetStone.stackIndex = this.rebuiltCount;
    targetStone.velocity = [0, 0, 0];
    targetStone.position = [0, this.stackHeights[this.rebuiltCount], 0];
    targetStone.rotation = [0, 0, 0];

    this.rebuiltCount++;
    soundManager.playStonePlace();

    return true;
  }

  // Reset all stones back into full stacked position
  public resetToFullStack() {
    this.rebuiltCount = TOTAL_STONES;
    this.stones.forEach((stone, idx) => {
      stone.isStacked = true;
      stone.stackIndex = idx;
      stone.velocity = [0, 0, 0];
      stone.position = [0, this.stackHeights[idx], 0];
      stone.rotation = [0, 0, 0];

      const mesh = this.meshes[idx];
      mesh.position.set(0, this.stackHeights[idx], 0);
      mesh.rotation.set(0, 0, 0);
    });
  }

  // Check collision between ball and stacked stones
  public checkStackBallCollision(ballPos: THREE.Vector3, ballRadius: number): boolean {
    if (this.rebuiltCount === 0) return false;

    // Height of stack
    const totalHeight = this.stackHeights[this.rebuiltCount - 1] + 0.1;
    const stackBase = 0;

    // Check cylinder bounds around stack center (0,0)
    const distXZ = Math.hypot(ballPos.x, ballPos.z);
    const maxRadius = STONE_CONFIGS[0].radius + ballRadius;

    if (distXZ <= maxRadius && ballPos.y >= stackBase && ballPos.y <= totalHeight + ballRadius) {
      return true;
    }
    return false;
  }

  // Find nearest scattered stone to a given position
  public getNearestUnstackedStone(pos: [number, number, number]): StoneData | null {
    let nearest: StoneData | null = null;
    let minDist = Infinity;

    for (const stone of this.stones) {
      if (!stone.isStacked) {
        const d = Math.hypot(stone.position[0] - pos[0], stone.position[2] - pos[2]);
        if (d < minDist) {
          minDist = d;
          nearest = stone;
        }
      }
    }
    return nearest;
  }
}
