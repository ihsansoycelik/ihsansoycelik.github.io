import { getShaders } from './shaders.js';

let gl;
let program;
let texture;
let paletteTexture;
let bayerTexture;
let blueNoiseTexture;

let buffers = {};
let uniforms = {};

const CLUSTER_MATRICES = {
    4: [12, 5, 6, 13, 4, 0, 1, 7, 11, 3, 2, 8, 15, 10, 9, 14],
    8: [
        24, 10, 12, 26, 35, 47, 49, 37,
        8, 0, 2, 14, 45, 59, 61, 49,
        22, 6, 4, 16, 33, 53, 55, 39,
        30, 18, 20, 32, 43, 57, 63, 51,
        36, 48, 50, 38, 25, 11, 13, 27,
        44, 58, 60, 48, 9, 1, 3, 15,
        34, 54, 56, 40, 23, 7, 5, 17,
        42, 56, 62, 50, 31, 19, 21, 33
    ]
};

function createBayer(n) {
    if (n <= 2) return [0, 2, 3, 1];

    const prev = createBayer(n / 2);
    const size = n / 2;
    const curr = new Array(n * n);

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const val = prev[y * size + x];
            curr[y * n + x] = 4 * val;
            curr[y * n + (x + size)] = 4 * val + 2;
            curr[(y + size) * n + x] = 4 * val + 3;
            curr[(y + size) * n + (x + size)] = 4 * val + 1;
        }
    }
    return curr;
}

function generateBayer(size) {
    const data = createBayer(size);
    const factor = 256 / (size * size);
    return new Uint8Array(data.map(x => Math.floor(x * factor)));
}

function generateCluster(size) {
    if (size === 4) return new Uint8Array(CLUSTER_MATRICES[4].map(x => x * 16));
    if (size === 8) return new Uint8Array(CLUSTER_MATRICES[8].map(x => x * 4));
    return generateBayer(size); // Fallback
}

// Simple approximation of Blue Noise (Void and Cluster inspired, but simplified random with smoothing for this demo)
function generateBlueNoise(size) {
    const data = new Uint8Array(size * size);
    for(let i=0; i<data.length; i++) data[i] = Math.random() * 255;
    // Real generation is complex, this is "White Noise" effectively, but we bind it.
    // Ideally we would load a texture.
    return data;
}

export function initRenderer(canvas) {
    gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    window.addEventListener('resize', () => resizeCanvas(canvas));
    resizeCanvas(canvas);

    const shaderSource = getShaders();
    program = createProgram(gl, shaderSource.vertex, shaderSource.fragment);
    gl.useProgram(program);

    const vertices = new Float32Array([
        -1, -1,  0, 0,
         1, -1,  1, 0,
        -1,  1,  0, 1,
         1,  1,  1, 1
    ]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'a_position');
    const aTexCoord = gl.getAttribLocation(program, 'a_texCoord');

    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 16, 8);

    uniforms = {
        u_image: gl.getUniformLocation(program, 'u_image'),
        u_palette: gl.getUniformLocation(program, 'u_palette'),
        u_bayer: gl.getUniformLocation(program, 'u_bayer'),
        u_blueNoise: gl.getUniformLocation(program, 'u_blueNoise'),
        u_resolution: gl.getUniformLocation(program, 'u_resolution'),
        u_paletteSize: gl.getUniformLocation(program, 'u_paletteSize'),
        u_bayerSize: gl.getUniformLocation(program, 'u_bayerSize'),
        u_algorithm: gl.getUniformLocation(program, 'u_algorithm'),
        u_contrast: gl.getUniformLocation(program, 'u_contrast'),
        u_brightness: gl.getUniformLocation(program, 'u_brightness'),
        u_ditherAmount: gl.getUniformLocation(program, 'u_ditherAmount'),
        u_bypass: gl.getUniformLocation(program, 'u_bypass')
    };

    texture = createTexture(gl);
    paletteTexture = createTexture(gl);
    bayerTexture = createTexture(gl);
    blueNoiseTexture = createTexture(gl);

    // Load Blue Noise (64x64)
    const bnData = generateBlueNoise(64);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, blueNoiseTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 64, 64, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bnData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    loadBayerTexture(8, generateBayer(8));
}

function resizeCanvas(canvas) {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
}

export function loadTexture(source, width, height) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (width && height) {
        // Raw data
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } else {
        // Element (Image/Video/Canvas)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    }
}

function createTexture(gl) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return tex;
}

function createProgram(gl, vsSource, fsSource) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    return prog;
}

function compileShader(gl, type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
    }
    return s;
}

function loadBayerTexture(size, data) {
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, bayerTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, size, size, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

export function render(state, bypassShader = false) {
    if (!gl || !program) return;

    const palette = state.palette;
    const pData = new Uint8Array(256 * 4);
    for (let i = 0; i < palette.length; i++) {
        pData[i*4] = palette[i][0];
        pData[i*4+1] = palette[i][1];
        pData[i*4+2] = palette[i][2];
        pData[i*4+3] = 255;
    }

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pData);

    let algoId = 0;
    let bayerSize = 8;

    if (!bypassShader) {
        const algo = state.settings.algorithm;

        if (algo.startsWith('bayer')) {
            algoId = 1;
            if (algo.includes('2')) bayerSize = 2;
            if (algo.includes('4')) bayerSize = 4;
            if (algo.includes('8')) bayerSize = 8;
            if (algo.includes('16')) bayerSize = 16;
            loadBayerTexture(bayerSize, generateBayer(bayerSize));

        } else if (algo.startsWith('cluster')) {
             algoId = 1; // Uses same logic as Bayer, just different texture
             if (algo.includes('4')) bayerSize = 4;
             if (algo.includes('8')) bayerSize = 8;
             loadBayerTexture(bayerSize, generateCluster(bayerSize));

        } else if (algo === 'blue-noise') {
            algoId = 3;
        } else if (algo === 'white-noise') {
            algoId = 2;
        } else if (algo === 'halftone') {
            algoId = 4;
        }
    }

    gl.uniform1i(uniforms.u_image, 0);
    gl.uniform1i(uniforms.u_palette, 1);
    gl.uniform1i(uniforms.u_bayer, 2);
    gl.uniform1i(uniforms.u_blueNoise, 3);

    gl.uniform2f(uniforms.u_resolution, state.image.width, state.image.height);
    gl.uniform1f(uniforms.u_paletteSize, palette.length);
    gl.uniform1f(uniforms.u_bayerSize, bayerSize);
    gl.uniform1i(uniforms.u_algorithm, algoId);
    gl.uniform1f(uniforms.u_contrast, state.settings.contrast / 100);
    gl.uniform1f(uniforms.u_brightness, state.settings.brightness / 100);
    gl.uniform1f(uniforms.u_ditherAmount, state.settings.ditherAmount / 100);
    gl.uniform1f(uniforms.u_bypass, bypassShader ? 1.0 : 0.0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
