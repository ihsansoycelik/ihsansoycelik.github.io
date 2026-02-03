const sketch3 = (p) => {
  let pg;
  let font;
  let txt = "GLITCH";
  let fontSize = 150;

  p.preload = () => {
    font = p.loadFont('assets/RubikMonoOne-Regular.ttf');
  };

  p.setup = () => {
    const container = document.getElementById('v3');
    container.innerHTML = '';
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent(container);

    initPG();
  };

  function initPG() {
    pg = p.createGraphics(p.width, p.height);
    pg.textFont(font);
    pg.textSize(fontSize);
    pg.textAlign(p.CENTER, p.CENTER);
    pg.noStroke();
    pg.fill(255);
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    initPG();
  };

  p.draw = () => {
    p.background(0);

    // Update PG
    pg.clear();
    // pg.background(0); // Transparent background is better for reuse? No, need black BG for slit scan usually or just clear.
    // If we want black bg on main canvas, and white text.

    // Draw Text to PG
    pg.push();
    pg.translate(p.width/2, p.height/2);
    // Add some internal jitter to text
    let scaleOsc = p.sin(p.frameCount * 0.05) * 0.1 + 1;
    pg.scale(scaleOsc);
    pg.fill(255);
    pg.text(txt, 0, 0);
    pg.pop();

    // Slit Scan / Wave Effect
    let strips = 100;
    let stripHeight = p.height / strips;

    for (let i = 0; i < strips; i++) {
      let y = i * stripHeight;

      // Calculate offset
      // Wave based on time and y position
      let phase = p.frameCount * 0.05 + i * 0.1;
      let offset = p.sin(phase) * 20;

      // Mouse interaction: horizontal distortion
      let distFromCenterY = p.abs(y - p.mouseY);
      let mouseEffect = p.map(distFromCenterY, 0, 300, 50, 0, true);
      if (p.mouseIsPressed) mouseEffect *= 2;

      offset += p.sin(i * 0.5) * mouseEffect * (p.mouseX / p.width - 0.5);

      // Source rectangle from PG
      // sx, sy, sw, sh
      let sx = 0;
      let sy = y;
      let sw = p.width;
      let sh = stripHeight;

      // Destination rectangle on Canvas
      // dx, dy, dw, dh
      let dx = offset;
      let dy = y;
      let dw = p.width;
      let dh = stripHeight;

      p.image(pg, dx, dy, dw, dh, sx, sy, sw, sh);
    }
  };
};
