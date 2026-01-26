// Global variables
let pg; // Off-screen graphics buffer
let markers = []; // Array to store stroke points if needed, but we draw directly to pg
let uiFont;

// UI State Variables
let contentText = "Here\nComes\nThe\nBoat";
let selectedFont = "Inter";
let bgColor;
let bgImage; 
let textColor;
let animFreq = 0.2;
let animAmp = 20;
let animSpeed = 1.0;
let brushSize = 25;
let dripSpeed = 1.0;
let gradientEnabled = false;
let currentGradient = 'neon';

// New features
let history = [];
const MAX_HISTORY = 20;
let isEraser = false;
let drips = [];

// Gradient Palettes
const GRADIENTS = {
  neon: ['#CCFF00', '#FF0099', '#00FFFF'],
  fire: ['#FF0000', '#FF9900', '#FFFF00'],
  ocean: ['#0000FF', '#0099FF', '#00FFFF'],
  bw: ['#000000', '#888888', '#FFFFFF']
};

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

  bind('gradient-toggle', 'change', (e) => {
    gradientEnabled = e.target.checked;
    const group = document.getElementById('gradient-select-group');
    group.style.opacity = gradientEnabled ? '1' : '0.5';
    group.style.pointerEvents = gradientEnabled ? 'auto' : 'none';
  });

  bind('gradient-select', 'change', (e) => currentGradient = e.target.value);
  bind('brush-size', 'input', (e) => brushSize = parseFloat(e.target.value));
  bind('drip-speed', 'input', (e) => dripSpeed = parseFloat(e.target.value));
  
  bind('btn-clear', 'click', () => {
    pg.clear();
    drips = [];
  });

  bind('btn-undo', 'click', () => {
    undo();
  });

  bind('btn-eraser', 'click', (e) => {
    isEraser = !isEraser;
    e.target.textContent = isEraser ? "Eraser Mode: ON" : "Eraser Mode: OFF";
    e.target.style.background = isEraser ? "#FF0000" : "";
    e.target.style.color = isEraser ? "#FFFFFF" : "";
  });
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
  for (let i = drips.length - 1; i >= 0; i--) {
    drips[i].update();
    drips[i].show(pg);
    if (drips[i].isDone()) {
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

function mousePressed(e) {
  if (e && e.target && (e.target.closest('#sidebar') || e.target.closest('#sidebar-toggle'))) return;

  // Save state for Undo
  if (history.length >= MAX_HISTORY) history.shift();
  history.push(pg.get());
}

function undo() {
  if (history.length > 0) {
    pg.clear();
    pg.image(history.pop(), 0, 0);
    // Also clear active drips on undo? Maybe safer.
    drips = [];
  }
}

function mouseDragged(e) {
  if (e && e.target && (e.target.closest('#sidebar') || e.target.closest('#sidebar-toggle'))) return;

  if (isEraser) {
    pg.erase();
    pg.strokeWeight(brushSize);
    // Draw a line to prevent gaps when moving fast
    pg.stroke(0); // color doesn't matter for erase
    pg.line(pmouseX, pmouseY, mouseX, mouseY);
    pg.noErase();
    return;
  }

  // 1. Determine Color
  let drawColor;
  if (gradientEnabled) {
    let palette = GRADIENTS[currentGradient];
    let t = map(mouseY, 0, height, 0, palette.length - 1);
    let i1 = floor(t);
    let i2 = ceil(t);
    if (i2 >= palette.length) { i1 = palette.length - 1; i2 = palette.length - 1; }
    drawColor = lerpColor(color(palette[i1]), color(palette[i2]), t - i1);
  } else {
    drawColor = color(textColor);
  }

  // 2. Calculate Dynamics
  let d = dist(mouseX, mouseY, pmouseX, pmouseY);
  let speed = constrain(d, 0, 50);
  
  // Marker Logic: Faster = Thinner, Slower = Thicker
  let dynamicWidth = map(speed, 0, 50, brushSize * 1.2, brushSize * 0.4);
  
  // 3. Draw to PG (Buffer)
  pg.noStroke();
  
  // Interpolate
  let steps = max(1, d / 2);
  
  for (let i = 0; i < steps; i++) {
    let t = i / steps;
    let x = lerp(pmouseX, mouseX, t);
    let y = lerp(pmouseY, mouseY, t);
    
    let w = dynamicWidth * random(0.9, 1.1);
    
    // Alpha
    drawColor.setAlpha(map(speed, 0, 50, 40, 20));
    
    pg.fill(drawColor);
    pg.ellipse(x, y, w, w);
  }

  // Drip Logic
  // If moving slowly, chance to drip
  // dripSpeed input controls probability/amount
  if (speed < 10 && random(1) < (0.05 * dripSpeed)) {
    // Clone color for drip so alpha is different
    let c = color(drawColor);
    c.setAlpha(200); // More opaque
    drips.push(new Drip(mouseX, mouseY, c, brushSize));
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
  let startX = width - 120;
  let startY = height / 2;

  translate(startX, startY);
  rotate(HALF_PI);

  // Make text from content variable
  let fullText = contentText.replace(/\n/g, ' ').toUpperCase();
  let totalW = textWidth(fullText);
  let currentX = -totalW / 2;

  // Mouse influence on wave
  let mouseEffect = map(mouseY, 0, height, 0.5, 2.0);

  for (let i = 0; i < fullText.length; i++) {
    let char = fullText.charAt(i);
    let cw = textWidth(char);
    // Interactive wave
    let wave = sin(frameCount * 0.05 * animSpeed + i * animFreq * mouseEffect) * animAmp;
    text(char, currentX + cw/2, -10 + wave);
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
  // Use dynamic text instead of hardcoded
  let displayContent = contentText.replace(/\n/g, ' ').substring(0, 50);
  if (contentText.length > 50) displayContent += "...";
  text(displayContent, 20, 20);

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

class Drip {
  constructor(x, y, c, size) {
    this.x = x + random(-5, 5);
    this.y = y;
    this.color = c;
    this.size = size * random(0.3, 0.6);
    this.speed = random(1, 3);
    this.life = 255;
  }

  update() {
    this.y += this.speed;
    this.life -= 2 * animSpeed; // Fade out based on anim speed
    this.size *= 0.99;
  }

  show(target) {
    target.noStroke();
    let c = color(this.color);
    c.setAlpha(map(this.life, 0, 255, 0, 200));
    target.fill(c);
    target.ellipse(this.x, this.y, this.size, this.size);
  }

  isDone() {
    return this.life <= 0 || this.size < 0.5;
  }
}
