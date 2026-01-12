
// UI Variables
let colBg, colFace;
let valTextSize, valDepth, valOffsetX, valOffsetY;
let valSpeed, valRange;
let colHighlightStart, colHighlightEnd, colBaseStart, colBaseEnd;
let checkboxGrain, valGrain;

const textData = [
  { word: "More", highlightIndices: [0, 3] }, // M, e
  { word: "is", highlightIndices: [1] },    // s
  { word: "More", highlightIndices: [3] }   // e
];

function setup() {
  const canvas = createCanvas(800, 800);
  canvas.parent('canvas-container');
  frameRate(60);

  // UI Selection
  colBg = select('#col-bg');
  colFace = select('#col-face');
  valTextSize = select('#val-text-size');

  valDepth = select('#val-depth');
  valOffsetX = select('#val-offset-x');
  valOffsetY = select('#val-offset-y');
  valSpeed = select('#val-speed');
  valRange = select('#val-range');

  colHighlightStart = select('#col-highlight-start');
  colHighlightEnd = select('#col-highlight-end');
  colBaseStart = select('#col-base-start');
  colBaseEnd = select('#col-base-end');

  checkboxGrain = select('#grain-enabled');
  valGrain = select('#val-grain');

  textFont('Arial Black'); // Fallback to standard bold font
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(colBg.value());

  let textSizeVal = valTextSize.value();
  textSize(textSizeVal);

  let depth = valDepth.value();
  let baseOffX = valOffsetX.value();
  let baseOffY = valOffsetY.value();
  let speed = valSpeed.value();
  let range = valRange.value();

  let startY = 220;
  let gapY = 180; // Vertical spacing

  // Loop through lines
  for (let l = 0; l < textData.length; l++) {
    let wordObj = textData[l];
    let word = wordObj.word;
    let yPos = startY + l * gapY;

    // Calculate total width to center the word
    // We need to draw character by character for the effect
    let totalWidth = textWidth(word);
    let startX = width / 2 - totalWidth / 2;
    let currentX = startX;

    for (let c = 0; c < word.length; c++) {
      let char = word.charAt(c);
      let charW = textWidth(char);
      let cx = currentX + charW / 2; // Center of the character

      let isHighlight = wordObj.highlightIndices.includes(c);

      // Draw Trail (Back to Front)
      // i goes from depth -> 1
      for (let i = depth; i > 0; i--) {
        // Calculate motion offset
        // Subtle motion: sine wave based on time + layer index
        let time = frameCount * speed;

        // "Little little movement" -> small range
        // Phase shift per layer creates the "tube" feel
        // Phase shift per character (l*10 + c) makes them distinct
        let phase = i * 0.06 + (l * 2 + c) * 0.5;

        // Scale range by layer index so deep layers swing more, face stays still
        let currentRange = map(i, 0, depth, 0, range);

        let offX = map(cos(time + phase), -1, 1, -currentRange, currentRange);
        let offY = map(sin(time + phase), -1, 1, -currentRange, currentRange);

        // Add manual static offset
        // We scale the manual offset by layer index so the face stays at 0,0 relative
        let manualX = map(i, 0, depth, 0, baseOffX);
        let manualY = map(i, 0, depth, 0, baseOffY);

        // Color Interpolation (Gradient)
        let amt = map(i, 0, depth, 1, 0); // 1 at back (darker/end), 0 at front (lighter/start)

        let cStart = isHighlight ? color(colHighlightStart.value()) : color(colBaseStart.value());
        let cEnd = isHighlight ? color(colHighlightEnd.value()) : color(colBaseEnd.value());

        let col = lerpColor(cStart, cEnd, amt); // actually, let's lerp from Start (front-ish) to End (back)
        // Wait, if i=depth (back), amt=1. if i=0 (front), amt=0.
        // Usually shadows get darker further back. So Start=FrontColor, End=BackColor.
        // Let's invert: i=depth is the 'deep' part.
        // Let's use map(i, 0, depth, 0, 1). 0 is closer to face, 1 is deep.
        amt = map(i, 0, depth, 0, 1);
        col = lerpColor(cStart, cEnd, amt);

        fill(col);
        noStroke();
        text(char, cx + offX + manualX, yPos + offY + manualY);
      }

      // Draw Face (Top Layer)
      // The face stays relatively static (or very little movement)
      // The user said "main text should be seen on the front with little movement"
      // So layer 0 is effectively static at (cx, yPos) unless we want tiny jitter
      fill(colFace.value());
      text(char, cx, yPos);

      currentX += charW;
    }
  }

  // Grain Overlay
  if (checkboxGrain.checked()) {
      drawGrain();
  }
}

function drawGrain() {
    loadPixels();
    let d = pixelDensity();
    let count = 4 * (width * d) * (height * d);
    let amount = valGrain.value();

    for (let i = 0; i < count; i += 4) {
        let noiseVal = random(-amount, amount);
        pixels[i] = constrain(pixels[i] + noiseVal, 0, 255);
        pixels[i+1] = constrain(pixels[i+1] + noiseVal, 0, 255);
        pixels[i+2] = constrain(pixels[i+2] + noiseVal, 0, 255);
        // alpha stays same
    }
    updatePixels();
}
