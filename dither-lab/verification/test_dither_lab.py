import os
import time
import subprocess
from playwright.sync_api import sync_playwright, expect

def test_dither_lab():
    # Start server
    # Running from /app (repo root)
    server_process = subprocess.Popen(['python3', '-m', 'http.server', '8080'], cwd='/app')
    time.sleep(2) # Wait for server

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Navigate to dither-lab
            print("Navigating to Dither Lab...")
            page.goto('http://localhost:8080/dither-lab/index.html')

            # Wait for canvas
            expect(page.locator('#dither-canvas')).to_be_visible()
            print("Canvas visible.")

            # Load a default image?
            # Dither Lab starts with no image, so drag drop area is visible.
            # We need to verify UI options mostly.
            # But the 'render' function only runs if an image is loaded?
            # Let's check main.js
            # initUI calls renderPalettePreview which works without image.
            # But `loop` returns if `!state.image.source`.

            # So to verify "Bayer 16" doesn't crash, we need to load an image.
            # We can use a dummy base64 image or file upload.

            # Create a dummy image via JS
            page.evaluate("""
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'red';
                ctx.fillRect(0,0,50,100);
                ctx.fillStyle = 'blue';
                ctx.fillRect(50,0,50,100);
                const img = new Image();
                img.onload = () => {
                    // Manually trigger handleFile logic or similar
                    // But handleFile expects a File object.
                    // We can inject into state directly?
                    // 'state' is exported from state.js but not global.
                    // We can simulate file input.
                };
                // Easier: Use input[type=file]
            """)

            # Better: We can rely on `setInputFiles`.
            # We need a dummy image file.
            # Create one.
            with open('dither-lab/verification/test_image.png', 'wb') as f:
                # Minimal PNG or just use random bytes if browser accepts?
                # Better to write a script to generate a valid PNG or use an existing one in repo?
                # There are no images in repo (listed files didn't show any assets).
                pass

            # Let's generate a valid PNG using python?
            # Or just use the evaluate method to inject an image into the app state if possible.
            # Accessing module scope is hard.

            # Let's try to mock the file input with a text file acting as image? No, FileReader needs image.
            # I'll create a simple valid PNG using a hex string.
            # 1x1 white pixel PNG.
            with open('dither-lab/verification/test.png', 'wb') as f:
                 f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xa7\x91\x06\x03\x00\x00\x00\x00IEND\xaeB`\x82')

            print("Uploading test image...")
            page.set_input_files('#file-input', 'dither-lab/verification/test.png')

            # Wait for processing (spinner hidden)
            expect(page.locator('#loading-indicator')).to_be_hidden(timeout=5000)
            print("Image loaded.")

            # Test 1: Check Palettes
            print("Testing Palettes...")
            page.select_option('#palette-select', 'c64')
            time.sleep(0.5)

            # Test 2: Bayer 16x16 (Crash check)
            print("Testing Bayer 16x16...")
            page.select_option('#algo-select', 'bayer-16')
            time.sleep(1)
            # Verify canvas is still there and we didn't crash
            expect(page.locator('#dither-canvas')).to_be_visible()

            # Test 3: Halftone
            print("Testing Halftone...")
            page.select_option('#algo-select', 'halftone')
            time.sleep(1)

            # Take screenshot
            print("Taking screenshot...")
            os.makedirs('dither-lab/verification', exist_ok=True)
            page.screenshot(path='dither-lab/verification/dither_lab_final.png')
            print("Screenshot taken")

    except Exception as e:
        print(f"Error: {e}")
        raise e
    finally:
        server_process.kill()

if __name__ == '__main__':
    test_dither_lab()
