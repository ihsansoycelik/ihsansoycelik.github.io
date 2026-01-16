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

// Reusable Assets
let enemyGeometry, enemyMaterial;
let particleGeometry, particleMaterial;

init();
animate();

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.Fog(0x111111, 0, 100);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 50, 50);
    scene.add(dirLight);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
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

    // Initialize Reusable Assets
    enemyGeometry = new THREE.BoxGeometry(1.5, 3, 1.5);
    enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    particleGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Setup Components
    setupEnvironment();
    setupGun();

    raycaster = new THREE.Raycaster();

    // Resize listener
    window.addEventListener('resize', onWindowResize);
}

function setupEnvironment() {
    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const grid = new THREE.GridHelper(200, 100, 0x444444, 0x222222);
    scene.add(grid);

    const boxGeometry = new THREE.BoxGeometry(5, 5, 5);
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x4444aa });
    const environment = new THREE.Group();
    environment.name = "environment";

    for (let i = 0; i < 50; i++) {
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        let x = Math.random() * 160 - 80;
        let z = Math.random() * 160 - 80;
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
        box.position.set(x, 2.5, z);
        environment.add(box);
    }
    scene.add(environment);
}

function setupGun() {
    const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    const gunMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    gun = new THREE.Mesh(gunGeometry, gunMaterial);
    gun.position.set(0.2, -0.2, -0.5);
    camera.add(gun);

    flash = new THREE.PointLight(0xffaa00, 0, 3);
    flash.position.set(0, 0, -0.6);
    gun.add(flash);
}

function spawnEnemy() {
    // Reuse geometry and material
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

    // Random position at distance
    const angle = Math.random() * Math.PI * 2;
    const radius = 30 + Math.random() * 20;
    const x = Math.cos(angle) * radius + camera.position.x;
    const z = Math.sin(angle) * radius + camera.position.z;

    enemy.position.set(x, 1.5, z);
    enemy.userData = { type: 'enemy', health: 1 };

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
        const dir = new THREE.Vector3().subVectors(playerPos, enemy.position);
        dir.y = 0;
        dir.normalize();

        enemy.position.add(dir.multiplyScalar(4 * delta));
        enemy.lookAt(playerPos.x, enemy.position.y, playerPos.z);

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
            requestAnimationFrame(animateParticle);
        };
        animateParticle();
    }
}

function shoot() {
    flash.intensity = 1.0;
    setTimeout(() => { flash.intensity = 0; }, 50);

    // Recoil
    const originalZ = -0.5;
    const recoilZ = -0.3;
    let recoilFrame = 0;
    const recoilDuration = 10;
    const animateRecoil = () => {
        recoilFrame++;
        if (recoilFrame < 5) {
            gun.position.z = originalZ + ((recoilZ - originalZ) * (recoilFrame / 5));
            gun.rotation.x = 0.1 * (recoilFrame / 5);
        } else if (recoilFrame < recoilDuration) {
            gun.position.z = recoilZ - ((recoilZ - originalZ) * ((recoilFrame - 5) / 5));
            gun.rotation.x = 0.1 - (0.1 * ((recoilFrame - 5) / 5));
        } else {
            gun.position.z = originalZ;
            gun.rotation.x = 0;
            return;
        }
        requestAnimationFrame(animateRecoil);
    };
    animateRecoil();

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(scene.children);
    let targetPoint = null;

    for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj !== gun && obj !== flash && obj.name !== "environment") {
             if (obj.userData.type === 'enemy') {
                 targetPoint = intersects[i].point;

                 scene.remove(obj);
                 enemies.splice(enemies.indexOf(obj), 1);
                 createExplosion(obj.position);

                 score += 100;
                 document.getElementById('score-display').innerText = `SCORE: ${score}`;
                 break;
             }
        }

        if (obj.name !== 'environment' && !obj.userData.type && obj.parent?.name === 'environment') {
             targetPoint = intersects[i].point;
             break;
        }
        if (obj.geometry instanceof THREE.PlaneGeometry || (obj.parent && obj.parent.name === 'environment')) {
             targetPoint = intersects[i].point;
             break;
        }
    }

    if (!targetPoint) {
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object !== gun && intersects[i].object !== flash) {
                targetPoint = intersects[i].point;
                break;
            }
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

    if (controls.isLocked === true && health > 0) {
        const delta = (time - prevTime) / 1000;

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
        controls.getObject().position.y += (velocity.y * delta);

        if (controls.getObject().position.y < 1.6) {
            velocity.y = 0;
            controls.getObject().position.y = 1.6;
            canJump = true;
        }

        updateEnemies(delta);
    }

    prevTime = time;
    renderer.render(scene, camera);
}
