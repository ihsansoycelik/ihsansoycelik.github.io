// Color Palettes Definition

export const PRESETS = {
    'bw': [[0,0,0], [255,255,255]],
    'gray-4': [[0,0,0], [85,85,85], [170,170,170], [255,255,255]],
    'gray-8': [
        [0,0,0], [36,36,36], [73,73,73], [109,109,109],
        [146,146,146], [182,182,182], [219,219,219], [255,255,255]
    ],
    'gameboy': [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
    'cga': [[0,0,0], [85,255,255], [255,85,255], [255,255,255]],
    'cga-2': [[0,0,0], [0,255,0], [255,0,0], [255,255,0]],
    'ega': [
        [0,0,0], [0,0,170], [0,170,0], [0,170,170],
        [170,0,0], [170,0,170], [170,85,0], [170,170,170],
        [85,85,85], [85,85,255], [85,255,85], [85,255,255],
        [255,85,85], [255,85,255], [255,255,85], [255,255,255]
    ],
    'c64': [
        [0,0,0], [255,255,255], [136,0,0], [170,255,238],
        [204,68,204], [0,204,85], [0,0,170], [238,238,119],
        [221,136,85], [102,68,0], [255,119,119], [51,51,51],
        [119,119,119], [170,255,102], [0,136,255], [187,187,187]
    ],
    'zx-spectrum': [
        [0,0,0], [0,0,215], [215,0,0], [215,0,215],
        [0,215,0], [0,215,215], [215,215,0], [215,215,215],
        [0,0,0], [0,0,255], [255,0,0], [255,0,255],
        [0,255,0], [0,255,255], [255,255,0], [255,255,255]
    ],
    'apple-ii': [
        [0,0,0], [144,23,64], [64,44,83], [255,44,255],
        [0,165,0], [128,128,128], [64,76,255], [255,83,255],
        [0,69,0], [255,89,0], [128,128,128], [255,138,206],
        [0,255,0], [144,255,0], [64,191,255], [255,255,255]
    ],
    'pico-8': [
        [0,0,0], [29,43,83], [126,37,83], [0,135,81],
        [171,82,54], [95,87,79], [194,195,199], [255,241,232],
        [255,0,77], [255,163,0], [255,236,39], [0,228,54],
        [41,173,255], [131,118,156], [255,119,168], [255,204,170]
    ],
    'web': []
};

// Generate Web Safe colors
for (let r=0; r<6; r++) {
    for (let g=0; g<6; g++) {
        for (let b=0; b<6; b++) {
            PRESETS['web'].push([r*51, g*51, b*51]);
        }
    }
}

export function getPalette(name, count = 256) {
    if (name === 'custom') {
        // This should be handled by extracting from state.image
        // But getPalette is sync and state is external.
        // We will need to pass the image data or call a generator function.
        // For now, return BW as placeholder, actual logic moved to `generatePalette`
        return PRESETS['bw'];
    }

    if (PRESETS[name]) {
        return PRESETS[name];
    }

    return PRESETS['bw'];
}

// Median Cut Implementation
export function generatePalette(imageData, colorCount) {
    if (!imageData) return PRESETS['bw'];

    const pixels = [];
    const step = 4 * 4; // Sample every 4th pixel to speed up
    for (let i = 0; i < imageData.data.length; i += step) {
        if (imageData.data[i+3] > 128) { // Ignore transparent
            pixels.push([imageData.data[i], imageData.data[i+1], imageData.data[i+2]]);
        }
    }

    if (pixels.length === 0) return PRESETS['bw'];

    const buckets = [pixels];

    while (buckets.length < colorCount) {
        let maxBucketIdx = 0;
        let maxBucketRange = 0;
        let maxBucketChannel = 0;

        // Find bucket with largest range
        for (let i = 0; i < buckets.length; i++) {
            const bucket = buckets[i];
            if (bucket.length <= 1) continue;

            let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;

            for (const p of bucket) {
                if(p[0]<minR) minR=p[0]; if(p[0]>maxR) maxR=p[0];
                if(p[1]<minG) minG=p[1]; if(p[1]>maxG) maxG=p[1];
                if(p[2]<minB) minB=p[2]; if(p[2]>maxB) maxB=p[2];
            }

            const rRange = maxR - minR;
            const gRange = maxG - minG;
            const bRange = maxB - minB;
            const range = Math.max(rRange, gRange, bRange);

            if (range > maxBucketRange) {
                maxBucketRange = range;
                maxBucketIdx = i;
                maxBucketChannel = (rRange >= gRange && rRange >= bRange) ? 0 : (gRange >= bRange ? 1 : 2);
            }
        }

        if (maxBucketRange === 0) break; // Cannot split further

        // Split bucket
        const bucketToSplit = buckets[maxBucketIdx];
        bucketToSplit.sort((a, b) => a[maxBucketChannel] - b[maxBucketChannel]);

        const medianIdx = Math.floor(bucketToSplit.length / 2);
        const splitA = bucketToSplit.slice(0, medianIdx);
        const splitB = bucketToSplit.slice(medianIdx);

        buckets.splice(maxBucketIdx, 1, splitA, splitB);
    }

    // Average colors in buckets
    const palette = buckets.map(bucket => {
        let r=0, g=0, b=0;
        for (const p of bucket) { r+=p[0]; g+=p[1]; b+=p[2]; }
        return [
            Math.round(r/bucket.length),
            Math.round(g/bucket.length),
            Math.round(b/bucket.length)
        ];
    });

    return palette;
}
