import { state, updateState, setAlgorithm, setPalette, subscribe } from './state.js';
import { initRenderer, render, loadTexture } from './gl-renderer.js';
import { initWorker, processImageCPU } from './worker-bridge.js';
import { getPalette, generatePalette } from './palettes.js';
import { initExport } from './export.js';

// CPU Algorithms list
const CPU_ALGOS = ['floyd-steinberg', 'atkinson', 'stucki', 'burkes', 'sierra', 'sierra-two-row', 'sierra-lite', 'jarvis'];

let processTimeout;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initRenderer(document.getElementById('dither-canvas'));

    // Initialize export logic
    initExport(state, handleWorkerResult);

    initWorker(handleWorkerResult);

    // Subscribe to state changes
    subscribe((newState) => {
        handleStateChange(newState);
    });

    // Initial Render Loop
    requestAnimationFrame(loop);
});

export function handleWorkerResult(result) {
    // Worker Finished
    const data = new Uint8Array(result.buffer);
    loadTexture(data, result.width, result.height);
    render(state, true); // Render with Bypass Shader
    document.getElementById('loading-indicator').classList.add('hidden');
}

function handleStateChange(newState) {
    const algo = newState.settings.algorithm;
    const isCPU = CPU_ALGOS.includes(algo);
    const isVideo = newState.image.type === 'video';

    if (newState.image.type === 'video') {
        // Video always uses GPU for real-time preview.
        // If a CPU algorithm is selected, the render loop handles the fallback to Bayer.
        return;
    }

    if (isCPU) {
        // Debounce CPU processing
        clearTimeout(processTimeout);
        document.getElementById('loading-indicator').classList.remove('hidden');
        processTimeout = setTimeout(() => {
            processImageCPU(newState);
        }, 100);
    } else {
        // GPU update is handled in loop or we can force render here if loop isn't running enough
        // But loop runs always.
    }
}

function initUI() {
    // File Input
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('btn-upload');
    const dropZone = document.getElementById('drop-zone');

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // Algorithm Select
    const algoSelect = document.getElementById('algo-select');
    algoSelect.addEventListener('change', (e) => {
        setAlgorithm(e.target.value);
    });

    // Palette Select
    const paletteSelect = document.getElementById('palette-select');
    paletteSelect.addEventListener('change', (e) => {
        const pName = e.target.value;
        if (pName === 'custom') {
            if (state.image.source) {
                // Generate palette from image
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 100; // Small sample
                tempCanvas.height = 100;
                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(state.image.source, 0, 0, 100, 100);
                const data = ctx.getImageData(0, 0, 100, 100);
                const colors = generatePalette(data, state.settings.colorCount);
                state.palette = colors;
                renderPalettePreview(colors);
                updateState({ palette: pName }); // Trigger update
            } else {
                alert("Please upload an image first to extract palette.");
                e.target.value = 'bw'; // Revert
            }
        } else {
            const colors = getPalette(pName, state.settings.colorCount);
            state.palette = colors; // Direct update before state triggers
            updateState({ palette: pName });
            renderPalettePreview(colors);
        }
    });

    // Sliders
    bindSlider('color-count', 'colorCount', (val) => {
        const colors = getPalette(state.settings.palette, val);
        state.palette = colors;
        renderPalettePreview(colors);
    });
    bindSlider('brightness', 'brightness');
    bindSlider('contrast', 'contrast');
    bindSlider('dither-amount', 'ditherAmount');
    bindSlider('pixel-scale', 'pixelScale', (val) => {
        const canvas = document.getElementById('dither-canvas');
        canvas.style.transform = `scale(${val})`;
    });

    // Initial Palette Preview
    renderPalettePreview(getPalette('bw', 2));
}

function bindSlider(id, settingKey, onChange) {
    const input = document.getElementById(id);
    const display = document.getElementById(id + '-val');

    input.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        display.innerText = val + (id === 'dither-amount' ? '%' : (id === 'pixel-scale' ? 'x' : ''));
        updateState({ [settingKey]: val });
        if (onChange) onChange(val);
    });
}

function handleFileSelect(e) {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
}

function handleFile(file) {
    const reader = new FileReader();
    const isVideo = file.type.startsWith('video');

    document.getElementById('loading-indicator').classList.remove('hidden');
    document.getElementById('empty-state').classList.add('hidden');

    reader.onload = (e) => {
        const src = e.target.result;
        if (isVideo) {
            const video = document.createElement('video');
            video.src = src;
            video.muted = true;
            video.loop = true;
            video.autoplay = true;
            video.playsInline = true;
            video.onloadedmetadata = () => {
                state.image.source = video;
                state.image.width = video.videoWidth;
                state.image.height = video.videoHeight;
                state.image.type = 'video';
                state.video.isPlaying = true;

                loadTexture(video);
                video.play();
                document.getElementById('loading-indicator').classList.add('hidden');

                // Force update to handle video mode
                updateState({ type: 'video' });
            };
        } else {
            const img = new Image();
            img.onload = () => {
                state.image.source = img;
                state.image.width = img.width;
                state.image.height = img.height;
                state.image.type = 'image';

                // Reset texture to image
                loadTexture(img);
                document.getElementById('loading-indicator').classList.add('hidden');

                // Force update to trigger processing
                updateState({ type: 'image' });
            };
            img.src = src;
        }
    };
    reader.readAsDataURL(file);
}

function renderPalettePreview(colors) {
    const container = document.getElementById('palette-colors');
    container.innerHTML = '';
    colors.forEach(c => {
        const div = document.createElement('div');
        div.className = 'palette-swatch';
        div.style.backgroundColor = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
        container.appendChild(div);
    });
}

function loop() {
    requestAnimationFrame(loop);

    if (!state.image.source) return;

    // Video Handling
    if (state.image.type === 'video') {
         // Always render video frames using GPU
         loadTexture(state.image.source);

         // Video playback requires real-time processing, which is not possible with CPU-bound algorithms (like Error Diffusion).
         // We automatically fallback to Ordered Dithering (Bayer 4x4) which runs on the GPU.
         const isCPU = CPU_ALGOS.includes(state.settings.algorithm);
         let renderState = state;
         if (isCPU) {
             renderState = {
                 ...state,
                 settings: {
                     ...state.settings,
                     algorithm: 'bayer-4'
                 }
             };
         }
         render(renderState, false);
         return;
    }

    // Image Handling
    const isCPU = CPU_ALGOS.includes(state.settings.algorithm);
    if (!isCPU) {
        // Continuous render for GPU algos (needed if we had animated noise, otherwise static)
        // But helpful for brightness/contrast sliders which are smooth
        render(state);
    }
    // If CPU, we do nothing. The worker callback handles the render.
}
