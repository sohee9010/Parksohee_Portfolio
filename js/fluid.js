/**
 * Hyper-Realistic 3D Glass Morphism Background
 * Simulates the look of high-end 3D abstract render
 * using canvas gradients and blur interactions.
 */

class GlassMorphismBg {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        if (!this.ctx) {
            console.error('Canvas 2D context not supported');
            return;
        }

        // Configuration for "Hyper-Realistic Glass" look
        this.config = {
            shapeCount: 3, // Fewer, larger shapes for clean look
            colorPalette: [
                { r: 127, g: 82, b: 255 },  // Purple
                { r: 59, g: 130, b: 246 },  // Blue
                { r: 255, g: 255, b: 255 }, // White/Light
            ],
            speed: 0.0005, // Extremely slow, elegant movement
            blurLevel: 120, // High blur for soft gradients
        };

        this.shapes = [];
        this.width = 0;
        this.height = 0;
        this.time = 0;

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.createShapes();
        this.animate();

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const parent = this.canvas.parentElement;
        const rect = parent.getBoundingClientRect();
        // Optimization: Cap DPR at 1 to prevent huge canvases on high-res screens
        const dpr = Math.min(window.devicePixelRatio || 1, 1);

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';

        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;
    }

    createShapes() {
        // Determine base size based on screen
        const minDim = Math.min(this.width, this.height);

        // specific carefully placed orbs for the 'composed' look
        this.shapes = [
            // Top Right - Purple focus
            {
                x: this.width * 0.8,
                y: this.height * 0.2,
                radius: minDim * 0.6,
                color: this.config.colorPalette[0],
                vx: Math.random() * 0.2 - 0.1,
                vy: Math.random() * 0.2 - 0.1,
                alpha: 0.4
            },
            // Bottom Left - Blue focus
            {
                x: this.width * 0.2,
                y: this.height * 0.9,
                radius: minDim * 0.7,
                color: this.config.colorPalette[1],
                vx: Math.random() * 0.2 - 0.1,
                vy: Math.random() * 0.2 - 0.1,
                alpha: 0.3
            },
            // Center/Top - White/Light highlight for glass reflection feel
            {
                x: this.width * 0.5,
                y: this.height * 0.4,
                radius: minDim * 0.4,
                color: this.config.colorPalette[2],
                vx: Math.random() * 0.1 - 0.05,
                vy: Math.random() * 0.1 - 0.05,
                alpha: 0.6
            }
        ];
    }

    update() {
        this.time += this.config.speed;

        this.shapes.forEach(shape => {
            // Very slow floating
            shape.x += Math.sin(this.time + shape.vx) * 0.5;
            shape.y += Math.cos(this.time + shape.vy) * 0.5;
        });
    }

    draw() {
        // Clear with white background
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // OPTIMIZED: Use Radial Gradients instead of heavy filter blur
        // this.ctx.filter = `blur(${this.config.blurLevel}px)`; Remove heavy blur

        this.shapes.forEach(shape => {
            this.ctx.beginPath();

            // Create Radial Gradient for soft "blob" look
            const gradient = this.ctx.createRadialGradient(
                shape.x, shape.y, 0,
                shape.x, shape.y, shape.radius
            );

            // Interpolate color with alpha
            const c = shape.color;
            gradient.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${shape.alpha})`);
            gradient.addColorStop(0.5, `rgba(${c.r}, ${c.g}, ${c.b}, ${shape.alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.rect(shape.x - shape.radius, shape.y - shape.radius, shape.radius * 2, shape.radius * 2);
            // this.ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2); // Rect is slightly faster for gradients usually, but arc is fine too. Let's use fillRect for the gradient area.
            this.ctx.fill();
        });

        // this.ctx.filter = 'none';
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Auto-initialize
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fluid-canvas');
    if (canvas) {
        new GlassMorphismBg(canvas);
    }
});
