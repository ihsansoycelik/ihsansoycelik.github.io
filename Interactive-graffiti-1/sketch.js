// Global variables
let pg; // Off-screen graphics buffer for static trails
let drips = []; // Array to hold active Drip objects
let splats = []; // Array to hold active Splat objects
let uiFont;

// UI State Variables
let contentText = "Here\nComes\nThe\nBoat";
let selectedFont = "Inter";
let bgColor;
let bgImage; // Background image variable
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

  bind('bg-image-upload', 'change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      loadImage(url, (img) => {
        bgImage = img;
      });
    }
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
  });
}

function draw() {
  background(bgColor);

  // Draw background image if available
  if (bgImage) {
    let scale = Math.max(width / bgImage.width, height / bgImage.height);
    let w = bgImage.width * scale;
    let h = bgImage.height * scale;
    let x = (width - w) / 2;
    let y = (height - h) / 2;
    image(bgImage, x, y, w, h);
  }
  
  // 1. Process and draw splats (these are drawn once, immediately)
  for (let i = splats.length - 1; i >= 0; i--) {
    let s = splats[i];
    s.display(pg); // Immediately draw to the off-screen buffer
    splats.splice(i, 1); // Remove after drawing
  }

  // 2. Draw static buffer
  image(pg, 0, 0);
  
  // 3. Update and draw active drips
  for (let i = drips.length - 1; i >= 0; i--) {
    let d = drips[i];
    d.update();
    d.display(window); // Draw to main canvas for live animation
    
    if (d.isDone()) {
      d.display(pg); // Stamp final state to buffer
      drips.splice(i, 1);
    }
  }
  
  // 4. Draw Kinetic Text
  drawKineticText();
  
  // 5. Draw Static UI Overlays (Corners)
  drawStaticOverlays();
}

function mouseDragged(e) {
  // Prevent drawing if on sidebar toggle or sidebar
  if (e && e.target && (e.target.closest('#sidebar') || e.target.closest('#sidebar-toggle'))) {
    return;
  }
  
  // Setup Stroke Color
  let baseColor;
  
  if (gradientEnabled) {
    let palette = GRADIENTS[currentGradient];
    let t = map(mouseY, 0, height, 0, palette.length - 1);
    let i1 = floor(t);
    let i2 = ceil(t);
    if (i2 >= palette.length) { i1 = palette.length - 1; i2 = palette.length - 1; }
    baseColor = lerpColor(color(palette[i1]), color(palette[i2]), t - i1);
  } else {
    baseColor = textColor;
  }

  // --- Particle Brush Logic ---
  pg.noStroke();
  let d = dist(mouseX, mouseY, pmouseX, pmouseY);
  let steps = d * 2;
  for (let i = 0; i < steps; i++) {
    let t = i / steps;
    let x = lerp(pmouseX, mouseX, t);
    let y = lerp(pmouseY, mouseY, t);

    let particleCount = brushSize * 0.5;
    for (let j = 0; j < particleCount; j++) {
      let offsetX = randomGaussian(0, brushSize * 0.25);
      let offsetY = randomGaussian(0, brushSize * 0.25);
      let particleSize = random(brushSize * 0.05, brushSize * 0.2);
      let particleAlpha = random(10, 50);
      let c = color(baseColor);
      c.setAlpha(particleAlpha);
      pg.fill(c);
      pg.ellipse(x + offsetX, y + offsetY, particleSize, particleSize);
    }

    let highlightCount = brushSize * 0.1;
    for (let j = 0; j < highlightCount; j++) {
        let offsetX = randomGaussian(0, brushSize * 0.2);
        let offsetY = randomGaussian(0, brushSize * 0.2);
        let particleSize = random(brushSize * 0.02, brushSize * 0.1);
        let particleAlpha = random(20, 70);
        pg.fill(255, particleAlpha);
        pg.ellipse(x + offsetX, y + offsetY, particleSize, particleSize);
    }
  }
  
  // --- Spawn Effects Logic ---
  let ms = dist(mouseX, mouseY, pmouseX, pmouseY);
  let safeSpeed = constrain(ms, 0.1, 50);

  // Spawn Drip
  let intensity = map(safeSpeed, 0, 30, 1.0, 0.0, true);
  let spawnChance = (intensity * 0.8) + 0.05;
  if (random() < spawnChance) {
    let jitterX = random(-brushSize * 0.2, brushSize * 0.2);
    drips.push(new Drip(mouseX + jitterX, mouseY, baseColor, brushSize, intensity));
  }

  // Spawn Splat
  let splatChance = map(safeSpeed, 15, 50, 0, 0.15, true); // Chance increases with speed
  if(random() < splatChance) {
    splats.push(new Splat(mouseX, mouseY, baseColor, brushSize, safeSpeed));
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
    
    // Main drip color
    let c = color(this.col);
    target.fill(c);
    
    let beadY = this.y + this.len;
    let numPoints = 10; // More points for a smoother curve

    target.beginShape();
    // Start point (top-left of the drip's base)
    target.curveVertex(this.x - this.width / 2, this.y);
    
    // Define the left edge of the drip
    for (let i = 0; i <= numPoints; i++) {
      let t = i / numPoints;
      let y = lerp(this.y, beadY, t);
      // Use easing to make the drip taper and then bulge into the bead
      let w = lerp(this.width, this.beadSize, pow(t, 1.5));
      let jitter = (1 - t) * randomGaussian(0, this.width * 0.05);
      target.curveVertex(this.x - w / 2 + jitter, y);
    }
    // Point at the very bottom of the bead
    target.curveVertex(this.x, beadY + this.beadSize * 0.3);

    // Define the right edge of the drip (mirroring the left)
    for (let i = numPoints; i >= 0; i--) {
      let t = i / numPoints;
      let y = lerp(this.y, beadY, t);
      let w = lerp(this.width, this.beadSize, pow(t, 1.5));
      let jitter = (1 - t) * randomGaussian(0, this.width * 0.05);
      target.curveVertex(this.x + w / 2 + jitter, y);
    }

    // End point (top-right of the drip's base)
    target.curveVertex(this.x + this.width / 2, this.y);
    target.endShape(CLOSE);

    // Highlight
    c.setAlpha(100);
    target.fill(255, 100);
    let highlightWidth = this.width * 0.3;
    let beadHighlightSize = this.beadSize * 0.4;

    // Draw a simple highlight shape
    target.beginShape();
    target.vertex(this.x - highlightWidth / 2 + this.highlightOffset, this.y);
    target.vertex(this.x + highlightWidth / 2 + this.highlightOffset, this.y);
    target.vertex(this.x + beadHighlightSize / 2 + this.highlightOffset, beadY);
    target.vertex(this.x - beadHighlightSize / 2 + this.highlightOffset, beadY);
    target.endShape(CLOSE);

    target.ellipse(this.x + this.beadSize * 0.2, beadY - this.beadSize * 0.2, this.beadSize * 0.3, this.beadSize * 0.3);

    target.pop();
  }
}

// --- Splat Class ---
class Splat {
  constructor(x, y, col, baseWidth, speed) {
    this.x = x;
    this.y = y;
    this.col = col;

    // Splats are larger and more irregular based on speed
    this.radius = baseWidth * map(speed, 10, 50, 0.5, 2.0, true);
    this.particles = [];

    let particleCount = int(random(10, 30));
    for (let i = 0; i < particleCount; i++) {
      let angle = random(TWO_PI);
      // Let particles fly out further based on speed
      let r = randomGaussian(0, this.radius * 0.5);
      let pX = this.x + cos(angle) * r;
      let pY = this.y + sin(angle) * r;
      let pSize = random(this.radius * 0.1, this.radius * 0.3);
      this.particles.push({ x: pX, y: pY, size: pSize });
    }
  }

  // Splats are drawn once to the off-screen buffer
  display(target) {
    target.push();
    target.noStroke();

    let baseColor = color(this.col);

    for (let p of this.particles) {
        let alpha = random(80, 150);
        baseColor.setAlpha(alpha);
        target.fill(baseColor);
        target.ellipse(p.x, p.y, p.size, p.size);
    }
    
    target.pop();
  }
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

// Disable context menu
document.oncontextmenu = function() { return false; }
