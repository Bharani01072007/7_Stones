import * as THREE from 'three';
import { Player, TeamId } from './types';
import { TEAM_COLORS } from './constants';

export class CharacterVisual {
  public root: THREE.Group;
  public player: Player;
  private torso: THREE.Mesh;
  private head: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private indicator: THREE.Sprite;
  private carriedStoneMesh: THREE.Mesh | null = null;

  constructor(player: Player) {
    this.player = player;
    this.root = new THREE.Group();

    const teamConfig = player.team === 'TEAM_A' ? TEAM_COLORS.TEAM_A : TEAM_COLORS.TEAM_B;
    const jerseyColor = teamConfig.primary;
    const shortsColor = '#1e293b'; // Slate dark shorts
    const skinColor = '#d97706'; // Warm skin tone
    const shoeColor = '#f8fafc';

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
    const jerseyMat = new THREE.MeshStandardMaterial({
      color: jerseyColor,
      roughness: 0.6,
      metalness: 0.1
    });
    const shortsMat = new THREE.MeshStandardMaterial({ color: shortsColor, roughness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.4 });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.44, 0.52, 0.28);
    this.torso = new THREE.Mesh(torsoGeo, jerseyMat);
    this.torso.position.y = 0.95;
    this.torso.castShadow = true;
    this.root.add(this.torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.set(0, 1.35, 0);
    this.head.castShadow = true;
    this.root.add(this.head);

    // Hair cap / headband
    const hairGeo = new THREE.SphereGeometry(0.185, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const hairMat = new THREE.MeshStandardMaterial({
      color: player.isHuman ? '#fbbf24' : '#1e1b4b',
      roughness: 0.9
    });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.copy(this.head.position);
    this.root.add(hair);

    // Left Arm (pivot at shoulder)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.28, 1.15, 0);
    const armGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.48, 8);
    const lArmMesh = new THREE.Mesh(armGeo, jerseyMat);
    lArmMesh.position.y = -0.24;
    lArmMesh.castShadow = true;
    this.leftArm.add(lArmMesh);
    const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinMat);
    lHand.position.y = -0.48;
    this.leftArm.add(lHand);
    this.root.add(this.leftArm);

    // Right Arm (pivot at shoulder)
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.28, 1.15, 0);
    const rArmMesh = new THREE.Mesh(armGeo, jerseyMat);
    rArmMesh.position.y = -0.24;
    rArmMesh.castShadow = true;
    this.rightArm.add(rArmMesh);
    const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), skinMat);
    rHand.position.y = -0.48;
    this.rightArm.add(rHand);
    this.root.add(this.rightArm);

    // Left Leg (pivot at hip)
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.13, 0.7, 0);
    const legGeo = new THREE.CylinderGeometry(0.075, 0.06, 0.65, 8);
    const lLegMesh = new THREE.Mesh(legGeo, shortsMat);
    lLegMesh.position.y = -0.32;
    lLegMesh.castShadow = true;
    this.leftLeg.add(lLegMesh);
    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.22), shoeMat);
    lShoe.position.set(0, -0.65, 0.04);
    lShoe.castShadow = true;
    this.leftLeg.add(lShoe);
    this.root.add(this.leftLeg);

    // Right Leg (pivot at hip)
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.13, 0.7, 0);
    const rLegMesh = new THREE.Mesh(legGeo, shortsMat);
    rLegMesh.position.y = -0.32;
    rLegMesh.castShadow = true;
    this.rightLeg.add(rLegMesh);
    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.22), shoeMat);
    rShoe.position.set(0, -0.65, 0.04);
    rShoe.castShadow = true;
    this.rightLeg.add(rShoe);
    this.root.add(this.rightLeg);

    // Floating indicator sprite with player role and human badge
    this.indicator = this.createPlayerBadge();
    this.indicator.position.set(0, 1.85, 0);
    this.root.add(this.indicator);

    // Initial position
    this.root.position.set(...player.position);
    this.root.rotation.y = player.rotation;
  }

  private createPlayerBadge(): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const isA = this.player.team === 'TEAM_A';
    const bgCol = isA ? '#ef4444' : '#2563eb';

    // Rounded tag background
    ctx.fillStyle = bgCol;
    ctx.beginPath();
    ctx.roundRect(16, 24, 224, 80, 24);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Text label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const label = (this.player.isHuman ? '★ YOU ' : '') + `#${this.player.number}`;
    ctx.fillText(label, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.4, 0.7, 1);
    return sprite;
  }

  public update(delta: number, isMoving: boolean) {
    this.root.position.set(...this.player.position);
    this.root.rotation.y = this.player.rotation;

    // Elimination visual treatment
    if (this.player.isEliminated) {
      this.root.rotation.x = THREE.MathUtils.lerp(this.root.rotation.x, -Math.PI / 2.2, delta * 8);
      this.root.position.y = 0.2;
      this.indicator.visible = false;
      this.leftArm.rotation.set(0, 0, -0.4);
      this.rightArm.rotation.set(0, 0, 0.4);
      return;
    }

    this.indicator.visible = true;

    // Animation state machine
    if (this.player.animState === 'throw') {
      // Throwing animation: right arm throws forward
      const p = Math.min(this.player.animTimer / 0.35, 1);
      this.rightArm.rotation.x = -Math.PI * 0.8 + p * Math.PI * 1.5;
      this.leftArm.rotation.x = Math.sin(p * Math.PI) * 0.4;
      this.torso.rotation.y = -0.3 + p * 0.6;
    } else if (this.player.animState === 'place') {
      // Crouching down to place stone
      this.torso.position.y = 0.55;
      this.head.position.y = 0.95;
      this.leftLeg.rotation.x = -1.2;
      this.rightLeg.rotation.x = -1.2;
      this.leftArm.rotation.x = 0.8;
      this.rightArm.rotation.x = 0.8;
    } else if (this.player.animState === 'celebrate') {
      // Hopping celebration
      const bounce = Math.abs(Math.sin(Date.now() * 0.01)) * 0.25;
      this.root.position.y = bounce;
      this.leftArm.rotation.x = -Math.PI * 0.85;
      this.rightArm.rotation.x = -Math.PI * 0.85;
      this.leftArm.rotation.z = -0.3 + Math.sin(Date.now() * 0.015) * 0.2;
      this.rightArm.rotation.z = 0.3 - Math.sin(Date.now() * 0.015) * 0.2;
    } else if (isMoving) {
      // Running animation
      const runSpeed = 12;
      const legAngle = Math.sin(Date.now() * 0.001 * runSpeed) * 0.75;
      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      this.leftArm.rotation.x = -legAngle * 0.85;
      this.rightArm.rotation.x = legAngle * 0.85;
      this.torso.position.y = 0.95 + Math.abs(Math.sin(Date.now() * 0.001 * runSpeed * 2)) * 0.06;
      this.head.position.y = 1.35;
      this.torso.rotation.y = Math.sin(Date.now() * 0.001 * runSpeed) * 0.1;
    } else {
      // Idle breathing
      const breath = Math.sin(Date.now() * 0.003) * 0.02;
      this.torso.position.y = 0.95 + breath;
      this.head.position.y = 1.35 + breath;
      this.leftLeg.rotation.set(0, 0, 0);
      this.rightLeg.rotation.set(0, 0, 0);
      this.leftArm.rotation.set(0, 0, -0.1);
      this.rightArm.rotation.set(0, 0, 0.1);
      this.torso.rotation.set(0, 0, 0);
    }
  }

  public setCarryingStone(hasStone: boolean, color: string = '#d97706') {
    if (hasStone && !this.carriedStoneMesh) {
      const stoneGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.08, 12);
      const stoneMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      this.carriedStoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
      this.carriedStoneMesh.position.set(0, 0.9, 0.3);
      this.root.add(this.carriedStoneMesh);
    } else if (!hasStone && this.carriedStoneMesh) {
      this.root.remove(this.carriedStoneMesh);
      this.carriedStoneMesh = null;
    }
  }

  public dispose() {
    this.root.clear();
  }
}
