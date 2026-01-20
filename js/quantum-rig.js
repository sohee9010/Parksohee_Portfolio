
// Revised Visual: "Volumetric Energy Orb" 
// Uses Additive Blending for a pure light effect, avoiding flat PBR rendering.

class QuantumRig {
    constructor(containerId) {
        this.container = document.getElementById(containerId);

        if (!this.container) return;

        this.canvas = this.container.querySelector('canvas');
        if (this.canvas) {
            this.canvas.remove();
        }
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);

        this.scene = new THREE.Scene();
        // Fog to blend edges slightly (optional)
        // this.scene.fog = new THREE.FogExp2(0xffffff, 0.05);

        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.initCamera();
        this.initRenderer();
        this.buildRig();

        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        window.addEventListener('resize', () => this.onResize());
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 0, 5);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true, // Transparent background
            antialias: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    buildRig() {
        this.rigGroup = new THREE.Group();

        // 1. Core Energy (Bright Center)
        const coreGeo = new THREE.SphereGeometry(0.8, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x7F52FF, // Primary Purple
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending // Glow effect
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.rigGroup.add(this.core);

        // 2. Inner Glow (Blue Haze)
        const innerGeo = new THREE.SphereGeometry(1.2, 48, 48);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x0071E3, // Blue
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide, // Render inside
            blending: THREE.AdditiveBlending
        });
        this.innerGlow = new THREE.Mesh(innerGeo, innerMat);
        this.rigGroup.add(this.innerGlow);

        // 3. Outer Shell (Soft White Aura)
        const outerGeo = new THREE.SphereGeometry(1.6, 64, 64);
        const outerMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF, // White
            transparent: true,
            opacity: 0.15, // Very subtle
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        this.outerGlow = new THREE.Mesh(outerGeo, outerMat);
        this.rigGroup.add(this.outerGlow);

        // 4. Orbital Rings (Light Streaks)
        // Thin glowing rings rotating
        const ringGeo = new THREE.TorusGeometry(1.5, 0.01, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xFF2D55, // Accent Pink
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.ring1 = new THREE.Mesh(ringGeo, ringMat);
        this.ring1.rotation.x = Math.PI / 3;
        this.rigGroup.add(this.ring1);

        const ringMat2 = new THREE.MeshBasicMaterial({
            color: 0x00C7BE, // Cyan accent
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        this.ring2 = new THREE.Mesh(ringGeo, ringMat2);
        this.ring2.rotation.y = Math.PI / 3;
        this.ring2.scale.set(1.2, 1.2, 1.2);
        this.rigGroup.add(this.ring2);

        // Position: Shift slightly right
        this.rigGroup.position.set(0.5, 0, 0);
        this.rigGroup.scale.set(1.3, 1.3, 1.3);

        this.scene.add(this.rigGroup);
    }

    onResize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(this.animate);

        const time = this.clock.getElapsedTime();

        if (this.rigGroup) {
            // General Float
            this.rigGroup.position.y = Math.sin(time * 0.5) * 0.1;

            // Core Pulse
            const pulse = 1 + Math.sin(time * 2) * 0.05;
            this.core.scale.set(pulse, pulse, pulse);

            // Layer rotations (Create turbulence feel)
            this.innerGlow.rotation.y = time * 0.2;
            this.innerGlow.rotation.z = time * 0.1;

            this.outerGlow.rotation.x = -time * 0.1;
            this.outerGlow.rotation.y = time * 0.05;

            // Ring Rotations
            this.ring1.rotation.x = Math.sin(time * 0.2) + time; // Complex spin
            this.ring1.rotation.y = time * 0.5;

            this.ring2.rotation.x = time * 0.3;
            this.ring2.rotation.z = Math.cos(time * 0.3) + time;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    // Only init if the wrapper exists
    const wrapper = document.querySelector('.sphere-wrapper');
    if (wrapper && typeof THREE !== 'undefined') {
        new QuantumRig('glassSphere');
    }
});
