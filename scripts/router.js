/* =============================================
   Nurons — SPA Router
   Ensures 3D Background Persistent State
   ============================================= */

class Router {
    constructor() {
        this.appContainer = document.getElementById('app-content');
        this.cache = {};

        // Define routes mapping path to partial HTML file
        this.routes = {
            '/': 'pages/home.html',
            '/services': 'pages/services.html',
            '/archives': 'pages/portfolio.html',
            '/team': 'pages/team.html',
            '/intel': 'pages/intel.html',
            '/holograms': 'pages/holograms.html',
            '/contact': 'pages/contact.html'
        };

        this.init();
    }

    init() {
        // Intercept all link clicks possessing `data-route`
        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const path = link.getAttribute('data-route');
                this.navigate(path);
            }
        });

        // Handle Browser Back/Forward navigation
        window.addEventListener('popstate', () => {
            this.handleRoute(window.location.pathname);
        });

        // Initial Load Route — handle GitHub Pages 404 SPA redirect
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get('p');
        if (redirectPath) {
            // Clean up the URL and navigate to the intended route
            window.history.replaceState({}, '', redirectPath);
            this.handleRoute(redirectPath);
        } else {
            const initialPath = window.location.pathname;
            this.handleRoute(initialPath === '/index.html' ? '/' : (initialPath || '/'));
        }
    }

    async navigate(path) {
        window.history.pushState({}, '', path);
        await this.handleRoute(path);
        
        // Update Active Nav Link
        document.querySelectorAll('a[data-route]').forEach(link => {
            link.classList.remove('active');
            if(link.getAttribute('data-route') === path) {
                link.classList.add('active');
            }
        });
    }

    async handleRoute(path) {
        const routePath = path === '/index.html' ? '/' : path;
        const pageFile = this.routes[routePath] || this.routes['/'];

        // 1. Fade out current content
        gsap.to(this.appContainer, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            onComplete: async () => {
                
                // 2. Fetch new content
                let html = '';
                if (this.cache[pageFile]) {
                    html = this.cache[pageFile];
                } else {
                    try {
                        const response = await fetch(pageFile);
                        if (!response.ok) throw new Error('Network response was not ok');
                        html = await response.text();
                        this.cache[pageFile] = html; // Cache to save network requests
                    } catch (error) {
                        html = `<section class="hero section"><div class="container"><h1 class="section-title text-gradient">404 // SYSTEM ERROR</h1><p>Data fragment not found. Path: ${path}</p></div></section>`;
                    }
                }

                // 3. Inject Content
                this.appContainer.innerHTML = html;
                window.scrollTo(0, 0);

                // 4. Fade in new content
                gsap.fromTo(this.appContainer, 
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
                );

                // 5. Reinitialize Page-Specific JS (GSAP triggers, Forms)
                this.reinitializeScripts();
            }
        });
    }

    reinitializeScripts() {
        // Refresh ScrollTrigger so new elements are animated correctly
        ScrollTrigger.refresh();
        
        // Glitch Effect
        const monoHeaders = document.querySelectorAll('.section-label');
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        monoHeaders.forEach((header) => {
            const originalText = header.getAttribute('data-text') || header.innerText;
            header.setAttribute('data-text', originalText); // Save original state
            
            header.addEventListener('mouseover', () => {
                let iterations = 0;
                const interval = setInterval(() => {
                    header.innerText = originalText.split("")
                        .map((letter, index) => {
                            if (index < iterations) return originalText[index];
                            return letters[Math.floor(Math.random() * letters.length)];
                        })
                        .join("");
                    if (iterations >= originalText.length) clearInterval(interval);
                    iterations += 1 / 3;
                }, 30);
            });
        });

        // Trigger GSAP Reveals for new elements (exclude intel-card to keep content visible)
        const revealElements = this.appContainer.querySelectorAll('.section-title, .section-subtitle');
        if(revealElements.length > 0) {
            gsap.from(revealElements, {
                y: 40,
                opacity: 0,
                filter: 'blur(10px)',
                duration: 0.8,
                stagger: 0.1,
                ease: 'expo.out'
            });
        }

        // Initialize Contact Form with Web3Forms
        const contactForm = document.getElementById('contact-form');
        if(contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const status = document.getElementById('form-status');
                const btn = contactForm.querySelector('button[type="submit"]');
                if(status) {
                    status.style.display = 'block';
                    status.textContent = '> TRANSMITTING...';
                    status.style.color = 'var(--color-cyan)';
                }
                if(btn) btn.disabled = true;

                // Collect form data
                const formData = {
                    access_key: 'd7b29c82-2b8b-4222-9b91-8f023fc50ed7',
                    subject: 'New Inquiry from nurons.in',
                    from_name: document.getElementById('contact-name').value,
                    email: document.getElementById('contact-email').value,
                    company: document.getElementById('contact-company').value || 'Not provided',
                    objective: document.getElementById('contact-budget').value || 'Not selected',
                    message: document.getElementById('contact-brief').value
                };

                // Send via Web3Forms API
                fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                })
                .then(res => res.json())
                .then(data => {
                    if(data.success) {
                        if(status) {
                            status.textContent = '> MESSAGE TRANSMITTED SUCCESSFULLY. WE WILL RESPOND WITHIN 24 HOURS.';
                            status.style.color = '#00ff88';
                        }
                        contactForm.reset();
                    } else {
                        if(status) {
                            status.textContent = '> TRANSMISSION FAILED. PLEASE EMAIL US DIRECTLY AT khirani042@rku.ac.in';
                            status.style.color = '#ff4444';
                        }
                    }
                    if(btn) btn.disabled = false;
                })
                .catch(error => {
                    if(status) {
                        status.textContent = '> NETWORK ERROR. PLEASE EMAIL US DIRECTLY AT khirani042@rku.ac.in';
                        status.style.color = '#ff4444';
                    }
                    if(btn) btn.disabled = false;
                    console.error('Web3Forms Error:', error);
                });
            });
        }

        // Initialize Holograms Page if it was just loaded
        const container = document.getElementById('hologram-container');
        if(container && typeof THREE !== 'undefined') {
            const loader = document.getElementById('hologram-loader');
            const readingPanel = document.getElementById('reading-content');

            // Content Data for each Hologram
            const contentData = [
                {
                    title: "AI & Neural Networks",
                    tag: "> CONSTRUCT_01 // INTELLIGENCE",
                    desc: "We construct bespoke Large Language Models and predictive algorithms. Our neural networks are trained specifically on your proprietary data sets, ensuring 100% intellectual property retention and zero generic outputs. The constructs adapt and restructure logic processing in real time."
                },
                {
                    title: "Offensive Cyber Security",
                    tag: "> CONSTRUCT_02 // FORTIFICATION",
                    desc: "Absolute zero-trust architecture. We employ offensive penetration testing methodologies (Red Teaming) to find critical attack vectors before bad actors do. Every packet routed through our infrastructure is encrypted with AES-256 protocols and decentralized node sharding."
                },
                {
                    title: "Hyper-Scale DevOps",
                    tag: "> CONSTRUCT_03 // INFRASTRUCTURE",
                    desc: "We build stateless, endlessly horizontally scalable backend architectures using Next.js, FastAPI, and Kubernetes clusters. By abstracting the heavy lifting to optimal micro-services, our applications handle punishing traffic loads with sub-10 millisecond latencies."
                }
            ];

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
            camera.position.z = 15;

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.domElement.style.position = 'absolute';
            renderer.domElement.style.top = '0';
            renderer.domElement.style.left = '0';
            container.appendChild(renderer.domElement);

            if(loader) loader.style.display = 'none';

            const objects = [];
            const geometries = [
                new THREE.IcosahedronGeometry(1.5, 0),
                new THREE.BoxGeometry(2, 2, 2),
                new THREE.OctahedronGeometry(1.8, 0)
            ];
            const colors = [0x00f3ff, 0xb026ff, 0xff0055];

            for(let i=0; i<3; i++) {
                const material = new THREE.MeshBasicMaterial({ color: colors[i], wireframe: true, transparent: true, opacity: 0.4 });
                const innerMaterial = new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: 0.1 });
                const mesh = new THREE.Mesh(geometries[i], material);
                const innerMesh = new THREE.Mesh(geometries[i].clone().scale(0.8,0.8,0.8), innerMaterial);
                mesh.add(innerMesh);
                mesh.position.x = (i === 1) ? -3 : (i === 2) ? 3 : 0;
                mesh.position.y = (i === 0) ? 3 : -1;
                mesh.userData = { id: i, baseSpeed: 0.005, hoverSpeed: 0.05, active: false };
                scene.add(mesh);
                objects.push(mesh);
            }

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2(-999, -999);
            let hoveredObj = null;

            container.addEventListener('mousemove', (event) => {
                const rect = container.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
            });

            function updateContent(index) {
                const data = contentData[index];
                readingPanel.style.opacity = 0;
                setTimeout(() => {
                    readingPanel.innerHTML = `
                        <p class="mono text-gradient" style="margin-bottom: 1rem; font-size: 0.9rem;">${data.tag}</p>
                        <h2 style="font-size: 2rem; margin-bottom: 1.5rem;">${data.title}</h2>
                        <p style="color: var(--color-text-secondary); line-height: 1.8;">${data.desc}</p>
                    `;
                    readingPanel.style.opacity = 1;
                }, 300);
            }

            let animationFrameId;
            function animate() {
                animationFrameId = requestAnimationFrame(animate);
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(objects, false);

                if (intersects.length > 0) {
                    const obj = intersects[0].object;
                    if (hoveredObj !== obj) {
                        hoveredObj = obj;
                        updateContent(obj.userData.id);
                        document.body.style.cursor = 'crosshair';
                    }
                } else {
                    if (hoveredObj !== null) {
                        hoveredObj = null;
                        document.body.style.cursor = 'default';
                        readingPanel.style.opacity = 0;
                        setTimeout(() => {
                            readingPanel.innerHTML = `
                                <p class="mono text-gradient" style="margin-bottom: 1rem; font-size: 0.9rem;">> SYSTEM STANDBY</p>
                                <h2 style="font-size: 2rem; margin-bottom: 1.5rem;">Select A Construct</h2>
                                <p style="color: var(--color-text-secondary); line-height: 1.8;">
                                    Awaiting user input. <br><br>
                                    Please move your cursor over the spinning 3D wireframe cubes in the adjacent panel to decrypt and view the specific operating parameters for our AI, Cybersecurity, and Data Engineering services.
                                </p>
                            `;
                            readingPanel.style.opacity = 1;
                        }, 300);
                    }
                }

                objects.forEach(obj => {
                    const speed = (hoveredObj === obj) ? obj.userData.hoverSpeed : obj.userData.baseSpeed;
                    obj.material.opacity += ((hoveredObj === obj ? 0.8 : 0.4) - obj.material.opacity) * 0.1;
                    obj.children[0].material.opacity += ((hoveredObj === obj ? 0.3 : 0.1) - obj.children[0].material.opacity) * 0.1;
                    obj.rotation.x += speed;
                    obj.rotation.y += speed;
                });
                renderer.render(scene, camera);
            }
            animate();

            const resizeObserver = new ResizeObserver(() => {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            });
            resizeObserver.observe(container);

            const observer = new MutationObserver(() => {
                if(!document.body.contains(container)) {
                    cancelAnimationFrame(animationFrameId);
                    resizeObserver.disconnect();
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        // ===== NEURAL CLUSTER — Interactive Particle System =====
        const neuralCanvas = document.getElementById('neural-canvas');
        if(neuralCanvas) {
            const ctx = neuralCanvas.getContext('2d');
            const neuralContainer = document.getElementById('neural-container');
            let nW = neuralContainer.clientWidth;
            let nH = neuralContainer.clientHeight;
            neuralCanvas.width = nW * window.devicePixelRatio;
            neuralCanvas.height = nH * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

            const particles = [];
            const PARTICLE_COUNT = 180;
            let nMouse = { x: -9999, y: -9999 };
            let pulseWaves = [];

            for(let i = 0; i < PARTICLE_COUNT; i++) {
                particles.push({
                    x: Math.random() * nW, y: Math.random() * nH,
                    vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                    r: Math.random() * 2 + 1,
                    color: ['#00f3ff', '#b026ff', '#ff0055', '#00ff88'][Math.floor(Math.random()*4)]
                });
            }

            neuralContainer.addEventListener('mousemove', (e) => {
                const rect = neuralContainer.getBoundingClientRect();
                nMouse.x = e.clientX - rect.left;
                nMouse.y = e.clientY - rect.top;
            });
            neuralContainer.addEventListener('mouseleave', () => { nMouse.x = -9999; nMouse.y = -9999; });
            neuralContainer.addEventListener('click', (e) => {
                const rect = neuralContainer.getBoundingClientRect();
                pulseWaves.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, radius: 0, maxRadius: 300, alpha: 1 });
            });

            let neuralFrameId;
            function animateNeural() {
                neuralFrameId = requestAnimationFrame(animateNeural);
                ctx.clearRect(0, 0, nW, nH);

                // Update & draw particles
                particles.forEach(p => {
                    // Mouse attraction
                    const dx = nMouse.x - p.x, dy = nMouse.y - p.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist < 200 && dist > 5) {
                        const force = (200 - dist) / 200 * 0.15;
                        p.vx += (dx / dist) * force;
                        p.vy += (dy / dist) * force;
                    }

                    // Pulse wave repulsion
                    pulseWaves.forEach(w => {
                        const wd = Math.sqrt((p.x - w.x)**2 + (p.y - w.y)**2);
                        if(Math.abs(wd - w.radius) < 30) {
                            const angle = Math.atan2(p.y - w.y, p.x - w.x);
                            p.vx += Math.cos(angle) * 3 * w.alpha;
                            p.vy += Math.sin(angle) * 3 * w.alpha;
                        }
                    });

                    p.vx *= 0.97; p.vy *= 0.97;
                    p.x += p.vx; p.y += p.vy;
                    if(p.x < 0) p.x = nW; if(p.x > nW) p.x = 0;
                    if(p.y < 0) p.y = nH; if(p.y > nH) p.y = 0;

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = 0.8;
                    ctx.fill();
                });

                // Draw connections
                ctx.globalAlpha = 1;
                for(let i = 0; i < particles.length; i++) {
                    for(let j = i + 1; j < particles.length; j++) {
                        const d = Math.sqrt((particles[i].x - particles[j].x)**2 + (particles[i].y - particles[j].y)**2);
                        if(d < 80) {
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.strokeStyle = `rgba(0, 243, 255, ${(1 - d/80) * 0.3})`;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                }

                // Draw pulse waves
                pulseWaves.forEach((w, idx) => {
                    ctx.beginPath();
                    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(176, 38, 255, ${w.alpha})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    w.radius += 4;
                    w.alpha -= 0.012;
                });
                pulseWaves = pulseWaves.filter(w => w.alpha > 0);
            }
            animateNeural();

            // Cleanup
            const neuralObs = new MutationObserver(() => {
                if(!document.body.contains(neuralCanvas)) { cancelAnimationFrame(neuralFrameId); neuralObs.disconnect(); }
            });
            neuralObs.observe(document.body, { childList: true, subtree: true });
        }

        // ===== DATA HELIX — Interactive Double Helix =====
        const helixCanvas = document.getElementById('helix-canvas');
        if(helixCanvas) {
            const ctx2 = helixCanvas.getContext('2d');
            const helixContainer = document.getElementById('helix-container');
            let hW = helixContainer.clientWidth;
            let hH = helixContainer.clientHeight;
            helixCanvas.width = hW * window.devicePixelRatio;
            helixCanvas.height = hH * window.devicePixelRatio;
            ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);

            let helixRotation = 0;
            let isDragging = false;
            let lastDragX = 0;
            let dragVelocity = 0;
            let hMouse = { x: -9999, y: -9999 };

            helixContainer.addEventListener('mousedown', (e) => { isDragging = true; lastDragX = e.clientX; helixContainer.style.cursor = 'grabbing'; });
            window.addEventListener('mouseup', () => { isDragging = false; helixContainer.style.cursor = 'grab'; });
            window.addEventListener('mousemove', (e) => {
                if(isDragging) { dragVelocity = (e.clientX - lastDragX) * 0.01; lastDragX = e.clientX; }
                const rect = helixContainer.getBoundingClientRect();
                hMouse.x = e.clientX - rect.left; hMouse.y = e.clientY - rect.top;
            });

            let helixFrameId;
            function animateHelix() {
                helixFrameId = requestAnimationFrame(animateHelix);
                ctx2.clearRect(0, 0, hW, hH);

                if(!isDragging) { dragVelocity *= 0.96; }
                helixRotation += dragVelocity + 0.008;

                const nodeCount = 40;
                const spacing = hH / (nodeCount - 1);
                const amplitude = Math.min(hW * 0.18, 120);
                const centerX = hW / 2;

                // Draw connecting rungs first (behind)
                for(let i = 0; i < nodeCount; i++) {
                    const y = i * spacing;
                    const phase = helixRotation + i * 0.3;
                    const x1 = centerX + Math.sin(phase) * amplitude;
                    const x2 = centerX + Math.sin(phase + Math.PI) * amplitude;
                    const depth1 = Math.cos(phase);
                    const depth2 = Math.cos(phase + Math.PI);

                    if(depth1 > 0 || depth2 > 0) {
                        ctx2.beginPath();
                        ctx2.moveTo(x1, y);
                        ctx2.lineTo(x2, y);
                        ctx2.strokeStyle = `rgba(0, 243, 255, 0.08)`;
                        ctx2.lineWidth = 1;
                        ctx2.stroke();
                    }
                }

                // Draw strands
                const strands = [
                    { offset: 0, color: '#00f3ff', glow: 'rgba(0, 243, 255,' },
                    { offset: Math.PI, color: '#b026ff', glow: 'rgba(176, 38, 255,' }
                ];

                strands.forEach(strand => {
                    // Draw strand path
                    ctx2.beginPath();
                    for(let i = 0; i < nodeCount; i++) {
                        const y = i * spacing;
                        const phase = helixRotation + i * 0.3 + strand.offset;
                        const x = centerX + Math.sin(phase) * amplitude;
                        if(i === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y);
                    }
                    ctx2.strokeStyle = `${strand.glow} 0.4)`;
                    ctx2.lineWidth = 1.5;
                    ctx2.stroke();

                    // Draw nodes
                    for(let i = 0; i < nodeCount; i++) {
                        const y = i * spacing;
                        const phase = helixRotation + i * 0.3 + strand.offset;
                        const x = centerX + Math.sin(phase) * amplitude;
                        const depth = Math.cos(phase);
                        const size = 3 + depth * 2;
                        const alpha = 0.4 + depth * 0.4;

                        // Highlight near mouse
                        const md = Math.sqrt((hMouse.x - x)**2 + (hMouse.y - y)**2);
                        const highlight = md < 60 ? 1.5 : 1;

                        if(size > 0) {
                            ctx2.beginPath();
                            ctx2.arc(x, y, Math.max(1, size * highlight), 0, Math.PI * 2);
                            ctx2.fillStyle = `${strand.glow} ${Math.max(0, alpha)})`;
                            ctx2.fill();

                            if(md < 60) {
                                ctx2.beginPath();
                                ctx2.arc(x, y, size * 3, 0, Math.PI * 2);
                                ctx2.fillStyle = `${strand.glow} 0.08)`;
                                ctx2.fill();
                            }
                        }
                    }
                });
            }
            animateHelix();

            const helixObs = new MutationObserver(() => {
                if(!document.body.contains(helixCanvas)) { cancelAnimationFrame(helixFrameId); helixObs.disconnect(); }
            });
            helixObs.observe(document.body, { childList: true, subtree: true });
        }

        // ===== CYBER TERRAIN — Interactive Wireframe Grid =====
        const terrainCanvas = document.getElementById('terrain-canvas');
        if(terrainCanvas) {
            const ctx3 = terrainCanvas.getContext('2d');
            const terrainContainer = document.getElementById('terrain-container');
            let tW = terrainContainer.clientWidth;
            let tH = terrainContainer.clientHeight;
            terrainCanvas.width = tW * window.devicePixelRatio;
            terrainCanvas.height = tH * window.devicePixelRatio;
            ctx3.scale(window.devicePixelRatio, window.devicePixelRatio);

            let tMouse = { x: tW / 2, y: tH / 2 };
            let time = 0;
            const cols = 50, rows = 30;
            const cellW = tW / cols, cellH = tH / rows;

            terrainContainer.addEventListener('mousemove', (e) => {
                const rect = terrainContainer.getBoundingClientRect();
                tMouse.x = e.clientX - rect.left; tMouse.y = e.clientY - rect.top;
            });

            let terrainFrameId;
            function animateTerrain() {
                terrainFrameId = requestAnimationFrame(animateTerrain);
                ctx3.clearRect(0, 0, tW, tH);
                time += 0.02;

                // Calculate heights
                const heights = [];
                for(let r = 0; r <= rows; r++) {
                    heights[r] = [];
                    for(let c = 0; c <= cols; c++) {
                        const x = c * cellW, y = r * cellH;
                        const dx = (x - tMouse.x) / tW;
                        const dy = (y - tMouse.y) / tH;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        const wave = Math.sin(c * 0.3 + time) * Math.cos(r * 0.3 + time) * 20;
                        const mouseEffect = Math.exp(-dist * 4) * 40;
                        heights[r][c] = wave + mouseEffect;
                    }
                }

                // Draw grid lines
                for(let r = 0; r < rows; r++) {
                    for(let c = 0; c < cols; c++) {
                        const x = c * cellW, y = r * cellH;
                        const h = heights[r][c];
                        const hRight = heights[r][c+1] || 0;
                        const hBottom = (heights[r+1] && heights[r+1][c]) || 0;

                        const intensity = Math.min(1, Math.abs(h) / 30);
                        const r_c = Math.floor(intensity * 100);
                        const g_c = Math.floor(200 + intensity * 55);
                        const b_c = 255;

                        // Horizontal line
                        ctx3.beginPath();
                        ctx3.moveTo(x, y - h);
                        ctx3.lineTo(x + cellW, y - hRight);
                        ctx3.strokeStyle = `rgba(${r_c}, ${g_c}, ${b_c}, ${0.2 + intensity * 0.4})`;
                        ctx3.lineWidth = 0.8;
                        ctx3.stroke();

                        // Vertical line
                        ctx3.beginPath();
                        ctx3.moveTo(x, y - h);
                        ctx3.lineTo(x, y + cellH - hBottom);
                        ctx3.strokeStyle = `rgba(${r_c}, ${g_c}, ${b_c}, ${0.15 + intensity * 0.3})`;
                        ctx3.lineWidth = 0.6;
                        ctx3.stroke();

                        // Highlight vertex near mouse
                        const md = Math.sqrt((tMouse.x - x)**2 + (tMouse.y - (y - h))**2);
                        if(md < 30) {
                            ctx3.beginPath();
                            ctx3.arc(x, y - h, 3, 0, Math.PI * 2);
                            ctx3.fillStyle = '#ff0055';
                            ctx3.fill();
                            ctx3.beginPath();
                            ctx3.arc(x, y - h, 8, 0, Math.PI * 2);
                            ctx3.fillStyle = 'rgba(255, 0, 85, 0.15)';
                            ctx3.fill();
                        }
                    }
                }
            }
            animateTerrain();

            const terrainObs = new MutationObserver(() => {
                if(!document.body.contains(terrainCanvas)) { cancelAnimationFrame(terrainFrameId); terrainObs.disconnect(); }
            });
            terrainObs.observe(document.body, { childList: true, subtree: true });
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // GitHub Pages SPA redirect: check for redirect query param from 404.html
    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('p');
    if(redirectPath) {
        window.history.replaceState({}, '', redirectPath);
    }
    new Router();
});
