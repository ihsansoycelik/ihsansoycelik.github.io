let worker;
let onResultCallback;

export function initWorker(onResult) {
    onResultCallback = onResult;
    worker = new Worker('js/worker.js', { type: 'module' });

    worker.onmessage = function(e) {
        const { type } = e.data;
        if (type === 'result') {
            if (onResultCallback) {
                onResultCallback(e.data);
            }
        }
    };
}

export function processImageCPU(state) {
    if (!worker || !state.image.source) return;

    // Create temp canvas to extract data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = state.image.width;
    tempCanvas.height = state.image.height;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(state.image.source, 0, 0);
    const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    worker.postMessage({
        type: 'process',
        imageData: imageData.data.buffer,
        width: state.image.width,
        height: state.image.height,
        settings: JSON.parse(JSON.stringify(state.settings)),
        palette: state.palette
    }, [imageData.data.buffer]);
}
