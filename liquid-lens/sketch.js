
let liquidShader;
let textBuffer;
let myFont;

// UI Elements
let textInput;
let radiusSlider;
let strengthSlider;
let fontsizeSlider;
let bgColorPicker;
let textColorPicker;

function preload() {
    // Load shader from DOM
    // We can't use loadShader with IDs directly easily in p5 usually,
    // but we can read the text content and create it.
    // Or we can create a shader object manually.

    // However, p5's createShader expects vertex and fragment shader sources.
    // Standard p5 vertex shader for WebGL which includes matrices:
    const vert = `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying vec2 vTexCoord;

    void main() {
        vTexCoord = aTexCoord;
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    }
    `;

    // Get fragment shader source from the HTML script tag
    const frag = document.getElementById('liquid-shader').textContent;

    liquidShader = createShader(vert, frag);
}

function setup() {
    // Create canvas and attach to container
    let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
    canvas.parent('canvas-container');

    // Create off-screen graphics buffer
    textBuffer = createGraphics(windowWidth, windowHeight);

    // UI Elements Setup
    textInput = select('#text-input');
    radiusSlider = select('#radius-slider');
    strengthSlider = select('#strength-slider');
    fontsizeSlider = select('#fontsize-slider');
    bgColorPicker = select('#bg-color');
    textColorPicker = select('#text-color');

    // Disable standard depth test and blend mode since we are doing 2D post-processing basically
    noStroke();

    // Initial draw of text buffer
    updateTextBuffer();
}

function draw() {
    // Update text buffer only if needed?
    // For real-time typing, we need to update it.
    // Ideally we check if values changed, but for simplicity we can redraw or check change.
    // The prompt asks for real-time updates.

    updateTextBuffer();

    // Background color from picker
    background(bgColorPicker.value());

    // Set shader
    shader(liquidShader);

    // Pass uniforms
    liquidShader.setUniform('uTexture', textBuffer);
    liquidShader.setUniform('uResolution', [width, height]);

    // Mouse coordinates
    // In WebGL, (0,0) is center. Shader expects UV (0 to 1)?
    // The shader we wrote expects UV (0 to 1) for uMouse.
    // p5 mouseX/Y are 0 to width/height (top-left origin).
    // So we normalize mouseX/Y.
    let mx = mouseX / width;
    let my = mouseY / height;

    liquidShader.setUniform('uMouse', [mx, my]);

    liquidShader.setUniform('uRadius', parseFloat(radiusSlider.value()));
    liquidShader.setUniform('uStrength', parseFloat(strengthSlider.value()));

    // Draw a rectangle covering the screen to display the shader
    // In p5 WebGL, rect(0, 0, w, h) draws at center if rectMode is CENTER (default).
    // But we are using default coordinates.
    // To cover the full screen with the shader, we can use plane(width, height)
    // or rect(-width/2, -height/2, width, height).
    // Let's use plane() which is cleaner for shaders usually.
    // plane(width, height);

    // However, plane() UVs might be different from rect().
    // Let's stick to rect() but ensure it covers the screen.
    rect(-width/2, -height/2, width, height);
}

function updateTextBuffer() {
    // Clear buffer with background color (transparent or white?)
    // The prompt says "Background is pure White... Text is pure Black".
    // But we are drawing text to a buffer to be used as a texture.
    // If we fill buffer with white, the shader will distort the white too.
    // That's fine, as long as the background behind the shader is also white (or the same color).

    let bg = bgColorPicker.value();
    let txt = textColorPicker.value();

    textBuffer.background(bg);
    textBuffer.fill(txt);
    textBuffer.textAlign(CENTER, CENTER);
    textBuffer.textSize(parseInt(fontsizeSlider.value()));
    textBuffer.textStyle(BOLD);

    // Use a sans-serif font
    textBuffer.textFont('Arial'); // Or 'Helvetica', 'Inter' if available

    let content = textInput.value();
    textBuffer.text(content, textBuffer.width / 2, textBuffer.height / 2);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    textBuffer.resizeCanvas(windowWidth, windowHeight);
}
