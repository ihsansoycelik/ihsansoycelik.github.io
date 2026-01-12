// Global variables
let pg; // Off-screen graphics buffer for static trails
let drips = []; // Array to hold active Drip objects
let splatters = []; // Array to hold splatter particles
let uiFont;

// UI State Variables
let contentText = "Here\nComes\nThe\nBoat";
let selectedFont = "Inter";
let bgColor;
let textColor;
let animFreq = 0.2;
let animAmp = 20;
let animSpeed = 1.0;
let brushSize = 25;
let dripSpeed = 1.0;
let gradientEnabled = false;
let currentGradient = 'neon';

// Gradient Palettes (Arrays of colors)
const GRADIENTS = {
  neon: ['#CCFF00', '#FF0099', '#00FFFF'],
  fire: ['#FF0000', '#FF9900', '#FFFF00'],
  ocean: ['#0000FF', '#0099FF', '#00FFFF'],
  bw: ['#000000', '#888888', '#FFFFFF']
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Default Colors
  bgColor = color('#0022AA'); // Deep Blue
  textColor = color('#FFFFFF'); // White
  
  // Create off-screen buffer
  pg = createGraphics(windowWidth, windowHeight);
  pg.clear();
  
  // Setup Fonts
  textFont('Inter');
  textStyle(BOLD);
  
  setupUI();
}

function setupUI() {
  // Bind UI elements using standard DOM
  const bind = (id, event, callback) => {
    const el = document.getElementById(id);
    if(el) el.addEventListener(event, callback);
    return el;
  };
  
  // Toggle Sidebar
  bind('sidebar-toggle', 'click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
  });

  // Content
  bind('text-content', 'input', (e) => contentText = e.target.value);
  
  bind('font-select', 'change', (e) => {
    selectedFont = e.target.value;
  });

  // Colors
  bind('bg-color-picker', 'input', (e) => {
    bgColor = color(e.target.value);
    document.getElementById('bg-preview').style.backgroundColor = e.target.value;
  });
  
  bind('text-color-picker', 'input', (e) => {
    textColor = color(e.target.value);
    document.getElementById('text-preview').style.backgroundColor = e.target.value;
  });

  // Animation
  bind('anim-freq', 'input', (e) => animFreq = parseFloat(e.target.value));
  bind('anim-amp', 'input', (e) => animAmp = parseFloat(e.target.value));
  bind('anim-speed', 'input', (e) => animSpeed = parseFloat(e.target.value));

  // Gradient
  bind('gradient-toggle', 'change', (e) => {
    gradientEnabled = e.target.checked;
    const selectGroup = document.getElementById('gradient-select-group');
    if(gradientEnabled) {
      selectGroup.style.opacity = '1';
      selectGroup.style.pointerEvents = 'auto';
    } else {
      selectGroup.style.opacity = '0.5';
      selectGroup.style.pointerEvents = 'none';
    }
  });

  bind('gradient-select', 'change', (e) => currentGradient = e.target.value);

  // Brush
  bind('brush-size', 'input', (e) => brushSize = parseFloat(e.target.value));
  bind('drip-speed', 'input', (e) => dripSpeed = parseFloat(e.target.value));
  bind('btn-clear', 'click', () => {
    pg.clear();
    drips = [];
    splatters = [];
  });
}

function draw() {
  background(bgColor);
  
  // 1. Draw static buffer
  image(pg, 0, 0);

  // 2. Draw splatters
  for (let s of splatters) {
    s.display(pg);
  }
  splatters = []; // Clear splatters after drawing them to the buffer to prevent re-drawing
  
  // 3. Update and draw active drips
  for (let i = drips.length - 1; i >= 0; i--) {
    let d = drips[i];
    d.update();
    d.display(window); // Draw to main canvas
    
    if (d.isDone()) {
      d.display(pg); // Stamp to buffer
      drips.splice(i, 1);
    }
  }
  
  // 4. Draw Kinetic Text
  // drawKineticText(); // Removed as per request
  
  // 5. Draw Static UI Overlays (Corners)
  // drawStaticOverlays(); // Removed as per request
}

function drawKineticText() {
  push();
  fill(textColor);
  noStroke();
  textFont(selectedFont);
  textSize(24);
  textAlign(CENTER, BOTTOM); // Vertical text baseline

  // Move text to the left of the sidebar area to ensure visibility
  // Sidebar is 280px + 20px margin = 300px. 
  // Let's put text at width - 350px.
  let startX = width - 350; 
  let startY = height / 2;
  
  translate(startX, startY);
  rotate(HALF_PI); // Rotate 90 deg clockwise to make text vertical
  
  // Text processing
  // We treat the whole text as a single string for the wave effect
  // But we replace newlines with spaces for continuity, OR treat newlines as blocks
  // The user input has newlines. Let's respect them by adding extra spacing or just joining.
  // The image shows "HERE COMES THE BOAT..." as one continuous vertical line.
  // We will join with spaces.
  let fullText = contentText.replace(/\n/g, ' ').toUpperCase();
  
  // Center alignment logic (calculated relative to rotated axis)
  let totalW = textWidth(fullText);
  let currentX = -totalW / 2; 
  
  for (let i = 0; i < fullText.length; i++) {
    let char = fullText.charAt(i);
    let cw = textWidth(char);
    
    // Wave calculation
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
  textFont('Inter'); // Always Inter for UI
  textSize(12);
  
  // Top-Left
  textAlign(LEFT, TOP);
  text("NIGHT BOAT TO CAIRO BY MADNESS.", 40, 40);
  
  // Bottom-Left
  textAlign(LEFT, BOTTOM);
  text("@holke79", 40, height - 40);
  
  // Top-Right Circle "79"
  // Position it to the left of the vertical text roughly
  // Vertical text is at width - 350. 
  // Let's put the circle at width - 350 - 50? Or aligned?
  // Image shows it top right, but left of the text.
  let cx = width - 400; 
  let cy = 60;
  
  stroke(textColor);
  strokeWeight(1);
  noFill();
  ellipse(cx, cy, 40, 40);
  
  fill(textColor);
  noStroke();
  textAlign(CENTER, CENTER);
  text("79", cx, cy + 1);
  
  pop();
}

function mouseDragged(e) {
  // Prevent drawing if on sidebar toggle or sidebar
  if (e && e.target && (e.target.closest('#sidebar') || e.target.closest('#sidebar-toggle'))) {
    return;
  }
  
  // Setup Stroke Color
  let strokeCol;
  
  if (gradientEnabled) {
    let palette = GRADIENTS[currentGradient];
    let t = map(mouseY, 0, height, 0, palette.length - 1);
    let i1 = floor(t);
    let i2 = ceil(t);
    // Handle edge case at bottom
    if (i2 >= palette.length) { i1 = palette.length - 1; i2 = palette.length - 1; }
    strokeCol = lerpColor(color(palette[i1]), color(palette[i2]), t - i1);
  } else {
    strokeCol = textColor;
  }

  // --- New Brush Logic ---
  pg.noStroke();

  // Draw a fuzzy, spray-like line
  let distance = dist(mouseX, mouseY, pmouseX, pmouseY);
  let steps = max(1, distance / (brushSize * 0.2)); // Adjust step size based on brush size

  for (let i = 0; i < steps; i++) {
    let t = i / steps;
    let x = lerp(pmouseX, mouseX, t);
    let y = lerp(pmouseY, mouseY, t);

    // Number of particles per step
    let particleCount = 10;
    for (let j = 0; j < particleCount; j++) {
      let radius = random(0, brushSize / 2);
      let angle = random(TWO_PI);
      let particleX = x + cos(angle) * radius;
      let particleY = y + sin(angle) * radius;

      let particleColor = color(strokeCol);
      // Fade out particles at the edge of the brush
      let alpha = map(radius, 0, brushSize / 2, 50, 0, true);
      particleColor.setAlpha(alpha);

      pg.fill(particleColor);
      pg.ellipse(particleX, particleY, random(2, 8), random(2, 8));
    }
  }

  // Spawn Drip and Splatter
  let ms = dist(mouseX, mouseY, pmouseX, pmouseY);
  let safeSpeed = constrain(ms, 0.1, 50);
  
  // Use a non-linear mapping for drip intensity.
  // Drips are very likely at slow speeds, but the chance drops off sharply as speed increases.
  let normSpeed = map(safeSpeed, 0, 30, 0, 1, true);
  let intensity = 1.0 - pow(normSpeed, 3);

  // Drip spawn
  let dripSpawnChance = (intensity * 0.8) + 0.05;
  if (random() < dripSpawnChance) {
    let jitterX = random(-brushSize * 0.2, brushSize * 0.2);
    let drip = new Drip(mouseX + jitterX, mouseY, strokeCol, brushSize, intensity);
    drips.push(drip);
  }

  // Splatter spawn (more likely with faster movement)
  let splatterSpawnChance = map(safeSpeed, 10, 50, 0.0, 0.2, true);
  if (random() < splatterSpawnChance) {
    let splatter = new Splatter(mouseX, mouseY, strokeCol, brushSize, ms);
    splatters.push(splatter);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let oldPg = pg;
  pg = createGraphics(windowWidth, windowHeight);
  pg.image(oldPg, 0, 0); 
}

// --- Drip Class ---
class Drip {
  constructor(x, y, col, baseWidth, intensity) {
    this.x = x;
    this.y = y;
    this.col = col;
    
    this.width = random(baseWidth * 0.2, baseWidth * 0.5); 
    this.beadSize = this.width * 1.5; 
    
    let lenMultiplier = map(intensity, 0, 1, 0.2, 1.5);
    this.maxLen = random(10, 150) * lenMultiplier; 
    
    this.baseSpeed = random(1, 3); 
    this.len = 0;
    this.highlightOffset = random(-2, 2);
  }
  
  update() {
    if (this.len < this.maxLen) {
      let progress = this.len / this.maxLen;
      let currentSpeed = this.baseSpeed * (1 - progress * 0.9) * dripSpeed;
      this.len += currentSpeed;
      if (this.len > this.maxLen) this.len = this.maxLen;
    }
  }
  
  isDone() {
    return Math.abs(this.len - this.maxLen) < 0.5;
  }
  
  display(target) {
    target.push();
    target.noStroke();
    target.fill(this.col);
    
    target.rectMode(CORNER);
    target.rect(this.x - this.width/2, this.y, this.width, this.len);
    
    let beadY = this.y + this.len;
    target.ellipse(this.x, beadY, this.beadSize, this.beadSize);
    
    // Highlight
    target.fill(255, 100);
    let highlightWidth = this.width * 0.3;
    target.rect(this.x - highlightWidth/2 + this.highlightOffset, this.y, highlightWidth, this.len);
    target.ellipse(this.x + this.beadSize * 0.2, beadY - this.beadSize * 0.2, this.beadSize * 0.3, this.beadSize * 0.3);
    
    target.pop();
  }
}

// --- Splatter Class ---
class Splatter {
  constructor(x, y, col, brushSize, speed) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.particles = [];

    let numParticles = floor(random(5, 20));
    let maxDist = brushSize * map(speed, 10, 50, 1, 3, true);

    for (let i = 0; i < numParticles; i++) {
      let angle = random(TWO_PI);
      let dist = random(brushSize * 0.5, maxDist);
      let particleX = this.x + cos(angle) * dist;
      let particleY = this.y + sin(angle) * dist;
      let particleSize = random(2, 6);
      this.particles.push({ x: particleX, y: particleY, size: particleSize });
    }
  }

  display(target) {
    target.push();
    target.noStroke();
    let splatterColor = color(this.col);
    splatterColor.setAlpha(150);
    target.fill(splatterColor);

    for (let p of this.particles) {
      target.ellipse(p.x, p.y, p.size, p.size);
    }
    target.pop();
  }
}

// Disable context menu
document.oncontextmenu = function() { return false; }
