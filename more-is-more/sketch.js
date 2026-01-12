function setup() {
  createCanvas(800, 800);
  frameRate(60);
  textFont('Arial Black'); // Fallback to 'Helvetica' if needed, but 'Arial Black' is usually standard.
  textStyle(BOLD);
  textSize(240);
  textAlign(CENTER, CENTER);
}

const lines = [
  {
    text: "More",
    y: 220,
    colors: ["#2B3FD4", "white", "white", "#2B3FD4"] // M, e -> Blue
  },
  {
    text: "is",
    y: 400,
    colors: ["white", "#2B3FD4"] // s -> Blue
  },
  {
    text: "More",
    y: 580,
    colors: ["white", "white", "white", "#2B3FD4"] // e -> Blue
  }
];

function draw() {
  background('#F0313C');

  let time = frameCount * 0.08;

  for (let l = 0; l < lines.length; l++) {
    let lineData = lines[l];
    let words = lineData.text;
    let yBase = lineData.y;
    let colorMap = lineData.colors;

    // Calculate centering
    // To center the word, we need its total width.
    let totalWidth = textWidth(words);

    // Starting X position for the first character
    let startX = (width - totalWidth) / 2;

    let currentX = startX;

    for (let c = 0; c < words.length; c++) {
      let charStr = words.charAt(c);
      let charW = textWidth(charStr);
      let charCenterX = currentX + charW / 2;

      let isBlue = colorMap[c] === "#2B3FD4";

      // Draw layers back to front
      for (let i = 60; i >= 0; i--) {
        // Motion Math
        let waveIntensity = map(i, 0, 60, 0, 85);
        let xOffset = cos(time + i * 0.06) * waveIntensity;
        let yOffset = sin(time + i * 0.06) * waveIntensity;

        let x = charCenterX + xOffset;
        let y = yBase + yOffset;

        // Color Logic
        if (i === 0) {
          // Face
          fill(255);
        } else {
          // Trail
          if (isBlue) {
            fill('#2B3FD4');
          } else {
            // White trail - semi transparent
            fill(255, 200); // Slight alpha for overlapping depth
          }
        }
        noStroke();
        text(charStr, x, y);
      }

      currentX += charW;
    }
  }
}
