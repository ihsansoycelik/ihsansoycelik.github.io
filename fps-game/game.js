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
let ammo = 30;
const maxAmmo = 30;
let isReloading = false;

// Gun & Shooting
let gunGroup; // The container for the gun
let gunMesh;  // The visual mesh
let flash;
let raycaster;
const bullets = [];

// Weapon Animation State
let recoilAmount = 0;
let recoilRotation = 0;
const gunBasePos = new THREE.Vector3(0.25, -0.3, -0.6);
const swayAmount = new THREE.Vector2(0, 0);

// Input tracking for sway
let mouseXDelta = 0;
let mouseYDelta = 0;

// Enemies
const enemies = [];
let lastSpawnTime = 0;

// Reusable Assets
let enemyGeometry, enemyMaterial, eyeMaterial;
let particleGeometry, particleMaterial;

init();
animate();

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.Fog(0x111111, 0, 80);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x4444ff, 0.5, 20);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Sync background color
    document.body.style.backgroundColor = '#111111';

    // Controls
    controls = new PointerLockControls(camera, document.body);

    const instructions = document.getElementById('instructions');
    const gameOverScreen = document.getElementById('game-over');

    instructions.addEventListener('click', function () {
        controls.lock();
    });

    gameOverScreen.addEventListener('click', function () {
        if (gameOverScreen.style.display !== 'none') {
             location.reload();
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
            case 'KeyR':
                reload();
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
    document.addEventListener('mousemove', (e) => {
        if (isGameActive) {
            mouseXDelta = e.movementX;
            mouseYDelta = e.movementY;
        }
    });

    document.addEventListener('mousedown', function(e) {
        if (controls.isLocked && e.button === 0) {
            shoot();
        }
    });

    // Initialize Reusable Assets
    enemyGeometry = new THREE.BoxGeometry(1.2, 2.5, 1.2);
    enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xaa0000 });
    eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    particleGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff4400 });

    // Setup Components
    setupEnvironment();
    setupGun();

    raycaster = new THREE.Raycaster();

    // Resize listener
    window.addEventListener('resize', onWindowResize);

    // Update initial UI
    updateAmmoDisplay();
}

function setupEnvironment() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(200, 50, 0x333333, 0x222222);
    scene.add(grid);

    // Obstacles
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1); // Base scale, will scale meshes
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x223355 });

    const environment = new THREE.Group();
    environment.name = "environment";

    // Generate random pillars/boxes
    for (let i = 0; i < 60; i++) {
        const box = new THREE.Mesh(boxGeometry, boxMaterial);

        const sx = 2 + Math.random() * 4;
        const sy = 2 + Math.random() * 8;
        const sz = 2 + Math.random() * 4;

        box.scale.set(sx, sy, sz);

        let x = Math.random() * 160 - 80;
        let z = Math.random() * 160 - 80;

        // Keep spawn area clear
        if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;

        box.position.set(x, sy / 2, z);
        box.castShadow = true;
        box.receiveShadow = true;
        environment.add(box);
    }
    scene.add(environment);
}

function setupGun() {
    gunGroup = new THREE.Group();
    camera.add(gunGroup);

    // Gun Body
    const bodyGeo = new THREE.BoxGeometry(0.15, 0.2, 0.6);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    gunGroup.add(body);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16);
    const barrelMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.4;
    barrel.position.y = 0.05;
    gunGroup.add(barrel);

    // Magazine/Clip
    const magGeo = new THREE.BoxGeometry(0.12, 0.3, 0.15);
    const magMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const mag = new THREE.Mesh(magGeo, magMat);
    mag.position.set(0, -0.2, 0.1);
    gunGroup.add(mag);

    // Scope/Sight
    const sightGeo = new THREE.BoxGeometry(0.08, 0.08, 0.3);
    const sightMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const sight = new THREE.Mesh(sightGeo, sightMat);
    sight.position.set(0, 0.15, 0);
    gunGroup.add(sight);

    // Muzzle Flash Light
    flash = new THREE.PointLight(0xffaa00, 0, 5);
    flash.position.set(0, 0.05, -0.9);
    gunGroup.add(flash);

    gunGroup.position.copy(gunBasePos);
}

function spawnEnemy() {
    const enemyGroup = new THREE.Group();
    enemyGroup.userData = { type: 'enemy', health: 2 }; // Health 2 = 2 hits

    // Body
    const body = new THREE.Mesh(enemyGeometry, enemyMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    enemyGroup.add(body);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEye.position.set(-0.3, 2, 0.6);
    enemyGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEye.position.set(0.3, 2, 0.6);
    enemyGroup.add(rightEye);

    // Random position
    const angle = Math.random() * Math.PI * 2;
    const radius = 30 + Math.random() * 30;
    const x = Math.cos(angle) * radius + camera.position.x;
    const z = Math.sin(angle) * radius + camera.position.z;

    enemyGroup.position.set(x, 0, z);

    scene.add(enemyGroup);
    enemies.push(enemyGroup);
}

function updateEnemies(delta) {
    const playerPos = camera.position;

    if (performance.now() - lastSpawnTime > 3000) {
        if (enemies.length < 15) { // Limit enemies
            spawnEnemy();
        }
        lastSpawnTime = performance.now();
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dir = new THREE.Vector3().subVectors(playerPos, enemy.position);
        dir.y = 0;
        dir.normalize();

        enemy.position.add(dir.multiplyScalar(3.5 * delta));
        enemy.lookAt(playerPos.x, enemy.position.y, playerPos.z);

        if (enemy.position.distanceTo(playerPos) < 1.0) {
            // Hit player
            health -= 15;
            document.getElementById('health-display').innerText = `HEALTH: ${Math.max(0, health)}`;

            // Remove enemy
            scene.remove(enemy);
            enemies.splice(i, 1);

            // Damage feedback
            document.body.style.boxShadow = "inset 0 0 100px rgba(255, 0, 0, 0.5)";
            setTimeout(() => { document.body.style.boxShadow = "none"; }, 200);

            if (health <= 0) {
                gameOver();
            }
        }
    }
}

function updateWeapon(time, delta) {
    if (!gunGroup) return;

    // 1. Recoil Recovery
    recoilAmount = THREE.MathUtils.lerp(recoilAmount, 0, delta * 10);
    recoilRotation = THREE.MathUtils.lerp(recoilRotation, 0, delta * 10);

    // 2. Sway (Input lag)
    const targetSwayX = -mouseXDelta * 0.001;
    const targetSwayY = mouseYDelta * 0.001;

    swayAmount.x = THREE.MathUtils.lerp(swayAmount.x, targetSwayX, delta * 5);
    swayAmount.y = THREE.MathUtils.lerp(swayAmount.y, targetSwayY, delta * 5);

    // Reset mouse delta input for this frame (it's accumulated)
    mouseXDelta = 0;
    mouseYDelta = 0;

    // 3. Bobbing (Movement)
    const isMoving = moveForward || moveBackward || moveLeft || moveRight;
    let bobY = 0;
    let bobX = 0;

    if (isMoving && canJump) { // Only bob on ground
        const bobFreq = time * 0.01;
        bobY = Math.sin(bobFreq) * 0.01;
        bobX = Math.cos(bobFreq * 0.5) * 0.01;
    }

    // Apply Transforms
    gunGroup.position.x = gunBasePos.x + swayAmount.x + bobX;
    gunGroup.position.y = gunBasePos.y + swayAmount.y + bobY + (Math.random() * recoilAmount * 0.1); // Jitter on recoil
    gunGroup.position.z = gunBasePos.z + recoilAmount;

    gunGroup.rotation.x = recoilRotation + swayAmount.y * 0.5;
    gunGroup.rotation.y = swayAmount.x * 0.5;
    gunGroup.rotation.z = swayAmount.x * 0.2;
}

function resolveCollisions() {
    const environment = scene.getObjectByName("environment");
    if (!environment) return;

    const playerRadius = 0.5;
    const playerPos = camera.position;

    // We only check boxes in environment for simplicity
    for (const box of environment.children) {
        // Get box bounds in world space
        // Assuming boxes are axis aligned and not rotated (except floor which is not in this group)
        // If boxes were rotated we'd need OBB, but our setup spawns AABB boxes

        // Calculate box min/max
        const boxPos = box.position;
        const boxScale = box.scale;

        // Geometry is 1x1x1 centered
        const halfX = (1 * boxScale.x) / 2;
        const halfZ = (1 * boxScale.z) / 2;

        const minX = boxPos.x - halfX;
        const maxX = boxPos.x + halfX;
        const minZ = boxPos.z - halfZ;
        const maxZ = boxPos.z + halfZ;

        // Check overlap X
        if (playerPos.x + playerRadius > minX && playerPos.x - playerRadius < maxX &&
            playerPos.z + playerRadius > minZ && playerPos.z - playerRadius < maxZ) {

            // Determine shallowest penetration
            const dists = [
                Math.abs(playerPos.x + playerRadius - minX), // Left side penetration
                Math.abs(playerPos.x - playerRadius - maxX), // Right side penetration
                Math.abs(playerPos.z + playerRadius - minZ), // Front side
                Math.abs(playerPos.z - playerRadius - maxZ)  // Back side
            ];

            const minIndex = dists.indexOf(Math.min(...dists));

            // Push out
            if (minIndex === 0) playerPos.x = minX - playerRadius;
            else if (minIndex === 1) playerPos.x = maxX + playerRadius;
            else if (minIndex === 2) playerPos.z = minZ - playerRadius;
            else if (minIndex === 3) playerPos.z = maxZ + playerRadius;
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
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8
        );
        scene.add(particle);

        const startTime = performance.now();
        const animateParticle = () => {
            const now = performance.now();
            const delta = (now - startTime) / 1000;
            if (delta > 0.5) {
                scene.remove(particle);
                return;
            }
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
            requestAnimationFrame(animateParticle);
        };
        animateParticle();
    }
}

function reload() {
    if (isReloading || ammo === maxAmmo) return;

    isReloading = true;
    document.getElementById('ammo-display').innerText = "RELOADING...";

    // Simple reload animation: drop gun down
    const startY = gunBasePos.y;
    gunBasePos.y = -1.0;

    setTimeout(() => {
        ammo = maxAmmo;
        updateAmmoDisplay();
        isReloading = false;
        gunBasePos.y = startY;
    }, 1500);
}

function updateAmmoDisplay() {
    document.getElementById('ammo-display').innerText = `AMMO: ${ammo} / ${maxAmmo}`;
}

function shoot() {
    if (isReloading) return;
    if (ammo <= 0) {
        // Click sound for empty?
        return;
    }

    ammo--;
    updateAmmoDisplay();

    // Trigger visual effects
    flash.intensity = 2.0;
    setTimeout(() => { flash.intensity = 0; }, 50);

    // Apply Recoil
    recoilAmount += 0.2;
    recoilRotation += 0.2;

    // Raycast
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(scene.children, true); // recursive true
    let targetPoint = null;

    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;

        // Ignore self (gun parts)
        if (obj.parent === gunGroup || obj === gunGroup) continue;
        if (obj.type === 'Line') continue; // Ignore trails

        // Check if enemy
        // Since enemy is a Group now, we might hit a child mesh (body, eye)
        // We traverse up to find if it belongs to an enemy
        let currentObj = obj;
        let isEnemy = false;
        while(currentObj.parent) {
            if (currentObj.userData.type === 'enemy') {
                isEnemy = true;
                break;
            }
            if (currentObj.parent.userData.type === 'enemy') {
                currentObj = currentObj.parent;
                isEnemy = true;
                break;
            }
            currentObj = currentObj.parent;
        }

        if (isEnemy) {
             targetPoint = intersects[i].point;
             const enemyGroup = currentObj;

             // Damage enemy
             enemyGroup.userData.health--;

             createExplosion(intersects[i].point);

             if (enemyGroup.userData.health <= 0) {
                 scene.remove(enemyGroup);
                 enemies.splice(enemies.indexOf(enemyGroup), 1);

                 score += 100;
                 document.getElementById('score-display').innerText = `SCORE: ${score}`;
             }
             break;
        }

        // Environment
        if (obj.parent && obj.parent.name === "environment") {
             targetPoint = intersects[i].point;
             // Add a spark or decal?
             break;
        }

        if (obj.geometry instanceof THREE.PlaneGeometry && obj.rotation.x === -Math.PI/2) {
             // Floor
             targetPoint = intersects[i].point;
             break;
        }
    }

    if (!targetPoint) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        targetPoint = new THREE.Vector3().copy(camera.position).add(direction.multiplyScalar(100));
    }

    createBulletTrail(gunGroup.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.05, -0.8).applyQuaternion(camera.quaternion)), targetPoint);
}

function createBulletTrail(start, end) {
    const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    let opacity = 1.0;
    const fade = () => {
        opacity -= 0.1;
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

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (controls.isLocked === true && health > 0) {

        // Physics / Movement
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 4.0 * delta; // Slightly stronger gravity

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

        // Apply movement and check collisions step-by-step
        controls.moveRight(-velocity.x * delta);
        resolveCollisions(); // Check lateral collision

        controls.moveForward(-velocity.z * delta);
        resolveCollisions(); // Check forward collision

        controls.getObject().position.y += (velocity.y * delta);

        if (controls.getObject().position.y < 1.6) {
            velocity.y = 0;
            controls.getObject().position.y = 1.6;
            canJump = true;
        }

        // Updates
        updateEnemies(delta);
        updateWeapon(time, delta);
    }

    prevTime = time;
    renderer.render(scene, camera);
}
