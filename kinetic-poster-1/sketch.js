const sketch1 = (p) => {
  let fonts = {};
  let fontData = [];
  let textLines = ["Here", "Comes", "The", "Boat"];
  let fontSize = 100;

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
    echoCount: 5,
    echoLag: 5,
    mouseInteraction: true,
    mouseRadius: 200,
    useGradient: false,
    gradientColor1: '#FF0080',
    gradientColor2: '#FF8C00',
    useNoise: false,
    noiseIntensity: 50
  };

  let noiseImage;
  let fontLoaded = false;
  let setupComplete = false;

  p.setup = () => {
    const container = document.getElementById('v1');
    container.innerHTML = ''; // Clear previous content

    // CSS for Fullscreen + Floating Sidebar
    let css = `
      #v1 { position: relative; width: 100%; height: 100%; overflow: hidden; }
      #v1 #canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
      #v1 #sidebar-toggle {
        position: absolute; top: 20px; right: 20px; z-index: 20;
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
        color: white; display: flex; align-items: center; justify-content: center;
        cursor: pointer; backdrop-filter: blur(5px);
      }
      #v1 #sidebar {
        position: absolute; top: 70px; right: 20px; width: 300px;
        max-height: calc(100% - 90px); overflow-y: auto;
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
        padding: 16px; display: flex; flex-direction: column; gap: 16px;
        z-index: 19; transition: transform 0.3s ease, opacity 0.3s ease;
        transform: translateX(0); opacity: 1;
      }
      #v1 #sidebar.hidden { transform: translateX(120%); opacity: 0; pointer-events: none; }
      #v1 .control-section { background: rgba(255, 255, 255, 0.05); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
      #v1 .section-header { padding: 10px 14px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; }
      #v1 .section-content { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
      #v1 input[type=range] { width: 100%; cursor: pointer; }
      #v1 textarea { width: 100%; background: #222; border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; resize: vertical; min-height: 80px; box-sizing: border-box; }
      #v1 select { width: 100%; background: #222; color: white; border: 1px solid #444; padding: 8px; border-radius: 4px; }
    `;
    p.createElement('style', css).parent(container);

    let canvasContainer = p.createDiv().id('canvas-container').parent(container);
    
    // Sidebar Toggle
    let toggleBtn = p.createDiv().id('sidebar-toggle').parent(container);
    toggleBtn.html('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>');
    toggleBtn.mousePressed(() => {
        let sb = document.querySelector('#v1 #sidebar');
        sb.classList.toggle('hidden');
    });

    let sidebar = p.createDiv().id('sidebar').parent(container);

    // Full Screen Canvas
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent(canvasContainer);

    setupSidebar(sidebar);
    document.body.style.backgroundColor = params.bgColor;

    for (let key in fontUrls) {
      p.loadFont(fontUrls[key], (loadedFont) => {
        fonts[key] = loadedFont;
        if (key === currentFontName) {
          currentFont = loadedFont;
          updateGeometry();
        }
      });
    }
    createNoiseTexture();
    setupComplete = true;
  }

  function setupSidebar(sidebar) {
    let textSection = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('CONTENT').class('section-header').parent(textSection);
    let textContent = p.createDiv().class('section-content').parent(textSection);
    let txtArea = p.createElement('textarea', params.text).parent(textContent);
    txtArea.input(() => {
      params.text = txtArea.value();
      updateGeometry();
    });

    let fontContent = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('TYPOGRAPHY').class('section-header').parent(fontContent);
    let fontInnerContent = p.createDiv().class('section-content').parent(fontContent);
    let fontSelect = p.createSelect().parent(fontInnerContent);
    for (let f in fontUrls) { fontSelect.option(f); }
    fontSelect.selected(currentFontName);
    fontSelect.changed(() => {
      currentFontName = fontSelect.value();
      currentFont = fonts[currentFontName];
      updateGeometry();
    });

    let animContent = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('ANIMATION').class('section-header').parent(animContent);
    let animInnerContent = p.createDiv().class('section-content').parent(animContent);
    
    p.createDiv('Frequency').style('font-size:10px;color:#888;margin-bottom:4px;').parent(animInnerContent);
    p.createSlider(0.01, 0.2, params.freq, 0.01).parent(animInnerContent).input((e) => params.freq = e.target.value);
    
    p.createDiv('Amplitude').style('font-size:10px;color:#888;margin-bottom:4px;').parent(animInnerContent);
    p.createSlider(0, 80, params.amp, 1).parent(animInnerContent).input((e) => params.amp = e.target.value);
    
    p.createDiv('Speed').style('font-size:10px;color:#888;margin-bottom:4px;').parent(animInnerContent);
    p.createSlider(0.01, 0.2, params.speed, 0.01).parent(animInnerContent).input((e) => params.speed = e.target.value);

    p.createDiv('Echo Count').style('font-size:10px;color:#888;margin-bottom:4px;').parent(animInnerContent);
    p.createSlider(1, 20, params.echoCount, 1).parent(animInnerContent).input((e) => params.echoCount = parseInt(e.target.value));

    p.createDiv('Echo Lag').style('font-size:10px;color:#888;margin-bottom:4px;').parent(animInnerContent);
    p.createSlider(0, 30, params.echoLag, 1).parent(animInnerContent).input((e) => params.echoLag = parseInt(e.target.value));
  }

  function updateGeometry() {
    textLines = params.text.split('\n');
    generateGeometry();
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    updateGeometry();
  }

  function generateGeometry() {
    fontData = [];
    if (!currentFont) return;

    let targetW = p.width * 0.8;
    let testSize = 100;
    let maxW = 0;
    for (let str of textLines) {
      let b = currentFont.textBounds(str, 0, 0, testSize);
      if (b.w > maxW) maxW = b.w;
    }
    // Prevent divide by zero if text is empty
    if (maxW === 0) maxW = 1;

    let scaleFactor = targetW / maxW;
    fontSize = testSize * scaleFactor;
    
    // Clamp max font size so it doesn't get absurdly huge on few chars
    fontSize = p.min(fontSize, p.height / textLines.length * 0.8);

    let totalH = textLines.length * fontSize;
    let startY = (p.height / 2) - (totalH / 2) + (fontSize * 0.75);

    for (let i = 0; i < textLines.length; i++) {
      let str = textLines[i];
      let b = currentFont.textBounds(str, 0, 0, fontSize);
      let x = (p.width / 2) - (b.w / 2);
      let y = startY + i * fontSize;

      let pts = currentFont.textToPoints(str, x, y, fontSize, { sampleFactor: 0.8 });

      let lineContours = [];
      let currentContour = [];
      if (pts.length > 0) currentContour.push(pts[0]);

      for (let j = 1; j < pts.length; j++) {
        let pt = pts[j];
        let prev = pts[j - 1];
        if (p.dist(prev.x, prev.y, pt.x, pt.y) > 20) {
          lineContours.push(currentContour);
          currentContour = [];
        }
        currentContour.push(pt);
      }
      if (currentContour.length > 0) lineContours.push(currentContour);
      fontData.push(lineContours);
    }
    fontLoaded = true;
  }

  function createNoiseTexture() {
    noiseImage = p.createImage(200, 200);
    noiseImage.loadPixels();
    for (let i = 0; i < 200; i++) {
      for (let j = 0; j < 200; j++) {
        let val = p.random(255);
        noiseImage.set(i, j, p.color(val, val, val, 40));
      }
    }
    noiseImage.updatePixels();
  }

  p.draw = () => {
    p.background(params.bgColor);
    if (fontLoaded) {
      p.noStroke();

      // Echo Loop (Draw from back to front)
      for(let k = params.echoCount - 1; k >= 0; k--) {
        let lag = k * params.echoLag;
        // Fade out trailing echoes
        let alphaVal = p.map(k, 0, params.echoCount, 255, 40);
        let col = p.color(params.textColor);
        col.setAlpha(alphaVal);
        p.fill(col);

        for (let i = 0; i < fontData.length; i++) {
          for (let contour of fontData[i]) {
            p.beginShape();
            for (let pt of contour) {
              let wave = p.sin(pt.y * params.freq + (p.frameCount - lag) * params.speed) * params.amp;
              p.vertex(pt.x + wave, pt.y);
            }
            p.endShape(p.CLOSE);
          }
        }
      }
    }
  }

  p.remove = () => {
     // Cleanup if needed
     document.body.style.backgroundColor = '';
  }
};

const sketch2 = (p) => {
  let font;
  let particles = [];
  let points = [];
  let textStr = "FLOW";
  let fontSize = 200;

  p.setup = () => {
    let container = document.getElementById('v2');
    container.innerHTML = '';

    // Add canvas
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent(container);

    p.colorMode(p.HSB);

    // Load font asynchronously
    p.loadFont('assets/RubikMonoOne-Regular.ttf', (loaded) => {
        font = loaded;
        generateParticles();
    });
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    generateParticles();
  };

  function generateParticles() {
    particles = [];
    fontSize = p.width / 5;

    // Center text
    let bounds = font.textBounds(textStr, 0, 0, fontSize);
    let x = p.width / 2 - bounds.w / 2;
    let y = p.height / 2 + bounds.h / 2;

    points = font.textToPoints(textStr, x, y, fontSize, { sampleFactor: 0.15 });

    points.forEach(pt => {
      particles.push(new Particle(pt.x, pt.y));
    });
  }

  p.draw = () => {
    p.background(240, 50, 20); // Dark Blueish in HSB? No, let's use RGB or simple
    p.clear();
    p.background('#111');

    for (let particle of particles) {
      particle.behaviors();
      particle.update();
      particle.show();
    }
  };

  class Particle {
    constructor(x, y) {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.target = p.createVector(x, y);
      this.vel = p.createVector(p.random(-1, 1), p.random(-1, 1));
      this.acc = p.createVector();
      this.r = 3;
      this.maxSpeed = 10;
      this.maxForce = 1;
      this.hue = p.random(0, 50); // Warm colors
    }

    behaviors() {
      let arrive = this.arrive(this.target);
      let mouse = p.createVector(p.mouseX, p.mouseY);
      let flee = this.flee(mouse);

      arrive.mult(1);
      flee.mult(5);

      this.applyForce(arrive);
      this.applyForce(flee);
    }

    applyForce(f) {
      this.acc.add(f);
    }

    update() {
      this.pos.add(this.vel);
      this.vel.add(this.acc);
      this.acc.mult(0);
    }

    show() {
      p.noStroke();
      // Distance based color or static?
      // Let's make it interactive color
      let d = p.dist(this.pos.x, this.pos.y, p.mouseX, p.mouseY);
      let h = p.map(d, 0, 200, 150, 360);
      p.fill(h % 360, 80, 100);
      p.ellipse(this.pos.x, this.pos.y, this.r * 2);
    }

    arrive(target) {
      let desired = p5.Vector.sub(target, this.pos);
      let d = desired.mag();
      let speed = this.maxSpeed;
      if (d < 100) {
        speed = p.map(d, 0, 100, 0, this.maxSpeed);
      }
      desired.setMag(speed);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      return steer;
    }

    flee(target) {
      let desired = p5.Vector.sub(target, this.pos);
      let d = desired.mag();
      if (d < 150) {
        desired.setMag(this.maxSpeed);
        desired.mult(-1);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
      } else {
        return p.createVector(0, 0);
      }
    }
  }
};

const sketch3 = (p) => {
  let font;
  let textStr = "GLITCH";
  let fontSize = 200;
  let pg;

  p.setup = () => {
    let container = document.getElementById('v3');
    container.innerHTML = '';

    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent(container);

    // Create buffer for static text
    pg = p.createGraphics(p.width, p.height);
    pg.pixelDensity(1);

    // Load font asynchronously
    p.loadFont('assets/RubikMonoOne-Regular.ttf', (loaded) => {
        font = loaded;
        drawTextToBuffer();
    });
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    pg = p.createGraphics(p.width, p.height);
    pg.pixelDensity(1);
    drawTextToBuffer();
  };

  function drawTextToBuffer() {
    pg.background('#0022AA');
    pg.fill(255);
    pg.noStroke();
    pg.textFont(font);

    // Auto size
    fontSize = p.width / 5;
    pg.textSize(fontSize);
    pg.textAlign(p.CENTER, p.CENTER);
    pg.text(textStr, p.width/2, p.height/2);
  }

  p.draw = () => {
    p.background('#0022AA');

    let sliceHeight = 10;
    let numSlices = p.height / sliceHeight;

    for (let i = 0; i < numSlices; i++) {
       let y = i * sliceHeight;
       let offset = 0;

       let speed = 0.05;
       let distortion = 50;

       // Interactive Glitch
       let d = p.dist(p.mouseX, p.mouseY, p.width/2, y);
       if (d < 200) {
           offset = p.map(p.noise(i * 0.5, p.frameCount * 0.2), 0, 1, -distortion, distortion);
       } else {
           offset = p.sin(i * 0.05 + p.frameCount * 0.02) * 10;
       }

       // copy(srcImage, sx, sy, sw, sh, dx, dy, dw, dh)
       p.copy(pg, 0, y, p.width, sliceHeight, offset, y, p.width, sliceHeight);
    }
  };
};
