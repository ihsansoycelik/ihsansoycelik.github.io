import { ditherAlgo } from './dither-cpu.js';

self.onmessage = function(e) {
    const { type, imageData, width, height, settings, palette } = e.data;

    if (type === 'process') {
        const data = new Uint8ClampedArray(imageData);

        // Apply Filters (Brightness/Contrast)
        const brightness = settings.brightness * 2.55;
        const contrast = settings.contrast;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i+1];
            let b = data[i+2];

            r += brightness;
            g += brightness;
            b += brightness;

            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;

            data[i] = Math.max(0, Math.min(255, r));
            data[i+1] = Math.max(0, Math.min(255, g));
            data[i+2] = Math.max(0, Math.min(255, b));
        }

        const result = ditherAlgo(data, width, height, palette, settings.algorithm);

        self.postMessage({
            type: 'result',
            buffer: result.buffer,
            width,
            height
        }, [result.buffer]);
    }
};
