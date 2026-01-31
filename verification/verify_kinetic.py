from playwright.sync_api import sync_playwright
import subprocess
import time

def test_kinetic():
    # Start server
    server = subprocess.Popen(["python3", "-m", "http.server", "8000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            page.goto("http://localhost:8000/kinetic-poster-1/index.html")

            # Wait for canvas
            page.wait_for_selector('canvas')

            # Wait a bit for animation to start
            time.sleep(1)

            # Screenshot
            page.screenshot(path="verification/kinetic.png")

            canvas = page.locator('canvas')
            print(f"Canvas found: {canvas.count()}")

            browser.close()
            print("SUCCESS: Kinetic Poster verified")
    finally:
        server.kill()

if __name__ == "__main__":
    test_kinetic()
