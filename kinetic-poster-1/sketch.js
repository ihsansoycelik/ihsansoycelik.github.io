const sketch = (p) => {
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
  let mainContainer;

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

    // ECHO SECTION
    let echoContent = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('ECHO').class('section-header').parent(echoContent);
    let echoInner = p.createDiv().class('section-content').parent(echoContent);

    p.createDiv('Count').style('font-size:10px;color:#888;margin-bottom:4px;').parent(echoInner);
    p.createSlider(1, 10, params.echoCount, 1).parent(echoInner).input((e) => params.echoCount = parseInt(e.target.value));

    p.createDiv('Lag').style('font-size:10px;color:#888;margin-bottom:4px;').parent(echoInner);
    p.createSlider(0, 20, params.echoLag, 1).parent(echoInner).input((e) => params.echoLag = parseInt(e.target.value));

    // INTERACTION SECTION
    let interContent = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('INTERACTION').class('section-header').parent(interContent);
    let interInner = p.createDiv().class('section-content').parent(interContent);

    let row1 = p.createDiv().style('display:flex;justify-content:space-between;align-items:center;').parent(interInner);
    p.createSpan('Mouse Interaction').style('font-size:12px;color:#ccc;').parent(row1);
    p.createCheckbox('', params.mouseInteraction).parent(row1).changed(function() { params.mouseInteraction = this.checked(); });

    p.createDiv('Radius').style('font-size:10px;color:#888;margin-bottom:4px;margin-top:8px;').parent(interInner);
    p.createSlider(50, 500, params.mouseRadius, 10).parent(interInner).input((e) => params.mouseRadius = parseInt(e.target.value));

    // STYLE SECTION
    let styleContent = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('STYLE').class('section-header').parent(styleContent);
    let styleInner = p.createDiv().class('section-content').parent(styleContent);

    let row2 = p.createDiv().style('display:flex;justify-content:space-between;align-items:center;').parent(styleInner);
    p.createSpan('Use Gradient').style('font-size:12px;color:#ccc;').parent(row2);
    p.createCheckbox('', params.useGradient).parent(row2).changed(function() { params.useGradient = this.checked(); });

    let row3 = p.createDiv().style('display:flex;justify-content:space-between;align-items:center;margin-top:8px;').parent(styleInner);
    p.createSpan('Use Noise').style('font-size:12px;color:#ccc;').parent(row3);
    p.createCheckbox('', params.useNoise).parent(row3).changed(function() { params.useNoise = this.checked(); });
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

      let echoCount = params.echoCount;
      let echoLag = params.echoLag;

      // Draw echoes from back to front
      for (let e = echoCount - 1; e >= 0; e--) {
        let alpha = p.map(e, 0, echoCount, 255, 60);
        let currentFill;

        if (!params.useGradient) {
           currentFill = p.color(params.textColor);
           currentFill.setAlpha(alpha);
        }

        for (let i = 0; i < fontData.length; i++) {
          for (let contour of fontData[i]) {

            // Gradient Logic
            if (params.useGradient) {
               if (contour.length > 0) {
                  let y = contour[0].y;
                  let inter = p.map(y, p.height/4, p.height*0.75, 0, 1);
                  inter = p.constrain(inter, 0, 1);
                  let c1 = p.color(params.gradientColor1);
                  let c2 = p.color(params.gradientColor2);
                  currentFill = p.lerpColor(c1, c2, inter);
                  currentFill.setAlpha(alpha);
               } else {
                  currentFill = p.color(params.gradientColor1);
                  currentFill.setAlpha(alpha);
               }
            }

            p.fill(currentFill);
            p.beginShape();
            for (let pt of contour) {
              // Wave Animation with Lag
              let effectiveFrame = p.frameCount - (e * echoLag);

              let wave = p.sin(pt.y * params.freq + effectiveFrame * params.speed) * params.amp;

              let mx = pt.x + wave;
              let my = pt.y;

              // Mouse Interaction
              if (params.mouseInteraction) {
                 let d = p.dist(p.mouseX, p.mouseY, mx, my);
                 if (d < params.mouseRadius) {
                    let angle = p.atan2(my - p.mouseY, mx - p.mouseX);
                    let force = (1 - d / params.mouseRadius) * 50;
                    mx += p.cos(angle) * force;
                    my += p.sin(angle) * force;
                 }
              }

              p.vertex(mx, my);
            }
            p.endShape(p.CLOSE);
          }
        }
      }

      // Noise Overlay
      if (params.useNoise && noiseImage) {
        p.push();
        p.blendMode(p.OVERLAY);
        p.tint(255, params.noiseIntensity * 2.55);
        p.image(noiseImage, 0, 0, p.width, p.height);
        p.pop();
      }
    }
  }

  p.remove = () => {
     // Cleanup if needed
     document.body.style.backgroundColor = '';
  }
};