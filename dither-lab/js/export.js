// Export Functionality
import { processImageCPU, setOnResultListener } from './worker-bridge.js';
import { render, loadTexture } from './gl-renderer.js';

let restoreWorkerCallback;

export function initExport(state, originalWorkerCallback) {
    restoreWorkerCallback = originalWorkerCallback;
    const btn = document.getElementById('btn-export');
    btn.addEventListener('click', () => handleExport(state));
}

function handleExport(state) {
    const canvas = document.getElementById('dither-canvas');
    if (!state.image.source) {
        alert('No image to export');
        return;
    }

    if (state.image.type === 'video') {
        const choice = confirm("Export Mode:\nOK - Offline Render (Best Quality, Slow)\nCancel - Real-time Record (Fast, may skip frames)");
        if (choice) {
            exportVideoOffline(state);
        } else {
            exportVideoRealtime(canvas, state);
        }
    } else {
        // Image Export
        const link = document.createElement('a');
        link.download = 'dither-lab-export.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}

function exportVideoRealtime(canvas, state) {
    const isCPU = !state.settings.algorithm.startsWith('bayer') &&
                  !state.settings.algorithm.includes('noise');

    if (isCPU) {
        alert("Warning: CPU-based algorithms (Floyd-Steinberg, etc.) may not render in real-time for video export. For best results, switch to an Ordered Dithering algorithm (Bayer, Cluster). Proceeding with screen capture...");
    }

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'dither-lab-video.webm';
        link.click();

        if (state.image.source) state.image.source.loop = true;
    };

    const video = state.image.source;
    video.currentTime = 0;
    video.loop = false;
    video.play();
    recorder.start();

    video.onended = () => {
        recorder.stop();
        video.onended = null;
    };
}

async function exportVideoOffline(state) {
    const { FFmpeg } = window.FFmpeg;
    const { fetchFile, toBlobURL } = window.FFmpegUtil;

    const ffmpeg = new FFmpeg();
    const video = state.image.source;
    const canvas = document.getElementById('dither-canvas');
    const loading = document.getElementById('loading-indicator');
    const loadingText = loading.querySelector('.loading-text');

    loading.classList.remove('hidden');
    video.pause();

    try {
        loadingText.innerText = "Loading FFmpeg...";
        // Load FFmpeg
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
        } catch (e) {
            console.error("FFmpeg load error:", e);
            throw new Error("Failed to load FFmpeg. Check network connection or browser compatibility.");
        }

        const fps = 30; // Target FPS
        const duration = video.duration;
        const totalFrames = Math.floor(duration * fps);
        const isCPU = !state.settings.algorithm.startsWith('bayer') &&
                      !state.settings.algorithm.includes('noise');

        // Prepare for offline rendering
        video.currentTime = 0;

        for (let i = 0; i < totalFrames; i++) {
            loadingText.innerText = `Rendering Frame ${i + 1}/${totalFrames}`;

            // Seek to frame
            video.currentTime = i / fps;
            await new Promise(r => {
                const onSeek = () => {
                    video.removeEventListener('seeked', onSeek);
                    r();
                };
                video.addEventListener('seeked', onSeek);
            });

            // Process Frame
            if (isCPU) {
                // Ensure texture is updated for "source" reads if needed,
                // but processImageCPU reads directly from video element which is updated by seek
                await new Promise(resolve => {
                    setOnResultListener((result) => {
                         // Update texture with result so we can draw it to canvas
                         const data = new Uint8Array(result.buffer);
                         loadTexture(data, result.width, result.height);
                         render(state, true); // Render with bypass
                         resolve();
                    });
                    processImageCPU(state);
                });
            } else {
                // GPU: Update texture from video and render
                loadTexture(video);
                render(state);
                // Wait for GPU to finish? usually sync enough for toBlob
            }

            // Capture Frame
            const frameBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
            const frameData = await fetchFile(frameBlob);
            await ffmpeg.writeFile(`input_${i}.png`, frameData);
        }

        loadingText.innerText = "Encoding Video...";

        // Encode video
        // -r 30: input framerate
        // -i input_%d.png: input pattern
        // -c:v libx264: codec
        // -pix_fmt yuv420p: compatibility
        await ffmpeg.exec([
            '-framerate', `${fps}`,
            '-i', 'input_%d.png',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            'output.mp4'
        ]);

        const data = await ffmpeg.readFile('output.mp4');
        const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));

        const link = document.createElement('a');
        link.href = url;
        link.download = 'dither-lab-render.mp4';
        link.click();

        // Cleanup
        for (let i = 0; i < totalFrames; i++) {
            await ffmpeg.deleteFile(`input_${i}.png`);
        }
        await ffmpeg.deleteFile('output.mp4');

    } catch (e) {
        console.error(e);
        alert("Export failed: " + e.message);
    } finally {
        loading.classList.add('hidden');
        loadingText.innerText = "Processing...";

        // Restore state
        if (restoreWorkerCallback) {
            setOnResultListener(restoreWorkerCallback);
        }
        video.loop = true;
        video.play();
    }
}
