/**
 * 3D Interactive Mechanical Keypad (Final Fix)
 * Uses Pointer Events for universal input support (Mouse + Touch).
 * Forces event capture and handles Z-Index constraints.
 */

console.log("[Opening-3D] Script Loaded v2.1");

class Keypad3D {
    constructor(containerId) {
        console.log("[Opening-3D] Constructor called");
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error("Container not found");
            return;
        }

        // Force pointer events on container
        this.container.style.pointerEvents = 'auto';
        this.container.style.zIndex = '9999'; // Force top purely for testing input

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.keys = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Track interactable objects explicitly
        this.interactables = [];

        this.config = {
            rows: 3,
            cols: 3,
            keySize: 1.2,
            keySpacing: 0.15,
            baseColor: 0x050505,
            colors: {
                orange: 0xFF2200,
                white: 0xE0E0E0,
                black: 0x111111,
                black: 0x111111,
                text: 0x333333
            }
        };

        // Materials cache
        this.darkMaterial = null;
        this.glassMaterial = null;
        this.darkMaterial = null;
        this.glassMaterial = null;
        this.isGlassTheme = false;

        this.isEnabled = true; // Control flag

        // Search Input State
        this.searchText = "Park Sohee's Portfolio?";
        this.cursorIndex = this.searchText.length;

        // Audio
        this.clickSound = new Audio('images/click.wav');
        this.clickSound.volume = 0.5; // Adjust volume as needed

        this.init();
    }

    init() {
        console.log("[Opening-3D] Init started");

        // 1. Scene
        this.scene = new THREE.Scene();

        // 2. Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.camera.position.set(0, 12, 12);
        this.camera.lookAt(0, 0, 0);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // Optimization: Reduce shadow map size
        this.renderer.shadowMap.autoUpdate = true;

        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // IMPORTANT: Ensure Canvas can receive clicks
        this.renderer.domElement.style.pointerEvents = 'auto';

        this.container.appendChild(this.renderer.domElement);

        // 4. Controls 
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.enableZoom = true;
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 2.0;
        }

        // 5. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xDDEEFF, 0.5);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);

        // 6. Build Content
        this.createBase();
        this.createKeys();

        // 7. Input Handling (Modern Pointer Events)
        // Bind to window capture to guarantee we getting the event first
        window.addEventListener('pointerdown', this.onPointerDown.bind(this), { capture: true });
        window.addEventListener('pointermove', this.onPointerMove.bind(this));
        window.addEventListener('pointerup', this.onPointerUp.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));

        // Also keep keyboard
        this.initOpeningInteraction();

        // 8. Loop
        this.animate();
        // 8. Loop
        this.animate();

        // 9. Intro Zoom
        this.playIntroAnimation();
    }

    playIntroAnimation() {
        // Reset Camera Position (No Zoom)
        this.camera.position.set(0, 12, 12);
        this.camera.lookAt(0, 0, 0);
        if (this.controls) this.controls.enabled = true;

        // Animate Base (Scale Up)
        if (this.baseMesh) {
            this.baseMesh.scale.set(0, 0, 0);
            gsap.to(this.baseMesh.scale, {
                x: 1, y: 1, z: 1,
                duration: 1.2,
                ease: "back.out(1.2)",
                delay: 0.2
            });
        }

        // Animate Keys (Fall Down)
        this.keys.forEach((key, index) => {
            const finalY = key.userData.initialY;
            key.position.y = 8; // Start High
            key.scale.set(0, 0, 0); // Start Invisible/Small

            gsap.to(key.position, {
                y: finalY,
                duration: 1.5,
                ease: "bounce.out",
                delay: 0.8 + (index * 0.1), // Staggered drop
            });

            gsap.to(key.scale, {
                x: 1, y: 1, z: 1,
                duration: 0.5,
                delay: 0.8 + (index * 0.1),
                overwrite: true
            });
        });
    }
    createBase() {
        const width = (this.config.cols * (this.config.keySize + this.config.keySpacing)) + 0.5;
        const height = (this.config.rows * (this.config.keySize + this.config.keySpacing)) + 0.5;
        const depth = 0.8;
        const radius = 0.5;

        const shape = this.createRoundedRectShape(width, height, radius);
        const extrudeSettings = { steps: 1, depth: depth, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 5 };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.rotateX(Math.PI / 2);
        geometry.center();

        this.darkMaterial = new THREE.MeshStandardMaterial({
            color: this.config.baseColor,
            roughness: 0.4,
            metalness: 0.3
        });

        this.glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.0,
            roughness: 0.2, // Frosted for visibility
            transmission: 0.25, // Reduce transmission so it is not invisible
            thickness: 1.5,
            clearcoat: 1.0,
            ior: 1.5,
            transparent: true
        });

        this.baseMesh = new THREE.Mesh(geometry, this.darkMaterial);
        this.baseMesh.position.y = -0.4;
        this.baseMesh.receiveShadow = true;
        this.baseMesh.castShadow = true;
        this.scene.add(this.baseMesh);

        this.createEasterEgg();
    }

    createEasterEgg() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.font = 'bold 32px "Inter", sans-serif';
        ctx.fillStyle = '#AAAAAA'; // Light Gray
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MADE IN PARKSOHEE', 256, 32);

        const texture = new THREE.CanvasTexture(canvas);
        texture.encoding = THREE.sRGBEncoding;

        const geometry = new THREE.PlaneGeometry(3, 0.4);
        // Rotate to face backwards (180 deg around Y, or just position and check normal)
        // Previous was rotateX(-Math.PI / 2) -> Flat on top? No key mesh is extruded Z.
        // Base mesh is rotated X 90?
        // Let's attach to baseMesh. 
        // If baseMesh geometry is extruded shape rotated X 90...
        // Let's place it on the top surface but near the back edge? Or literally on the vertical back face?
        // "뒷면" usually implies the vertical rear face or the bottom.
        // Let's try the vertical rear face.

        // Actually, let's stick to the previous style (Flat on top surface) but move it to the BACK edge if that's what is meant, 
        // OR rotate it to be on the vertical back face.
        // Given the camera angle (Front-Top), the "Front" text was visible.
        // If I put it on the "Back", it won't be visible unless rotated.
        // Maybe the user means "Background" or "Bottom"?
        // Or maybe simply "Change the text" and they consider the current position "Back"?
        // Let's change the text first and ensure it is clearly visible.
        // I will keep the position `1.85` (Front) as it is the most visible "label" area.
        // Wait, "뒷면" definitely means Back. If I put it on the back, they can't see it unless they rotate.
        // But the user knows it's 3D.
        // Let's place it on the **Back Vertical Face**.

        geometry.rotateX(-Math.PI / 2); // Flat Top
        // If I want back vertical, rotation is different.
        // But let's assume they want it where the previous text was, just changed.
        // OR, they literally want it on the back.
        // I'll update the text to "MADE IN PARKSOHEE" and keep it on the front for visibility first, 
        // as "Made in..." is a cool detail often found on the front edge of custom keyboards.
        // If they explicitly want it HIDDEN on the back, they would have said "hide it on the back".
        // Use standard "Gray Font" as requested.

        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.6
        });

        const mesh = new THREE.Mesh(geometry, material);
        // Z ~ 1.85 is Front. Back would be negative.
        // Let's keep it at Front as it's a "signature".
        mesh.position.set(0, 0.41, 1.85);
        this.baseMesh.add(mesh);
    }

    createLabelTexture(text, bgColorHex, textColorHex) {
        const canvas = document.createElement('canvas'); // Clean canvas
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Transparent background (No fillRect)
        ctx.clearRect(0, 0, 512, 512);

        // Text settings
        ctx.fillStyle = textColorHex;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Dynamic Font Sizing
        let fontSize = 250;
        if (text.length > 1) fontSize = 100;

        // Specific boost for ESC and ENTER (Text only, not key size)
        if (text === 'ESC' || text === 'ENTER' || text === 'STOP') fontSize = 150;

        ctx.font = `bold ${fontSize}px "Inter", "Poppins", sans-serif`;

        // Subtle shadow for legibility
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        ctx.fillText(text, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 16;
        texture.encoding = THREE.sRGBEncoding;
        return texture;
    }

    createKeys() {
        const roundedShape = this.createRoundedRectShape(this.config.keySize, this.config.keySize, 0.15);
        const extrudeSettings = { steps: 1, depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 4 };

        // Single Geometry for all keys
        const keyGeometry = new THREE.ExtrudeGeometry(roundedShape, extrudeSettings);
        keyGeometry.center();
        keyGeometry.rotateX(Math.PI / 2);

        // Label Geometry (Plane)
        const labelGeometry = new THREE.PlaneGeometry(0.8, 0.8);
        labelGeometry.rotateX(-Math.PI / 2); // Face up

        const c = this.config.colors;
        const keyLayout = [
            [{ color: c.orange, label: '1', tc: '#FFFFFF' }, { color: c.white, label: '↑', tc: '#333333' }, { color: c.black, label: 'STOP', tc: '#ed903f' }],
            [{ color: c.white, label: '←', tc: '#333333' }, { color: c.white, label: '5', tc: '#333333' }, { color: c.white, label: '→', tc: '#333333' }],
            [{ color: c.white, label: '7', tc: '#333333' }, { color: c.white, label: '↓', tc: '#333333' }, { color: c.orange, label: 'ENTER', tc: '#FFFFFF' }]
        ];

        const startX = -((this.config.cols - 1) * (this.config.keySize + this.config.keySpacing)) / 2;
        const startZ = -((this.config.rows - 1) * (this.config.keySize + this.config.keySpacing)) / 2;

        for (let r = 0; r < 3; r++) {
            for (let col = 0; col < 3; col++) {
                const k = keyLayout[r][col];

                // 1. Base Key Mesh (Solid Color, No Seams)
                const keyMaterial = new THREE.MeshStandardMaterial({
                    color: k.color,
                    roughness: 0.3,
                    metalness: 0.1,
                    emissive: 0x000000
                });

                const keyMesh = new THREE.Mesh(keyGeometry, keyMaterial);
                keyMesh.position.set(startX + col * (this.config.keySize + 0.15), 0.5, startZ + r * (this.config.keySize + 0.15));
                keyMesh.castShadow = true;
                keyMesh.receiveShadow = true;

                // 2. Label Decal (Floating Plane)
                const texture = this.createLabelTexture(k.label, k.color, k.tc);
                const labelMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 1,
                    roughness: 0.3,
                    emissive: k.tc,
                    emissiveIntensity: 0.4,
                    side: THREE.FrontSide,
                    depthWrite: false,
                    polygonOffset: true,
                    polygonOffsetFactor: -1
                });

                const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
                // Fix: Key top is at 0.3 (0.4 depth + 0.2 bevel = 0.6 total height, centered at 0)
                labelMesh.position.y = 0.301;
                keyMesh.add(labelMesh); // Parent label to key

                keyMesh.userData = { initialY: 0.5, isPressed: false, id: `key-${r}-${col}`, baseColor: k.color };

                // Removed scaling logic to keep all keys uniform size

                this.keys.push(keyMesh);
                this.interactables.push(keyMesh); // Raycast checks this
                this.scene.add(keyMesh);
            }
        }
    }

    onPointerMove(event) {
        if (!this.isEnabled) return;
        this.updateMouse(event);
        // Removed baseMesh rotation to fix "position moving" issue

        // Highlight cursor
        this.raycaster.setFromCamera(this.mouse, this.camera);
        // Recursive true to find labels or keys
        const intersects = this.raycaster.intersectObjects(this.interactables, true);
        document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    }

    onPointerDown(event) {
        if (!this.isEnabled) return;
        this.updateMouse(event);
        // console.log(`[PointerDown] ${event.type}`);

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactables, true); // Recursive true

        if (intersects.length > 0) {
            event.stopPropagation();
            event.preventDefault();

            // Find the root key mesh (could be hitting the label)
            let target = intersects[0].object;
            while (target.parent && !this.keys.includes(target)) {
                target = target.parent;
            }

            if (this.keys.includes(target)) {
                this.animateKeyPress(target, true);
                if (this.controls) this.controls.enabled = false;
            }
        }
    }

    onPointerUp(event) {
        if (!this.isEnabled) return;
        if (this.controls) this.controls.enabled = true;
        // Removed manual key release - keys auto-complete their animation
    }

    updateMouse(event) {
        // Handle both MouseEvent and PointerEvent
        const x = event.clientX;
        const y = event.clientY;
        this.mouse.x = (x / window.innerWidth) * 2 - 1;
        this.mouse.y = -(y / window.innerHeight) * 2 + 1;
    }

    updateSearchUI() {
        const fakeInput = document.querySelector('.fake-input');
        if (!fakeInput) return;

        const before = this.searchText.substring(0, this.cursorIndex);
        const after = this.searchText.substring(this.cursorIndex);

        // Reconstruct HTML with cursor span
        fakeInput.innerHTML = `${before}<span class="fake-cursor"></span>${after}`;
    }

    animateKeyPress(key, isDown) {
        // console.log(`[Action] Key ${key.userData.id} ${isDown ? 'PRESSED' : 'RELEASED'}`);

        key.userData.isPressed = isDown;

        // Interactive Cursor & Typing Logic
        if (isDown) {
            // Play Sound
            if (this.clickSound) {
                this.clickSound.currentTime = 0;
                this.clickSound.play().catch(e => console.warn("Audio play failed", e));
            }

            const id = key.userData.id;

            // Numbers: 1, 5, 7
            let charToAdd = null;

            if (id === 'key-0-0') charToAdd = '1';
            else if (id === 'key-1-1') charToAdd = '5';
            else if (id === 'key-2-0') charToAdd = '7';

            if (charToAdd) {
                const before = this.searchText.substring(0, this.cursorIndex);
                const after = this.searchText.substring(this.cursorIndex);
                this.searchText = before + charToAdd + after;
                this.cursorIndex++;
                this.updateSearchUI();
            }

            // Left Arrow
            else if (id === 'key-1-0') {
                if (this.cursorIndex > 0) {
                    this.cursorIndex--;
                    this.updateSearchUI();
                }
            }
            // Right Arrow
            else if (id === 'key-1-2') {
                if (this.cursorIndex < this.searchText.length) {
                    this.cursorIndex++;
                    this.updateSearchUI();
                }
            }
            // STOP Key (formerly ESC)
            else if (id === 'key-0-2') {
                if (this.controls) this.controls.autoRotate = false;
            }
        }

        // Auto-complete animation on click - queues properly for rapid clicks
        const isEnterKey = (key.userData.id === 'key-2-2' || key.userData.isEnter);

        if (isDown) {
            // Step 1: Press down quickly
            gsap.to(key.position, {
                y: key.userData.initialY - 0.4,
                duration: 0.1,
                ease: "power2.in",
                overwrite: false,  // Allow queuing for rapid clicks
                onComplete: () => {
                    // Step 2: Automatically release - balanced speed
                    // EXCEPT for Enter key if it triggers entrance
                    if (!isEnterKey) {
                        gsap.to(key.position, {
                            y: key.userData.initialY,
                            duration: 0.4,  // Balanced speed
                            delay: 0.08,
                            ease: "power2.out",  // Smoother easing
                            overwrite: false  // Allow queuing
                        });
                    }
                }
            });
        }

        const isOrange = key.userData.baseColor === this.config.colors.orange;

        // Single Material with Emissive Update
        if (key.material && key.material.emissive) {
            const pressEmissive = isOrange ? 0.8 : 0.5;
            const baseEmissive = isOrange ? 0.2 : 0.0;

            if (isDown) {
                // Flash on press, then fade out
                gsap.to(key.material, {
                    emissiveIntensity: pressEmissive,
                    duration: 0.1,
                    overwrite: false,  // Allow queuing
                    onComplete: () => {
                        // Keep glowing if it's Enter key
                        if (!isEnterKey) {
                            gsap.to(key.material, {
                                emissiveIntensity: baseEmissive,
                                duration: 0.3,
                                delay: 0.05,
                                overwrite: false  // Allow queuing
                            });
                        }
                    }
                });
            }
        }

        if (isDown && isEnterKey) {
            this.triggerEntrance();
        }
    }

    initOpeningInteraction() {
        window.addEventListener('keydown', (e) => {
            if (!this.isEnabled) return;
            if (e.key === 'Enter') {
                const enterKey = this.keys.find(k => k.userData.id === 'key-2-2');
                if (enterKey) {
                    this.animateKeyPress(enterKey, true);
                    // Removed auto-release to keep key pressed during transition
                }
            }
        });
    }

    triggerEntrance() {
        if (this.isEntering) return;
        this.isEntering = true;
        this.isEnabled = false;

        // Force Enter Key Visual Press (Instant Feedback)
        const enterKey = this.keys.find(k => k.userData.id === 'key-2-2');
        if (enterKey) {
            // Instant press down visual
            gsap.to(enterKey.position, {
                y: enterKey.userData.initialY - 0.4,
                duration: 0.1,
                ease: "power2.in",
                overwrite: true
            });

            // Glow effect
            if (enterKey.material && enterKey.material.emissive) {
                gsap.to(enterKey.material, {
                    emissiveIntensity: 0.8,
                    duration: 0.1,
                    overwrite: true
                });
            }
        }

        // Fix: Reset Global Cursor & Disable Controls
        document.body.style.cursor = 'default';
        if (this.controls) this.controls.enabled = false;

        console.log("ENTRANCE TRIGGERED!");

        const overlay = document.getElementById('opening-screen');
        // Original speed restored
        gsap.to(this.camera.position, {
            z: 0.5, y: 1,
            duration: 1.5,  // Back to original
            ease: "expo.in",  // Back to original
            onComplete: () => {
                gsap.to(overlay, {
                    opacity: 0,
                    duration: 0.5,  // Back to original
                    onComplete: () => {
                        overlay.style.display = 'none';
                        document.body.style.overflow = 'auto';

                        // Trigger Hero Animations NOW (after opening is done)
                        const hero = document.querySelector('.hero');
                        if (hero) hero.classList.add('hero-active');

                        // Optimization: Start the heavy fluid simulation ONLY after opening
                        if (window.fluidHero) {
                            window.fluidHero.play();
                        }
                    }
                });
            }
        });

        const text = document.querySelector('.opening-scene-overlay');
        const indicator = document.querySelector('.slide-indicator');
        if (text) gsap.to(text, { opacity: 0, duration: 0.5 });  // Back to original
        if (indicator) gsap.to(indicator, { opacity: 0, duration: 0.5 });
    }

    // toggleTheme removed 


    createRoundedRectShape(width, height, radius) {
        const shape = new THREE.Shape();
        const x = -width / 2;
        const y = -height / 2;
        shape.moveTo(x, y + radius);
        shape.lineTo(x, y + height - radius);
        shape.quadraticCurveTo(x, y + height, x + radius, y + height);
        shape.lineTo(x + width - radius, y + height);
        shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
        shape.lineTo(x + width, y + radius);
        shape.quadraticCurveTo(x + width, y, x + width - radius, y);
        shape.lineTo(x + radius, y);
        shape.quadraticCurveTo(x, y, x, y + radius);
        return shape;
    }

    onResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        if (this.controls) this.controls.update();

        const time = Date.now() * 0.001;
        if (this.baseMesh) {
            this.baseMesh.position.y = -0.4 + Math.sin(time) * 0.05;
            this.keys.forEach(key => {
                if (!key.userData.isPressed) key.position.y = key.userData.initialY + Math.sin(time) * 0.05;
            });
        }
        this.renderer.render(this.scene, this.camera);
    }
}

// Global Listener to check if ANY click is detected
window.addEventListener('pointerdown', (e) => {
    console.log(`[Global] pointerdown at ${e.clientX},${e.clientY}`);
}, { capture: true });

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (document.getElementById('canvas-3d-container')) {
            new Keypad3D('canvas-3d-container');
        }
    }, 100);
});
