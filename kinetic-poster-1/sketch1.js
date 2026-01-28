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

    // STYLE SECTION
    let styleContent = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('STYLE').class('section-header').parent(styleContent);
    let styleInner = p.createDiv().class('section-content').parent(styleContent);

    // Gradient
    let gradDiv = p.createDiv().style('display:flex;align-items:center;gap:8px;').parent(styleInner);
    let gradCheck = p.createCheckbox('', params.useGradient).parent(gradDiv);
    gradCheck.changed(() => params.useGradient = gradCheck.checked());
    p.createSpan('Gradient').style('font-size:12px').parent(gradDiv);

    let colDiv = p.createDiv().style('display:flex;gap:4px').parent(styleInner);
    p.createColorPicker(params.gradientColor1).parent(colDiv).input((e) => params.gradientColor1 = e.target.value);
    p.createColorPicker(params.gradientColor2).parent(colDiv).input((e) => params.gradientColor2 = e.target.value);

    // Noise
    let noiseDiv = p.createDiv().style('display:flex;align-items:center;gap:8px;margin-top:8px').parent(styleInner);
    let noiseCheck = p.createCheckbox('', params.useNoise).parent(noiseDiv);
    noiseCheck.changed(() => params.useNoise = noiseCheck.checked());
    p.createSpan('Noise').style('font-size:12px').parent(noiseDiv);

    p.createSlider(0, 255, params.noiseIntensity, 1).parent(styleInner).input((e) => params.noiseIntensity = e.target.value);

    // EFFECTS SECTION (Echo & Interaction)
    let fxContent = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('EFFECTS').class('section-header').parent(fxContent);
    let fxInner = p.createDiv().class('section-content').parent(fxContent);

    p.createDiv('Echo Count').style('font-size:10px;color:#888;margin-bottom:4px;').parent(fxInner);
    p.createSlider(1, 10, params.echoCount, 1).parent(fxInner).input((e) => params.echoCount = e.target.value);

    p.createDiv('Echo Lag').style('font-size:10px;color:#888;margin-bottom:4px;').parent(fxInner);
    p.createSlider(1, 20, params.echoLag, 1).parent(fxInner).input((e) => params.echoLag = e.target.value);

    let mouseDiv = p.createDiv().style('display:flex;align-items:center;gap:8px;margin-top:8px').parent(fxInner);
    let mouseCheck = p.createCheckbox('', params.mouseInteraction).parent(mouseDiv);
    mouseCheck.changed(() => params.mouseInteraction = mouseCheck.checked());
    p.createSpan('Mouse Interaction').style('font-size:12px').parent(mouseDiv);
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
    if (!fontLoaded) return;

    p.noStroke();

    // Setup Gradient if enabled
    if (params.useGradient) {
      // Calculate bounds to map gradient
      let gradient = p.drawingContext.createLinearGradient(0, 0, 0, p.height);
      gradient.addColorStop(0, params.gradientColor1);
      gradient.addColorStop(1, params.gradientColor2);
      p.drawingContext.fillStyle = gradient;
    } else {
      p.fill(params.textColor);
    }

    let loops = params.echoCount;
    // Limit loops to avoid performance kill
    if (loops < 1) loops = 1;
    if (loops > 20) loops = 20;

    for (let k = loops - 1; k >= 0; k--) {
       // Alpha for echo
       if (!params.useGradient) {
         let c = p.color(params.textColor);
         // Main layer (k=0) is opaque, others transparent
         let alpha = k === 0 ? 255 : p.map(k, 0, loops, 100, 0);
         c.setAlpha(alpha);
         p.fill(c);
       } else {
          // If gradient, we can't easily set alpha on the canvas gradient object per draw.
          // We might need to use globalAlpha
          p.drawingContext.globalAlpha = k === 0 ? 1.0 : p.map(k, 0, loops, 0.4, 0);
       }

       let timeOffset = k * params.echoLag;

       for (let i = 0; i < fontData.length; i++) {
        for (let contour of fontData[i]) {
          p.beginShape();
          for (let pt of contour) {
            // Wave
            let wave = p.sin(pt.y * params.freq + (p.frameCount - timeOffset) * params.speed) * params.amp;

            let vx = pt.x + wave;
            let vy = pt.y;

            // Mouse Interaction
            if (params.mouseInteraction) {
                let d = p.dist(vx, vy, p.mouseX, p.mouseY);
                if (d < params.mouseRadius) {
                    let angle = p.atan2(vy - p.mouseY, vx - p.mouseX);
                    let force = p.map(d, 0, params.mouseRadius, 50, 0); // Repel
                    vx += p.cos(angle) * force;
                    vy += p.sin(angle) * force;
                }
            }

            p.vertex(vx, vy);
          }
          p.endShape(p.CLOSE);
        }
      }
    }
    p.drawingContext.globalAlpha = 1.0; // Reset

    // Noise Overlay
    if (params.useNoise && noiseImage) {
        p.push();
        p.blendMode(p.OVERLAY);
        p.tint(255, params.noiseIntensity); // Alpha controls intensity
        p.image(noiseImage, 0, 0, p.width, p.height);
        p.pop();
    }
  }

  p.remove = () => {
     // Cleanup if needed
     document.body.style.backgroundColor = '';
  }
};