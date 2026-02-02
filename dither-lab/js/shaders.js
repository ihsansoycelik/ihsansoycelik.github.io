export function getShaders() {
    return {
        vertex: `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            varying vec2 v_texCoord;
            void main() {
                gl_Position = vec4(a_position, 0, 1);
                v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
            }
        `,
        fragment: `
            precision mediump float;

            varying vec2 v_texCoord;

            uniform sampler2D u_image;
            uniform sampler2D u_palette;
            uniform sampler2D u_bayer;
            uniform sampler2D u_blueNoise;

            uniform vec2 u_resolution;
            uniform float u_paletteSize;
            uniform float u_bayerSize;
            uniform int u_algorithm; // 0: None, 1: Bayer, 2: Noise, 3: Blue Noise

            uniform float u_contrast;
            uniform float u_brightness;
            uniform float u_ditherAmount;
            uniform float u_bypass;

            // Color adjustments
            vec3 adjustColor(vec3 color) {
                color += u_brightness;
                color = (color - 0.5) * (1.0 + u_contrast) + 0.5;
                return clamp(color, 0.0, 1.0);
            }

            // Find closest color in palette
            vec3 findClosestColor(vec3 color) {
                float minDist = 1000.0;
                vec3 closest = vec3(0.0);
                for (int i = 0; i < 256; i++) {
                    if (float(i) >= u_paletteSize) break;
                    float u = (float(i) + 0.5) / 256.0;
                    vec3 pColor = texture2D(u_palette, vec2(u, 0.5)).rgb;
                    float dist = distance(color, pColor);
                    if (dist < minDist) {
                        minDist = dist;
                        closest = pColor;
                    }
                }
                return closest;
            }

            void main() {
                vec4 texColor = texture2D(u_image, v_texCoord);

                if (u_bypass > 0.5) {
                    gl_FragColor = texColor;
                    return;
                }

                vec3 color = texColor.rgb;
                color = adjustColor(color);

                if (u_algorithm == 1) {
                    // Ordered Dither (Bayer)
                    vec2 pixelCoord = v_texCoord * u_resolution;
                    vec2 ditherCoord = pixelCoord / u_bayerSize;
                    float map = texture2D(u_bayer, ditherCoord).r;
                    float ditherOffset = (map - 0.5) * u_ditherAmount;
                    color += ditherOffset;
                } else if (u_algorithm == 2) {
                    // White Noise
                    vec2 pixelCoord = v_texCoord * u_resolution;
                    float noise = fract(sin(dot(pixelCoord, vec2(12.9898, 78.233))) * 43758.5453);
                    float ditherOffset = (noise - 0.5) * u_ditherAmount;
                    color += ditherOffset;
                } else if (u_algorithm == 3) {
                    // Blue Noise
                    vec2 pixelCoord = v_texCoord * u_resolution;
                    // Wrap blue noise texture (assume 64x64 or similar)
                    vec2 noiseCoord = pixelCoord / 64.0;
                    float noise = texture2D(u_blueNoise, noiseCoord).r;
                    float ditherOffset = (noise - 0.5) * u_ditherAmount;
                    color += ditherOffset;
                } else if (u_algorithm == 4) {
                    // Halftone (Sine Wave approximation)
                    vec2 pixelCoord = v_texCoord * u_resolution;
                    float angle = 0.785398; // 45 degrees
                    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
                    vec2 rotated = rot * pixelCoord;

                    float frequency = 6.0;
                    vec2 uv = rotated * (3.14159 * 2.0 / frequency);
                    float wave = (sin(uv.x) * sin(uv.y)) * 0.5 + 0.5;

                    float ditherOffset = (wave - 0.5) * u_ditherAmount;
                    color += ditherOffset;
                }

                color = clamp(color, 0.0, 1.0);
                color = findClosestColor(color);

                gl_FragColor = vec4(color, texColor.a);
            }
        `
    };
}
