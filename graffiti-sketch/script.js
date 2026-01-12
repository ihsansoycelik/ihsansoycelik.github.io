import * as THREE from 'three';

const container = document.getElementById('container');

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// State
let mesh;
let texture;
let canvas2D;
let ctx;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isDrawing = false;
let drips = [];

// Brush Settings (Default)
let brushColor = '#ff0055';
let brushSize = 15;
let dripFactor = 30; // 0 to 100

// UI Elements
const colorPicker = document.getElementById('colorPicker');
const sizeSlider = document.getElementById('brushSize');
const dripSlider = document.getElementById('dripFactor');
const clearBtn = document.getElementById('clearBtn');
let initialImage = null; // Store for reset

// Update Settings from UI
if(colorPicker) {
    colorPicker.addEventListener('input', (e) => brushColor = e.target.value);
    sizeSlider.addEventListener('input', (e) => brushSize = parseInt(e.target.value));
    dripSlider.addEventListener('input', (e) => dripFactor = parseInt(e.target.value));
    clearBtn.addEventListener('click', clearCanvas);
}

function clearCanvas() {
    if(!ctx || !initialImage) return;
    ctx.drawImage(initialImage, 0, 0);
    texture.needsUpdate = true;
    drips = []; // Clear active drips
}

// Load Background
const loader = new THREE.TextureLoader();
loader.load('./background.jpg', (bgTexture) => {
    initialImage = bgTexture.image;

    // Create 2D Canvas for drawing
    canvas2D = document.createElement('canvas');
    canvas2D.width = initialImage.width;
    canvas2D.height = initialImage.height;
    ctx = canvas2D.getContext('2d');

    // Draw the initial image
    ctx.drawImage(initialImage, 0, 0);

    // Create Texture from Canvas
    texture = new THREE.CanvasTexture(canvas2D);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;

    // Create Plane matching aspect ratio
    const aspect = initialImage.width / initialImage.height;
    const geometry = new THREE.PlaneGeometry(aspect * 6, 6); // Scale to fit view roughly
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    initInteraction();
});

function initInteraction() {
    window.addEventListener('mousedown', () => isDrawing = true);
    window.addEventListener('mouseup', () => isDrawing = false);
    window.addEventListener('mousemove', onMouseMove);

    // Touch support
    window.addEventListener('touchstart', (e) => { isDrawing = true; onMouseMove(e.touches[0]); });
    window.addEventListener('touchend', () => isDrawing = false);
    window.addEventListener('touchmove', (e) => onMouseMove(e.touches[0]));
}

function onMouseMove(event) {
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isDrawing && mesh) {
        raycastAndPaint();
    }
}

function raycastAndPaint() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(mesh);

    if (intersects.length > 0) {
        const uv = intersects[0].uv;
        paint(uv.x * canvas2D.width, (1 - uv.y) * canvas2D.height);
    }
}

function paint(x, y) {
    if (!ctx) return;

    ctx.fillStyle = brushColor;

    // Spray Effect
    const density = 20; // Particles per frame
    const radius = brushSize;

    for (let i = 0; i < density; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius; // Uniform distribution within circle
        // Using Math.sqrt(Math.random()) * radius for uniform area distribution would be better,
        // but simple random * radius concentrates in center, which is good for spray.

        const offsetX = Math.cos(angle) * r;
        const offsetY = Math.sin(angle) * r;

        ctx.globalAlpha = Math.random() * 0.2; // Low opacity for build-up
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1.0; // Reset
    texture.needsUpdate = true;

    // Trigger Drips
    if (Math.random() * 100 < dripFactor) {
        createDrip(x, y);
    }
}

function createDrip(x, y) {
    // Randomize drip start slightly
    const offsetX = (Math.random() - 0.5) * brushSize;
    drips.push({
        x: x + offsetX,
        y: y,
        velocity: Math.random() * 2 + 1, // Speed
        life: Math.random() * 100 + 50, // Frames to live
        color: brushColor,
        size: Math.random() * 3 + 1
    });
}

function updateDrips() {
    if (drips.length === 0) return;

    let activeDrips = false;

    for (let i = drips.length - 1; i >= 0; i--) {
        const d = drips[i];

        if (d.life > 0) {
            ctx.fillStyle = d.color;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();

            d.y += d.velocity;
            d.life--;

            // Randomly stop drips or slow them down
            if (Math.random() > 0.95) d.velocity *= 0.9;

            activeDrips = true;
        } else {
            drips.splice(i, 1);
        }
    }

    if (activeDrips) {
        texture.needsUpdate = true;
    }
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    updateDrips();
    renderer.render(scene, camera);
}
animate();

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
