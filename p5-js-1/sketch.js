// DOM Elements
let inputLine1, inputLine2;
let sliderSpeed, sliderRoundness, sliderScale;

// Configuration
let text1 = "They talk";
let text2 = "We Do.";
let baseFontSize = 120;
let timeOffset = 0;

// Colors (Neon Red, Lime Green, Bright Yellow, Soft Lavender)
const gradients = [
    { r: 255, g: 30, b: 80 },  // Neon Red
    { r: 100, g: 255, b: 80 },  // Lime Green
    { r: 255, g: 240, b: 50 },  // Bright Yellow
    { r: 220, g: 180, b: 255 }  // Lavender
];

function setup() {
    createCanvas(windowWidth, windowHeight);

    // Connect DOM elements
    inputLine1 = select('#inputLine1');
    inputLine2 = select('#inputLine2');
    sliderSpeed = select('#sliderSpeed');
    sliderRoundness = select('#sliderRoundness');
    sliderScale = select('#sliderScale');

    // Event Listeners for smooth updates
    inputLine1.input(() => text1 = inputLine1.value());
    inputLine2.input(() => text2 = inputLine2.value());
}

function draw() {
    // Speed control
    let speedVal = map(parseFloat(sliderSpeed.value()), 0, 100, 0, 0.05);
    timeOffset += speedVal;

    // Draw Background
    drawGradientBackground(timeOffset);

    // Scale control
    let scaleVal = parseFloat(sliderScale.value());

    // Text measurements
    let currentFontSize = baseFontSize * scaleVal;

    // Calculate bounds
    textSize(currentFontSize);
    textFont('Inter');
    textStyle(BOLD);
    let w1 = textWidth(text1.toUpperCase());
    let h1 = textAscent() * 0.8; // Approximate cap height
    let bounds1 = { w: w1, h: h1 };

    textFont('Playfair Display');
    textStyle(BOLDITALIC);
    let w2 = textWidth(text2);
    let h2 = textAscent() * 0.8;
    let bounds2 = { w: w2, h: h2 };

    // Total dimensions
    let paddingH = currentFontSize * 0.8;
    let paddingV = currentFontSize * 0.6;
    let spacing = currentFontSize * 0.1; // Space between lines

    let contentWidth = Math.max(bounds1.w, bounds2.w);
    let totalHeight = bounds1.h + bounds2.h + spacing;

    let boxW = contentWidth + paddingH * 2;
    let boxH = totalHeight + paddingV * 2;

    // Draw Blob Container
    push();
    translate(width / 2, height / 2);

    fill(10, 10, 10); // Soft black/grey
    noStroke();
    rectMode(CENTER);

    let roundness = parseFloat(sliderRoundness.value());
    rect(0, 0, boxW, boxH, roundness);

    // Draw Text
    fill(255);
    textAlign(CENTER, CENTER);

    // Line 1: Sans Serif
    textFont('Inter');
    textStyle(BOLD);
    textSize(currentFontSize);
    // Adjust y1 logic since text bounds origin is different from text() with CENTER/CENTER
    // We want to stack them.
    // Let's use simple stacking relative to center.
    let totalContentH = bounds1.h + spacing + bounds2.h;
    let startY = -totalContentH / 2;

    let y1 = startY + bounds1.h / 2;
    text(text1.toUpperCase(), 0, y1);

    // Separator Line
    stroke(255, 100);
    strokeWeight(2 * scaleVal);
    let lineY = startY + bounds1.h + spacing / 2;
    // Draw a subtle line between texts if both exist
    if (text1.length > 0 && text2.length > 0) {
        line(-contentWidth / 2, lineY, contentWidth / 2, lineY);
    }

    // Line 2: Serif
    noStroke();
    textFont('Playfair Display');
    textStyle(BOLDITALIC);
    // Slightly smaller optical size for serif often looks better paired
    textSize(currentFontSize * 0.95);
    let y2 = lineY + spacing / 2 + bounds2.h / 2;
    text(text2, 0, y2);

    pop();
}

function drawGradientBackground(t) {
    // Creating a mesh of colors that drift
    // We'll use large ellipses with high blur to mimic a gradient mesh
    background(240, 240, 250); // Light base

    noStroke();

    // We use blendMode usually for cooler effects, but standard drawing with low opacity loops is fine 
    // or just big blurry circles.

    // Apply blur for the blobs
    drawingContext.filter = 'blur(60px)';

    // Blob 1: Red (Top Left-ish)
    let x1 = map(noise(t), 0, 1, 0, width);
    let y1 = map(noise(t + 100), 0, 1, 0, height);
    fill(gradients[0].r, gradients[0].g, gradients[0].b, 200);
    ellipse(x1, y1, width * 0.8);

    // Blob 2: Lime (Bottom Left-ish)
    let x2 = map(noise(t + 200), 0, 1, 0, width);
    let y2 = map(noise(t + 300), 0, 1, height / 2, height);
    fill(gradients[1].r, gradients[1].g, gradients[1].b, 200);
    ellipse(x2, y2, width * 0.9);

    // Blob 3: Yellow (Top Right-ish)
    let x3 = map(noise(t + 400), 0, 1, width / 2, width);
    let y3 = map(noise(t + 500), 0, 1, 0, height / 2);
    fill(gradients[2].r, gradients[2].g, gradients[2].b, 200);
    ellipse(x3, y3, width * 0.7);

    // Blob 4: Lavender (Bottom Right-ish)
    let x4 = map(noise(t + 600), 0, 1, width / 3, width);
    let y4 = map(noise(t + 700), 0, 1, height / 3, height);
    fill(gradients[3].r, gradients[3].g, gradients[3].b, 200);
    ellipse(x4, y4, width * 1.0);

    // Reset filter
    drawingContext.filter = 'none';
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
