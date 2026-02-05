// Global variables
let inputLine1, inputLine2, inputLine3;
let selectTextAlign;
let sliderJitterSpeed, sliderJitterAmount, sliderTextSize;
let checkboxJitter;
let sliderTitleX, sliderTitleY;
let overlayInputs = [];

// Color Pickers
let colorBg, colorFace, colorShadow;
let colorOverlayText, colorOverlayLines;
let colorBadgeBg, colorBadgeText;

// Gradient & Grain
let checkboxGradient, colorGradientStart, colorGradientEnd;
let checkboxGrain, sliderGrainAmount, checkboxGrainAnimated, sliderGrainFrequency, selectGrainBlend, selectGrainType;

// Buffers
let pg, pgNoise;

function setup() {
  // 1. Create Canvas
  let c = createCanvas(windowWidth, windowHeight);
  // Ensure the parent exists
  let parent = document.getElementById('canvas-container');
  if (parent) {
    c.parent(parent);
  }

  // 2. Initialize Buffers
  initBuffers(windowWidth, windowHeight);

  // 3. Bind UI Elements
  // We use p5's select() but verify results to avoid crashes
  
  // Text Inputs
  inputLine1 = selectElement('#text-line-1');
  inputLine2 = selectElement('#text-line-2');
  inputLine3 = selectElement('#text-line-3');
  selectTextAlign = selectElement('#text-align');
  
  // Jitter / Transforms
  checkboxJitter = selectElement('#jitter-enabled');
  sliderJitterSpeed = selectElement('#jitter-speed');
  sliderJitterAmount = selectElement('#jitter-amount');
  sliderTextSize = selectElement('#text-size');
  sliderTitleX = selectElement('#title-x');
  sliderTitleY = selectElement('#title-y');

  // Initial centering if inputs exist
  if(sliderTitleX) sliderTitleX.value(width/2);
  if(sliderTitleY) sliderTitleY.value(height/2);

  // Overlay Inputs
  for (let i = 1; i <= 4; i++) {
    overlayInputs.push({
      l: selectElement(`#overlay-${i}-l`),
      r: selectElement(`#overlay-${i}-r`)
    });
  }

  // Colors
  colorBg = selectElement('#col-bg');
  colorFace = selectElement('#col-face');
  colorShadow = selectElement('#col-shadow');
  colorOverlayText = selectElement('#col-overlay-text');
  colorOverlayLines = selectElement('#col-overlay-lines');
  colorBadgeBg = selectElement('#col-badge-bg');
  colorBadgeText = selectElement('#col-badge-text');

  // Sync Body BG
  if(colorBg) {
    document.body.style.backgroundColor = colorBg.value();
    colorBg.input(() => document.body.style.backgroundColor = colorBg.value());
  }

  // Gradient & Grain
  checkboxGradient = selectElement('#gradient-enabled');
  colorGradientStart = selectElement('#gradient-start');
  colorGradientEnd = selectElement('#gradient-end');

  checkboxGrain = selectElement('#grain-enabled');
  sliderGrainAmount = selectElement('#grain-amount');
  checkboxGrainAnimated = selectElement('#grain-animated');
  sliderGrainFrequency = selectElement('#grain-frequency');
  selectGrainBlend = selectElement('#grain-blend');
  selectGrainType = selectElement('#grain-type');

  // Setup UI toggles
  setupUI();

  // Settings
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
}

// Helper to safely select an element
function selectElement(selector) {
  let el = select(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    // Return a dummy object to prevent .value() crashes
    return { 
      value: () => {
        if (selector.includes('col') || selector.includes('color')) {
          return '#000000';
        }
        return 0;
      },
      checked: () => false, 
      input: () => {}, 
      changed: () => {},
      mouseClicked: () => {} 
    };
  }
  return el;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initBuffers(windowWidth, windowHeight);
}

function initBuffers(w, h) {
  pg = createGraphics(w, h);
  pg.textAlign(CENTER, CENTER);
  pg.rectMode(CENTER);
  
  pgNoise = createGraphics(w, h);
  pgNoise.noSmooth();
}

function setupUI() {
  // Use vanilla JS for event listeners on Toggles for consistency
  const toggleBtn = document.getElementById('sidebar-toggle');
  const controls = document.getElementById('controls');
  
  if(toggleBtn && controls) {
    toggleBtn.addEventListener('click', () => {
      controls.classList.toggle('hidden');
    });
  }
  
  // Section Toggles
  const bindToggle = (toggleId, contentId) => {
    const t = document.getElementById(toggleId);
    const c = document.getElementById(contentId);
    if(t && c) {
      const update = () => {
        if(t.checked) c.classList.remove('hidden');
        else c.classList.add('hidden');
      };
      t.addEventListener('change', update);
      update(); // Init state
    }
  };

  bindToggle('jitter-enabled', 'jitter-controls');
  bindToggle('gradient-enabled', 'gradient-controls');
  bindToggle('grain-enabled', 'grain-controls');
}

function draw() {
  // Defensive check: if pg failed to init
  if(!pg) return;

  let bgVal = colorBg ? colorBg.value() : '#111';
  pg.background(bgVal);

  drawMainText(pg);
  drawOverlay(pg);

  // Render to main
  blendMode(BLEND);
  background(bgVal);

  if (checkboxGradient && checkboxGradient.checked()) {
    applyGradientMap();
  } else {
    image(pg, 0, 0);
  }

  if (checkboxGrain && checkboxGrain.checked()) {
    applyGrain();
  }
}

function drawMainText(target) {
  let txtSize = sliderTextSize.value();
  target.textSize(txtSize);
  target.textFont('Anton'); // Assuming font loaded via Google Fonts
  
  let lines = [inputLine1.value(), inputLine2.value(), inputLine3.value()];
  let centerX = sliderTitleX.value();
  let centerY = sliderTitleY.value();

  let alignMode = selectTextAlign.value(); 
  if (alignMode === 'LEFT') target.textAlign(LEFT, CENTER);
  else if (alignMode === 'RIGHT') target.textAlign(RIGHT, CENTER);
  else target.textAlign(CENTER, CENTER);

  let lineHeight = txtSize * 0.9;
  let startY = centerY - (lineHeight * (lines.length - 1)) / 2;
  
  let speed = sliderJitterSpeed.value();
  let amount = sliderJitterAmount.value();
  let isJitter = checkboxJitter.checked();
  
  for (let i = 0; i < lines.length; i++) {
    let yBase = startY + i * lineHeight;
    let txt = lines[i];
    
    // Shadow
    target.fill(colorShadow.value());
    target.push();
    let nX_s = 0, nY_s = 0, nR_s = 0;
    if (isJitter) {
      nX_s = noise(frameCount * speed + i*10 + 100) * amount - amount/2;
      nY_s = noise(frameCount * speed + i*10 + 200) * amount - amount/2;
      nR_s = noise(frameCount * speed + i*10 + 300) * 0.1 - 0.05;
    }
    target.translate(centerX + 10 + nX_s, yBase + 10 + nY_s);
    target.rotate(nR_s);
    target.text(txt, 0, 0);
    target.pop();
    
    // Face
    target.fill(colorFace.value());
    target.push();
    let nX = 0, nY = 0, nR = 0;
    if (isJitter) {
      nX = noise(frameCount * speed + i*10) * amount - amount/2;
      nY = noise(frameCount * speed + i*10 + 50) * amount - amount/2;
      nR = noise(frameCount * speed + i*10 + 60) * 0.1 - 0.05;
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
      y: yPositions[i] || 0
    };

    let ox = 0, oy = 0;
    if (isJitter) {
      ox = noise(frameCount * 0.01 + p.y) * 4 - 2;
      oy = noise(frameCount * 0.01 + p.y + 100) * 4 - 2;
    }
    
    let ly = p.y + oy;
    let margin = 40;
    let leftX = margin + ox;
    let rightX = target.width - margin + ox;
    
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
    
    let lineStart = leftX + leftW + 15;
    let lineEnd = rightX - rightW - 15;
    
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
  loadPixels(); // main canvas
  
  let cStart = color(colorGradientStart.value());
  let cEnd = color(colorGradientEnd.value());
  
  let r1 = red(cStart), g1 = green(cStart), b1 = blue(cStart);
  let r2 = red(cEnd), g2 = green(cEnd), b2 = blue(cEnd);
  
  let d = pixelDensity();
  let fullLen = 4 * (width * d) * (height * d);
  
  if (pg.pixels.length < fullLen) return; // safety check

  for (let i = 0; i < fullLen; i += 4) {
    let r = pg.pixels[i];
    let g = pg.pixels[i+1];
    let b = pg.pixels[i+2];
    
    let lum = (r + g + b) / 765; // Normalized 0-1
    
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
  let type = selectGrainType.value();
  let mode = selectGrainBlend.value();
  
  // Map Blend Mode
  let bm = BLEND;
  if (mode === 'OVERLAY') bm = OVERLAY;
  else if (mode === 'MULTIPLY') bm = MULTIPLY;
  else if (mode === 'SCREEN') bm = SCREEN;
  else if (mode === 'DIFFERENCE') bm = DIFFERENCE;
  else if (mode === 'ADD') bm = ADD;
  
  let noiseW = Math.floor(width / freq);
  let noiseH = Math.floor(height / freq);
  
  if (noiseW < 1 || noiseH < 1) return; // safety

  let needsUpdate = false;
  if (pgNoise.width !== noiseW || pgNoise.height !== noiseH) {
    pgNoise = createGraphics(noiseW, noiseH);
    pgNoise.noSmooth();
    needsUpdate = true;
  }
  
  if (animated || frameCount === 1 || needsUpdate) {
    pgNoise.loadPixels();
    let d = pgNoise.pixelDensity();
    let len = 4 * (pgNoise.width * d) * (pgNoise.height * d);
    
    if (type === 'SCANLINES') {
       let lineSpacing = 2;
       for (let y = 0; y < pgNoise.height * d; y++) {
         let isLine = (y % lineSpacing) === 0;
         if (animated) {
            let phase = frameCount % lineSpacing;
            isLine = ((y + phase) % lineSpacing) === 0;
         }
         for (let x = 0; x < pgNoise.width * d; x++) {
           let idx = 4 * (y * pgNoise.width * d + x);
           if (isLine) {
             pgNoise.pixels[idx] = 0; 
             pgNoise.pixels[idx+1] = 0; 
             pgNoise.pixels[idx+2] = 0; 
             pgNoise.pixels[idx+3] = amount; 
           } else {
             pgNoise.pixels[idx+3] = 0; 
           }
         }
       }
    } else {
       for (let i = 0; i < len; i += 4) {
         if (type === 'COLOR') {
           pgNoise.pixels[i] = random(255);   
           pgNoise.pixels[i+1] = random(255); 
           pgNoise.pixels[i+2] = random(255); 
         } else {
           let val = random(255);
           pgNoise.pixels[i] = val; 
           pgNoise.pixels[i+1] = val; 
           pgNoise.pixels[i+2] = val; 
         }
         pgNoise.pixels[i+3] = amount;
       }
    }
    pgNoise.updatePixels();
  }
  
  blendMode(bm);
  image(pgNoise, 0, 0, width, height);
  blendMode(BLEND); 
}
