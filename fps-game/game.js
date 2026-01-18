import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer;
let controls;

// Movement state
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Game state
let isGameActive = false;
let score = 0;
let health = 100;

// Gun & Shooting
let gun;
let flash;
let raycaster;

// Animation State
const gunBasePos = new THREE.Vector3(0.3, -0.3, -0.6);
const swayOffset = new THREE.Vector3(0, 0, 0);
const mouseMove = { x: 0, y: 0 };
let bobTimer = 0;
const recoil = { val: 0, rot: 0 };

// Enemies
const enemies = [];
let lastSpawnTime = 0;

// Reusable Assets
let enemyGeometry, enemyMaterial, enemyEyeMaterial;
let particleGeometry, particleMaterial;

init();
animate();

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 0, 80);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00ffff, 0.5, 50);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // Enable shadows
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Controls
    controls = new PointerLockControls(camera, document.body);

    const instructions = document.getElementById('instructions');
    const gameOverScreen = document.getElementById('game-over');

    instructions.addEventListener('click', function () {
        controls.lock();
    });

    gameOverScreen.addEventListener('click', function () {
        if (gameOverScreen.style.display !== 'none') {
             location.reload(); // Simple restart
        }
    });

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        isGameActive = true;
    });

    controls.addEventListener('unlock', function () {
        if (health > 0) {
            instructions.style.display = 'block';
        }
        isGameActive = false;
    });

    scene.add(controls.getObject());

    // Input listeners
    const onKeyDown = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
            case 'Space':
                if (canJump === true) velocity.y += 15;
                canJump = false;
                break;
        }
    };

    const onKeyUp = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    document.addEventListener('click', function() {
        if (controls.isLocked) {
            shoot();
        }
    });

    document.addEventListener('mousemove', function(event) {
        if (controls.isLocked) {
            mouseMove.x += event.movementX;
            mouseMove.y += event.movementY;
        }
    });

    // Initialize Reusable Assets
    enemyGeometry = new THREE.BoxGeometry(1.5, 3, 1.5);
    enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.2, metalness: 0.5 });
    enemyEyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    particleGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff5500 });

    // Setup Components
    setupEnvironment();
    setupGun();

    raycaster = new THREE.Raycaster();

    // Resize listener
    window.addEventListener('resize', onWindowResize);
}

function createGridTexture(color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    // Fill background
    context.fillStyle = color1;
    context.fillRect(0, 0, 512, 512);

    // Draw grid
    context.strokeStyle = color2;
    context.lineWidth = 4;
    context.strokeRect(0, 0, 512, 512);

    // Inner details
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(256, 0);
    context.lineTo(256, 512);
    context.moveTo(0, 256);
    context.lineTo(512, 256);
    context.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function setupEnvironment() {
    const floorTexture = createGridTexture('#111111', '#004444');
    floorTexture.repeat.set(50, 50);

    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const boxTexture = createGridTexture('#222244', '#444488');
    const boxGeometry = new THREE.BoxGeometry(5, 5, 5);
    const boxMaterial = new THREE.MeshStandardMaterial({ map: boxTexture, roughness: 0.5, metalness: 0.1 });
    const environment = new THREE.Group();
    environment.name = "environment";

    for (let i = 0; i < 50; i++) {
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        let x = Math.random() * 160 - 80;
        let z = Math.random() * 160 - 80;
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue; // Keep spawn clear
        box.position.set(x, 2.5, z);
        box.castShadow = true;
        box.receiveShadow = true;
        environment.add(box);
    }
    scene.add(environment);
}

function setupGun() {
    gun = new THREE.Group();

    // Gun Body
    const bodyGeo = new THREE.BoxGeometry(0.15, 0.2, 0.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    gun.add(body);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.3, metalness: 0.9 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = -Math.PI / 2;
    barrel.position.set(0, 0.05, -0.4);
    gun.add(barrel);

    // Scope/Sight
    const scopeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.3);
    const scope = new THREE.Mesh(scopeGeo, bodyMat);
    scope.position.set(0, 0.15, 0);
    gun.add(scope);

    // Flash Light
    flash = new THREE.PointLight(0xffaa00, 0, 3);
    flash.position.set(0, 0.05, -0.9);
    gun.add(flash);

    gun.position.copy(gunBasePos);
    camera.add(gun);
}

function spawnEnemy() {
    // Create enemy group
    const enemy = new THREE.Group();
    enemy.userData = { type: 'enemy', health: 1 };

    // Body
    const body = new THREE.Mesh(enemyGeometry, enemyMaterial);
    body.castShadow = true;
    enemy.add(body);

    // Glowing Eye
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.2), enemyEyeMaterial);
    eye.position.set(0, 0.5, 0.76); // Front
    eye.userData.isEye = true;
    enemy.add(eye);

    // Random position
    const angle = Math.random() * Math.PI * 2;
    const radius = 30 + Math.random() * 20;
    const x = Math.cos(angle) * radius + camera.position.x;
    const z = Math.sin(angle) * radius + camera.position.z;

    enemy.position.set(x, 1.5, z);

    scene.add(enemy);
    enemies.push(enemy);
}

function updateEnemies(delta) {
    const playerPos = camera.position;

    if (performance.now() - lastSpawnTime > 2000) {
        spawnEnemy();
        lastSpawnTime = performance.now();
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Face player
        enemy.lookAt(playerPos.x, enemy.position.y, playerPos.z);

        const dir = new THREE.Vector3().subVectors(playerPos, enemy.position);
        dir.y = 0;
        dir.normalize();

        enemy.position.add(dir.multiplyScalar(4 * delta));

        // Pulse/Bob animation
        const time = performance.now() / 1000;
        enemy.position.y = 1.5 + Math.sin(time * 5 + enemy.id) * 0.2;

        if (enemy.position.distanceTo(playerPos) < 1.5) {
            health -= 10;
            document.getElementById('health-display').innerText = `HEALTH: ${health}`;

            scene.remove(enemy);
            enemies.splice(i, 1);

            document.body.style.boxShadow = "inset 0 0 50px red";
            setTimeout(() => { document.body.style.boxShadow = "none"; }, 100);

            if (health <= 0) {
                gameOver();
            }
        }
    }
}

function gameOver() {
    controls.unlock();
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('instructions').style.display = 'none';
    isGameActive = false;
}

function createExplosion(position) {
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        // Reuse geometry and material
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);

        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );

        scene.add(particle);

        const startTime = performance.now();
        const animateParticle = () => {
            const now = performance.now();
            const delta = (now - startTime) / 1000;

            if (delta > 1.0) {
                scene.remove(particle);
                return;
            }

            particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
            particle.rotation.x += delta;
            particle.rotation.y += delta;
            requestAnimationFrame(animateParticle);
        };
        animateParticle();
    }
}

function shoot() {
    flash.intensity = 2.0;
    setTimeout(() => { flash.intensity = 0; }, 50);

    // Apply Recoil Impulse
    recoil.val = 0.2; // Push back
    recoil.rot = 0.2; // Rotate up

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    let targetPoint = null;

    for (let i = 0; i < intersects.length; i++) {
        let obj = intersects[i].object;
        let rootObj = obj;

        // Traverse up to find if it's an enemy group or environment
        while(rootObj.parent && rootObj.parent.type !== 'Scene') {
             if (rootObj.userData.type === 'enemy') break;
             if (rootObj.name === 'environment') break;
             rootObj = rootObj.parent;
        }

        if (rootObj === gun || rootObj === flash) continue;

        if (rootObj.userData.type === 'enemy') {
             targetPoint = intersects[i].point;

             scene.remove(rootObj);
             enemies.splice(enemies.indexOf(rootObj), 1);
             createExplosion(rootObj.position);

             score += 100;
             document.getElementById('score-display').innerText = `SCORE: ${score}`;
             break;
        }

        if (rootObj.name === 'environment' || (rootObj.parent && rootObj.parent.name === 'environment') || obj.geometry instanceof THREE.PlaneGeometry) {
             targetPoint = intersects[i].point;
             break;
        }
    }

    if (!targetPoint) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        targetPoint = new THREE.Vector3().copy(camera.position).add(direction.multiplyScalar(100));
    }

    createBulletTrail(gun.getWorldPosition(new THREE.Vector3()), targetPoint);
}

function createBulletTrail(start, end) {
    const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    let opacity = 1.0;
    const fade = () => {
        opacity -= 0.15;
        material.opacity = opacity;
        material.transparent = true;
        if (opacity <= 0) {
            scene.remove(line);
            geometry.dispose();
            material.dispose();
        } else {
            requestAnimationFrame(fade);
        }
    };
    fade();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function checkCollisions() {
    const playerPos = controls.getObject().position;
    const playerRadius = 0.5;
    const environment = scene.getObjectByName("environment");

    if (environment) {
        for (let i = 0; i < environment.children.length; i++) {
            const box = environment.children[i];

            const minX = box.position.x - 2.5 - playerRadius;
            const maxX = box.position.x + 2.5 + playerRadius;
            const minZ = box.position.z - 2.5 - playerRadius;
            const maxZ = box.position.z + 2.5 + playerRadius;

            if (playerPos.x > minX && playerPos.x < maxX &&
                playerPos.z > minZ && playerPos.z < maxZ) {
                return box;
            }
        }
    }
    return null;
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;
    prevTime = time;

    if (controls.isLocked === true && health > 0) {
        // Physics & Movement
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 3.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // Collisions
        const collisionBox = checkCollisions();
        if (collisionBox) {
            const playerPos = controls.getObject().position;
            const minX = collisionBox.position.x - 2.5 - 0.5;
            const maxX = collisionBox.position.x + 2.5 + 0.5;
            const minZ = collisionBox.position.z - 2.5 - 0.5;
            const maxZ = collisionBox.position.z + 2.5 + 0.5;

            const distToMinX = Math.abs(playerPos.x - minX);
            const distToMaxX = Math.abs(playerPos.x - maxX);
            const distToMinZ = Math.abs(playerPos.z - minZ);
            const distToMaxZ = Math.abs(playerPos.z - maxZ);

            const minDist = Math.min(distToMinX, distToMaxX, distToMinZ, distToMaxZ);

            if (minDist === distToMinX) playerPos.x = minX - 0.001;
            else if (minDist === distToMaxX) playerPos.x = maxX + 0.001;
            else if (minDist === distToMinZ) playerPos.z = minZ - 0.001;
            else if (minDist === distToMaxZ) playerPos.z = maxZ + 0.001;
        }

        controls.getObject().position.y += (velocity.y * delta);

        if (controls.getObject().position.y < 1.6) {
            velocity.y = 0;
            controls.getObject().position.y = 1.6;
            canJump = true;
        }

        // --- Animations ---

        // Weapon Sway
        const swayForce = 0.005;
        const maxSway = 0.1;

        let targetX = -mouseMove.x * swayForce;
        let targetY = mouseMove.y * swayForce;

        targetX = Math.max(-maxSway, Math.min(maxSway, targetX));
        targetY = Math.max(-maxSway, Math.min(maxSway, targetY));

        swayOffset.x = THREE.MathUtils.lerp(swayOffset.x, targetX, delta * 10);
        swayOffset.y = THREE.MathUtils.lerp(swayOffset.y, targetY, delta * 10);

        mouseMove.x = 0;
        mouseMove.y = 0;

        // Weapon Bobbing
        if (moveForward || moveBackward || moveLeft || moveRight) {
             bobTimer += delta * 15;
             const bobAmp = 0.01;
             gun.position.x = gunBasePos.x + swayOffset.x + Math.cos(bobTimer) * bobAmp;
             gun.position.y = gunBasePos.y + swayOffset.y + Math.sin(bobTimer * 2) * bobAmp;
        } else {
             gun.position.x = THREE.MathUtils.lerp(gun.position.x, gunBasePos.x + swayOffset.x, delta * 10);
             gun.position.y = THREE.MathUtils.lerp(gun.position.y, gunBasePos.y + swayOffset.y, delta * 10);
             bobTimer = 0;
        }

        // Recoil Decay
        recoil.val = THREE.MathUtils.lerp(recoil.val, 0, delta * 10);
        recoil.rot = THREE.MathUtils.lerp(recoil.rot, 0, delta * 10);

        gun.position.z = gunBasePos.z + recoil.val;
        gun.rotation.x = recoil.rot;

        updateEnemies(delta);
    }

    renderer.render(scene, camera);
}
