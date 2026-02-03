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

    let points = font.textToPoints(txt, startX, startY, fontSize, {
      sampleFactor: 0.2
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
      this.r = 5;
      this.maxspeed = 10;
      this.maxforce = 1;
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
      p.stroke(255);
      p.strokeWeight(this.r);
      p.point(this.pos.x, this.pos.y);
    }

    arrive(target) {
      let desired = p5.Vector.sub(target, this.pos);
      let d = desired.mag();
      let speed = this.maxspeed;
      if (d < 100) {
        speed = p.map(d, 0, 100, 0, this.maxspeed);
      }
      desired.setMag(speed);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxforce);
      return steer;
    }

    flee(target) {
      let desired = p5.Vector.sub(target, this.pos);
      let d = desired.mag();
      if (d < 100) {
        desired.setMag(this.maxspeed);
        desired.mult(-1);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxforce);
        return steer;
      } else {
        return p.createVector(0, 0);
      }
    }
  }
};
