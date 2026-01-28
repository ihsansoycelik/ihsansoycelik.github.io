const sketch3 = (p) => {
  let fonts = {};
  let fontUrls = {
    'Rubik Mono One': 'assets/RubikMonoOne-Regular.ttf',
    'Anton': 'assets/Anton-Regular.ttf'
  };
  let currentFontName = 'Rubik Mono One';
  let currentFont;

  let params = {
    text: "DIGITAL\nGLITCH",
    bgColor: '#000000',
    textColor: '#00FF00',
    sliceHeight: 5,
    offsetSpeed: 0.05,
    offsetAmp: 20,
    waveFreq: 0.1,
    textSize: 150
  };

  let fontLoaded = false;
  let pg;

  p.setup = () => {
    const container = document.getElementById('v3');
    container.innerHTML = '';

    let css = `
      #v3 { position: relative; width: 100%; height: 100%; overflow: hidden; }
      #v3 #canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
      #v3 #sidebar-toggle {
        position: absolute; top: 20px; right: 20px; z-index: 20;
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
        color: white; display: flex; align-items: center; justify-content: center;
        cursor: pointer; backdrop-filter: blur(5px);
      }
      #v3 #sidebar {
        position: absolute; top: 70px; right: 20px; width: 300px;
        max-height: calc(100% - 90px); overflow-y: auto;
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
        padding: 16px; display: flex; flex-direction: column; gap: 16px;
        z-index: 19; transition: transform 0.3s ease, opacity 0.3s ease;
        transform: translateX(0); opacity: 1;
      }
      #v3 #sidebar.hidden { transform: translateX(120%); opacity: 0; pointer-events: none; }
      #v3 .control-section { background: rgba(255, 255, 255, 0.05); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
      #v3 .section-header { padding: 10px 14px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; }
      #v3 .section-content { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
      #v3 input[type=range] { width: 100%; cursor: pointer; }
      #v3 textarea { width: 100%; background: #222; border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; resize: vertical; min-height: 80px; box-sizing: border-box; }
      #v3 select { width: 100%; background: #222; color: white; border: 1px solid #444; padding: 8px; border-radius: 4px; }
    `;
    p.createElement('style', css).parent(container);

    let canvasContainer = p.createDiv().id('canvas-container').parent(container);
    let toggleBtn = p.createDiv().id('sidebar-toggle').parent(container);
    toggleBtn.html('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>');
    toggleBtn.mousePressed(() => {
        let sb = document.querySelector('#v3 #sidebar');
        sb.classList.toggle('hidden');
    });

    let sidebar = p.createDiv().id('sidebar').parent(container);

    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent(canvasContainer);

    pg = p.createGraphics(p.width, p.height);

    setupSidebar(sidebar);
    document.body.style.backgroundColor = params.bgColor;

    for (let key in fontUrls) {
      p.loadFont(fontUrls[key], (loadedFont) => {
        fonts[key] = loadedFont;
        if (key === currentFontName) {
          currentFont = loadedFont;
          fontLoaded = true;
        }
      });
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    pg.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  function setupSidebar(sidebar) {
    let textSection = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('CONTENT').class('section-header').parent(textSection);
    let textContent = p.createDiv().class('section-content').parent(textSection);
    let txtArea = p.createElement('textarea', params.text).parent(textContent);
    txtArea.input((e) => params.text = e.target.value);

    let styleSection = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('STYLE').class('section-header').parent(styleSection);
    let styleInner = p.createDiv().class('section-content').parent(styleSection);

    let colDiv = p.createDiv().style('display:flex;gap:4px').parent(styleInner);
    p.createColorPicker(params.textColor).parent(colDiv).input((e) => params.textColor = e.target.value);
    p.createColorPicker(params.bgColor).parent(colDiv).input((e) => {
        params.bgColor = e.target.value;
        document.body.style.backgroundColor = params.bgColor;
    });

    p.createDiv('Text Size').style('font-size:10px;color:#888;').parent(styleInner);
    p.createSlider(50, 300, params.textSize, 10).parent(styleInner).input((e) => params.textSize = parseInt(e.target.value));

    let glContent = p.createDiv().class('control-section').parent(sidebar);
    p.createDiv('GLITCH').class('section-header').parent(glContent);
    let glInner = p.createDiv().class('section-content').parent(glContent);

    p.createDiv('Slice Height').style('font-size:10px;color:#888;').parent(glInner);
    p.createSlider(1, 50, params.sliceHeight, 1).parent(glInner).input((e) => params.sliceHeight = parseInt(e.target.value));

    p.createDiv('Offset Amplitude').style('font-size:10px;color:#888;').parent(glInner);
    p.createSlider(0, 200, params.offsetAmp, 1).parent(glInner).input((e) => params.offsetAmp = parseInt(e.target.value));

    p.createDiv('Wave Frequency').style('font-size:10px;color:#888;').parent(glInner);
    p.createSlider(0.01, 0.5, params.waveFreq, 0.01).parent(glInner).input((e) => params.waveFreq = parseFloat(e.target.value));

    p.createDiv('Speed').style('font-size:10px;color:#888;').parent(glInner);
    p.createSlider(0, 0.5, params.offsetSpeed, 0.01).parent(glInner).input((e) => params.offsetSpeed = parseFloat(e.target.value));
  }

  p.draw = () => {
    if (!fontLoaded) return;

    // 1. Draw to Buffer
    pg.background(params.bgColor);
    pg.fill(params.textColor);
    pg.textFont(currentFont);
    pg.textSize(params.textSize);
    pg.textAlign(p.CENTER, p.CENTER);
    pg.textLeading(params.textSize * 0.9);
    pg.text(params.text, pg.width/2, pg.height/2);

    // 2. Render Slices
    p.background(params.bgColor);

    let sh = params.sliceHeight;
    // Avoid infinite loop if 0
    if(sh < 1) sh = 1;

    for (let y = 0; y < p.height; y += sh) {
        // Calculate offset
        // Use a sine wave based on y and time
        let wave = p.sin(y * params.waveFreq + p.frameCount * params.offsetSpeed);
        let offset = wave * params.offsetAmp;

        // Draw slice
        p.image(pg, offset, y, p.width, sh, 0, y, p.width, sh);
    }
  }
};
