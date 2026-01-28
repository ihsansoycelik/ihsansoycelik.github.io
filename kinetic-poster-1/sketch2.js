const sketch2 = (p) => {
  let fonts = {};
  let particles = [];
  let fontUrls = {
    'Rubik Mono One': 'assets/RubikMonoOne-Regular.ttf',
    'Anton': 'assets/Anton-Regular.ttf'
  };
  let currentFontName = 'Rubik Mono One';
  let currentFont;

  let params = {
    text: "PARTICLE\nSYSTEM",
    bgColor: '#111111',
    particleColor: '#00FF88',
    particleSize: 4,
    mouseRadius: 100,
    repulsionForce: 10,
    friction: 0.85
  };

  let fontLoaded = false;

  p.setup = () => {
    const container = document.getElementById('v2');
    container.innerHTML = '';

    let css = `
      #v2 { position: relative; width: 100%; height: 100%; overflow: hidden; }
      #v2 #canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
      #v2 #sidebar-toggle {
        position: absolute; top: 20px; right: 20px; z-index: 20;
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
        color: white; display: flex; align-items: center; justify-content: center;
        cursor: pointer; backdrop-filter: blur(5px);
      }
      #v2 #sidebar {
        position: absolute; top: 70px; right: 20px; width: 300px;
        max-height: calc(100% - 90px); overflow-y: auto;
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
        padding: 16px; display: flex; flex-direction: column; gap: 16px;
        z-index: 19; transition: transform 0.3s ease, opacity 0.3s ease;
        transform: translateX(0); opacity: 1;
      }
      #v2 #sidebar.hidden { transform: translateX(120%); opacity: 0; pointer-events: none; }
      #v2 .control-section { background: rgba(255, 255, 255, 0.05); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
      #v2 .section-header { padding: 10px 14px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; }
      #v2 .section-content { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
      #v2 input[type=range] { width: 100%; cursor: pointer; }
      #v2 textarea { width: 100%; background: #222; border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; resize: vertical; min-height: 80px; box-sizing: border-box; }
      #v2 select { width: 100%; background: #222; color: white; border: 1px solid #444; padding: 8px; border-radius: 4px; }
    `;
    p.createElement('style', css).parent(container);

    let canvasContainer = p.createDiv().id('canvas-container').parent(container);
    let toggleBtn = p.createDiv().id('sidebar-toggle').parent(container);
    toggleBtn.html('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>');
    toggleBtn.mousePressed(() => {
        let sb = document.querySelector('#v2 #sidebar');
        sb.classList.toggle('hidden');
    });

    let sidebar = p.createDiv().id('sidebar').parent(container);
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent(canvasContainer);

    setupSidebar(sidebar);
    document.body.style.backgroundColor = params.bgColor;

    for (let key in fontUrls) {
      p.loadFont(fontUrls[key], (loadedFont) => {
        fonts[key] = loadedFont;
        if (key === currentFontName) {
          currentFont = loadedFont;
          generateParticles();
        }
      });
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    generateParticles();
  };

  function setupSidebar(sidebar) {
    let textSection = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('CONTENT').class('section-header').parent(textSection);
    let textContent = p.createDiv().class('section-content').parent(textSection);
    let txtArea = p.createElement('textarea', params.text).parent(textContent);
    txtArea.input(() => {
      params.text = txtArea.value();
      generateParticles();
    });

    let styleSection = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('APPEARANCE').class('section-header').parent(styleSection);
    let styleInner = p.createDiv().class('section-content').parent(styleSection);

    p.createDiv('Particle Size').style('font-size:10px;color:#888;').parent(styleInner);
    p.createSlider(1, 10, params.particleSize, 0.5).parent(styleInner).input((e) => params.particleSize = parseFloat(e.target.value));

    let colDiv = p.createDiv().style('display:flex;gap:4px').parent(styleInner);
    p.createColorPicker(params.particleColor).parent(colDiv).input((e) => params.particleColor = e.target.value);
    p.createColorPicker(params.bgColor).parent(colDiv).input((e) => {
       params.bgColor = e.target.value;
       document.body.style.backgroundColor = params.bgColor;
    });

    let physSection = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('PHYSICS').class('section-header').parent(physSection);
    let physInner = p.createDiv().class('section-content').parent(physSection);

    p.createDiv('Mouse Radius').style('font-size:10px;color:#888;').parent(physInner);
    p.createSlider(50, 400, params.mouseRadius, 10).parent(physInner).input((e) => params.mouseRadius = parseFloat(e.target.value));

    p.createDiv('Repulsion Force').style('font-size:10px;color:#888;').parent(physInner);
    p.createSlider(0, 50, params.repulsionForce, 1).parent(physInner).input((e) => params.repulsionForce = parseFloat(e.target.value));
  }

  function generateParticles() {
    if (!currentFont) return;
    particles = [];

    let textLines = params.text.split('\n');
    let targetW = p.width * 0.8;
    let testSize = 100;
    let maxW = 0;
    for (let str of textLines) {
      let b = currentFont.textBounds(str, 0, 0, testSize);
      if (b.w > maxW) maxW = b.w;
    }
    if (maxW === 0) maxW = 1;
    let fontSize = testSize * (targetW / maxW);
    fontSize = p.min(fontSize, p.height / textLines.length * 0.8);

    let totalH = textLines.length * fontSize;
    let startY = (p.height / 2) - (totalH / 2) + (fontSize * 0.75);

    for (let i = 0; i < textLines.length; i++) {
      let str = textLines[i];
      let b = currentFont.textBounds(str, 0, 0, fontSize);
      let x = (p.width / 2) - (b.w / 2);
      let y = startY + i * fontSize;

      let pts = currentFont.textToPoints(str, x, y, fontSize, { sampleFactor: 0.15 });

      for (let pt of pts) {
        particles.push(new Particle(pt.x, pt.y));
      }
    }
    fontLoaded = true;
  }

  class Particle {
    constructor(x, y) {
      this.target = p.createVector(x, y);
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.vel = p.createVector(0, 0);
      this.acc = p.createVector(0, 0);
      this.maxSpeed = 15;
      this.maxForce = 1.0;
    }

    update() {
      this.behaviors();
      this.vel.add(this.acc);
      this.pos.add(this.vel);
      this.acc.mult(0);
      this.vel.mult(params.friction);
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

    arrive(target) {
      let desired = target.copy().sub(this.pos);
      let d = desired.mag();
      let speed = this.maxSpeed;
      if (d < 100) {
        speed = p.map(d, 0, 100, 0, this.maxSpeed);
      }
      desired.setMag(speed);
      let steer = desired.sub(this.vel);
      steer.limit(this.maxForce);
      return steer;
    }

    flee(target) {
      let desired = target.copy().sub(this.pos);
      let d = desired.mag();
      if (d < params.mouseRadius) {
        desired.setMag(this.maxSpeed);
        desired.mult(-1);
        let steer = desired.sub(this.vel);
        steer.limit(this.maxForce);
        return steer;
      } else {
        return p.createVector(0, 0);
      }
    }

    display() {
      p.noStroke();
      p.fill(params.particleColor);
      p.ellipse(this.pos.x, this.pos.y, params.particleSize, params.particleSize);
    }
  }

  p.draw = () => {
    p.background(params.bgColor);
    if (!fontLoaded) return;

    for (let part of particles) {
      part.update();
      part.display();
    }
  }
};
