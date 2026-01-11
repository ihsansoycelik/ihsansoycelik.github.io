let fonts = {};
let fontData = [];
let textLines = ["Here", "Comes", "The", "Boat"];
let fontSize = 100;

// Use local paths for stability in headless environment
let fontUrls = {
  'Rubik Mono One': 'assets/RubikMonoOne-Regular.ttf',
  'Anton': 'assets/Anton-Regular.ttf'
};
let currentFontName = 'Rubik Mono One';
let currentFont;

let params = {
  text: "Here\nComes\nThe\nBoat",
  bgColor: '#0022AA',
  textColor: '#E0E0E0',
  freq: 0.08,
  amp: 20,
  speed: 0.05,
  useGradient: false,
  gradientColor1: '#FF0080',
  gradientColor2: '#FF8C00',
  useNoise: false,
  noiseIntensity: 50
};

let noiseImage;
let fontLoaded = false;
let setupComplete = false;

function setup() {
  try {
    // Apple UI Style
    let css = `
      :root {
        --bg-color: #1e1e1e;
        --sidebar-bg: rgba(30, 30, 30, 0.9);
        --section-bg: rgba(255, 255, 255, 0.05);
        --text-color: #ffffff;
        --accent-color: #007AFF;
        --border-radius: 10px;
      }
      body {
        margin: 0;
        padding: 0;
        background-color: #000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: var(--text-color);
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }
      #main-container {
        display: flex;
        width: 100%;
        height: 100%;
      }
      #canvas-container {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #0022AA;
        position: relative;
        overflow: hidden;
      }
      #sidebar {
        width: 320px;
        background: var(--sidebar-bg);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex-shrink: 0;
        box-sizing: border-box;
        z-index: 10;
      }
      .control-section {
        background: var(--section-bg);
        border-radius: var(--border-radius);
        overflow: hidden;
        transition: all 0.3s ease;
      }
      .section-header {
        padding: 12px 14px;
        font-weight: 500;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
        background: rgba(255, 255, 255, 0.02);
        letter-spacing: 0.5px;
      }
      .section-header:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      .section-content {
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 6px;
        display: block;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      textarea {
        width: 100%;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: white;
        padding: 8px;
        font-family: inherit;
        resize: vertical;
        min-height: 60px;
        box-sizing: border-box;
      }
      textarea:focus {
        outline: none;
        border-color: var(--accent-color);
      }
      input[type=range] {
        -webkit-appearance: none;
        width: 100%;
        background: transparent;
        margin: 0;
      }
      input[type=range]::-webkit-slider-runnable-track {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #fff;
        margin-top: -6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
      }
      input[type=color] {
        -webkit-appearance: none;
        border: none;
        width: 100%;
        height: 28px;
        border-radius: 6px;
        background: none;
        cursor: pointer;
        padding: 0;
      }
      input[type=color]::-webkit-color-swatch-wrapper {
        padding: 0;
      }
      input[type=color]::-webkit-color-swatch {
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 6px;
      }
      select {
        width: 100%;
        padding: 6px 8px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: white;
        -webkit-appearance: none;
        font-size: 12px;
      }
      .toggle-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }
      .toggle-label {
        font-size: 13px;
        font-weight: 500;
      }
      /* Switch */
      .switch {
        position: relative;
        display: inline-block;
        width: 36px;
        height: 20px;
      }
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.2);
        transition: .4s;
        border-radius: 20px;
      }
      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }
      input:checked + .slider {
        background-color: var(--accent-color);
      }
      input:checked + .slider:before {
        transform: translateX(16px);
      }
      button.save-btn {
        background: var(--accent-color);
        color: white;
        border: none;
        padding: 10px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        margin-top: 10px;
        transition: opacity 0.2s;
      }
      button.save-btn:hover {
        opacity: 0.9;
      }
      .arrow {
        font-size: 10px;
        opacity: 0.5;
        transition: transform 0.2s;
      }
      .collapsed .arrow {
        transform: rotate(-90deg);
      }
      .collapsed .section-content {
        display: none;
      }
      /* Scrollbar */
      #sidebar::-webkit-scrollbar {
        width: 8px;
      }
      #sidebar::-webkit-scrollbar-track {
        background: transparent;
      }
      #sidebar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      #sidebar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      #defaultCanvas0 {
        display: block !important;
        visibility: visible !important;
      }
    `;
    createElement('style', css);

    // Layout Containers
    let mainContainer = createDiv().id('main-container');
    let canvasContainer = createDiv().id('canvas-container').parent(mainContainer);
    let sidebar = createDiv().id('sidebar').parent(mainContainer);

    // Canvas
    let cnv = createCanvas(800, 800);
    cnv.parent(canvasContainer);
    cnv.id('defaultCanvas0');
    cnv.style('max-width', '100%');
    cnv.style('max-height', '100%');
    cnv.style('object-fit', 'contain');

    // Create UI - DO THIS BEFORE FONTS
    setupSidebar(sidebar);
    
    // Load fonts asynchronously
    for (let key in fontUrls) {
      // We pass a callback to handle successful load
      loadFont(fontUrls[key], 
        (loadedFont) => {
          console.log(`Font ${key} loaded in setup`);
          fonts[key] = loadedFont;
          
          // If this is the current selected font, update immediately
          if (key === currentFontName) {
            currentFont = loadedFont;
            updateGeometry();
          }
        },
        (err) => {
          console.error(`Failed to load font ${key} in setup`, err);
        }
      );
    }

    // Noise
    createNoiseTexture();

    setupComplete = true;
    
  } catch(e) {
    console.error("Setup error:", e);
  }
}

function setupSidebar(sidebar) {
  // Text
  let textSection = createDiv().class('control-section').parent(sidebar);
  let textContent = createDiv().class('section-content').parent(textSection);
  createSpan('Content').parent(textContent).style('font-size','11px').style('opacity','0.5').style('text-transform','uppercase').style('margin-bottom','4px');
  let txtArea = createElement('textarea', params.text).parent(textContent);
  txtArea.attribute('rows', '4');
  txtArea.input(() => {
    params.text = txtArea.value();
    updateGeometry();
  });

  function createSection(title, parent, isOpen = false) {
    let sec = createDiv().class('control-section').parent(parent);
    if (!isOpen) sec.addClass('collapsed');
    
    let header = createDiv().class('section-header').parent(sec);
    header.html(`<span>${title}</span><span class="arrow">▼</span>`);
    header.mousePressed(() => {
      sec.toggleClass('collapsed');
    });
    
    let content = createDiv().class('section-content').parent(sec);
    return content;
  }

  // Color
  let colorContent = createSection('Color', sidebar, true);
  createSpan('Background').parent(colorContent).style('font-size','11px').style('opacity','0.5').style('text-transform','uppercase');
  let bgPicker = createColorPicker(params.bgColor).parent(colorContent);
  bgPicker.input(() => {
    params.bgColor = bgPicker.value();
    // Update container bg for seamlessness
    select('#canvas-container').style('background', params.bgColor);
  });
  
  createSpan('Text').parent(colorContent).style('font-size','11px').style('opacity','0.5').style('text-transform','uppercase').style('margin-top','8px');
  let textPicker = createColorPicker(params.textColor).parent(colorContent);
  textPicker.input(() => params.textColor = textPicker.value());

  // Animation
  let animContent = createSection('Animation', sidebar, true);
  function createSliderControl(label, min, max, val, step, parent, callback) {
    let wrap = createDiv().parent(parent);
    let lbl = createDiv(label).parent(wrap).style('font-size','11px').style('opacity','0.5').style('text-transform','uppercase').style('margin-bottom','4px');
    let sl = createSlider(min, max, val, step).parent(wrap);
    sl.input(() => callback(sl.value()));
    return sl;
  }
  createSliderControl("Frequency", 0.01, 0.2, params.freq, 0.01, animContent, v => params.freq = v);
  createSliderControl("Amplitude", 0, 80, params.amp, 1, animContent, v => params.amp = v);
  createSliderControl("Speed", 0.01, 0.2, params.speed, 0.01, animContent, v => params.speed = v);

  // Gradient
  let gradContent = createSection('Gradient Maps', sidebar, false);
  let gradToggleRow = createDiv().class('toggle-row').parent(gradContent);
  createSpan('Enabled').class('toggle-label').parent(gradToggleRow);
  let gradSwitch = createElement('label').class('switch').parent(gradToggleRow);
  let gradInput = createElement('input');
  gradInput.attribute('type', 'checkbox');
  if (params.useGradient) gradInput.attribute('checked', '');
  gradInput.parent(gradSwitch);
  gradInput.changed(() => {
    params.useGradient = gradInput.elt.checked;
  });
  createSpan().class('slider').parent(gradSwitch);
  
  createSpan('Start Color').parent(gradContent).style('font-size','11px').style('opacity','0.5').style('text-transform','uppercase');
  let g1Picker = createColorPicker(params.gradientColor1).parent(gradContent);
  g1Picker.input(() => params.gradientColor1 = g1Picker.value());
  
  createSpan('End Color').parent(gradContent).style('font-size','11px').style('opacity','0.5').style('text-transform','uppercase').style('margin-top','8px');
  let g2Picker = createColorPicker(params.gradientColor2).parent(gradContent);
  g2Picker.input(() => params.gradientColor2 = g2Picker.value());

  // Typography
  let fontContent = createSection('Typography', sidebar, false);
  let fontSelect = createSelect().parent(fontContent);
  for (let f in fontUrls) {
    fontSelect.option(f);
  }
  fontSelect.selected(currentFontName);
  fontSelect.changed(() => {
    currentFontName = fontSelect.value();
    currentFont = fonts[currentFontName];
    updateGeometry();
  });

  // Noise
  let noiseContent = createSection('Grain Noise', sidebar, false);
  let noiseToggleRow = createDiv().class('toggle-row').parent(noiseContent);
  createSpan('Enabled').class('toggle-label').parent(noiseToggleRow);
  let noiseSwitch = createElement('label').class('switch').parent(noiseToggleRow);
  let noiseInput = createElement('input');
  noiseInput.attribute('type', 'checkbox');
  if (params.useNoise) noiseInput.attribute('checked', '');
  noiseInput.parent(noiseSwitch);
  noiseInput.changed(() => {
    params.useNoise = noiseInput.elt.checked;
  });
  createSpan().class('slider').parent(noiseSwitch);
  createSliderControl("Intensity", 0, 100, params.noiseIntensity, 1, noiseContent, v => params.noiseIntensity = v);

  // Save
  let saveBtn = createButton('Save Loop').class('save-btn').parent(sidebar);
  saveBtn.mousePressed(saveLoop);
}

function updateGeometry() {
  textLines = params.text.split('\n');
  generateGeometry();
}

function generateGeometry() {
  fontData = [];
  if (!currentFont) {
    // console.warn("generateGeometry: No current font set.");
    return;
  }
  
  let startY = 200;
  let totalH = textLines.length * fontSize;
  startY = (800 / 2) - (totalH / 2) + (fontSize * 0.75);

  for (let i = 0; i < textLines.length; i++) {
    let str = textLines[i];
    if (!str) continue;
    
    let b;
    try {
      b = currentFont.textBounds(str, 0, 0, fontSize);
    } catch(e) {
      console.warn("textBounds failed", e);
      continue;
    }
    
    let x = (800 / 2) - (b.w / 2);
    let y = startY + i * fontSize;
    
    let pts;
    try {
      pts = currentFont.textToPoints(str, x, y, fontSize, {
        sampleFactor: 0.25,
        simplifyThreshold: 0
      });
    } catch(e) {
      console.error("textToPoints failed", e);
      continue;
    }
    
    let lineContours = [];
    let currentContour = [];
    if (pts.length > 0) currentContour.push(pts[0]);
    
    for (let j = 1; j < pts.length; j++) {
      let p = pts[j];
      let prev = pts[j-1];
      if (dist(prev.x, prev.y, p.x, p.y) > 20) {
        lineContours.push(currentContour);
        currentContour = [];
      }
      currentContour.push(p);
    }
    if (currentContour.length > 0) lineContours.push(currentContour);
    
    let areas = lineContours.map(c => {
      let a = 0;
      for (let k = 0; k < c.length; k++) {
        let p1 = c[k];
        let p2 = c[(k + 1) % c.length];
        a += (p1.x * p2.y - p2.x * p1.y);
      }
      return a / 2;
    });
    
    let positiveCount = areas.filter(a => a > 0).length;
    let negativeCount = areas.filter(a => a < 0).length;
    let outlineSign = (positiveCount >= negativeCount) ? 1 : -1;
    
    lineContours.forEach((c, index) => {
      c.area = areas[index];
      c.isHole = (Math.sign(c.area) !== outlineSign && Math.sign(c.area) !== 0);
    });
    lineContours.sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
    
    fontData.push(lineContours);
  }
  
  if (fontData.length > 0) {
    fontLoaded = true;
  }
}

function createNoiseTexture() {
  noiseImage = createImage(200, 200);
  noiseImage.loadPixels();
  for (let i = 0; i < 200; i++) {
    for (let j = 0; j < 200; j++) {
      let val = random(255);
      noiseImage.set(i, j, color(val, val, val, 40));
    }
  }
  noiseImage.updatePixels();
}

function draw() {
  try {
    background(params.bgColor);
    
    if (currentFont && fontData.length > 0) {
      noStroke();
      strokeWeight(3);
      strokeJoin(ROUND);
      
      let gradient;
      if (params.useGradient) {
        let ctx = drawingContext;
        gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, params.gradientColor1);
        gradient.addColorStop(1, params.gradientColor2);
      }

      for (let i = 0; i < fontData.length; i++) {
        let lineContours = fontData[i];
        for (let j = 0; j < lineContours.length; j++) {
          let contour = lineContours[j];
          
          if (contour.isHole) {
            fill(params.bgColor);
            stroke(params.bgColor);
          } else {
            if (params.useGradient) {
              drawingContext.fillStyle = gradient;
              drawingContext.strokeStyle = gradient;
            } else {
              fill(params.textColor);
              stroke(params.textColor);
            }
          }
          
          beginShape();
          for (let k = 0; k < contour.length; k++) {
            let p = contour[k];
            let wave = sin(p.y * params.freq + frameCount * params.speed) * params.amp;
            vertex(p.x + wave, p.y);
          }
          endShape(CLOSE);
        }
      }
    }
    
    drawUI();

    if (params.useNoise) {
      push();
      blendMode(OVERLAY);
      tint(255, map(params.noiseIntensity, 0, 100, 0, 255));
      image(noiseImage, 0, 0, width, height);
      pop();
    }
  } catch(e) {
    console.error(e);
  }
}

function drawUI() {
  noStroke();
  fill(params.textColor);
  textSize(12);
  textFont('Arial'); 
  textAlign(LEFT, TOP);
  
  text("NIGHT BOAT TO CAIRO BY MADNESS.", 20, 20);
  text("@holke79", 20, height - 30);
  
  push();
  translate(width - 40, 40);
  noFill();
  stroke(params.textColor);
  strokeWeight(1);
  ellipse(0, 0, 50, 50);
  fill(params.textColor);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(16);
  text("79", 0, 1);
  pop();
  
  push();
  translate(width - 20, height / 2);
  rotate(HALF_PI);
  textAlign(CENTER, CENTER);
  textSize(10);
  text("HERE COMES THE BOAT, ONLY HALF-AFLOAT.", 0, 0);
  pop();
}

function saveLoop() {
  let durationFrames = TWO_PI / params.speed;
  let durationSeconds = durationFrames / 60; 
  saveGif('kinetic_type.gif', durationSeconds, {
    units: 'seconds',
    notificationDuration: 1
  });
}
