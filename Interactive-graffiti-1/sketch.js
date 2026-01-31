// Global variables
let pg; // Off-screen graphics buffer
let markers = []; // Array to store stroke points if needed, but we draw directly to pg
let drips = [];
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
let dripSpeed = 1.0; // Still used for ink flow feeling? Maybe not for marker.
let gradientEnabled = false;
let currentGradient = 'neon';

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
  
  bind('btn-clear', 'click', () => {
    pg.clear();
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
  
  // Draw the drawing layer
  image(pg, 0, 0);

  // Update and draw drips
  for (let i = drips.length - 1; i >= 0; i--) {
    let d = drips[i];
    d.update();
    d.show(pg); // Draw directly to buffer
    if (d.isDone()) {
      drips.splice(i, 1);
    }
  }
  
  // Draw Kinetic Text (Sidebar Decoration)
  drawKineticText();
  
  // Draw Static UI
  drawStaticOverlays();
}

function mouseDragged(e) {
  if (e && e.target && (e.target.closest('#sidebar') || e.target.closest('#sidebar-toggle'))) return;

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
  
  // Marker Logic: Faster = Thinner, Slower = Thicker (and slightly darker due to overlap)
  // Base width varies by speed
  let dynamicWidth = map(speed, 0, 50, brushSize * 1.2, brushSize * 0.4);
  
  // 3. Draw to PG (Buffer)
  pg.noStroke();
  
  // Interpolate between previous mouse pos and current to avoid gaps
  let steps = max(1, d / 2); // Step every 2 pixels roughly
  
  for (let i = 0; i < steps; i++) {
    let t = i / steps;
    let x = lerp(pmouseX, mouseX, t);
    let y = lerp(pmouseY, mouseY, t);
    
    // Slight size jitter for "felt tip" texture
    let w = dynamicWidth * random(0.9, 1.1);
    
    // Alpha is low to simulate ink buildup
    // Darker colors need lower alpha to not become black instantly
    drawColor.setAlpha(map(speed, 0, 50, 40, 20)); // Faster = less ink deposit
    
    pg.fill(drawColor);
    
    // Draw a "chisel" shape or just a circle.
    // Let's use a circle for a round tip marker, but rotate it slightly or deform it for realism?
    // Simple circle with low alpha works surprisingly well for markers.
    pg.ellipse(x, y, w, w);
    
    // Optional: Add a "core" that is slightly smaller and darker for the wet center
    // pg.fill(red(drawColor), green(drawColor), blue(drawColor), 5);
    // pg.ellipse(x, y, w * 0.7, w * 0.7);

    // Spawn Drips
    if (random() < 0.05 * dripSpeed) { // Low chance per step
       drips.push(new Drip(x, y, drawColor, w * 0.8));
    }
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
    let wave = sin(frameCount * 0.05 * animSpeed + i * animFreq) * animAmp;
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
  text("NIGHT BOAT TO CAIRO BY MADNESS.", 20, 20);

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
  constructor(x, y, c, w) {
    this.x = x;
    this.y = y;
    this.c = color(c);
    this.w = w;
    this.life = random(50, 150);
    this.speed = random(0.5, 2);
  }

  update() {
    this.y += this.speed;
    this.life--;
    this.w *= 0.99; // Shrink slightly
  }

  show(buffer) {
    buffer.noStroke();
    // High alpha for drip head
    this.c.setAlpha(150);
    buffer.fill(this.c);
    buffer.ellipse(this.x, this.y, this.w, this.w);
  }

  isDone() {
    return this.life < 0 || this.w < 1;
  }
}