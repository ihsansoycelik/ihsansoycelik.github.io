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
  // Animation
  animType: 'Wave Y',
  freq: 0.08,
  amp: 20,
  speed: 0.05,
  // Gradient
  useGradient: false,
  gradientColor1: '#FF0080',
  gradientColor2: '#FF8C00',
  // Noise
  useNoise: false,
  noiseIntensity: 50,
  noiseDensity: 1.0, // 0.1 - 1.0
  noiseSize: 1.0, // Scale
  noiseSpeed: 1 // Update every N frames (1 = every frame)
};

let noiseBuffer;
let fontLoaded = false;
let setupComplete = false;

// Animation Types
const ANIM_TYPES = ['Wave Y', 'Wave X', 'Ripple', 'Stretch', 'Glitch', 'Breathing'];

function setup() {
  try {
    // Layout Containers
    let mainContainer = createDiv().id('main-container');
    let canvasContainer = createDiv().id('canvas-container').parent(mainContainer);
    let sidebar = createDiv().id('sidebar').parent(mainContainer);

    // Canvas
    let cnv = createCanvas(800, 800);
    cnv.parent(canvasContainer);
    cnv.id('defaultCanvas0');
    // Ensure canvas fits
    // The CSS handles max-width/height, but p5 sets style width/height too.
    // We let CSS override it via !important in index.html, or we can leave it.

    // Create UI - DO THIS BEFORE FONTS
    setupSidebar(sidebar);
    
    // Load fonts asynchronously
    for (let key in fontUrls) {
      loadFont(fontUrls[key], 
        (loadedFont) => {
          console.log(`Font ${key} loaded in setup`);
          fonts[key] = loadedFont;
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
    initNoiseBuffer();

    setupComplete = true;
    
  } catch(e) {
    console.error("Setup error:", e);
  }
}

function initNoiseBuffer() {
  // Create a buffer larger than canvas to allow for jitter/movement
  // High res noise
  let w = width + 200;
  let h = height + 200;
  noiseBuffer = createGraphics(w, h);
  generateNoiseTexture();
}

function generateNoiseTexture() {
  if (!noiseBuffer) return;
  noiseBuffer.clear();
  noiseBuffer.noStroke();

  // High density random pixels
  noiseBuffer.loadPixels();
  let d = noiseBuffer.pixelDensity();
  let fullW = noiseBuffer.width * d;
  let fullH = noiseBuffer.height * d;

  // We want strictly black/white noise usually, or grayscale.
  // We'll write to alpha channel mostly for overlay?
  // Or white pixels with alpha.

  // Optimization: Loop through pixels
  // Density affects how many pixels are opaque
  let density = params.noiseDensity;

  for (let i = 0; i < fullW * fullH * 4; i += 4) {
    // fast random
    if (Math.random() < density) {
        let val = Math.random() * 255;
        noiseBuffer.pixels[i] = val;     // R
        noiseBuffer.pixels[i+1] = val;   // G
        noiseBuffer.pixels[i+2] = val;   // B
        noiseBuffer.pixels[i+3] = 255;   // A
    } else {
        noiseBuffer.pixels[i+3] = 0;     // Transparent
    }
  }
  noiseBuffer.updatePixels();
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
    select('#canvas-container').style('background', params.bgColor);
  });
  
  createSpan('Text').parent(colorContent).style('font-size','11px').style('opacity','0.5').style('text-transform','uppercase').style('margin-top','8px');
  let textPicker = createColorPicker(params.textColor).parent(colorContent);
  textPicker.input(() => params.textColor = textPicker.value());

  // Animation
  let animContent = createSection('Animation', sidebar, true);

  // Type Selector
  createSpan('Type').parent(animContent).style('font-size','11px').style('opacity','0.5').style('text-transform','uppercase');
  let typeSelect = createSelect().parent(animContent);
  ANIM_TYPES.forEach(t => typeSelect.option(t));
  typeSelect.selected(params.animType);
  typeSelect.changed(() => {
    params.animType = typeSelect.value();
  });

  function createSliderControl(label, min, max, val, step, parent, callback) {
    let wrap = createDiv().parent(parent);
    let lbl = createDiv(label).parent(wrap).style('font-size','11px').style('opacity','0.5').style('text-transform','uppercase').style('margin-bottom','4px');
    let sl = createSlider(min, max, val, step).parent(wrap);
    sl.input(() => callback(sl.value()));
    return sl;
  }

  createSliderControl("Frequency", 0.01, 0.5, params.freq, 0.01, animContent, v => params.freq = v);
  createSliderControl("Amplitude", 0, 150, params.amp, 1, animContent, v => params.amp = v);
  createSliderControl("Speed", 0.01, 0.5, params.speed, 0.01, animContent, v => params.speed = v);

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
  createSliderControl("Density", 0.1, 1.0, params.noiseDensity, 0.05, noiseContent, v => {
    params.noiseDensity = v;
    generateNoiseTexture();
  });
  createSliderControl("Size", 0.5, 4.0, params.noiseSize, 0.1, noiseContent, v => params.noiseSize = v);
  // Speed is actually "Jitter Speed"
  createSliderControl("Jitter Speed", 1, 10, 11 - params.noiseSpeed, 1, noiseContent, v => params.noiseSpeed = 11 - v); // Invert UI: Higher is faster (lower interval)

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
  if (!currentFont) return;
  
  let startY = 200;
  let totalH = textLines.length * fontSize;
  startY = (800 / 2) - (totalH / 2) + (fontSize * 0.75);

  for (let i = 0; i < textLines.length; i++) {
    let str = textLines[i];
    if (!str) continue;
    
    let b;
    try {
      b = currentFont.textBounds(str, 0, 0, fontSize);
    } catch(e) { continue; }
    
    let x = (800 / 2) - (b.w / 2);
    let y = startY + i * fontSize;
    
    let pts;
    try {
      pts = currentFont.textToPoints(str, x, y, fontSize, {
        sampleFactor: 0.25,
        simplifyThreshold: 0
      });
    } catch(e) { continue; }
    
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
            let nx = p.x;
            let ny = p.y;

            // Apply Animation
            let t = frameCount * params.speed;

            switch(params.animType) {
              case 'Wave Y':
                nx += sin(p.y * params.freq + t) * params.amp;
                break;
              case 'Wave X':
                ny += sin(p.x * params.freq + t) * params.amp;
                break;
              case 'Ripple':
                let d = dist(p.x, p.y, width/2, height/2);
                nx += sin(d * params.freq - t) * params.amp;
                break;
              case 'Stretch':
                // Stretch from center vertically
                let cy = height/2;
                let dy = (p.y - cy);
                ny = cy + dy * (1 + sin(t * 0.5) * (params.amp/100)); // normalized amp
                break;
              case 'Glitch':
                if (frameCount % 10 < 5) { // Stutter
                   if (random() < 0.1) nx += random(-params.amp, params.amp);
                }
                break;
              case 'Breathing':
                 let scaleF = 1 + sin(t) * (params.amp/200);
                 nx = (nx - width/2) * scaleF + width/2;
                 ny = (ny - height/2) * scaleF + height/2;
                 break;
            }

            vertex(nx, ny);
          }
          endShape(CLOSE);
        }
      }
    }
    
    drawUI();

    if (params.useNoise && noiseBuffer) {
      push();
      blendMode(OVERLAY);
      tint(255, map(params.noiseIntensity, 0, 100, 0, 255));

      // Animated Grain: Randomize position
      let ox = 0, oy = 0;
      // Update offset every N frames
      if (frameCount % Math.max(1, floor(params.noiseSpeed)) === 0) {
        // We use random noise offset
        // But to make it continuous we need to store it?
        // No, grain is usually random every frame.
      }

      // We draw the noise buffer shifted by a random amount
      // The buffer is larger than canvas, so we can shift it.
      // Max shift = 200

      // If speed is high (interval low), we shift often.
      // Wait, params.noiseSpeed I defined as "Update every N frames".
      // Let's use noiseSeed or just random.

      let speedInterval = Math.max(1, floor(params.noiseSpeed));
      let frameKey = floor(frameCount / speedInterval);

      randomSeed(frameKey * 12345);
      ox = random(-200, 0);
      oy = random(-200, 0);

      // Scale
      let s = params.noiseSize;

      translate(ox, oy);
      scale(s);

      // If we scale up, we need to ensure we cover the canvas.
      // noiseBuffer is w+200, h+200.
      // if scale is 1, we draw at -200..0. covers width.
      // if scale is 2, we draw huge image.

      image(noiseBuffer, 0, 0);

      pop();
      // restore random seed for other things? p5 random is global.
      randomSeed(frameCount);
    }
  } catch(e) {
    console.error(e);
  }
}

function drawUI() {
  // UI text removed as per request
}

function saveLoop() {
  let durationFrames = TWO_PI / params.speed;
  let durationSeconds = durationFrames / 60; 
  saveGif('kinetic_type.gif', durationSeconds, {
    units: 'seconds',
    notificationDuration: 1
  });
}
