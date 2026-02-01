const sketch3 = (p) => {
  let pg;
  let font;
  let params = {
    text: "GLITCH\nMODE",
    fontSize: 150,
    scanSpeed: 5,
    scanFreq: 0.02,
    scanAmp: 50,
    bgColor: '#000000',
    textColor: '#FFFFFF'
  };

  p.setup = () => {
    let container = document.getElementById('v3');
    container.innerHTML = '';

    let css = `
      #v3 { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${params.bgColor}; }
      #v3 canvas { display: block; position: absolute; top: 0; left: 0; z-index: 1; }
      #v3 .controls {
        position: absolute; bottom: 20px; right: 20px; z-index: 10;
        background: rgba(0,0,0,0.7); padding: 15px; border-radius: 8px;
        color: white; font-family: monospace; display: flex; flex-direction: column; gap: 10px;
        backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.2); text-align: right;
      }
      #v3 input[type=range] { width: 150px; cursor: pointer; }
      #v3 label { display: flex; justify-content: flex-end; gap: 10px; font-size: 12px; align-items: center; }
    `;
    p.createElement('style', css).parent(container);
    p.createCanvas(p.windowWidth, p.windowHeight).parent(container);

    pg = p.createGraphics(p.windowWidth, p.windowHeight);

    // Controls
    let ctrlDiv = p.createDiv().class('controls').parent(container);

    let textInput = p.createInput(params.text).parent(ctrlDiv);
    textInput.style('background', '#222').style('color', '#fff').style('border', '1px solid #444').style('padding', '5px').style('margin-bottom', '10px');
    textInput.input(() => {
        params.text = textInput.value().replace(/\\n/g, '\n');
        updatePG();
    });

    const createControl = (label, min, max, val, step, key) => {
        let l = p.createElement('label', label).parent(ctrlDiv);
        let s = p.createSlider(min, max, val, step).parent(l);
        s.input(() => {
            params[key] = s.value();
            if(key === 'fontSize') updatePG();
        });
    };

    createControl('Speed', 0, 20, params.scanSpeed, 0.1, 'scanSpeed');
    createControl('Frequency', 0.001, 0.1, params.scanFreq, 0.001, 'scanFreq');
    createControl('Amplitude', 0, 200, params.scanAmp, 1, 'scanAmp');
    createControl('Font Size', 50, 400, params.fontSize, 10, 'fontSize');

    p.loadFont('assets/RubikMonoOne-Regular.ttf', f => {
      font = f;
      updatePG();
    });
  }

  function updatePG() {
    if(!pg || !font) return;
    pg.clear();
    // pg.background(params.bgColor); // Transparent background allows layering if needed, but let's stick to simple
    // Actually if we want bgColor to be consistent, we just clear and let draw handle bg.
    // But we are copying pixels. If PG is transparent, we copy transparency?
    // Yes.

    pg.fill(params.textColor);
    pg.textFont(font);
    pg.textSize(params.fontSize);
    pg.textAlign(p.CENTER, p.CENTER);
    pg.textLeading(params.fontSize * 1.0);
    pg.text(params.text, pg.width/2, pg.height/2);
  }

  p.draw = () => {
    p.background(params.bgColor);

    if (!font) return;

    let h = p.height;
    let w = p.width;
    let stripHeight = 4;

    for (let y = 0; y < h; y += stripHeight) {
      let xOffset = p.sin(y * params.scanFreq + p.frameCount * params.scanSpeed * 0.01) * params.scanAmp;

      // Draw strip
      p.image(pg, xOffset, y, w, stripHeight, 0, y, w, stripHeight);

      // Wrap horizontal
      if (xOffset > 0) {
         p.image(pg, xOffset - w, y, w, stripHeight, 0, y, w, stripHeight);
      } else if (xOffset < 0) {
         p.image(pg, xOffset + w, y, w, stripHeight, 0, y, w, stripHeight);
      }
    }
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    pg.resizeCanvas(p.windowWidth, p.windowHeight);
    updatePG();
  }
};
