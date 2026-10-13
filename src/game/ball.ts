import * as THREE from 'three';
import { BallData } from './types';
import { BALL_RADIUS } from './constants';
import { soundManager } from './audio';

export class BallSystem {
  public data: BallData;
  public mesh: THREE.Mesh;
  public trajectoryLine: THREE.Line;
  public trailLine: THREE.Line;
  private trailPoints: THREE.Vector3[] = [];
  private maxTrailPoints = 20;

  constructor(scene: THREE.Scene) {
    this.data = {
      position: [0, 1.2, -7.0],
      velocity: [0, 0, 0],
      isInAir: false,
      holderPlayerId: null,
      lastThrownByPlayerId: null,
      isThrowViolation: false
    };

    // Realistic tennis / rubber playground ball
    const ballGeo = new THREE.SphereGeometry(BALL_RADIUS, 24, 24);
    const ballMat = new THREE.MeshStandardMaterial({
      color: '#eab308', // vibrant yellow-green sports ball
      roughness: 0.6,
      metalness: 0.1
    });

    this.mesh = new THREE.Mesh(ballGeo, ballMat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(...this.data.position);
    scene.add(this.mesh);

    // Aiming trajectory line (visible during throw aim)
    const trajGeo = new THREE.BufferGeometry();
    const trajMat = new THREE.LineDashedMaterial({
      color: '#facc15',
      dashSize: 0.3,
      gapSize: 0.15,
      linewidth: 3
    });
    this.trajectoryLine = new THREE.Line(trajGeo, trajMat);
    this.trajectoryLine.visible = false;
    scene.add(this.trajectoryLine);

    // Ball movement trail
    const trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.LineBasicMaterial({
      color: '#fde047',
      transparent: true,
      opacity: 0.8
    });
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    this.trailLine.visible = false;
    scene.add(this.trailLine);
  }

  // Update aim trajectory curve
  public updateTrajectory(origin: THREE.Vector3, velocity: THREE.Vector3) {
    const points: THREE.Vector3[] = [];
    const simPos = origin.clone();
    const simVel = velocity.clone();
    const dt = 0.03;
    const gravity = -14.0;

    for (let i = 0; i < 40; i++) {
      points.push(simPos.clone());
      simVel.y += gravity * dt;
      simPos.addScaledVector(simVel, dt);

      if (simPos.y <= BALL_RADIUS) {
        simPos.y = BALL_RADIUS;
        points.push(simPos.clone());
        break;
      }
    }

    this.trajectoryLine.geometry.dispose();
    this.trajectoryLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.trajectoryLine.computeLineDistances();
    this.trajectoryLine.visible = true;
  }

  public hideTrajectory() {
    this.trajectoryLine.visible = false;
  }

  // Throw ball
  public throw(startPos: THREE.Vector3, velocity: THREE.Vector3, throwerId: string, isViolation: boolean = false) {
    this.data.holderPlayerId = null;
    this.data.lastThrownByPlayerId = throwerId;
    this.data.isInAir = true;
    this.data.isThrowViolation = isViolation;
    this.data.position = [startPos.x, startPos.y, startPos.z];
    this.data.velocity = [velocity.x, velocity.y, velocity.z];
    this.mesh.position.copy(startPos);
    this.trailPoints = [startPos.clone()];
    this.trailLine.visible = true;

    soundManager.playThrow();
  }

  // Give possession directly to player
  public giveToPlayer(playerId: string, playerPos: [number, number, number], playerRot: number) {
    this.data.holderPlayerId = playerId;
    this.data.isInAir = false;
    this.data.velocity = [0, 0, 0];
    this.trailPoints = [];
    this.trailLine.visible = false;

    // Position ball in front of player
    const handX = playerPos[0] + Math.sin(playerRot) * 0.45;
    const handY = playerPos[1] + 1.1;
    const handZ = playerPos[2] + Math.cos(playerRot) * 0.45;

    this.data.position = [handX, handY, handZ];
    this.mesh.position.set(handX, handY, handZ);
  }

  // Physics update loop
  public updatePhysics(delta: number) {
    if (this.data.holderPlayerId !== null) {
      // Held by player: mesh updated by owner
      return;
    }

    if (!this.data.isInAir && Math.hypot(this.data.velocity[0], this.data.velocity[2]) < 0.1) {
      // Idle at rest on ground
      return;
    }

    const gravity = -14.0;
    const restitution = 0.65; // bounce dampening
    const friction = 0.92;

    // Apply gravity
    this.data.velocity[1] += gravity * delta;

    // Update position
    this.data.position[0] += this.data.velocity[0] * delta;
    this.data.position[1] += this.data.velocity[1] * delta;
    this.data.position[2] += this.data.velocity[2] * delta;

    // Ground bounce check
    if (this.data.position[1] <= BALL_RADIUS) {
      this.data.position[1] = BALL_RADIUS;
      if (Math.abs(this.data.velocity[1]) > 0.6) {
        this.data.velocity[1] = -this.data.velocity[1] * restitution;
        soundManager.playBounce();
      } else {
        this.data.velocity[1] = 0;
        this.data.isInAir = false;
      }
      this.data.velocity[0] *= friction;
      this.data.velocity[2] *= friction;
    }

    this.mesh.position.set(...this.data.position);

    // Update trail
    if (this.data.isInAir) {
      this.trailPoints.push(this.mesh.position.clone());
      if (this.trailPoints.length > this.maxTrailPoints) {
        this.trailPoints.shift();
      }
      if (this.trailPoints.length >= 2) {
        this.trailLine.geometry.dispose();
        this.trailLine.geometry = new THREE.BufferGeometry().setFromPoints(this.trailPoints);
      }
    } else {
      this.trailLine.visible = false;
    }
  }

  public getPositionVector(): THREE.Vector3 {
    return new THREE.Vector3(...this.data.position);
  }

  public getVelocityVector(): THREE.Vector3 {
    return new THREE.Vector3(...this.data.velocity);
  }
}
