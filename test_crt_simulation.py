
from playwright.sync_api import sync_playwright
import time
import os

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # We need to serve the file because of CORS with local files and modules/shaders
        # But here we can use file:// because it's a simple script?
        # Actually p5.js in instance mode or global mode might need http if loading assets.
        # But this shader is a string. So file:// might work.
        # Let's try file:// first.

        page.goto(f"file://{os.getcwd()}/crt-simulation/index.html")

        # Wait for canvas
        page.wait_for_selector("#defaultCanvas0", timeout=5000)

        # Check if no errors in console
        page.on("console", lambda msg: print(f"Console: {msg.text}"))

        # Wait a bit
        time.sleep(2)

        # Take a screenshot
        page.screenshot(path="crt_simulation_initial.png")
        print("Screenshot taken: crt_simulation_initial.png")

        browser.close()

if __name__ == "__main__":
    run_test()
