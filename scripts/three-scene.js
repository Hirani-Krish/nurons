/* =============================================
   Nurons — Highly Interactive 3D Cyber Matrix
   Using Three.js + BufferGeometry for high-tech particles
   ============================================= */

// Configuration
const CONFIG = {
  particleCount: 2000,
  connectionDistance: 120,
  mouseRepelRadius: 200,
  colors: {
    base: 0x00f3ff,     // Cyan
    highlight: 0xb026ff // Purple
  }
};

(function init3DScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  // Scene setup
  const scene = new THREE.Scene();
  // We use fog instead of clearing with background color to blend particles deep into the background
  scene.fog = new THREE.FogExp2(0x050505, 0.001);

  // Camera setup
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 600;

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // ── 1. Create Data Nodes (Particles) ── 
  const particleParams = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(CONFIG.particleCount * 3);
  const particleVelocities = [];

  for (let i = 0; i < CONFIG.particleCount; i++) {
    // Spread in a large 3D cylinder/grid volume
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 1000 - 200;

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;

    // Movement vectors
    particleVelocities.push({
      x: (Math.random() - 0.5) * 0.5,
      y: (Math.random() - 0.5) * 0.5,
      z: (Math.random() - 0.5) * 0.5
    });
  }

  particleParams.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  // Custom shader material for glowing tech dots
  const particleMaterial = new THREE.PointsMaterial({
    color: CONFIG.colors.base,
    size: 3,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(particleParams, particleMaterial);
  scene.add(particleSystem);

  // ── 2. Create Cyber Lines (Connections) ── 
  // We will dynamically draw lines between close points
  const linesGeometry = new THREE.BufferGeometry();
  const linesMaterial = new THREE.LineBasicMaterial({
    color: CONFIG.colors.highlight,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });
  
  // Max connections buffer based on assuming particles connect
  const maxLines = CONFIG.particleCount * 2; 
  const linePositions = new Float32Array(maxLines * 6);
  linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  linesGeometry.setDrawRange(0, 0);

  const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
  scene.add(linesMesh);

  // ── 3. Mouse Interaction (Hyper-Interactive) ── 
  const mouse = new THREE.Vector2(9999, 9999); // Off-screen initially
  const targetCameraPos = new THREE.Vector3(0, 0, 600);
  
  // Raycaster to map 2D mouse to 3D space
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointOfIntersection = new THREE.Vector3();

  window.addEventListener('mousemove', (event) => {
    // Normalize mouse coords
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Move camera slightly based on mouse position (Parallax)
    targetCameraPos.x = mouse.x * 150;
    targetCameraPos.y = mouse.y * 150;
  });

  // Track scroll for camera Z depth diving
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
  });

  // ── 4. Animation Loop ── 
  function animate() {
    requestAnimationFrame(animate);

    // Smoothly interpolate camera position
    camera.position.x += (targetCameraPos.x - camera.position.x) * 0.05;
    camera.position.y += (targetCameraPos.y - camera.position.y) * 0.05;
    // Scroll dives deep into the matrix
    camera.position.z = 600 - (scrollY * 0.3);
    camera.lookAt(scene.position);

    // Get true 3D mouse position
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, pointOfIntersection);

    const positions = particleSystem.geometry.attributes.position.array;
    
    let lineIndex = 0;

    for (let i = 0; i < CONFIG.particleCount; i++) {
      const pId = i * 3;
      
      // Basic movement
      positions[pId]     += particleVelocities[i].x;
      positions[pId + 1] += particleVelocities[i].y;
      positions[pId + 2] += particleVelocities[i].z;

      // Screen wrap
      if (positions[pId] > 1000) positions[pId] = -1000;
      if (positions[pId] < -1000) positions[pId] = 1000;
      if (positions[pId + 1] > 1000) positions[pId + 1] = -1000;
      if (positions[pId + 1] < -1000) positions[pId + 1] = 1000;

      // Mouse Repulsion Effect
      const dx = pointOfIntersection.x - positions[pId];
      const dy = pointOfIntersection.y - positions[pId + 1];
      const distToMouse = Math.sqrt(dx * dx + dy * dy);

      if (distToMouse < CONFIG.mouseRepelRadius) {
        // Push particle away
        const force = (CONFIG.mouseRepelRadius - distToMouse) / CONFIG.mouseRepelRadius;
        particleVelocities[i].x -= (dx / distToMouse) * force * 0.2;
        particleVelocities[i].y -= (dy / distToMouse) * force * 0.2;
        
        // Boost color if near mouse (glow effect)
        // Actually, we'll just speed them up to simulate energy
        particleVelocities[i].x *= 1.05;
        particleVelocities[i].y *= 1.05;
      }

      // Add friction to slow down hyper particles
      particleVelocities[i].x *= 0.98;
      particleVelocities[i].y *= 0.98;
      particleVelocities[i].z *= 0.98;

      // Minimum drift speed
      if(Math.abs(particleVelocities[i].x) < 0.2) particleVelocities[i].x += (Math.random()-0.5)*0.1;
      if(Math.abs(particleVelocities[i].y) < 0.2) particleVelocities[i].y += (Math.random()-0.5)*0.1;

      // Draw Connection Lines (Optimized brute force)
      // Only check a fraction of particles to save frame rate
      if (i % 2 === 0) { 
        for (let j = i + 1; j < CONFIG.particleCount; j += 4) {
          const pId2 = j * 3;
          const distSq = (positions[pId] - positions[pId2]) ** 2 + 
                         (positions[pId+1] - positions[pId2+1]) ** 2 + 
                         (positions[pId+2] - positions[pId2+2]) ** 2;

          if (distSq < (CONFIG.connectionDistance * CONFIG.connectionDistance)) {
             linePositions[lineIndex++] = positions[pId];
             linePositions[lineIndex++] = positions[pId+1];
             linePositions[lineIndex++] = positions[pId+2];
             
             linePositions[lineIndex++] = positions[pId2];
             linePositions[lineIndex++] = positions[pId2+1];
             linePositions[lineIndex++] = positions[pId2+2];
             
             if(lineIndex >= maxLines * 6) break;
          }
        }
      }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
    
    linesMesh.geometry.setDrawRange(0, lineIndex / 3);
    linesMesh.geometry.attributes.position.needsUpdate = true;

    // Slight scene rotation for dynamic feel
    scene.rotation.y += 0.0005;
    scene.rotation.x += 0.0002;

    renderer.render(scene, camera);
  }

  // Handle Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Start loop
  animate();

})();
