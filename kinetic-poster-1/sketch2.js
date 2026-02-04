const sketch2 = (p) => {
  let font;
  let particles = [];
  let txt = "INTERACT";
  let fontSize = 120;

  p.preload = () => {
    font = p.loadFont('assets/RubikMonoOne-Regular.ttf');
  };

  p.setup = () => {
    const container = document.getElementById('v2');
    container.innerHTML = ''; // Clear placeholder
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent(container);
    p.colorMode(p.HSB, 360, 100, 100, 100);

    p.textFont(font);
    p.textSize(fontSize);

    generateParticles();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    generateParticles();
  };

  function generateParticles() {
    particles = [];
    let bounds = font.textBounds(txt, 0, 0, fontSize);
    let startX = (p.width - bounds.w) / 2;
    let startY = (p.height + bounds.h) / 2;

    // Increased sampleFactor for higher fidelity (was 0.2)
    let points = font.textToPoints(txt, startX, startY, fontSize, {
      sampleFactor: 0.6
    });

    for (let pt of points) {
      let vehicle = new Vehicle(pt.x, pt.y);
      particles.push(vehicle);
    }
  }

  p.draw = () => {
    p.background('#111');
    for (let v of particles) {
      v.behaviors();
      v.update();
      v.show();
    }
  };

  class Vehicle {
    constructor(x, y) {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.target = p.createVector(x, y);
      this.vel = p.createVector(p.random(-1, 1), p.random(-1, 1));
      this.acc = p.createVector();
      this.r = 4;
      this.maxspeed = 10;
      this.maxforce = 1;
      this.hue = p.random(180, 240); // Base hue (Blue-ish)
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
      // Dynamic color based on speed
      let speed = this.vel.mag();
      let bright = p.map(speed, 0, this.maxspeed, 80, 100);
      let sat = p.map(speed, 0, this.maxspeed, 50, 100);

      // Shift hue when moving fast (fleeing)
      let h = this.hue;
      if (speed > 1) {
          h = p.map(speed, 1, this.maxspeed, this.hue, 360); // Shift towards Red
      }

      p.stroke(h, sat, bright);
      p.strokeWeight(this.r);
      p.point(this.pos.x, this.pos.y);
    }

    arrive(target) {
      // Instance mode safe vector math
      let desired = p.createVector(target.x, target.y).sub(this.pos);
      let d = desired.mag();
      let speed = this.maxspeed;
      if (d < 100) {
        speed = p.map(d, 0, 100, 0, this.maxspeed);
      }
      desired.setMag(speed);

      let steer = desired.sub(this.vel);
      steer.limit(this.maxforce);
      return steer;
    }

    flee(target) {
      // Instance mode safe vector math
      let desired = p.createVector(target.x, target.y).sub(this.pos);
      let d = desired.mag();
      if (d < 100) {
        desired.setMag(this.maxspeed);
        desired.mult(-1);
        let steer = desired.sub(this.vel);
        steer.limit(this.maxforce);
        return steer;
      } else {
        return p.createVector(0, 0);
      }
    }
  }
};
