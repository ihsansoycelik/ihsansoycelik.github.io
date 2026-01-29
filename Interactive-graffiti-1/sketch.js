// Global variables
let pg; // Off-screen graphics buffer
let uiFont;

// UI State Variables
let contentText = "Here\nComes\nThe\nBoat";
let titleText = "NIGHT BOAT TO CAIRO BY MADNESS.";
let selectedFont = "Inter";
let bgColor;
let bgImage; 
let textColor;
let animFreq = 0.2;
let animAmp = 20;
let animSpeed = 1.0;
let animMode = 'wave';
let brushSize = 25;
let dripSpeed = 1.0;
let gradientEnabled = false;
let currentGradient = 'neon';

// New features
let drips = [];
let history = [];
let currentTool = 'marker'; // marker, spray, eraser
let sprayDensity = 20;
let sprayRadius = 30;

// Gradient Palettes
const GRADIENTS = {
  neon: ['#CCFF00', '#FF0099', '#00FFFF'],
  fire: ['#FF0000', '#FF9900', '#FFFF00'],
  ocean: ['#0000FF', '#0099FF', '#00FFFF'],
  bw: ['#000000', '#888888', '#FFFFFF']
};

class Drip {
  constructor(x, y, color, size, speed) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.speed = speed * random(0.5, 1.5);
    this.life = random(100, 300); // Length of drip
  }

  update() {
    this.y += this.speed;
    this.life -= this.speed;
    this.size *= 0.99; // Taper off
  }

  draw(graphics) {
    graphics.noStroke();
    graphics.fill(this.color);
    graphics.ellipse(this.x, this.y, this.size, this.size);
  }

  isDead() {
    return this.life <= 0 || this.size < 1;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Default Colors
  bgColor = color('#0022AA');
  document.body.style.backgroundColor = bgColor.toString();
  textColor = color('#FFFFFF');
  
  // Create off-screen buffer
  pg = createGraphics(windowWidth, windowHeight);
  pg.clear();
  
  // Setup Fonts
  textFont('Inter');
  textStyle(BOLD);
  
  setupUI();
}

function setupUI() {
  const bind = (id, event, callback) => {
    const el = document.getElementById(id);
    if(el) el.addEventListener(event, callback);
    return el;
  };
  
  bind('sidebar-toggle', 'click', () => {
    document.getElementById('sidebar').classList.toggle('hidden');
  });

  bind('text-content', 'input', (e) => contentText = e.target.value);
  bind('title-input', 'input', (e) => titleText = e.target.value);
  bind('font-select', 'change', (e) => selectedFont = e.target.value);

  bind('bg-color-picker', 'input', (e) => {
    bgColor = color(e.target.value);
    document.body.style.backgroundColor = e.target.value;
    document.getElementById('bg-preview').style.backgroundColor = e.target.value;
  });

  bind('bg-image-upload', 'change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      loadImage(url, (img) => bgImage = img);
    }
  });
  
  bind('text-color-picker', 'input', (e) => {
    textColor = color(e.target.value);
    document.getElementById('text-preview').style.backgroundColor = e.target.value;
  });

  bind('anim-freq', 'input', (e) => animFreq = parseFloat(e.target.value));
  bind('anim-amp', 'input', (e) => animAmp = parseFloat(e.target.value));
  bind('anim-speed', 'input', (e) => animSpeed = parseFloat(e.target.value));
  bind('anim-mode', 'change', (e) => animMode = e.target.value);

  bind('gradient-toggle', 'change', (e) => {
    gradientEnabled = e.target.checked;
    const group = document.getElementById('gradient-select-group');
    group.style.opacity = gradientEnabled ? '1' : '0.5';
    group.style.pointerEvents = gradientEnabled ? 'auto' : 'none';
  });

  bind('gradient-select', 'change', (e) => currentGradient = e.target.value);
  bind('brush-size', 'input', (e) => brushSize = parseFloat(e.target.value));
  bind('drip-speed', 'input', (e) => dripSpeed = parseFloat(e.target.value));
  bind('tool-select', 'change', (e) => currentTool = e.target.value);

  bind('btn-undo', 'click', undo);
  bind('btn-download', 'click', () => saveCanvas('graffiti', 'png'));
  
  bind('btn-clear', 'click', () => {
    pg.clear();
    drips = [];
  });
}

function saveState() {
  if (history.length > 10) {
    history.shift();
  }
  history.push(pg.get());
}

function undo() {
  if (history.length > 0) {
    let previousState = history.pop();
    pg.clear();
    pg.image(previousState, 0, 0);
  }
}

function mousePressed(e) {
  if (e && e.target && (e.target.closest('#sidebar') || e.target.closest('#sidebar-toggle'))) return;
  saveState();
}

function draw() {
  background(bgColor);

  if (bgImage) {
    // Cover mode
    let scale = max(width / bgImage.width, height / bgImage.height);
    let w = bgImage.width * scale;
    let h = bgImage.height * scale;
    image(bgImage, (width - w) / 2, (height - h) / 2, w, h);
  }
  
  // Update and draw drips to PG
  // We draw drips to PG so they become permanent part of drawing
  for (let i = drips.length - 1; i >= 0; i--) {
    let d = drips[i];
    d.update();
    d.draw(pg);
    if (d.isDead()) {
      drips.splice(i, 1);
    }
  }

  // Draw the drawing layer
  image(pg, 0, 0);
  
  // Draw Kinetic Text (Sidebar Decoration)
  drawKineticText();
  
  // Draw Static UI
  drawStaticOverlays();
}

function getCurrentColor() {
  if (gradientEnabled) {
    let palette = GRADIENTS[currentGradient];
    let t = map(mouseY, 0, height, 0, palette.length - 1);
    let i1 = floor(t);
    let i2 = ceil(t);
    if (i2 >= palette.length) { i1 = palette.length - 1; i2 = palette.length - 1; }
    return lerpColor(color(palette[i1]), color(palette[i2]), t - i1);
  } else {
    return color(textColor);
  }
}

function mouseDragged(e) {
  if (e && e.target && (e.target.closest('#sidebar') || e.target.closest('#sidebar-toggle'))) return;
  if (!mouseIsPressed) return; // Extra safety

  let drawColor = getCurrentColor();
  let d = dist(mouseX, mouseY, pmouseX, pmouseY);
  let speed = constrain(d, 0, 50);

  pg.noStroke();

  if (currentTool === 'marker') {
    let dynamicWidth = map(speed, 0, 50, brushSize * 1.2, brushSize * 0.4);
    let steps = max(1, d / 2);
    
    // Alpha adjustment for marker feel
    let alphaVal = map(speed, 0, 50, 40, 20);
    drawColor.setAlpha(alphaVal);
    pg.fill(drawColor);

    for (let i = 0; i < steps; i++) {
      let t = i / steps;
      let x = lerp(pmouseX, mouseX, t);
      let y = lerp(pmouseY, mouseY, t);
      let w = dynamicWidth * random(0.9, 1.1);
      pg.ellipse(x, y, w, w);
    }

    // Spawn Drips based on Flow (dripSpeed) and inverse speed (slower = more ink = more drips)
    // Probability
    if (random(1) < (0.05 * dripSpeed) / (speed * 0.1 + 1)) {
        drips.push(new Drip(mouseX, mouseY, color(drawColor.levels[0], drawColor.levels[1], drawColor.levels[2], 200), dynamicWidth * 0.5, dripSpeed));
    }

  } else if (currentTool === 'spray') {
    // Spray Logic
    let density = sprayDensity * (brushSize / 20); // More particles for bigger brush
    drawColor.setAlpha(150); // Higher alpha for spray dots
    pg.fill(drawColor);
    
    for (let i = 0; i < density; i++) {
        let angle = random(TWO_PI);
        let rad = random(brushSize); // Random radius within brush size
        // Biased towards center for soft brush feel
        rad = pow(random(), 2) * brushSize * 1.5;

        let offsetX = cos(angle) * rad;
        let offsetY = sin(angle) * rad;

        pg.ellipse(mouseX + offsetX, mouseY + offsetY, 2, 2);
    }
     // Spray drips less than marker? Or maybe accumulates.
     if (random(1) < (0.02 * dripSpeed)) {
        drips.push(new Drip(mouseX, mouseY, color(drawColor.levels[0], drawColor.levels[1], drawColor.levels[2], 200), brushSize * 0.2, dripSpeed));
    }
  } else if (currentTool === 'eraser') {
    pg.erase();
    pg.noStroke();
    pg.fill(0);
    pg.ellipse(mouseX, mouseY, brushSize, brushSize);
    pg.noErase();
  }
}

function drawKineticText() {
  push();
  fill(textColor);
  noStroke();
  textFont(selectedFont);
  textSize(24);
  textAlign(CENTER, BOTTOM);

  // Position: Right side, vertical
  let startX = width - 120; // Adjusted to be closer to edge but visible
  let startY = height / 2;

  translate(startX, startY);
  rotate(HALF_PI);

  let fullText = contentText.replace(/\n/g, ' ').toUpperCase();
  let totalW = textWidth(fullText);
  let currentX = -totalW / 2;

  for (let i = 0; i < fullText.length; i++) {
    let char = fullText.charAt(i);
    let cw = textWidth(char);
    let offsetY = 0;

    if (animMode === 'wave') {
      offsetY = sin(frameCount * 0.05 * animSpeed + i * animFreq) * animAmp;
    } else if (animMode === 'shake') {
       offsetY = random(-animAmp, animAmp) * 0.5;
    } else if (animMode === 'elastic') {
       let t = frameCount * 0.05 * animSpeed + i * animFreq;
       offsetY = -abs(sin(t)) * animAmp;
    }

    text(char, currentX + cw/2, -10 + offsetY);
    currentX += cw;
  }
  pop();
}

function drawStaticOverlays() {
  push();
  fill(textColor);
  noStroke();
  textFont('Inter');
  textSize(12);

  textAlign(LEFT, TOP);
  text(titleText.toUpperCase(), 20, 20);

  textAlign(LEFT, BOTTOM);
  text("@holke79", 20, height - 20);

  // Top-Right Circle "79"
  let cx = width - 60;
  let cy = 40;

  stroke(textColor);
  strokeWeight(1);
  noFill();
  ellipse(cx, cy, 30, 30);

  fill(textColor);
  noStroke();
  textAlign(CENTER, CENTER);
  text("79", cx, cy + 1);

  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let oldPg = pg;
  pg = createGraphics(windowWidth, windowHeight);
  pg.image(oldPg, 0, 0);
}

document.oncontextmenu = function() { return false; }
