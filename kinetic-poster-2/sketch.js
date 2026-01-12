let inputLine1, inputLine2, inputLine3;
let selectTextAlign;
let sliderJitterSpeed, sliderJitterAmount, sliderTextSize;
let checkboxJitter;
let sliderTitleX, sliderTitleY;
let overlayInputs = [];

// Canvas Size Controls
let inputCanvasW, inputCanvasH, btnApplySize;

// Color Pickers
let colorBg, colorFace, colorShadow;
let colorOverlayText, colorOverlayLines;
let colorBadgeBg, colorBadgeText;

// Gradient Map Controls
let checkboxGradient;
let colorGradientStart, colorGradientEnd;

// Grain Controls
let checkboxGrain, sliderGrainAmount, checkboxGrainAnimated, sliderGrainFrequency, selectGrainBlend, selectGrainType;

// Export Controls
let btnExportPng, btnExportGif, btnExportVideo;
let capturer = null;
let isRecording = false;
let canvasRef;

// Offscreen Buffers
let pg;       // Main content buffer
let pgNoise;  // Noise texture buffer

function setup() {
  canvasRef = createCanvas(600, 800);
  canvasRef.parent('canvas-container');
  
  // Setup UI Collapsible Logic
  setupUI();

  // Create offscreen graphics buffer
  initBuffers(600, 800);
  
  // Select HTML elements
  inputLine1 = select('#text-line-1');
  inputLine2 = select('#text-line-2');
  inputLine3 = select('#text-line-3');
  selectTextAlign = select('#text-align');
  
  checkboxJitter = select('#jitter-enabled');
  sliderJitterSpeed = select('#jitter-speed');
  sliderJitterAmount = select('#jitter-amount');
  sliderTextSize = select('#text-size');
  
  sliderTitleX = select('#title-x');
  sliderTitleY = select('#title-y');

  // Canvas Size Inputs
  inputCanvasW = select('#canvas-width');
  inputCanvasH = select('#canvas-height');
  btnApplySize = select('#apply-size');
  
  if (btnApplySize) {
      btnApplySize.mousePressed(() => {
          let w = parseInt(inputCanvasW.value());
          let h = parseInt(inputCanvasH.value());
          if (w > 0 && h > 0) {
              resizeCanvas(w, h);
              initBuffers(w, h);
          }
      });
  }

  // Select Overlay inputs
  for (let i = 1; i <= 4; i++) {
    overlayInputs.push({
      l: select(`#overlay-${i}-l`),
      r: select(`#overlay-${i}-r`)
    });
  }
  
  // Colors
  colorBg = select('#col-bg');
  colorFace = select('#col-face');
  colorShadow = select('#col-shadow');
  colorOverlayText = select('#col-overlay-text');
  colorOverlayLines = select('#col-overlay-lines');
  colorBadgeBg = select('#col-badge-bg');
  colorBadgeText = select('#col-badge-text');

  // Gradient Map
  checkboxGradient = select('#gradient-enabled');
  colorGradientStart = select('#gradient-start');
  colorGradientEnd = select('#gradient-end');

  // Grain
  checkboxGrain = select('#grain-enabled');
  sliderGrainAmount = select('#grain-amount');
  checkboxGrainAnimated = select('#grain-animated');
  sliderGrainFrequency = select('#grain-frequency');
  selectGrainBlend = select('#grain-blend');
  selectGrainType = select('#grain-type');

  // Export Buttons
  btnExportPng = select('#btn-export-png');
  btnExportGif = select('#btn-export-gif');
  btnExportVideo = select('#btn-export-video');

  if (btnExportPng) {
    btnExportPng.mousePressed(() => {
      saveCanvas(canvasRef, 'kinetic-poster', 'png');
    });
  }

  if (btnExportGif) {
    btnExportGif.mousePressed(() => {
      if (isRecording) {
        stopRecording();
        btnExportGif.html('Start GIF Rec');
        if(btnExportVideo) btnExportVideo.removeAttribute('disabled');
      } else {
        startRecording('gif');
        btnExportGif.html('Stop GIF Rec');
        if(btnExportVideo) btnExportVideo.attribute('disabled', '');
      }
    });
  }

  if (btnExportVideo) {
    btnExportVideo.mousePressed(() => {
      if (isRecording) {
        stopRecording();
        btnExportVideo.html('Start Video Rec');
        if(btnExportGif) btnExportGif.removeAttribute('disabled');
      } else {
        startRecording('webm');
        btnExportVideo.html('Stop Video Rec');
        if(btnExportGif) btnExportGif.attribute('disabled', '');
      }
    });
  }
  
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
}

function startRecording(format) {
  capturer = new CCapture({
    format: format,
    framerate: 30,
    workersPath: 'lib/',
    name: 'kinetic-poster'
  });
  capturer.start();
  isRecording = true;
}

function stopRecording() {
  if (capturer) {
    capturer.stop();
    capturer.save();
    capturer = null;
  }
  isRecording = false;
}

function initBuffers(w, h) {
    pg = createGraphics(w, h);
    pg.textAlign(CENTER, CENTER);
    pg.rectMode(CENTER);
    
    // Initial noise buffer (size will be dynamic based on freq, but init here)
    pgNoise = createGraphics(w, h);
    pgNoise.noSmooth(); // Important for chunky pixels
}

function setupUI() {
  // Logic to handle collapsible sections based on toggle state
  const jitterToggle = document.getElementById('jitter-enabled');
  const jitterContent = document.getElementById('jitter-controls');
  
  const gradientToggle = document.getElementById('gradient-enabled');
  const gradientContent = document.getElementById('gradient-controls');
  
  const grainToggle = document.getElementById('grain-enabled');
  const grainContent = document.getElementById('grain-controls');
  
  function updateVisibility() {
    if (jitterToggle.checked) jitterContent.classList.remove('hidden');
    else jitterContent.classList.add('hidden');
    
    if (gradientToggle.checked) gradientContent.classList.remove('hidden');
    else gradientContent.classList.add('hidden');

    if (grainToggle.checked) grainContent.classList.remove('hidden');
    else grainContent.classList.add('hidden');
  }
  
  // Listeners
  jitterToggle.addEventListener('change', updateVisibility);
  gradientToggle.addEventListener('change', updateVisibility);
  grainToggle.addEventListener('change', updateVisibility);
  
  // Init
  updateVisibility();
}

function draw() {
  // 1. Draw to Offscreen Buffer
  pg.background(colorBg.value());
  
  drawMainText(pg);
  drawOverlay(pg);
  
  // 2. Render to Main Canvas
  blendMode(BLEND);
  background(colorBg.value());
  
  if (checkboxGradient.checked()) {
    applyGradientMap();
  } else {
    image(pg, 0, 0);
  }
  
  // 3. Apply Grain
  if (checkboxGrain.checked()) {
    applyGrain();
  }

  // 4. Capture Frame
  if (isRecording && capturer) {
    capturer.capture(canvasRef.elt);
  }
}

function drawMainText(target) {
  let txtSize = sliderTextSize.value();
  target.textSize(txtSize);
  target.textFont('Anton');
  
  let lines = [inputLine1.value(), inputLine2.value(), inputLine3.value()];
  let centerX = sliderTitleX.value();
  let centerY = sliderTitleY.value();

  // Alignment Logic
  let alignMode = selectTextAlign.value(); 
  if (alignMode === 'LEFT') target.textAlign(LEFT, CENTER);
  else if (alignMode === 'RIGHT') target.textAlign(RIGHT, CENTER);
  else target.textAlign(CENTER, CENTER);

  let startY = centerY - txtSize * 1.0; 
  let lineHeight = txtSize * 0.9;
  
  let speed = sliderJitterSpeed.value();
  let amount = sliderJitterAmount.value();
  let isJitter = checkboxJitter.checked();
  
  for (let i = 0; i < lines.length; i++) {
    let yBase = startY + i * lineHeight;
    let txt = lines[i];
    
    // Shadow Layer
    target.fill(colorShadow.value());
    target.push();
    let nX_shadow = 0, nY_shadow = 0, nR_shadow = 0;
    
    if (isJitter) {
      nX_shadow = noise(frameCount * speed + i * 10 + 100) * amount - amount/2;
      nY_shadow = noise(frameCount * speed + i * 10 + 200) * amount - amount/2;
      nR_shadow = noise(frameCount * speed + i * 10 + 300) * 0.1 - 0.05;
    }
    
    target.translate(centerX + 10 + nX_shadow, yBase + 10 + nY_shadow);
    target.rotate(nR_shadow);
    target.text(txt, 0, 0);
    target.pop();
    
    // Face Layer
    target.fill(colorFace.value());
    target.push();
    let nX = 0, nY = 0, nR = 0;
    
    if (isJitter) {
      nX = noise(frameCount * speed + i * 10) * amount - amount/2;
      nY = noise(frameCount * speed + i * 10 + 50) * amount - amount/2;
      nR = noise(frameCount * speed + i * 10 + 60) * 0.1 - 0.05;
    }
    
    target.translate(centerX + nX, yBase + nY);
    target.rotate(nR);
    target.text(txt, 0, 0);
    target.pop();
  }
}

function drawOverlay(target) {
  target.textFont('Space Mono');
  target.textSize(14);
  
  let yPositions = [50, target.height * 0.25, target.height * 0.75, target.height - 50];
  let isJitter = checkboxJitter.checked();
  
  for (let i = 0; i < overlayInputs.length; i++) {
    let p = {
      left: overlayInputs[i].l.value(),
      right: overlayInputs[i].r.value(),
      y: yPositions[i]
    };

    // Jitter
    let ox = 0, oy = 0;
    if (isJitter) {
      ox = noise(frameCount * 0.01 + p.y) * 4 - 2;
      oy = noise(frameCount * 0.01 + p.y + 100) * 4 - 2;
    }
    
    let ly = p.y + oy;
    let margin = 40;

    // Left Alignment Point
    let leftX = margin + ox;
    
    // Right Alignment Point
    let rightX = target.width - margin + ox;
    
    // Text
    target.fill(colorOverlayText.value());
    target.noStroke();
    
    target.textAlign(LEFT, CENTER);
    target.text(p.left, leftX, ly);
    
    target.textAlign(RIGHT, CENTER);
    target.text(p.right, rightX, ly);
    
    // Dotted line
    target.stroke(colorOverlayLines.value());
    target.drawingContext.setLineDash([2, 5]);
    target.strokeWeight(1);
    
    let leftW = target.textWidth(p.left);
    let rightW = target.textWidth(p.right);
    
    // Draw line from end of left text to start of right text
    let lineStart = leftX + leftW + 10;
    let lineEnd = rightX - rightW - 10;
    
    if (lineStart < lineEnd) {
      target.line(lineStart, ly, lineEnd, ly);
    }
    target.drawingContext.setLineDash([]); 
    target.noStroke();
  }
  
  drawBadge(target);
}

function drawBadge(target) {
  let badgeX = 100;
  let badgeY = 150;
  let isJitter = checkboxJitter.checked();
  
  target.push();
  target.translate(badgeX, badgeY);
  target.rotate(-0.2);
  
  let bx = 0, by = 0;
  if (isJitter) {
    bx = noise(frameCount * 0.05) * 10 - 5;
    by = noise(frameCount * 0.05 + 50) * 10 - 5;
  }
  target.translate(bx, by);
  
  target.fill(colorBadgeBg.value());
  target.noStroke();
  target.ellipse(0, 0, 100, 60);
  
  target.fill(colorBadgeText.value());
  target.textSize(16);
  target.textAlign(CENTER, CENTER);
  target.text("Fresquito", 0, 0);
  target.pop();
}

function applyGradientMap() {
  pg.loadPixels();
  
  let cStart = color(colorGradientStart.value());
  let cEnd = color(colorGradientEnd.value());
  
  let r1 = red(cStart), g1 = green(cStart), b1 = blue(cStart);
  let r2 = red(cEnd), g2 = green(cEnd), b2 = blue(cEnd);
  
  // Use a temporary graphic or draw directly to canvas pixels
  // Because blendMode(BLEND) is on, we can draw the result as an image or just manipulate pixels on main canvas
  loadPixels();
  
  let d = pixelDensity();
  let fullLen = 4 * (width * d) * (height * d);
  
  // Warning: This is slow for large canvases.
  // Ideally this would be a shader, but for p5.js vanilla, pixel manipulation is the way.
  
  for (let i = 0; i < fullLen; i += 4) {
    let r = pg.pixels[i];
    let g = pg.pixels[i+1];
    let b = pg.pixels[i+2];
    
    let lum = (r + g + b) / 3 / 255; 
    
    pixels[i] = r1 + (r2 - r1) * lum;
    pixels[i+1] = g1 + (g2 - g1) * lum;
    pixels[i+2] = b1 + (b2 - b1) * lum;
    pixels[i+3] = 255;
  }
  
  updatePixels();
}

function applyGrain() {
  let amount = sliderGrainAmount.value();
  let freq = sliderGrainFrequency.value();
  let animated = checkboxGrainAnimated.checked();
  let mode = selectGrainBlend.value();
  let type = selectGrainType.value(); // MONO, COLOR, SCANLINES
  
  // Map Blend Mode string to p5 constant
  let bm = BLEND;
  if (mode === 'OVERLAY') bm = OVERLAY;
  else if (mode === 'MULTIPLY') bm = MULTIPLY;
  else if (mode === 'SCREEN') bm = SCREEN;
  else if (mode === 'DIFFERENCE') bm = DIFFERENCE;
  else if (mode === 'ADD') bm = ADD;
  
  // Resize Noise Buffer if needed (Coarse grain = smaller buffer stretched up)
  let noiseW = Math.floor(width / freq);
  let noiseH = Math.floor(height / freq);
  
  let needsUpdate = false;
  if (pgNoise.width !== noiseW || pgNoise.height !== noiseH) {
      pgNoise = createGraphics(noiseW, noiseH);
      pgNoise.noSmooth();
      needsUpdate = true;
  }
  
  // Optimization: Only update noise pixels if animated OR first frame OR buffer resized
  if (animated || frameCount === 1 || needsUpdate) {
      pgNoise.loadPixels();
      let d = pgNoise.pixelDensity();
      let len = 4 * (pgNoise.width * d) * (pgNoise.height * d);
      
      if (type === 'SCANLINES') {
        // Horizontal lines pattern
        let lineSpacing = 2; // Every 2nd pixel row
        for (let y = 0; y < pgNoise.height * d; y++) {
             // For scanlines, we can just check y % spacing
             let isLine = (y % lineSpacing) === 0;
             // We can also animate the phase
             if (animated) {
                 let phase = frameCount % lineSpacing;
                 isLine = ((y + phase) % lineSpacing) === 0;
             }
             
             for (let x = 0; x < pgNoise.width * d; x++) {
                 let idx = 4 * (y * pgNoise.width * d + x);
                 // If it's a line, draw dark or light depending on desired effect
                 // Usually scanlines darken. Let's make them black with alpha.
                 if (isLine) {
                     pgNoise.pixels[idx] = 0;
                     pgNoise.pixels[idx+1] = 0;
                     pgNoise.pixels[idx+2] = 0;
                     pgNoise.pixels[idx+3] = amount; 
                 } else {
                     pgNoise.pixels[idx+3] = 0; // Transparent
                 }
             }
        }
      } else {
          // MONO or COLOR
          for (let i = 0; i < len; i += 4) {
              if (type === 'COLOR') {
                  pgNoise.pixels[i] = random(255);   // R
                  pgNoise.pixels[i+1] = random(255); // G
                  pgNoise.pixels[i+2] = random(255); // B
              } else {
                  // MONO
                  let val = random(255);
                  pgNoise.pixels[i] = val;
                  pgNoise.pixels[i+1] = val;
                  pgNoise.pixels[i+2] = val;
              }
              pgNoise.pixels[i+3] = amount; // Alpha controls intensity
          }
      }
      pgNoise.updatePixels();
  }
  
  blendMode(bm);
  image(pgNoise, 0, 0, width, height);
  blendMode(BLEND); // Reset
}
