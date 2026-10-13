import * as THREE from 'three';
import { ARENA_WIDTH, ARENA_LENGTH, STONE_CIRCLE_RADIUS, THROWING_LINE_Z } from './constants';

export class PlaygroundScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public dirLight: THREE.DirectionalLight;
  private animFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#7dd3fc'); // Sky blue
    this.scene.fog = new THREE.FogExp2('#bae6fd', 0.015);

    // Camera setup
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);
    this.camera.position.set(0, 10, -14);
    this.camera.lookAt(0, 0.5, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight('#e0f2fe', 0.6);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#fef08a', '#4ade80', 0.4);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight('#fffbeb', 1.2);
    this.dirLight.position.set(15, 25, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 60;
    this.dirLight.shadow.camera.left = -20;
    this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.top = 20;
    this.dirLight.shadow.camera.bottom = -20;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Build playground environment
    this.buildGround();
    this.buildFieldMarkings();
    this.buildSurroundings();

    // Auto resize
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize(container);
    });
    this.resizeObserver.observe(container);
  }

  private handleResize(container: HTMLElement) {
    if (!container || !this.renderer || !this.camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private buildGround() {
    // Generate procedural grass texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base lawn color
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, 512, 512);

    // Mowing stripes pattern
    for (let i = 0; i < 512; i += 64) {
      ctx.fillStyle = i % 128 === 0 ? 'rgba(34, 197, 94, 0.35)' : 'rgba(74, 222, 128, 0.35)';
      ctx.fillRect(0, i, 512, 64);
    }

    // Grass speckle noise
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(22, 163, 74, 0.4)' : 'rgba(134, 239, 172, 0.4)';
      ctx.fillRect(x, y, 2, 3);
    }

    const grassTexture = new THREE.CanvasTexture(canvas);
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(12, 18);

    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      map: grassTexture,
      roughness: 0.9,
      metalness: 0.05
    });

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    groundMesh.position.y = 0;
    this.scene.add(groundMesh);
  }

  private buildFieldMarkings() {
    const markGroup = new THREE.Group();

    // 1. Central Stone Circle (dirt patch + white chalk boundary)
    const circleDirtGeo = new THREE.CircleGeometry(STONE_CIRCLE_RADIUS, 32);
    const circleDirtMat = new THREE.MeshStandardMaterial({
      color: '#b45309', // reddish earthen clay ground
      roughness: 0.95,
      metalness: 0.05
    });
    const circleDirt = new THREE.Mesh(circleDirtGeo, circleDirtMat);
    circleDirt.rotation.x = -Math.PI / 2;
    circleDirt.position.set(0, 0.005, 0);
    circleDirt.receiveShadow = true;
    markGroup.add(circleDirt);

    // White circle outline
    const ringGeo = new THREE.RingGeometry(STONE_CIRCLE_RADIUS - 0.06, STONE_CIRCLE_RADIUS + 0.06, 48);
    const chalkMat = new THREE.MeshBasicMaterial({
      color: '#f8fafc',
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, chalkMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(0, 0.008, 0);
    markGroup.add(ringMesh);

    // 2. Exact 7-Meter Throwing Line (Z = -7.0)
    const throwLineGeo = new THREE.PlaneGeometry(ARENA_WIDTH - 2, 0.18);
    const throwLineMat = new THREE.MeshBasicMaterial({ color: '#fef08a' }); // bright chalk yellow
    const throwLineMesh = new THREE.Mesh(throwLineGeo, throwLineMat);
    throwLineMesh.rotation.x = -Math.PI / 2;
    throwLineMesh.position.set(0, 0.009, THROWING_LINE_Z);
    markGroup.add(throwLineMesh);

    // Boundary chalk lines (arena perimeter)
    const lineWidth = 0.14;
    // North line
    const nLine = new THREE.Mesh(new THREE.PlaneGeometry(ARENA_WIDTH, lineWidth), chalkMat);
    nLine.rotation.x = -Math.PI / 2;
    nLine.position.set(0, 0.008, ARENA_LENGTH / 2);
    markGroup.add(nLine);

    // South line
    const sLine = new THREE.Mesh(new THREE.PlaneGeometry(ARENA_WIDTH, lineWidth), chalkMat);
    sLine.rotation.x = -Math.PI / 2;
    sLine.position.set(0, 0.008, -ARENA_LENGTH / 2);
    markGroup.add(sLine);

    // West line
    const wLine = new THREE.Mesh(new THREE.PlaneGeometry(lineWidth, ARENA_LENGTH), chalkMat);
    wLine.rotation.x = -Math.PI / 2;
    wLine.position.set(-ARENA_WIDTH / 2, 0.008, 0);
    markGroup.add(wLine);

    // East line
    const eLine = new THREE.Mesh(new THREE.PlaneGeometry(lineWidth, ARENA_LENGTH), chalkMat);
    eLine.rotation.x = -Math.PI / 2;
    eLine.position.set(ARENA_WIDTH / 2, 0.008, 0);
    markGroup.add(eLine);

    // Visual indicators: "7m" distance signs at both edges of the 7-meter line
    [-ARENA_WIDTH / 2 + 1.2, ARENA_WIDTH / 2 - 1.2].forEach(xPos => {
      const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12);
      const postMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.6 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(xPos, 0.45, THROWING_LINE_Z);
      post.castShadow = true;
      markGroup.add(post);

      const signGeo = new THREE.BoxGeometry(0.6, 0.35, 0.05);
      const signMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.5 });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(xPos, 0.8, THROWING_LINE_Z);
      sign.castShadow = true;
      markGroup.add(sign);
    });

    this.scene.add(markGroup);
  }

  private buildSurroundings() {
    const envGroup = new THREE.Group();

    // Wooden perimeter fence
    const fenceMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
    const railGeo = new THREE.BoxGeometry(2.4, 0.08, 0.05);

    const fMarginX = ARENA_WIDTH / 2 + 1.8;
    const fMarginZ = ARENA_LENGTH / 2 + 1.8;

    // Place trees around the court outside fence
    const treePositions = [
      [-16, -20], [-10, -22], [0, -23], [12, -21], [18, -18],
      [-18, 0], [18, 0], [-18, 10], [18, 12],
      [-15, 20], [-6, 22], [5, 22], [14, 21], [19, 19]
    ];

    treePositions.forEach(([tx, tz]) => {
      const tree = this.createTree();
      tree.position.set(tx, 0, tz);
      const scale = 0.85 + Math.random() * 0.4;
      tree.scale.set(scale, scale, scale);
      envGroup.add(tree);
    });

    // Benches on sidelines
    [-ARENA_WIDTH / 2 - 1.2, ARENA_WIDTH / 2 + 1.2].forEach(bx => {
      [-4, 4].forEach(bz => {
        const bench = this.createBench();
        bench.position.set(bx, 0, bz);
        bench.rotation.y = bx < 0 ? Math.PI / 2 : -Math.PI / 2;
        envGroup.add(bench);
      });
    });

    this.scene.add(envGroup);
  }

  private createTree(): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 2.8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.4;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Foliage layers (stylized low-poly spheres)
    const foliageMat = new THREE.MeshStandardMaterial({
      color: '#15803d',
      roughness: 0.8,
      flatShading: true
    });

    const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), foliageMat);
    f1.position.set(0, 3.2, 0);
    f1.castShadow = true;
    tree.add(f1);

    const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), foliageMat);
    f2.position.set(0.3, 4.2, -0.2);
    f2.castShadow = true;
    tree.add(f2);

    return tree;
  }

  private createBench(): THREE.Group {
    const bench = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.7 });
    const ironMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 });

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.45), woodMat);
    seat.position.set(0, 0.45, 0);
    seat.castShadow = true;
    bench.add(seat);

    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.06), woodMat);
    back.position.set(0, 0.8, -0.2);
    back.castShadow = true;
    bench.add(back);

    // Legs
    [-0.8, 0.8].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), ironMat);
      leg.position.set(lx, 0.225, 0);
      leg.castShadow = true;
      bench.add(leg);
    });

    return bench;
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.renderer.dispose();
  }
}
