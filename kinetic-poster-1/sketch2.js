const sketch2 = (p) => {
  let font;
  let particles = [];

  let params = {
    text: "TOUCH\nME",
    sampleFactor: 0.15,
    particleSize: 4,
    mouseRadius: 150,
    maxForce: 1,
    maxSpeed: 10,
    bgColor: '#111111',
    particleColor: '#00FF88'
  };

  class Particle {
    constructor(x, y) {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.target = p.createVector(x, y);
      this.vel = p5.Vector.random2D();
      this.acc = p.createVector();
      this.r = params.particleSize;
    }

    update() {
      this.pos.add(this.vel);
      this.vel.add(this.acc);
      this.acc.mult(0);
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
      let desired = p5.Vector.sub(target, this.pos);
      let d = desired.mag();
      let speed = params.maxSpeed;
      if (d < 100) {
        speed = p.map(d, 0, 100, 0, params.maxSpeed);
      }
      desired.setMag(speed);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(params.maxForce);
      return steer;
    }

    flee(target) {
      let desired = p5.Vector.sub(target, this.pos);
      let d = desired.mag();
      if (d < params.mouseRadius) {
        desired.setMag(params.maxSpeed);
        desired.mult(-1);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(params.maxForce);
        return steer;
      } else {
        return p.createVector(0, 0);
      }
    }

    show() {
      p.stroke(params.particleColor);
      p.strokeWeight(params.particleSize);
      p.point(this.pos.x, this.pos.y);
    }
  }

  p.setup = () => {
    let container = document.getElementById('v2');
    container.innerHTML = '';

    let css = `
      #v2 { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${params.bgColor}; }
      #v2 canvas { display: block; position: absolute; top: 0; left: 0; z-index: 1; }
      #v2 .controls {
        position: absolute; bottom: 20px; left: 20px; z-index: 10;
        background: rgba(0,0,0,0.7); padding: 15px; border-radius: 8px;
        color: white; font-family: monospace; display: flex; flex-direction: column; gap: 10px;
        backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.2);
      }
      #v2 input[type=range] { width: 150px; cursor: pointer; }
      #v2 label { display: flex; justify-content: space-between; font-size: 12px; }
    `;
    p.createElement('style', css).parent(container);

    p.createCanvas(p.windowWidth, p.windowHeight).parent(container);

    // Controls
    let ctrlDiv = p.createDiv().class('controls').parent(container);

    // Text Input
    let textInput = p.createInput(params.text).parent(ctrlDiv);
    textInput.style('background', '#222').style('color', '#fff').style('border', '1px solid #444').style('padding', '5px');
    textInput.input(() => {
        params.text = textInput.value().replace(/\\n/g, '\n');
        initParticles();
    });

    // Color
    let colInput = p.createColorPicker(params.particleColor).parent(ctrlDiv);
    colInput.input(() => params.particleColor = colInput.value());

    // Radius
    let radLabel = p.createElement('label', 'Mouse Radius').parent(ctrlDiv);
    let radSlider = p.createSlider(0, 500, params.mouseRadius).parent(ctrlDiv);
    radSlider.input(() => params.mouseRadius = radSlider.value());

    p.loadFont('assets/RubikMonoOne-Regular.ttf', f => {
      font = f;
      initParticles();
    });
  }

  function initParticles() {
    if (!font) return;
    particles = [];

    let bounds = font.textBounds(params.text, 0, 0, 150);
    let fontSize = 150;

    // Scale to fit width
    if (bounds.w > p.width * 0.8) {
        fontSize = 150 * (p.width * 0.8 / bounds.w);
    }

    // Center logic
    // We need multiline support
    let lines = params.text.split('\n');
    let totalH = lines.length * fontSize;
    let startY = p.height/2 - totalH/2 + fontSize * 0.75;

    for(let i=0; i<lines.length; i++) {
        let str = lines[i];
        let b = font.textBounds(str, 0, 0, fontSize);
        let x = p.width/2 - b.w/2;
        let y = startY + i * fontSize;

        let pts = font.textToPoints(str, x, y, fontSize, {
            sampleFactor: params.sampleFactor
        });

        for(let pt of pts) {
            particles.push(new Particle(pt.x, pt.y));
        }
    }
  }

  p.draw = () => {
    p.background(params.bgColor);
    if (particles.length > 0) {
      for (let particle of particles) {
        particle.behaviors();
        particle.update();
        particle.show();
      }
    }
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    initParticles();
  }
};
