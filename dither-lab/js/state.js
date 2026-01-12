// State Management
export const state = {
    image: {
        source: null, // Image or Video Element
        width: 0,
        height: 0,
        type: 'none', // 'image' or 'video'
        data: null // ImageData for CPU processing
    },
    settings: {
        algorithm: 'bayer-4',
        palette: 'bw',
        colorCount: 4,
        brightness: 0,
        contrast: 0,
        ditherAmount: 100,
        pixelScale: 1
    },
    palette: [
        [0, 0, 0],       // Black
        [255, 255, 255]  // White
    ],
    video: {
        isPlaying: false,
        fps: 30
    }
};

const listeners = [];

export function subscribe(callback) {
    listeners.push(callback);
}

export function updateState(changes) {
    let hasChanged = false;
    for (const key in changes) {
        if (state.settings[key] !== changes[key]) {
             // Handle nested settings object if key is inside settings, otherwise top level
             // For simplicity, assuming flat updates or specific keys
             if (key in state.settings) {
                 state.settings[key] = changes[key];
                 hasChanged = true;
             } else {
                 state[key] = changes[key];
                 hasChanged = true;
             }
        }
    }

    if (hasChanged) {
        notifyListeners();
    }
}

// Special setter for deep updates or specific logic
export function setAlgorithm(algo) {
    if (state.settings.algorithm !== algo) {
        state.settings.algorithm = algo;
        notifyListeners();
    }
}

export function setPalette(paletteName, customColors = null) {
    state.settings.palette = paletteName;
    if (customColors) {
        state.palette = customColors;
    } else {
        // Load preset palette (this logic might move to palettes.js, but setting state here)
        // For now, we will handle the actual palette data loading in the main controller or palettes module
    }
    notifyListeners();
}

function notifyListeners() {
    listeners.forEach(cb => cb(state));
}
