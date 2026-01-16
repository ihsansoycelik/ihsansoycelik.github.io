const vertShader = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
}
`;

const fragShader = `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;

uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;

// CRT Params
uniform float uCurve;
uniform float uScanlineIntensity;
uniform float uGlow;
uniform float uNoise;
uniform float uAberration;
uniform float uVignette;

// Magnet Params
uniform vec2 uMagPos; // 0.0 to 1.0
uniform float uMagStrength;
uniform float uMagRadius;

// Noise function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 2D Noise
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Barrel Distortion
vec2 curve(vec2 uv) {
    vec2 centered = uv * 2.0 - 1.0;

    // Correct for aspect ratio to ensure circular distortion (Precise calculation)
    float aspect = uResolution.x / uResolution.y;

    // Calculate distance from center in "square" pixel space
    vec2 aspectCorrected = centered;
    aspectCorrected.x *= aspect;

    float distSq = dot(aspectCorrected, aspectCorrected);
    float distortion = 1.0 + distSq * uCurve;

    return centered * distortion * 0.5 + 0.5;
}

// Magnetic Interference
vec2 magnet(vec2 uv) {
    vec2 diff = uv - uMagPos;
    float aspect = uResolution.x / uResolution.y;
    vec2 diffCorrected = diff;
    diffCorrected.x *= aspect;
    float dist = length(diffCorrected);
    // Smooth falloff
    float pull = smoothstep(uMagRadius, 0.0, dist);
    // Distort towards/away or swirl?
    // Let's do a simple radial displacement
    vec2 displacement = diff * pull * uMagStrength;

    // Add some noise jitter near the magnet center
    float jitter = (random(uv * uTime) - 0.5) * 0.02 * pull;

    return uv - displacement + vec2(jitter);
}

void main() {
    vec2 uv = vTexCoord;

    // 1. Apply CRT Geometry Curve
    uv = curve(uv);

    // Check boundaries after curve
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // 2. Apply Magnetic Interference
    // We apply this after curve so the magnet moves with the "screen" surface
    // Or before? If the magnet is external, it affects the beam.
    // Let's apply it relative to the curved surface coordinates.
    // Need to adjust uMagPos to match the curved coordinate space visually?
    // For simplicity, we assume magnet is close to the screen surface.
    uv = magnet(uv);

    // 3. Chromatic Aberration
    // We sample the texture at slightly different coordinates for R, G, B
    float aber = uAberration * 0.005; // Scale down
    // Add distance from center factor for cheap lens blur effect
    vec2 d = uv - vec2(0.5);
    float aspect = uResolution.x / uResolution.y;
    d.x *= aspect;
    float distFromCenter = length(d);
    aber *= (1.0 + distFromCenter);

    vec4 col;
    col.r = texture2D(uTexture, uv + vec2(aber, 0.0)).r;
    col.g = texture2D(uTexture, uv).g;
    col.b = texture2D(uTexture, uv - vec2(aber, 0.0)).b;
    col.a = 1.0;

    // 4. Scanlines
    // Based on screen Y coordinate
    float scanline = sin(uv.y * uResolution.y * 0.5 * 3.14159);
    // Soften
    scanline = 0.5 + 0.5 * scanline;
    // Blend with intensity
    col.rgb *= 1.0 - (uScanlineIntensity * (1.0 - scanline));

    // 5. RGB Grid (Phosphor)
    // Horizontal subpixels
    float modX = mod(gl_FragCoord.x, 3.0);
    vec3 mask = vec3(1.0);
    if (modX < 1.0) mask = vec3(1.0, 0.5, 0.5); // R enhanced
    else if (modX < 2.0) mask = vec3(0.5, 1.0, 0.5); // G enhanced
    else mask = vec3(0.5, 0.5, 1.0); // B enhanced

    col.rgb *= mix(vec3(1.0), mask, uScanlineIntensity * 0.5);

    // 6. Glow / Bloom
    // Simple approach: add a blurred version or just brighten based on intensity
    // For a single pass shader, we can't do true bloom. We can just overdrive brightness.
    // Or sample neighbors (expensive).
    // Let's just boost contrast/brightness as a fake glow
    col.rgb = pow(col.rgb, vec3(1.0 / uGlow));
    col.rgb *= uGlow;

    // 7. Noise / Static
    float n = random(uv * uTime) * uNoise;
    col.rgb += n;

    // 8. Vignette
    float vig = 1.0 - distFromCenter * uVignette * 1.5;
    col.rgb *= smoothstep(0.0, 1.0, vig);

    // Flicker
    col.rgb *= (1.0 - 0.05 * sin(uTime * 30.0));

    gl_FragColor = col;
}
`;

// Global Variables
let crtShader;
let contentLayer;
let font;

// State
const defaultParams = {
    text: "SYSTEM MALFUNCTION // SIGNAL LOST // RETRYING...",
    textSpeed: 3,
    textSize: 100,
    textColor: "#00FF41",
    textFont: "Courier New",
    direction: 1, // 1 for right-to-left (speed subtraction)
    magStrength: 0.3,
    magRadius: 0.25,
    magPos: { x: 0.5, y: 0.5 },
    curve: 0.15,
    scanlines: 0.4,
    glow: 1.2,
    noise: 0.15,
    aberration: 1.5,
    vignette: 0.4,
    paused: false
};

let params = JSON.parse(JSON.stringify(defaultParams));

// Internal animation state
let textX = 0;

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('canvas-container');

    // Create offscreen graphics for text content
    contentLayer = createGraphics(width, height);
    contentLayer.textAlign(LEFT, CENTER);
    contentLayer.noStroke();

    // Initialize shader
    crtShader = createShader(vertShader, fragShader);

    setupUI();

    // Initial Magnet Pos
    params.magPos.x = 0.5;
    params.magPos.y = 0.5;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    contentLayer.resizeCanvas(windowWidth, windowHeight);
}

function draw() {
    // 1. Update Content Layer
    contentLayer.clear();
    contentLayer.background(0); // Black background for CRT content
    contentLayer.fill(params.textColor);
    contentLayer.textSize(params.textSize);

    // Calculate Font styling
    contentLayer.textStyle(BOLD);
    contentLayer.textFont(params.textFont); // Retro font default

    // Animate Text
    if (!params.paused) {
        textX -= params.textSpeed * params.direction;
    }

    let textW = contentLayer.textWidth(params.text);

    // Loop logic
    if (params.direction > 0 && textX < -textW) {
        textX = width;
    } else if (params.direction < 0 && textX > width) {
        textX = -textW;
    }

    // Draw text
    // We draw it multiple times to ensure seamless loop if needed,
    // but for simple marquee:
    contentLayer.text(params.text, textX, height / 2);

    // Also draw a grid or some retro UI elements in the background for flair
    drawRetroGrid(contentLayer);

    // 2. Apply Shader
    shader(crtShader);

    crtShader.setUniform('uTexture', contentLayer);
    crtShader.setUniform('uTime', millis() / 1000.0);
    crtShader.setUniform('uResolution', [width, height]);

    // Update Magnet Pos (Mouse interaction overrides manual if dragging?
    // For now, let's make mouse passively control it if not dragging UI)
    // Actually, user asked for draggable interference object.
    // We'll let the mouse control it directly for the demo feel.
    // If mouse is over UI, don't move magnet?
    // We'll handle that logic in UI setup or assume full screen interaction.

    // Update Magnet Pos if dragging on canvas (and not over UI)
    if (mouseIsPressed && !isMouseOverUI()) {
        params.magPos.x = mouseX / width;
        params.magPos.y = 1.0 - (mouseY / height); // Flip Y for WebGL
    }

    crtShader.setUniform('uMagPos', [params.magPos.x, params.magPos.y]);

    crtShader.setUniform('uMagStrength', parseFloat(params.magStrength));
    crtShader.setUniform('uMagRadius', parseFloat(params.magRadius));

    crtShader.setUniform('uCurve', parseFloat(params.curve));
    crtShader.setUniform('uScanlineIntensity', parseFloat(params.scanlines));
    crtShader.setUniform('uGlow', parseFloat(params.glow));
    crtShader.setUniform('uNoise', parseFloat(params.noise));
    crtShader.setUniform('uAberration', parseFloat(params.aberration));
    crtShader.setUniform('uVignette', parseFloat(params.vignette));

    // Render a quad to fill screen with shader
    noStroke();
    rect(-width/2, -height/2, width, height);
}

function drawRetroGrid(pg) {
    pg.stroke(0, 50, 0);
    pg.strokeWeight(1);
    for(let i = 0; i < width; i+=50) {
        pg.line(i, 0, i, height);
    }
    for(let j = 0; j < height; j+=50) {
        pg.line(0, j, width, j);
    }
}


function setupUI() {
    // Select elements
    const inputs = {
        text: document.getElementById('TextInput'),
        speed: document.getElementById('TextSpeed'),
        size: document.getElementById('TextSize'),
        font: document.getElementById('TextFont'),
        color: document.getElementById('TextColor'),
        magStr: document.getElementById('MagStrength'),
        magRad: document.getElementById('MagRadius'),
        curve: document.getElementById('CrtCurve'),
        scan: document.getElementById('CrtScanlines'),
        glow: document.getElementById('CrtGlow'),
        noise: document.getElementById('CrtNoise'),
        aber: document.getElementById('CrtAberration'),
        vig: document.getElementById('CrtVignette'),
    };

    const btns = {
        pause: document.getElementById('BtnPause'),
        full: document.getElementById('BtnFullscreen'),
        reset: document.getElementById('BtnReset'),
        toggle: document.getElementById('togglePanel'),
        dir: document.getElementById('BtnDir')
    };

    // Bind inputs to params
    inputs.text.addEventListener('input', (e) => params.text = e.target.value);
    inputs.speed.addEventListener('input', (e) => params.textSpeed = parseFloat(e.target.value));
    inputs.size.addEventListener('input', (e) => params.textSize = parseFloat(e.target.value));
    inputs.font.addEventListener('change', (e) => params.textFont = e.target.value);
    inputs.color.addEventListener('input', (e) => params.textColor = e.target.value);

    inputs.magStr.addEventListener('input', (e) => params.magStrength = parseFloat(e.target.value));
    inputs.magRad.addEventListener('input', (e) => params.magRadius = parseFloat(e.target.value));

    inputs.curve.addEventListener('input', (e) => params.curve = parseFloat(e.target.value));
    inputs.scan.addEventListener('input', (e) => params.scanlines = parseFloat(e.target.value));
    inputs.glow.addEventListener('input', (e) => params.glow = parseFloat(e.target.value));
    inputs.noise.addEventListener('input', (e) => params.noise = parseFloat(e.target.value));
    inputs.aber.addEventListener('input', (e) => params.aberration = parseFloat(e.target.value));
    inputs.vig.addEventListener('input', (e) => params.vignette = parseFloat(e.target.value));

    // Buttons
    btns.pause.addEventListener('click', () => {
        params.paused = !params.paused;
        btns.pause.textContent = params.paused ? "Play" : "Pause";
    });

    btns.dir.addEventListener('click', () => {
        params.direction *= -1;
        btns.dir.textContent = params.direction === 1 ? "Right to Left" : "Left to Right";
    });

    btns.full.addEventListener('click', () => {
        let fs = fullscreen();
        fullscreen(!fs);
    });

    btns.reset.addEventListener('click', () => {
        // Reset params
        params = JSON.parse(JSON.stringify(defaultParams));

        // Update Inputs
        inputs.text.value = params.text;
        inputs.speed.value = params.textSpeed;
        inputs.size.value = params.textSize;
        inputs.font.value = params.textFont;
        inputs.color.value = params.textColor;

        inputs.magStr.value = params.magStrength;
        inputs.magRad.value = params.magRadius;

        inputs.curve.value = params.curve;
        inputs.scan.value = params.scanlines;
        inputs.glow.value = params.glow;
        inputs.noise.value = params.noise;
        inputs.aber.value = params.aberration;
        inputs.vig.value = params.vignette;

        // Update Buttons / Toggles
        btns.pause.textContent = params.paused ? "Play" : "Pause";
        btns.dir.textContent = params.direction === 1 ? "Right to Left" : "Left to Right";
    });

    // Panel Toggle
    const panel = document.getElementById('controlPanel');
    let isOpen = true;
    btns.toggle.addEventListener('click', () => {
        isOpen = !isOpen;
        if(isOpen) {
            panel.classList.remove('collapsed');
            btns.toggle.textContent = "_";
        } else {
            panel.classList.add('collapsed');
            btns.toggle.textContent = "+";
        }
    });

    // Expand on click if collapsed
    panel.addEventListener('click', (e) => {
        if(!isOpen && e.target !== btns.toggle) {
            isOpen = true;
            panel.classList.remove('collapsed');
            btns.toggle.textContent = "_";
        }
    });
}

function isMouseOverUI() {
    const panel = document.getElementById('controlPanel');
    const rect = panel.getBoundingClientRect();
    // p5.js mouseX/Y are relative to canvas, which covers the window.
    // Client rect is also relative to viewport.
    // So direct comparison works.
    return (mouseX > rect.left && mouseX < rect.right &&
            mouseY > rect.top && mouseY < rect.bottom);
}
