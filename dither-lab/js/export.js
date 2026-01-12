// Export Functionality
import { processImageCPU } from './worker-bridge.js';

export function initExport(state) {
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
        exportVideo(canvas, state);
    } else {
        // Image Export
        const link = document.createElement('a');
        link.download = 'dither-lab-export.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}

function exportVideo(canvas, state) {
    // Attempt frame-by-frame processing if CPU algorithm is selected
    // Note: This is complex because we need to sync video playback with frame capture and processing.
    // Given the constraints, we will use the existing recording method which captures the Canvas stream.
    // If the user wants CPU dithering on video, they see a static/low-fps preview or "None".
    // Improving this to be perfect offline rendering is a huge task involving ffmpeg.wasm.

    // We will stick to MediaRecorder but add a notification.

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
