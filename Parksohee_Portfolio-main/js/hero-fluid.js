/**
 * WebGL Fluid Simulation for Hero Section
 * Based on PavelDoGreat's WebGL Fluid Simulation
 * Customized with Purple + White + Transparent theme for the main hero section
 */

'use strict';

const heroCanvas = document.getElementById('hero-fluid-canvas');
if (heroCanvas) {
    const { gl: heroGl, ext: heroExt } = getWebGLContext(heroCanvas);

    if (!heroExt.supportLinearFiltering) {
        console.warn('Linear filtering not supported for hero fluid');
    }

    function getWebGLContext(canvas) {
        const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
        let gl = canvas.getContext('webgl2', params);
        const isWebGL2 = !!gl;
        if (!isWebGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

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
        let formatRGBA;
        let formatRG;
        let formatR;

        if (isWebGL2) {
            formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
        } else {
            formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
            formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        }

        return {
            gl,
            ext: {
                formatRGBA,
                formatRG,
                formatR,
                halfFloatTexType,
                supportLinearFiltering
            }
        };
    }

    function getSupportedFormat(gl, internalFormat, format, type) {
        if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
            switch (internalFormat) {
                case gl.R16F:
                    return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
                case gl.RG16F:
                    return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
                default:
                    return null;
            }
        }
        return { internalFormat, format };
    }

    function supportRenderTextureFormat(gl, internalFormat, format, type) {
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

        let fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        return status == gl.FRAMEBUFFER_COMPLETE;
    }

    // Configuration (Purple Aurora theme - MORE VISIBLE for hero background)
    const heroConfig = {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1024,  // Increased for better visual quality
        DENSITY_DISSIPATION: 0.97,  // Slightly faster fade for cleaner look
        VELOCITY_DISSIPATION: 0.98,  // Smoother movement
        PRESSURE: 0.8,
        PRESSURE_ITERATIONS: 20,
        CURL: 30,  // Increased for more swirling
        SPLAT_RADIUS: 0.4,  // MUCH LARGER for visible ink spreading
        SPLAT_FORCE: 6000,  // STRONGER for dramatic effect
        SHADING: true,
        COLORFUL: false,
        PAUSED: false,
        TRANSPARENT: true,
        BLOOM: false,  // Disabled for performance
    };

    // Purple + White aurora color palette
    const purpleAuroraColors = [
        { r: 0.50, g: 0.20, b: 0.85 },  // Vibrant Purple
        { r: 0.65, g: 0.35, b: 0.95 },  // Lavender
        { r: 0.75, g: 0.55, b: 1.00 },  // Light Violet
        { r: 0.90, g: 0.80, b: 1.00 },  // Pale Lavender
        { r: 1.00, g: 1.00, b: 1.00 },  // White
    ];

    function getRandomPurpleColor() {
        return purpleAuroraColors[Math.floor(Math.random() * purpleAuroraColors.length)];
    }

    class Program {
        constructor(vertexShader, fragmentShader) {
            this.uniforms = {};
            this.program = createProgram(vertexShader, fragmentShader);
            this.uniforms = getUniforms(this.program);
        }

        bind() {
            heroGl.useProgram(this.program);
        }
    }

    function createProgram(vertexShader, fragmentShader) {
        let program = heroGl.createProgram();
        heroGl.attachShader(program, vertexShader);
        heroGl.attachShader(program, fragmentShader);
        heroGl.linkProgram(program);

        if (!heroGl.getProgramParameter(program, heroGl.LINK_STATUS)) {
            console.error('Failed to link program: ' + heroGl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    function getUniforms(program) {
        let uniforms = [];
        let uniformCount = heroGl.getProgramParameter(program, heroGl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let uniformName = heroGl.getActiveUniform(program, i).name;
            uniforms[uniformName] = heroGl.getUniformLocation(program, uniformName);
        }
        return uniforms;
    }

    function compileShader(type, source) {
        const shader = heroGl.createShader(type);
        heroGl.shaderSource(shader, source);
        heroGl.compileShader(shader);

        if (!heroGl.getShaderParameter(shader, heroGl.COMPILE_STATUS)) {
            console.error('Shader compilation failed: ' + heroGl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    const baseVertexShader = compileShader(heroGl.VERTEX_SHADER, `
        precision highp float;

        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;

        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `);

    const displayShader = compileShader(heroGl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;

        varying vec2 vUv;
        uniform sampler2D uTexture;

        void main () {
            vec3 C = texture2D(uTexture, vUv).rgb;
            float a = max(C.r, max(C.g, C.b)); // Full alpha for better visibility
            gl_FragColor = vec4(C, a);
        }
    `);

    const splatShader = compileShader(heroGl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;

        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;

        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
    `);

    const advectionShader = compileShader(heroGl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;

        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform float dt;
        uniform float dissipation;

        void main () {
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            gl_FragColor = dissipation * texture2D(uSource, coord);
            gl_FragColor.a = 1.0;
        }
    `);

    const divergenceShader = compileShader(heroGl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uVelocity, vL).x;
            float R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y;
            float B = texture2D(uVelocity, vB).y;

            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) { L = -C.x; }
            if (vR.x > 1.0) { R = -C.x; }
            if (vT.y > 1.0) { T = -C.y; }
            if (vB.y < 0.0) { B = -C.y; }

            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
    `);

    const curlShader = compileShader(heroGl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
    `);

    const vorticityShader = compileShader(heroGl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;

        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;

        void main () {
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

    const pressureShader = compileShader(heroGl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;

        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            float C = texture2D(uPressure, vUv).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
    `);

    const gradientSubtractShader = compileShader(heroGl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;

        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `);

    const clearShader = compileShader(heroGl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;

        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;

        void main () {
            gl_FragColor = value * texture2D(uTexture, vUv);
        }
    `);

    const blit = (() => {
        heroGl.bindBuffer(heroGl.ARRAY_BUFFER, heroGl.createBuffer());
        heroGl.bufferData(heroGl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), heroGl.STATIC_DRAW);
        heroGl.bindBuffer(heroGl.ELEMENT_ARRAY_BUFFER, heroGl.createBuffer());
        heroGl.bufferData(heroGl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), heroGl.STATIC_DRAW);
        heroGl.vertexAttribPointer(0, 2, heroGl.FLOAT, false, 0, 0);
        heroGl.enableVertexAttribArray(0);

        return (destination) => {
            heroGl.bindFramebuffer(heroGl.FRAMEBUFFER, destination);
            heroGl.drawElements(heroGl.TRIANGLES, 6, heroGl.UNSIGNED_SHORT, 0);
        };
    })();

    let heroDye;
    let heroVelocity;
    let heroDivergence;
    let heroCurl;
    let heroPressure;

    const displayProgram = new Program(baseVertexShader, displayShader);
    const splatProgram = new Program(baseVertexShader, splatShader);
    const advectionProgram = new Program(baseVertexShader, advectionShader);
    const divergenceProgram = new Program(baseVertexShader, divergenceShader);
    const curlProgram = new Program(baseVertexShader, curlShader);
    const vorticityProgram = new Program(baseVertexShader, vorticityShader);
    const pressureProgram = new Program(baseVertexShader, pressureShader);
    const gradientSubtractProgram = new Program(baseVertexShader, gradientSubtractShader);
    const clearProgram = new Program(baseVertexShader, clearShader);

    function initFramebuffers() {
        let simRes = getResolution(heroConfig.SIM_RESOLUTION);
        let dyeRes = getResolution(heroConfig.DYE_RESOLUTION);

        const texType = heroExt.halfFloatTexType;
        const rgba = heroExt.formatRGBA;
        const rg = heroExt.formatRG;
        const r = heroExt.formatR;
        const filtering = heroExt.supportLinearFiltering ? heroGl.LINEAR : heroGl.NEAREST;

        if (heroDye == null)
            heroDye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
        else
            heroDye = resizeDoubleFBO(heroDye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);

        if (heroVelocity == null)
            heroVelocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
        else
            heroVelocity = resizeDoubleFBO(heroVelocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);

        heroDivergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, heroGl.NEAREST);
        heroCurl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, heroGl.NEAREST);
        heroPressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, heroGl.NEAREST);
    }

    function createFBO(w, h, internalFormat, format, type, param) {
        heroGl.activeTexture(heroGl.TEXTURE0);
        let texture = heroGl.createTexture();
        heroGl.bindTexture(heroGl.TEXTURE_2D, texture);
        heroGl.texParameteri(heroGl.TEXTURE_2D, heroGl.TEXTURE_MIN_FILTER, param);
        heroGl.texParameteri(heroGl.TEXTURE_2D, heroGl.TEXTURE_MAG_FILTER, param);
        heroGl.texParameteri(heroGl.TEXTURE_2D, heroGl.TEXTURE_WRAP_S, heroGl.CLAMP_TO_EDGE);
        heroGl.texParameteri(heroGl.TEXTURE_2D, heroGl.TEXTURE_WRAP_T, heroGl.CLAMP_TO_EDGE);
        heroGl.texImage2D(heroGl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

        let fbo = heroGl.createFramebuffer();
        heroGl.bindFramebuffer(heroGl.FRAMEBUFFER, fbo);
        heroGl.framebufferTexture2D(heroGl.FRAMEBUFFER, heroGl.COLOR_ATTACHMENT0, heroGl.TEXTURE_2D, texture, 0);
        heroGl.viewport(0, 0, w, h);
        heroGl.clear(heroGl.COLOR_BUFFER_BIT);

        let texelSizeX = 1.0 / w;
        let texelSizeY = 1.0 / h;

        return {
            texture,
            fbo,
            width: w,
            height: h,
            texelSizeX,
            texelSizeY,
            attach(id) {
                heroGl.activeTexture(heroGl.TEXTURE0 + id);
                heroGl.bindTexture(heroGl.TEXTURE_2D, texture);
                return id;
            }
        };
    }

    function createDoubleFBO(w, h, internalFormat, format, type, param) {
        let fbo1 = createFBO(w, h, internalFormat, format, type, param);
        let fbo2 = createFBO(w, h, internalFormat, format, type, param);

        return {
            width: w,
            height: h,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
            get read() {
                return fbo1;
            },
            set read(value) {
                fbo1 = value;
            },
            get write() {
                return fbo2;
            },
            set write(value) {
                fbo2 = value;
            },
            swap() {
                let temp = fbo1;
                fbo1 = fbo2;
                fbo2 = temp;
            }
        };
    }

    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
        if (target.width == w && target.height == h) return target;
        target.read = createFBO(w, h, internalFormat, format, type, param);
        target.write = createFBO(w, h, internalFormat, format, type, param);
        target.width = w;
        target.height = h;
        target.texelSizeX = 1.0 / w;
        target.texelSizeY = 1.0 / h;
        return target;
    }

    function getResolution(resolution) {
        let aspectRatio = heroGl.drawingBufferWidth / heroGl.drawingBufferHeight;
        if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

        let min = Math.round(resolution);
        let max = Math.round(resolution * aspectRatio);

        if (heroGl.drawingBufferWidth > heroGl.drawingBufferHeight)
            return { width: max, height: min };
        else
            return { width: min, height: max };
    }

    initFramebuffers();

    let lastUpdateTime = Date.now();
    let heroPointers = [];
    let heroSplatStack = [];

    class Pointer {
        constructor() {
            this.id = -1;
            this.texcoordX = 0;
            this.texcoordY = 0;
            this.prevTexcoordX = 0;
            this.prevTexcoordY = 0;
            this.deltaX = 0;
            this.deltaY = 0;
            this.down = false;
            this.moved = false;
            this.color = getRandomPurpleColor();
        }
    }

    heroPointers.push(new Pointer());

    function updatePointerDownData(pointer, id, posX, posY) {
        pointer.id = id;
        pointer.down = true;
        pointer.moved = false;
        pointer.texcoordX = posX / heroCanvas.width;
        pointer.texcoordY = 1.0 - posY / heroCanvas.height;
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.deltaX = 0;
        pointer.deltaY = 0;
        pointer.color = getRandomPurpleColor();
    }

    function updatePointerMoveData(pointer, posX, posY) {
        pointer.prevTexcoordX = pointer.texcoordX;
        pointer.prevTexcoordY = pointer.texcoordY;
        pointer.texcoordX = posX / heroCanvas.width;
        pointer.texcoordY = 1.0 - posY / heroCanvas.height;
        pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
        pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    }

    function correctDeltaX(delta) {
        let aspectRatio = heroCanvas.width / heroCanvas.height;
        if (aspectRatio < 1) delta *= aspectRatio;
        return delta;
    }

    function correctDeltaY(delta) {
        let aspectRatio = heroCanvas.width / heroCanvas.height;
        if (aspectRatio > 1) delta /= aspectRatio;
        return delta;
    }

    heroCanvas.addEventListener('mousemove', e => {
        let pointer = heroPointers[0];
        const rect = heroCanvas.getBoundingClientRect();
        let posX = e.clientX - rect.left;
        let posY = e.clientY - rect.top;
        updatePointerMoveData(pointer, posX, posY);
    });

    heroCanvas.addEventListener('touchmove', e => {
        e.preventDefault();
        const touches = e.targetTouches;
        const rect = heroCanvas.getBoundingClientRect();
        for (let i = 0; i < touches.length; i++) {
            let pointer = heroPointers[i];
            if (!pointer) {
                pointer = new Pointer();
                heroPointers.push(pointer);
            }
            let posX = touches[i].clientX - rect.left;
            let posY = touches[i].clientY - rect.top;
            updatePointerMoveData(pointer, posX, posY);
        }
    }, { passive: false });

    update();

    function update() {
        const dt = calcDeltaTime();
        if (resizeCanvas()) initFramebuffers();
        applyInputs();
        if (!heroConfig.PAUSED) step(dt);
        render(null);
        requestAnimationFrame(update);
    }

    function calcDeltaTime() {
        let now = Date.now();
        let dt = (now - lastUpdateTime) / 1000;
        dt = Math.min(dt, 0.016666);
        lastUpdateTime = now;
        return dt;
    }

    function resizeCanvas() {
        let width = scaleByPixelRatio(heroCanvas.clientWidth);
        let height = scaleByPixelRatio(heroCanvas.clientHeight);
        if (heroCanvas.width != width || heroCanvas.height != height) {
            heroCanvas.width = width;
            heroCanvas.height = height;
            return true;
        }
        return false;
    }

    function scaleByPixelRatio(input) {
        let pixelRatio = window.devicePixelRatio || 1;
        return Math.floor(input * pixelRatio);
    }

    function applyInputs() {
        if (heroSplatStack.length > 0) multipleSplats(heroSplatStack.pop());

        heroPointers.forEach(p => {
            if (p.moved) {
                p.moved = false;
                splatPointer(p);
            }
        });
    }

    function step(dt) {
        heroGl.disable(heroGl.BLEND);

        curlProgram.bind();
        heroGl.uniform2f(curlProgram.uniforms.texelSize, heroVelocity.texelSizeX, heroVelocity.texelSizeY);
        heroGl.uniform1i(curlProgram.uniforms.uVelocity, heroVelocity.read.attach(0));
        blit(heroCurl.fbo);

        vorticityProgram.bind();
        heroGl.uniform2f(vorticityProgram.uniforms.texelSize, heroVelocity.texelSizeX, heroVelocity.texelSizeY);
        heroGl.uniform1i(vorticityProgram.uniforms.uVelocity, heroVelocity.read.attach(0));
        heroGl.uniform1i(vorticityProgram.uniforms.uCurl, heroCurl.attach(1));
        heroGl.uniform1f(vorticityProgram.uniforms.curl, heroConfig.CURL);
        heroGl.uniform1f(vorticityProgram.uniforms.dt, dt);
        blit(heroVelocity.write.fbo);
        heroVelocity.swap();

        divergenceProgram.bind();
        heroGl.uniform2f(divergenceProgram.uniforms.texelSize, heroVelocity.texelSizeX, heroVelocity.texelSizeY);
        heroGl.uniform1i(divergenceProgram.uniforms.uVelocity, heroVelocity.read.attach(0));
        blit(heroDivergence.fbo);

        clearProgram.bind();
        heroGl.uniform1i(clearProgram.uniforms.uTexture, heroPressure.read.attach(0));
        heroGl.uniform1f(clearProgram.uniforms.value, heroConfig.PRESSURE);
        blit(heroPressure.write.fbo);
        heroPressure.swap();

        pressureProgram.bind();
        heroGl.uniform2f(pressureProgram.uniforms.texelSize, heroVelocity.texelSizeX, heroVelocity.texelSizeY);
        heroGl.uniform1i(pressureProgram.uniforms.uDivergence, heroDivergence.attach(0));
        for (let i = 0; i < heroConfig.PRESSURE_ITERATIONS; i++) {
            heroGl.uniform1i(pressureProgram.uniforms.uPressure, heroPressure.read.attach(1));
            blit(heroPressure.write.fbo);
            heroPressure.swap();
        }

        gradientSubtractProgram.bind();
        heroGl.uniform2f(gradientSubtractProgram.uniforms.texelSize, heroVelocity.texelSizeX, heroVelocity.texelSizeY);
        heroGl.uniform1i(gradientSubtractProgram.uniforms.uPressure, heroPressure.read.attach(0));
        heroGl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, heroVelocity.read.attach(1));
        blit(heroVelocity.write.fbo);
        heroVelocity.swap();

        advectionProgram.bind();
        heroGl.uniform2f(advectionProgram.uniforms.texelSize, heroVelocity.texelSizeX, heroVelocity.texelSizeY);
        let velocityId = heroVelocity.read.attach(0);
        heroGl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
        heroGl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
        heroGl.uniform1f(advectionProgram.uniforms.dt, dt);
        heroGl.uniform1f(advectionProgram.uniforms.dissipation, heroConfig.VELOCITY_DISSIPATION);
        blit(heroVelocity.write.fbo);
        heroVelocity.swap();

        heroGl.uniform1i(advectionProgram.uniforms.uVelocity, heroVelocity.read.attach(0));
        heroGl.uniform1i(advectionProgram.uniforms.uSource, heroDye.read.attach(1));
        heroGl.uniform1f(advectionProgram.uniforms.dissipation, heroConfig.DENSITY_DISSIPATION);
        blit(heroDye.write.fbo);
        heroDye.swap();
    }

    function render(target) {
        heroGl.blendFunc(heroGl.ONE, heroGl.ONE_MINUS_SRC_ALPHA);
        heroGl.enable(heroGl.BLEND);

        displayProgram.bind();
        heroGl.uniform1i(displayProgram.uniforms.uTexture, heroDye.read.attach(0));
        blit(target);
    }

    function splatPointer(pointer) {
        let dx = pointer.deltaX * heroConfig.SPLAT_FORCE;
        let dy = pointer.deltaY * heroConfig.SPLAT_FORCE;
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }

    function multipleSplats(amount) {
        for (let i = 0; i < amount; i++) {
            const color = getRandomPurpleColor();
            const x = Math.random();
            const y = Math.random();
            const dx = 1000 * (Math.random() - 0.5);
            const dy = 1000 * (Math.random() - 0.5);
            splat(x, y, dx, dy, color);
        }
    }

    function splat(x, y, dx, dy, color) {
        splatProgram.bind();
        heroGl.uniform1i(splatProgram.uniforms.uTarget, heroVelocity.read.attach(0));
        heroGl.uniform1f(splatProgram.uniforms.aspectRatio, heroCanvas.width / heroCanvas.height);
        heroGl.uniform2f(splatProgram.uniforms.point, x, y);
        heroGl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
        heroGl.uniform1f(splatProgram.uniforms.radius, correctRadius(heroConfig.SPLAT_RADIUS / 100.0));
        blit(heroVelocity.write.fbo);
        heroVelocity.swap();

        heroGl.uniform1i(splatProgram.uniforms.uTarget, heroDye.read.attach(0));
        heroGl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
        blit(heroDye.write.fbo);
        heroDye.swap();
    }

    function correctRadius(radius) {
        let aspectRatio = heroCanvas.width / heroCanvas.height;
        if (aspectRatio > 1) radius *= aspectRatio;
        return radius;
    }
}
