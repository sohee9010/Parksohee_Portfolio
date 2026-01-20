/**
 * WebGL Fluid Simulation for Hero Section
 * Optimized for performance and visual quality
 */

class FluidEffect {
    constructor(canvas) {
        this.canvas = canvas;
        this.config = {
            dyeResolution: 512,  // Optimization: Reduced from 1024
            simResolution: 64, // Optimization: Reduced from 128
            densityDissipation: 0.97,  // Slightly faster fade for cleaner look
            velocityDissipation: 0.98,  // Smoother movement
            pressure: 0.8,
            pressureIterations: 10, // Optimization: Reduced from 20
            curl: 30,  // Increased for more swirling
            splatRadius: 0.008,
            splatForce: 6000,
            shading: true,
            colorful: false,
            colorPalette: [
                { r: 0.5, g: 0.3, b: 1.0 },
                { r: 0.8, g: 0.7, b: 1.0 },
                { r: 1.0, g: 1.0, b: 1.0 },
            ]
        };

        this.paused = true; // Optimization: Start paused
        this.init();
    }

    play() {
        this.paused = false;
        this.update();
    }

    pause() {
        this.paused = true;
    }

    init() {
        const { gl, ext } = this.getWebGLContext();
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        this.gl = gl;
        this.ext = ext;

        this.initPrograms();
        this.initFramebuffers();
        this.setupEvents();
        this.update();
    }

    getWebGLContext() {
        const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };

        let gl = this.canvas.getContext('webgl2', params);
        const isWebGL2 = !!gl;

        if (!isWebGL2) {
            gl = this.canvas.getContext('webgl', params) || this.canvas.getContext('experimental-webgl', params);
        }

        if (!gl) return { gl: null, ext: null };

        let halfFloat;
        let supportLinearFiltering;

        if (isWebGL2) {
            gl.getExtension('EXT_color_buffer_float');
            supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
        } else {
            halfFloat = gl.getExtension('OES_texture_half_float');
            supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
        }

        gl.clearColor(1.0, 1.0, 1.0, 0.0);

        const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;

        return {
            gl,
            ext: {
                formatRGBA: this.getSupportedFormat(gl, isWebGL2 ? gl.RGBA16F : gl.RGBA, gl.RGBA, halfFloatTexType),
                formatRG: this.getSupportedFormat(gl, isWebGL2 ? gl.RG16F : gl.RGBA, isWebGL2 ? gl.RG : gl.RGBA, halfFloatTexType),
                formatR: this.getSupportedFormat(gl, isWebGL2 ? gl.R16F : gl.RGBA, isWebGL2 ? gl.RED : gl.RGBA, halfFloatTexType),
                halfFloatTexType,
                supportLinearFiltering
            }
        };
    }

    getSupportedFormat(gl, internalFormat, format, type) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        return status === gl.FRAMEBUFFER_COMPLETE ? { internalFormat, format } : null;
    }

    initPrograms() {
        const gl = this.gl;

        // Base vertex shader
        const baseVertexShader = this.compileShader(gl.VERTEX_SHADER, `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;
      
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `);

        // Display shader
        const displayShader = this.compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTexture;
      
      void main() {
        vec3 C = texture2D(uTexture, vUv).rgb;
        float a = max(C.r, max(C.g, C.b));
        gl_FragColor = vec4(C, a);
      }
    `);

        // Splat shader
        const splatShader = this.compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;
      
      void main() {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `);

        // Advection shader
        const advectionShader = this.compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform float dt;
      uniform float dissipation;
      
      void main() {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
      }
    `);

        // Divergence shader
        const divergenceShader = this.compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      
      void main() {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `);

        // Curl shader
        const curlShader = this.compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      
      void main() {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `);

        // Vorticity shader
        const vorticityShader = this.compileShader(gl.FRAGMENT_SHADER, `
      precision highp float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;
      
      void main() {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
      }
    `);

        // Pressure shader
        const pressureShader = this.compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;
      
      void main() {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `);

        // Gradient subtract shader
        const gradientSubtractShader = this.compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec2 vUv; 
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;
      
      void main() {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `);

        this.programs = {
            display: this.createProgram(baseVertexShader, displayShader),
            splat: this.createProgram(baseVertexShader, splatShader),
            advection: this.createProgram(baseVertexShader, advectionShader),
            divergence: this.createProgram(baseVertexShader, divergenceShader),
            curl: this.createProgram(baseVertexShader, curlShader),
            vorticity: this.createProgram(baseVertexShader, vorticityShader),
            pressure: this.createProgram(baseVertexShader, pressureShader),
            gradientSubtract: this.createProgram(baseVertexShader, gradientSubtractShader)
        };

        // Setup quad
        const gl2 = this.gl;
        gl2.bindBuffer(gl2.ARRAY_BUFFER, gl2.createBuffer());
        gl2.bufferData(gl2.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl2.STATIC_DRAW);
        gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, gl2.createBuffer());
        gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl2.STATIC_DRAW);
        gl2.vertexAttribPointer(0, 2, gl2.FLOAT, false, 0, 0);
        gl2.enableVertexAttribArray(0);
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            return null;
        }

        const uniforms = {};
        const uniformCount = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            const uniformName = this.gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = this.gl.getUniformLocation(program, uniformName);
        }

        return { program, uniforms };
    }

    initFramebuffers() {
        const simRes = this.getResolution(this.config.simResolution);
        const dyeRes = this.getResolution(this.config.dyeResolution);

        const texType = this.ext.halfFloatTexType;
        const rgba = this.ext.formatRGBA;
        const rg = this.ext.formatRG;
        const r = this.ext.formatR;
        const filtering = this.ext.supportLinearFiltering ? this.gl.LINEAR : this.gl.NEAREST;

        this.dye = this.createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        this.velocity = this.createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        this.divergence = this.createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.gl.NEAREST);
        this.curl = this.createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.gl.NEAREST);
        this.pressure = this.createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, this.gl.NEAREST);
    }

    getResolution(resolution) {
        const aspectRatio = this.gl.drawingBufferWidth / this.gl.drawingBufferHeight;

        if (aspectRatio < 1) {
            return { width: Math.round(resolution), height: Math.round(resolution / aspectRatio) };
        } else {
            return { width: Math.round(resolution * aspectRatio), height: Math.round(resolution) };
        }
    }

    createFBO(w, h, internalFormat, format, type, param) {
        const gl = this.gl;
        gl.activeTexture(gl.TEXTURE0);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT);

        return {
            texture,
            fbo,
            width: w,
            height: h,
            texelSizeX: 1.0 / w,
            texelSizeY: 1.0 / h,
            attach(id) {
                gl.activeTexture(gl.TEXTURE0 + id);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                return id;
            }
        };
    }

    createDoubleFBO(w, h, internalFormat, format, type, param) {
        let fbo1 = this.createFBO(w, h, internalFormat, format, type, param);
        let fbo2 = this.createFBO(w, h, internalFormat, format, type, param);

        return {
            width: w,
            height: h,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
            get read() { return fbo1; },
            set read(value) { fbo1 = value; },
            get write() { return fbo2; },
            set write(value) { fbo2 = value; },
            swap() {
                const temp = fbo1;
                fbo1 = fbo2;
                fbo2 = temp;
            }
        };
    }

    setupEvents() {
        this.pointers = [];
        this.splatStack = [];

        this.canvas.addEventListener('mousedown', (e) => {
            const pointer = {
                id: -1,
                texcoordX: e.offsetX / this.canvas.clientWidth,
                texcoordY: 1.0 - e.offsetY / this.canvas.clientHeight,
                deltaX: 0,
                deltaY: 0,
                down: true,
                moved: false,
                color: this.config.colorPalette[Math.floor(Math.random() * this.config.colorPalette.length)]
            };
            this.pointers.push(pointer);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const pointer = this.pointers.findIndex(p => p.id === -1);
            if (pointer === -1) return;

            const px = e.offsetX / this.canvas.clientWidth;
            const py = 1.0 - e.offsetY / this.canvas.clientHeight;

            this.pointers[pointer].deltaX = (px - this.pointers[pointer].texcoordX) * 10;
            this.pointers[pointer].deltaY = (py - this.pointers[pointer].texcoordY) * 10;
            this.pointers[pointer].texcoordX = px;
            this.pointers[pointer].texcoordY = py;
            this.pointers[pointer].moved = Math.abs(this.pointers[pointer].deltaX) > 0 || Math.abs(this.pointers[pointer].deltaY) > 0;
        });

        window.addEventListener('mouseup', () => {
            this.pointers = [];
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touches = e.targetTouches;
            for (let i = 0; i < touches.length; i++) {
                const pointer = {
                    id: touches[i].identifier,
                    texcoordX: touches[i].pageX / this.canvas.clientWidth,
                    texcoordY: 1.0 - touches[i].pageY / this.canvas.clientHeight,
                    deltaX: 0,
                    deltaY: 0,
                    down: true,
                    moved: false,
                    color: this.config.colorPalette[Math.floor(Math.random() * this.config.colorPalette.length)]
                };
                this.pointers.push(pointer);
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touches = e.targetTouches;
            for (let i = 0; i < touches.length; i++) {
                const pointer = this.pointers.find(p => p.id === touches[i].identifier);
                if (!pointer) continue;

                const px = touches[i].pageX / this.canvas.clientWidth;
                const py = 1.0 - touches[i].pageY / this.canvas.clientHeight;

                pointer.deltaX = (px - pointer.texcoordX) * 10;
                pointer.deltaY = (py - pointer.texcoordY) * 10;
                pointer.texcoordX = px;
                pointer.texcoordY = py;
                pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            const touches = e.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const idx = this.pointers.findIndex(p => p.id === touches[i].identifier);
                if (idx >= 0) this.pointers.splice(idx, 1);
            }
        });

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    resizeCanvas() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.initFramebuffers();
        }
    }

    update() {
        if (this.paused) return; // Stop loop if paused
        this.resizeCanvas();
        this.input();
        this.step(0.016);
        this.render();
        requestAnimationFrame(() => this.update());
    }

    input() {
        this.pointers.forEach(p => {
            if (p.moved) {
                this.splat(p.texcoordX, p.texcoordY, p.deltaX, p.deltaY, p.color);
                p.moved = false;
            }
        });
    }

    step(dt) {
        const gl = this.gl;

        gl.disable(gl.BLEND);

        // Curl
        this.gl.useProgram(this.programs.curl.program);
        gl.uniform2f(this.programs.curl.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        gl.uniform1i(this.programs.curl.uniforms.uVelocity, this.velocity.read.attach(0));
        this.blit(this.curl.fbo);

        // Vorticity
        gl.useProgram(this.programs.vorticity.program);
        gl.uniform2f(this.programs.vorticity.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        gl.uniform1i(this.programs.vorticity.uniforms.uVelocity, this.velocity.read.attach(0));
        gl.uniform1i(this.programs.vorticity.uniforms.uCurl, this.curl.attach(1));
        gl.uniform1f(this.programs.vorticity.uniforms.curl, this.config.curl);
        gl.uniform1f(this.programs.vorticity.uniforms.dt, dt);
        this.blit(this.velocity.write.fbo);
        this.velocity.swap();

        // Divergence
        gl.useProgram(this.programs.divergence.program);
        gl.uniform2f(this.programs.divergence.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        gl.uniform1i(this.programs.divergence.uniforms.uVelocity, this.velocity.read.attach(0));
        this.blit(this.divergence.fbo);

        // Pressure
        gl.useProgram(this.programs.pressure.program);
        gl.uniform2f(this.programs.pressure.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        gl.uniform1i(this.programs.pressure.uniforms.uDivergence, this.divergence.attach(0));

        for (let i = 0; i < this.config.pressureIterations; i++) {
            gl.uniform1i(this.programs.pressure.uniforms.uPressure, this.pressure.read.attach(1));
            this.blit(this.pressure.write.fbo);
            this.pressure.swap();
        }

        // Gradient subtract
        gl.useProgram(this.programs.gradientSubtract.program);
        gl.uniform2f(this.programs.gradientSubtract.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        gl.uniform1i(this.programs.gradientSubtract.uniforms.uPressure, this.pressure.read.attach(0));
        gl.uniform1i(this.programs.gradientSubtract.uniforms.uVelocity, this.velocity.read.attach(1));
        this.blit(this.velocity.write.fbo);
        this.velocity.swap();

        // Advection
        gl.useProgram(this.programs.advection.program);
        gl.uniform2f(this.programs.advection.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
        gl.uniform1i(this.programs.advection.uniforms.uVelocity, this.velocity.read.attach(0));
        gl.uniform1i(this.programs.advection.uniforms.uSource, this.velocity.read.attach(0));
        gl.uniform1f(this.programs.advection.uniforms.dt, dt);
        gl.uniform1f(this.programs.advection.uniforms.dissipation, this.config.velocityDissipation);
        this.blit(this.velocity.write.fbo);
        this.velocity.swap();

        gl.uniform1i(this.programs.advection.uniforms.uVelocity, this.velocity.read.attach(0));
        gl.uniform1i(this.programs.advection.uniforms.uSource, this.dye.read.attach(1));
        gl.uniform1f(this.programs.advection.uniforms.dissipation, this.config.densityDissipation);
        this.blit(this.dye.write.fbo);
        this.dye.swap();
    }

    render() {
        const gl = this.gl;

        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);

        gl.useProgram(this.programs.display.program);
        gl.uniform1i(this.programs.display.uniforms.uTexture, this.dye.read.attach(0));

        this.blit(null);
    }

    splat(x, y, dx, dy, color) {
        const gl = this.gl;

        gl.useProgram(this.programs.splat.program);
        gl.uniform1i(this.programs.splat.uniforms.uTarget, this.velocity.read.attach(0));
        gl.uniform1f(this.programs.splat.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
        gl.uniform2f(this.programs.splat.uniforms.point, x, y);
        gl.uniform3f(this.programs.splat.uniforms.color, dx, dy, 0.0);
        gl.uniform1f(this.programs.splat.uniforms.radius, this.config.splatRadius);
        this.blit(this.velocity.write.fbo);
        this.velocity.swap();

        gl.uniform1i(this.programs.splat.uniforms.uTarget, this.dye.read.attach(0));
        gl.uniform3f(this.programs.splat.uniforms.color, color.r, color.g, color.b);
        this.blit(this.dye.write.fbo);
        this.dye.swap();
    }

    blit(destination) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
}

// Auto-initialize
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fluid-hero-canvas');
    if (canvas) {
        // Expose globally for control
        window.fluidHero = new FluidEffect(canvas);
    }

    // Slide Indicator Interaction
    const slideIndicator = document.querySelector('.slide-indicator');
    const openingOverlay = document.querySelector('#opening-screen'); // Assuming openingOverlay is defined elsewhere or needs to be defined here
    if (slideIndicator && openingOverlay) {
        slideIndicator.addEventListener('click', () => {
            // ... existing slide logic ...
        });

        // --- NEW: UI/UX Mouse Interaction ---
        const openingContainer = document.querySelector('#opening-screen');
        const glassText = document.querySelector('.glass-text');

        if (openingContainer && glassText) {
            openingContainer.addEventListener('mousemove', (e) => {
                const rect = openingContainer.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width; // 0 to 1
                const y = (e.clientY - rect.top) / rect.height; // 0 to 1

                glassText.style.setProperty('--mouse-x', x);
                glassText.style.setProperty('--mouse-y', y);
            });
        }
    }
});
