// CPU Dithering Algorithms

// Helper: Find closest color index in palette
function getClosestColorIndex(r, g, b, palette) {
    let minDiff = Infinity;
    let idx = 0;
    for (let i = 0; i < palette.length; i++) {
        const p = palette[i];
        const diff = (r - p[0])**2 + (g - p[1])**2 + (b - p[2])**2;
        if (diff < minDiff) {
            minDiff = diff;
            idx = i;
        }
    }
    return idx;
}

// Generalized Error Diffusion
export function ditherErrorDiffusion(data, width, height, palette, kernel, divisor) {
    const buf = new Float32Array(data);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;

            const oldR = buf[i];
            const oldG = buf[i+1];
            const oldB = buf[i+2];

            const idx = getClosestColorIndex(oldR, oldG, oldB, palette);
            const newColor = palette[idx];

            buf[i] = newColor[0];
            buf[i+1] = newColor[1];
            buf[i+2] = newColor[2];

            const errR = oldR - newColor[0];
            const errG = oldG - newColor[1];
            const errB = oldB - newColor[2];

            // Distribute Error based on Kernel
            for (let k = 0; k < kernel.length; k++) {
                const item = kernel[k]; // [dx, dy, weight]
                distributeError(buf, x + item[0], y + item[1], width, height, errR, errG, errB, item[2] / divisor);
            }
        }
    }

    return new Uint8ClampedArray(buf);
}

function distributeError(buf, x, y, w, h, er, eg, eb, weight) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const i = (y * w + x) * 4;
    buf[i] += er * weight;
    buf[i+1] += eg * weight;
    buf[i+2] += eb * weight;
}

// Kernel Definitions [dx, dy, weight]
const KERNELS = {
    'floyd-steinberg': {
        kernel: [[1, 0, 7], [-1, 1, 3], [0, 1, 5], [1, 1, 1]],
        divisor: 16
    },
    'atkinson': {
        kernel: [[1, 0, 1], [2, 0, 1], [-1, 1, 1], [0, 1, 1], [1, 1, 1], [0, 2, 1]],
        divisor: 8
    },
    'stucki': {
        kernel: [
            [1, 0, 8], [2, 0, 4],
            [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2],
            [-2, 2, 1], [-1, 2, 2], [0, 2, 4], [1, 2, 2], [2, 2, 1]
        ],
        divisor: 42
    },
    'burkes': {
        kernel: [
            [1, 0, 8], [2, 0, 4],
            [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2]
        ],
        divisor: 32
    },
    'sierra': {
        kernel: [
            [1, 0, 5], [2, 0, 3],
            [-2, 1, 2], [-1, 1, 4], [0, 1, 5], [1, 1, 4], [2, 1, 2],
            [-1, 2, 2], [0, 2, 3], [1, 2, 2]
        ],
        divisor: 32
    },
    'sierra-two-row': {
        kernel: [
            [1, 0, 4], [2, 0, 3],
            [-2, 1, 1], [-1, 1, 2], [0, 1, 3], [1, 1, 2], [2, 1, 1]
        ],
        divisor: 16
    },
    'sierra-lite': {
        kernel: [[1, 0, 2], [-1, 1, 1], [0, 1, 1]],
        divisor: 4
    },
    'jarvis': {
        kernel: [
            [1, 0, 7], [2, 0, 5],
            [-2, 1, 3], [-1, 1, 5], [0, 1, 7], [1, 1, 5], [2, 1, 3],
            [-2, 2, 1], [-1, 2, 3], [0, 2, 5], [1, 2, 3], [2, 2, 1]
        ],
        divisor: 48
    }
};

export function ditherAlgo(data, width, height, palette, algoName) {
    if (KERNELS[algoName]) {
        return ditherErrorDiffusion(data, width, height, palette, KERNELS[algoName].kernel, KERNELS[algoName].divisor);
    }
    // Fallback
    return ditherErrorDiffusion(data, width, height, palette, KERNELS['floyd-steinberg'].kernel, 16);
}
