/**
 * Transformations Visual (Zero to One to Infinity)
 * A collection of geometric cubes that transform into various shapes.
 * Represents: Chaos (0) -> Cube (Structure) -> Pyramid (Growth) -> Sphere (Global).
 * Aesthetic: Vibrant Crystal (Electric Purple/Blue), Glassy, Alive.
 * Interaction: Click to explode (Scatter) then assemble into next shape.
 * Cycle: Scatter -> Cube -> Scatter -> Pyramid -> Scatter -> Sphere...
 */

(function () {
    'use strict';

    let scene, camera, renderer;
    let cubeGroup;
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let time = 0;

    // State Definitions
    const STATES = {
        SCATTER: 0,
        CUBE: 1,
        SPHERE: 2,
        PYRAMID: 3
    };

    // Interaction Logic State
    let currentState = STATES.SCATTER; // Start Scattered
    let isAnimating = false;

    // Cycle Order: Cube -> Pyramid -> Sphere -> (Loop)
    const SHAPE_CYCLE = [STATES.CUBE, STATES.PYRAMID, STATES.SPHERE];
    let nextShapeIndex = 0;

    const container = document.querySelector('.sphere-wrapper');
    if (!container) return;

    function init() {
        // 1. Scene
        scene = new THREE.Scene();
        // No fog or very light fog to keep colors popping

        // 2. Camera
        camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.z = 14;
        camera.position.x = 0;

        // 3. Renderer
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2)); // Lowered from 2 to 1.2 for performance

        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // 4. Create Content
        createCubes();
        addStudioLighting();

        // 5. Events
        window.addEventListener('resize', onWindowResize, false);
        container.addEventListener('mousemove', onMouseMove, false);

        // CLICK INTERACTION
        container.style.cursor = 'pointer';
        container.addEventListener('click', toggleShape);

        animate();
    }

    function createCubes() {
        cubeGroup = new THREE.Group();
        // Shift right to avoid text overlap
        cubeGroup.position.set(4.0, 0, 0);
        scene.add(cubeGroup);

        const geometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);

        // VIBRANT CRYSTAL PALETTE (Purple Dominant - No Blue/Cyan)
        const colors = [
            0x7F52FF, // Electric Purple (Brand)
            0x8A2BE2, // Blue Violet (Deep)
            0xFFFFFF, // Pure Crystal White
            0xD8BFD8, // Thistle (Soft Pinkish Purple)
            0x9370DB  // Medium Purple
        ];

        const count = 64; // Perfect 4x4x4 Cube

        for (let i = 0; i < count; i++) {

            const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
            const isGlass = Math.random() > 0.3; // 70% Glass, 30% Solid Accent

            let material;

            if (isGlass) {
                // Simplified Glass Material (MeshStandard is much faster than Physical)
                material = new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.1,
                    roughness: 0.05,
                    transparent: true,
                    opacity: 0.6,
                    side: THREE.FrontSide // Optimize by only rendering front side
                });
            } else {
                // Solid Emissive Accent (Glowing Core)
                material = new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.8,
                    roughness: 0.2,
                    emissive: color,
                    emissiveIntensity: 0.5 // Glow!
                });
            }

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // --- CALCULATE TARGET POSITIONS ---

            // 1. SCATTER (Random Cloud - Wide)
            const scatterPos = {
                x: (Math.random() - 0.5) * 14,
                y: (Math.random() - 0.5) * 12,
                z: (Math.random() - 0.5) * 10
            };
            const scatterRot = {
                x: Math.random() * Math.PI * 2,
                y: Math.random() * Math.PI * 2,
                z: Math.random() * Math.PI * 2
            };
            const scatterScale = 1.0;

            // 2. CUBE (4x4x4 Grid)
            const spacing = 0.75;
            const gridSize = 4;
            const offset = (gridSize - 1) * spacing * 0.5;

            const cx = (i % 4);
            const cy = Math.floor((i / 4) % 4);
            const cz = Math.floor(i / 16);

            const cubePos = {
                x: (cx * spacing) - offset,
                y: (cy * spacing) - offset,
                z: (cz * spacing) - offset
            };
            const cubeRot = { x: 0, y: 0, z: 0 };
            const cubeScale = 1.0;

            // 3. SPHERE (Fibonacci)
            const goldenRatio = (1 + Math.sqrt(5)) / 2;
            const r = 2.4;
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / count);

            const spherePos = {
                x: r * Math.cos(theta) * Math.sin(phi),
                y: r * Math.sin(theta) * Math.sin(phi),
                z: r * Math.cos(phi)
            };

            const dummy = new THREE.Object3D();
            dummy.position.set(spherePos.x, spherePos.y, spherePos.z);
            dummy.lookAt(0, 0, 0);
            const sphereRot = { x: dummy.rotation.x, y: dummy.rotation.y, z: dummy.rotation.z };
            const sphereScale = 1.0;

            // 4. PYRAMID (Stacked Squares) - STRICT
            let pyPos = { x: 0, y: 0, z: 0 };
            let pyScale = 1.0;

            if (i < 25) { // Level 0 (Base 5x5) centered
                const ox = (i % 5) - 2;
                const oz = Math.floor(i / 5) - 2;
                pyPos = { x: ox * spacing, y: -1.5 * spacing, z: oz * spacing };
            } else if (i < 25 + 16) { // Level 1 (4x4)
                const ii = i - 25;
                const ox = (ii % 4) - 1.5;
                const oz = Math.floor(ii / 4) - 1.5;
                pyPos = { x: ox * spacing, y: -0.5 * spacing, z: oz * spacing };
            } else if (i < 25 + 16 + 9) { // Level 2 (3x3)
                const ii = i - (25 + 16);
                const ox = (ii % 3) - 1;
                const oz = Math.floor(ii / 3) - 1;
                pyPos = { x: ox * spacing, y: 0.5 * spacing, z: oz * spacing };
            } else if (i < 25 + 16 + 9 + 4) { // Level 3 (2x2)
                const ii = i - (25 + 16 + 9);
                const ox = (ii % 2) - 0.5;
                const oz = Math.floor(ii / 2) - 0.5;
                pyPos = { x: ox * spacing, y: 1.5 * spacing, z: oz * spacing };
            } else if (i < 25 + 16 + 9 + 4 + 1) { // Top
                pyPos = { x: 0, y: 2.5 * spacing, z: 0 };
            } else {
                // Hide extras
                pyPos = { x: 0, y: 0, z: 0 };
                pyScale = 0.001;
            }
            const pyRot = { x: 0, y: 0, z: 0 };


            // --- SET INITIAL STATE (SCATTER) ---
            mesh.position.set(scatterPos.x, scatterPos.y, scatterPos.z);
            mesh.rotation.set(scatterRot.x, scatterRot.y, scatterRot.z);

            mesh.userData = {
                targets: {
                    [STATES.SCATTER]: { pos: scatterPos, rot: scatterRot, scale: scatterScale },
                    [STATES.CUBE]: { pos: cubePos, rot: cubeRot, scale: cubeScale },
                    [STATES.SPHERE]: { pos: spherePos, rot: sphereRot, scale: sphereScale },
                    [STATES.PYRAMID]: { pos: pyPos, rot: pyRot, scale: pyScale }
                },
                rotSpeedX: (Math.random() - 0.5) * 0.02,
                rotSpeedY: (Math.random() - 0.5) * 0.02
            };

            cubeGroup.add(mesh);
        }
    }

    function toggleShape() {
        const hint = document.getElementById('interaction-hint');

        if (isAnimating) return;
        isAnimating = true;

        let delayOffset = 0.005; // Standard delay
        let rotationTarget = { x: 0, y: 0, z: 0 };
        let ease = "power2.inOut";
        let duration = 1.2;

        // LOGIC: Scatter <-> Shape
        if (currentState !== STATES.SCATTER) {
            // Currently a Shape -> Go to SCATTER (Explode!)
            currentState = STATES.SCATTER;

            // Explosion settings
            ease = "expo.out"; // Fast start (Pop), slow end
            duration = 1.6;
            delayOffset = 0;   // Immediate explode

            rotationTarget = {
                x: Math.random() * 0.5,
                y: Math.random() * 0.5,
                z: 0
            };

        } else {
            // Currently Scattered -> Go to NEXT SHAPE
            currentState = SHAPE_CYCLE[nextShapeIndex];

            // Advance cycle for next time
            nextShapeIndex = (nextShapeIndex + 1) % SHAPE_CYCLE.length;

            // Shape Settings
            switch (currentState) {
                case STATES.CUBE:
                    rotationTarget = { x: 0.5, y: -0.5, z: 0 }; // Isometric
                    ease = "back.out(1.2)";
                    break;
                case STATES.PYRAMID:
                    rotationTarget = { x: 0.2, y: 0.8, z: 0 }; // Slight tilt spin
                    ease = "elastic.out(1, 0.75)";
                    break;
                case STATES.SPHERE:
                    rotationTarget = { x: 0, y: 0.5, z: 0 }; // Upright spin
                    ease = "power2.out";
                    break;
            }
        }

        // Animate Group Rotation
        if (currentState !== STATES.SCATTER) {
            gsap.to(cubeGroup.rotation, {
                x: rotationTarget.x,
                y: rotationTarget.y,
                z: rotationTarget.z,
                duration: duration,
                ease: "power2.inOut"
            });
        }

        // Animate Individual Cubes
        cubeGroup.children.forEach((mesh, i) => {
            const tgt = mesh.userData.targets[currentState];
            if (!tgt) return;

            // Pos
            gsap.to(mesh.position, {
                x: tgt.pos.x,
                y: tgt.pos.y,
                z: tgt.pos.z,
                duration: duration,
                ease: ease,
                delay: i * delayOffset
            });

            // Rot
            gsap.to(mesh.rotation, {
                x: tgt.rot.x,
                y: tgt.rot.y,
                z: tgt.rot.z,
                duration: duration,
                ease: "power2.inOut",
                delay: i * delayOffset
            });

            // Scale
            const targetScale = tgt.scale !== undefined ? tgt.scale : 1.0;
            gsap.to(mesh.scale, {
                x: targetScale,
                y: targetScale,
                z: targetScale,
                duration: duration,
                ease: ease,
                delay: i * delayOffset
            });
        });

        // Show hint when scattered, hide when forming a shape
        if (hint) {
            if (currentState === STATES.SCATTER) {
                // Show "Click!" after scatter animation completes
                setTimeout(() => {
                    hint.classList.remove('hidden');
                }, duration * 1000);
            } else {
                hint.classList.add('hidden');
            }
        }

        setTimeout(() => {
            isAnimating = false;
        }, duration * 1000 + 100);
    }

    function addStudioLighting() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);

        // Key Light (Warm Sun) - Adds vibrancy
        const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
        keyLight.position.set(5, 10, 5);
        keyLight.castShadow = true;
        scene.add(keyLight);

        // Rim 1 (Vibrant Purple)
        const rimLight1 = new THREE.SpotLight(0x7F52FF, 4.0);
        rimLight1.position.set(-10, 5, -5);
        scene.add(rimLight1);

        // Rim 2 (Cyan/Blue Pop)
        const rimLight2 = new THREE.SpotLight(0x00FFFF, 3.0);
        rimLight2.position.set(10, -5, 0);
        scene.add(rimLight2);
    }

    function onMouseMove(event) {
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        targetMouseX = (x / rect.width) * 2 - 1;
        targetMouseY = -(y / rect.height) * 2 + 1;
    }

    function onWindowResize() {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // Group Rotation
        if (cubeGroup) {
            // Slower mouse follow (Was 0.02)
            cubeGroup.rotation.y += mouseX * 0.005;
            cubeGroup.rotation.x += mouseY * 0.005;

            if (!isAnimating) {
                if (currentState === STATES.SCATTER) {
                    cubeGroup.rotation.y += 0.0005; // Was 0.001
                    cubeGroup.rotation.x += 0.0002; // Was 0.0005
                    cubeGroup.children.forEach(mesh => {
                        if (mesh.userData.rotSpeedX) {
                            mesh.rotation.x += mesh.userData.rotSpeedX;
                            mesh.rotation.y += mesh.userData.rotSpeedY;
                        }
                    });
                } else {
                    // Slower steady rotation (Was 0.003)
                    cubeGroup.rotation.y += 0.001;
                }
            }
        }

        renderer.render(scene, camera);
    }

    init();

})();
