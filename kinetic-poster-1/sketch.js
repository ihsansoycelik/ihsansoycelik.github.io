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
    container.innerHTML = '';

    let css = `
      #v1 #main-container { display: flex; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
      #v1 #canvas-container { flex: 1; display: flex; justify-content: center; align-items: center; background: ${params.bgColor}; position: relative; overflow: hidden; }
      #v1 #sidebar { width: 320px; background: rgba(30, 30, 30, 0.9); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-left: 1px solid rgba(255, 255, 255, 0.1); padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; flex-shrink: 0; box-sizing: border-box; z-index: 10; }
      #v1 .control-section { background: rgba(255, 255, 255, 0.05); border-radius: 10px; overflow: hidden; }
      #v1 .section-header { padding: 12px 14px; font-weight: 500; font-size: 13px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; }
      #v1 .section-content { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
    `;
    p.createElement('style', css).parent(container);

    mainContainer = p.createDiv().id('main-container').parent(container);
    let canvasContainer = p.createDiv().id('canvas-container').parent(mainContainer);
    let sidebar = p.createDiv().id('sidebar').parent(mainContainer);

    let sidebarWidth = 320;
    let cWidth = container.clientWidth > sidebarWidth ? container.clientWidth - sidebarWidth : container.clientWidth;
    let cHeight = container.clientHeight;
    let cnv = p.createCanvas(cWidth, cHeight);
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
    let textContent = p.createDiv().class('section-content').parent(textSection);
    p.createSpan('Content').parent(textContent);
    let txtArea = p.createElement('textarea', params.text).parent(textContent);
    txtArea.input(() => {
      params.text = txtArea.value();
      updateGeometry();
    });

    let fontContent = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('Typography').class('section-header').parent(fontContent);
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
    p.createDiv('Animation').class('section-header').parent(animContent);
    let animInnerContent = p.createDiv().class('section-content').parent(animContent);
    p.createSlider(0.01, 0.2, params.freq, 0.01).parent(animInnerContent).input((e) => params.freq = e.target.value);
    p.createSlider(0, 80, params.amp, 1).parent(animInnerContent).input((e) => params.amp = e.target.value);
    p.createSlider(0.01, 0.2, params.speed, 0.01).parent(animInnerContent).input((e) => params.speed = e.target.value);
  }

  function updateGeometry() {
    textLines = params.text.split('\n');
    generateGeometry();
  }

  p.windowResized = () => {
    const container = document.getElementById('v1');
    let sidebarWidth = 320;
    let newWidth = container.clientWidth > sidebarWidth ? container.clientWidth - sidebarWidth : container.clientWidth;
    p.resizeCanvas(newWidth, container.clientHeight);
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
    let scaleFactor = targetW / maxW;
    fontSize = testSize * scaleFactor;
    
    let totalH = textLines.length * fontSize;
    let startY = (p.height / 2) - (totalH / 2) + (fontSize * 0.75);

    for (let i = 0; i < textLines.length; i++) {
      let str = textLines[i];
      let b = currentFont.textBounds(str, 0, 0, fontSize);
      let x = (p.width / 2) - (b.w / 2);
      let y = startY + i * fontSize;

      let pts = currentFont.textToPoints(str, x, y, fontSize, { sampleFactor: 0.25 });

      let lineContours = [];
      let currentContour = [];
      if (pts.length > 0) currentContour.push(pts[0]);

      for (let j = 1; j < pts.length; j++) {
        let pt = pts[j];
        let prev = pts[j-1];
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
      for (let i = 0; i < fontData.length; i++) {
        for (let contour of fontData[i]) {
          p.fill(params.textColor);
          p.beginShape();
          for (let pt of contour) {
            let wave = p.sin(pt.y * params.freq + p.frameCount * params.speed) * params.amp;
            p.vertex(pt.x + wave, pt.y);
          }
          p.endShape(p.CLOSE);
        }
      }
    }
  }

  p.remove = () => {
      mainContainer.remove();
      document.body.style.backgroundColor = '#111';
  }
};
