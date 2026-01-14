import * as THREE from 'three';

class Sketch {
    constructor(container) {
        this.container = container;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.init();
        this.addObjects();
        this.render();
        this.setupResize();
        this.addInteraction();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.width / this.height,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);
    }

    addObjects() {
        const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0x6e45e2,
            roughness: 0.1,
            metalness: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);
    }

    render() {
        if (!this.renderer) return;

        this.mesh.rotation.x += 0.01;
        this.mesh.rotation.y += 0.01;

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }

    setupResize() {
        window.addEventListener('resize', () => {
            this.width = this.container.offsetWidth;
            this.height = this.container.offsetHeight;

            this.renderer.setSize(this.width, this.height);
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
        });
    }

    addInteraction() {
        // Basic mouse interaction placeholder
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / this.width) * 2 - 1;
            const y = -(e.clientY / this.height) * 2 + 1;

            // Slight tilt based on mouse
            this.mesh.rotation.x += y * 0.05;
            this.mesh.rotation.y += x * 0.05;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');
    new Sketch(container);
});
