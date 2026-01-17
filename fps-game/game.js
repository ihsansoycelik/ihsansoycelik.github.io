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
const bullets = [];

// Enemies
const enemies = [];
let lastSpawnTime = 0;

// Map / Environment
const TILE_SIZE = 10;
const MAP_WIDTH = 10;
const MAP_HEIGHT = 10;
const WALL_HEIGHT = 8;

// 1 = Wall, 0 = Empty
const mapLayout = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
const walls = [];

// Reusable Assets
let particleGeometry, particleMaterial;

// Gun Sway
const swayPos = new THREE.Vector3(0.25, -0.25, -0.6);
const swayTarget = swayPos.clone();
let swayTime = 0;

init();
animate();

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.Fog(0x111111, 0, 70);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6;

    // Find a valid spawn point (first 0)
    let spawnFound = false;
    const mapOffsetX = (MAP_WIDTH * TILE_SIZE) / 2;
    const mapOffsetZ = (MAP_HEIGHT * TILE_SIZE) / 2;

    for (let r = 1; r < MAP_HEIGHT - 1; r++) {
        for (let c = 1; c < MAP_WIDTH - 1; c++) {
            if (mapLayout[r][c] === 0) {
                camera.position.x = c * TILE_SIZE - mapOffsetX + TILE_SIZE / 2;
                camera.position.z = r * TILE_SIZE - mapOffsetZ + TILE_SIZE / 2;
                spawnFound = true;
                break;
            }
        }
        if (spawnFound) break;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    // scene.add(controls.getObject()); // PointerLockControls adds camera to scene when you pass it in ctor? No, we must add it.
    // Actually the logic is: scene.add(camera) is enough, but controls.getObject() returns camera.
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
                if (canJump === true) velocity.y += 12; // Jump force
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

    document.addEventListener('mousedown', function() {
        if (controls.isLocked && isGameActive) {
            shoot();
        }
    });

    // Initialize Assets
    particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff4400 });

    setupEnvironment();
    setupGun();

    raycaster = new THREE.Raycaster();

    window.addEventListener('resize', onWindowResize);
}

function setupEnvironment() {
    const floorSize = MAP_WIDTH * TILE_SIZE;
    const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(floorSize, MAP_WIDTH, 0x333333, 0x111111);
    grid.name = 'grid';
    scene.add(grid);

    const wallGeometry = new THREE.BoxGeometry(TILE_SIZE, WALL_HEIGHT, TILE_SIZE);
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x223344,
        roughness: 0.6,
        metalness: 0.1
    });

    const offset = (MAP_WIDTH * TILE_SIZE) / 2 - (TILE_SIZE / 2);

    for (let r = 0; r < MAP_HEIGHT; r++) {
        for (let c = 0; c < MAP_WIDTH; c++) {
            if (mapLayout[r][c] === 1) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(
                    c * TILE_SIZE - offset,
                    WALL_HEIGHT / 2,
                    r * TILE_SIZE - offset
                );
                wall.castShadow = true;
                wall.receiveShadow = true;
                wall.name = "wall";
                scene.add(wall);
                walls.push(wall);
            }
        }
    }
}

function setupGun() {
    gun = new THREE.Group();

    // Gun body
    const bodyGeo = new THREE.BoxGeometry(0.12, 0.15, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    gun.add(body);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.6, 12);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.8 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(0, 0.05, -0.3);
    gun.add(barrel);

    // Grip
    const gripGeo = new THREE.BoxGeometry(0.08, 0.2, 0.1);
    gripGeo.rotateX(Math.PI / 6);
    const grip = new THREE.Mesh(gripGeo, bodyMat);
    grip.position.set(0, -0.1, 0.1);
    gun.add(grip);

    // Sight
    const sightGeo = new THREE.BoxGeometry(0.02, 0.02, 0.05);
    const sight = new THREE.Mesh(sightGeo, new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    sight.position.set(0, 0.1, -0.2);
    gun.add(sight);

    gun.position.copy(swayPos);
    camera.add(gun);

    flash = new THREE.PointLight(0xffaa00, 0, 5);
    flash.position.set(0, 0.05, -0.7);
    gun.add(flash);
}

function spawnEnemy() {
    const enemyGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.6, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0; // Relative to group center
    body.castShadow = true;
    enemyGroup.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xcc4444 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.2;
    head.castShadow = true;
    enemyGroup.add(head);

    // Eye
    const eyeGeo = new THREE.BoxGeometry(0.6, 0.2, 0.2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 1.2, 0.35); // Facing +Z initially? No, we will lookAt player.
    // Actually geometry is centered.
    eye.position.set(0, 1.2, 0.41);
    enemyGroup.add(eye);

    // Find valid spawn pos
    const mapOffsetX = (MAP_WIDTH * TILE_SIZE) / 2;
    const mapOffsetZ = (MAP_HEIGHT * TILE_SIZE) / 2;
    let spawnX, spawnZ;
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 20) {
        attempts++;
        const r = Math.floor(Math.random() * MAP_HEIGHT);
        const c = Math.floor(Math.random() * MAP_WIDTH);
        if (mapLayout[r][c] === 0) {
            spawnX = c * TILE_SIZE - mapOffsetX + TILE_SIZE / 2;
            spawnZ = r * TILE_SIZE - mapOffsetZ + TILE_SIZE / 2;
            // Don't spawn too close to player
            if (new THREE.Vector3(spawnX, 1.5, spawnZ).distanceTo(camera.position) > 15) {
                valid = true;
            }
        }
    }

    if (valid) {
        enemyGroup.position.set(spawnX, 1.8, spawnZ); // Center height approx
        enemyGroup.userData = { type: 'enemy', health: 3, velocity: new THREE.Vector3() };
        scene.add(enemyGroup);
        enemies.push(enemyGroup);
    }
}

function checkWallCollision(position) {
    const mapOffsetX = (MAP_WIDTH * TILE_SIZE) / 2;
    const mapOffsetZ = (MAP_HEIGHT * TILE_SIZE) / 2;

    // Position to Grid coords
    const gridX = Math.floor((position.x + mapOffsetX) / TILE_SIZE);
    const gridZ = Math.floor((position.z + mapOffsetZ) / TILE_SIZE);

    if (gridX < 0 || gridX >= MAP_WIDTH || gridZ < 0 || gridZ >= MAP_HEIGHT) {
        return true; // Out of bounds is wall
    }

    return mapLayout[gridZ][gridX] === 1;
}

function updateEnemies(delta) {
    const playerPos = camera.position;

    if (performance.now() - lastSpawnTime > 3000 && enemies.length < 10) {
        spawnEnemy();
        lastSpawnTime = performance.now();
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const dir = new THREE.Vector3().subVectors(playerPos, enemy.position);
        dir.y = 0;
        dir.normalize();

        // Simple movement
        const moveSpeed = 4 * delta;
        const oldPos = enemy.position.clone();

        enemy.position.add(dir.multiplyScalar(moveSpeed));
        enemy.lookAt(playerPos.x, enemy.position.y, playerPos.z);

        // Bobbing animation
        enemy.children[0].position.y = Math.sin(performance.now() * 0.01) * 0.1;
        enemy.children[1].position.y = 1.2 + Math.sin(performance.now() * 0.01 + 1) * 0.05;

        // Collision with player
        if (enemy.position.distanceTo(playerPos) < 1.5) {
            health -= 15;
            document.getElementById('health-display').innerText = `HEALTH: ${health}`;

            // Push back
            const pushDir = dir.clone().negate();
            camera.position.add(pushDir.multiplyScalar(2));

            document.body.style.boxShadow = "inset 0 0 50px red";
            setTimeout(() => { document.body.style.boxShadow = "none"; }, 100);

            if (health <= 0) {
                gameOver();
            }
        }

        // Very basic wall collision for enemy (just stop if inside)
        if (checkWallCollision(enemy.position)) {
             enemy.position.copy(oldPos); // Revert if hit wall
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

        // Random spread
        particle.position.x += (Math.random() - 0.5);
        particle.position.y += (Math.random() - 0.5);
        particle.position.z += (Math.random() - 0.5);

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
            particle.rotation.x += 0.1;
            particle.rotation.y += 0.1;
            requestAnimationFrame(animateParticle);
        };
        animateParticle();
    }
}

function shoot() {
    flash.intensity = 1.0;
    setTimeout(() => { flash.intensity = 0; }, 50);

    // Recoil kick
    swayTarget.z = swayPos.z + 0.2; // Kick back
    swayTarget.y = swayPos.y + 0.1; // Kick up

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(scene.children, true); // Recursive for groups
    let targetPoint = null;
    let hitObject = null;

    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        const dist = intersects[i].distance;

        // Ignore gun/flash
        if (obj.parent === gun || obj === gun) continue;

        // Check for wall
        if (obj.name === 'wall' || obj.name === 'floor' || obj.geometry instanceof THREE.PlaneGeometry) {
            targetPoint = intersects[i].point;
            hitObject = obj;
            break; // Wall stops bullet
        }

        // Check for enemy
        // Enemy is a Group now, ray intersects child Mesh.
        let parent = obj.parent;
        while(parent) {
            if (parent.userData && parent.userData.type === 'enemy') {
                targetPoint = intersects[i].point;
                hitObject = parent;

                // Damage enemy
                parent.userData.health -= 1;
                createExplosion(targetPoint);

                if (parent.userData.health <= 0) {
                     scene.remove(parent);
                     enemies.splice(enemies.indexOf(parent), 1);
                     score += 100;
                     document.getElementById('score-display').innerText = `SCORE: ${score}`;
                } else {
                     // Hit effect but not dead
                     // maybe flash enemy red?
                }
                break;
            }
            parent = parent.parent;
        }
        if (targetPoint) break;
    }

    if (!targetPoint) {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        targetPoint = new THREE.Vector3().copy(camera.position).add(direction.multiplyScalar(100));
    }

    createBulletTrail(flash.getWorldPosition(new THREE.Vector3()), targetPoint);
}

function createBulletTrail(start, end) {
    const material = new THREE.LineBasicMaterial({ color: 0xffffaa, transparent: true });
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    scene.add(line);

    let opacity = 0.8;
    const fade = () => {
        opacity -= 0.1;
        material.opacity = opacity;
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

    if (controls.isLocked === true && health > 0) {
        const delta = Math.min((time - prevTime) / 1000, 0.1);

        // Friction
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 3.0 * delta; // Gravity

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 80.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 80.0 * delta;

        // Ground Movement Logic (sliding against walls)
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(camera.up, forward).normalize();

        // Handle straight up/down look edge case
        if (forward.lengthSq() < 0.001) {
            forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
            forward.y = 0;
            forward.normalize();
            right.crossVectors(camera.up, forward).normalize();
        }

        const speedFwd = -velocity.z * delta;
        const speedRight = -velocity.x * delta;

        const moveX = (forward.x * speedFwd) + (right.x * speedRight);
        const moveZ = (forward.z * speedFwd) + (right.z * speedRight);

        // 1. Try Move X
        camera.position.x += moveX;
        if (checkWallCollision(camera.position)) {
             camera.position.x -= moveX;
        }

        // 2. Try Move Z
        camera.position.z += moveZ;
        if (checkWallCollision(camera.position)) {
             camera.position.z -= moveZ;
        }

        // 3. Y (Jump/Gravity)
        camera.position.y += (velocity.y * delta);
        if (controls.getObject().position.y < 1.6) {
            velocity.y = 0;
            controls.getObject().position.y = 1.6;
            canJump = true;
        }
        // Ceiling check? Not strictly needed for this height.

        updateEnemies(delta);

        // Gun Sway
        if (moveForward || moveBackward || moveLeft || moveRight) {
             swayTime += delta * 10;
             swayTarget.x = swayPos.x + Math.sin(swayTime) * 0.05;
             swayTarget.y = swayPos.y + Math.abs(Math.sin(swayTime * 2)) * 0.05;
        } else {
             swayTarget.x = swayPos.x;
             swayTarget.y = swayPos.y;
             swayTime = 0;
        }

        // Lerp gun to target
        gun.position.lerp(swayTarget, 0.1);

        // Recover recoil
        if (!moveForward && !moveBackward && !moveLeft && !moveRight) {
             swayTarget.lerp(swayPos, 0.1);
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
}
