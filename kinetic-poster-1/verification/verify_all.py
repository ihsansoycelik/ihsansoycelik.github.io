import os
import time
import subprocess
from playwright.sync_api import sync_playwright, expect

def verify_kinetic_poster():
    # Start local server to avoid CORS issues with fonts
    server_process = subprocess.Popen(['python3', '-m', 'http.server', '8081'], cwd='/app')
    time.sleep(2) # Wait for server to start

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            url = "http://localhost:8081/kinetic-poster-1/index.html"
            print(f"Navigating to {url}")
            page.goto(url)

            # Wait for Version 1 content
            print("Verifying Version 1...")
            page.wait_for_selector("#v1 canvas", timeout=10000)
            # Wait for text to likely be rendered
            time.sleep(2)
            page.screenshot(path="kinetic-poster-1/verification/v1_initial.png")
            print("Version 1 screenshot captured.")

            # Switch to Version 2
            print("Switching to Version 2...")
            page.click("a[href='#v2']")

            # Wait for Version 2 canvas
            page.wait_for_selector("#v2 canvas", timeout=10000)
            time.sleep(2)
            page.screenshot(path="kinetic-poster-1/verification/v2_initial.png")
            print("Version 2 screenshot captured.")

            # Interact with Version 2 (The Game)
            print("Interacting with Version 2...")
            # Move mouse across the canvas to trigger flee behavior
            canvas = page.locator("#v2 canvas")
            box = canvas.bounding_box()
            if box:
                # Move from center to edges
                cx = box['x'] + box['width'] / 2
                cy = box['y'] + box['height'] / 2
                page.mouse.move(cx, cy)
                time.sleep(0.5)
                page.mouse.move(cx + 100, cy + 100, steps=10)
                time.sleep(0.5)
                page.mouse.move(cx - 100, cy - 100, steps=10)

            time.sleep(1)
            page.screenshot(path="kinetic-poster-1/verification/v2_interaction.png")
            print("Version 2 interaction screenshot captured.")

    except Exception as e:
        print(f"Verification failed: {e}")
        raise e
    finally:
        server_process.kill()

if __name__ == "__main__":
    verify_kinetic_poster()
