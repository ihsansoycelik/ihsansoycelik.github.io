from playwright.sync_api import sync_playwright, expect
import time
import subprocess
import os
import signal
import sys

def verify_theme():
    # Start HTTP server
    port = 8000
    server_process = subprocess.Popen([sys.executable, "-m", "http.server", str(port)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Started HTTP server on port {port}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Navigate to localhost
            url = f"http://localhost:{port}/index.html"
            print(f"Navigating to {url}...")
            page.goto(url)

            # Initial check
            body = page.locator("body")
            initial_bg = body.evaluate("element => getComputedStyle(element).backgroundColor")
            print(f"Initial Background: {initial_bg}")

            # Click Kinetic-Poster-1
            print("Clicking Kinetic-Poster-1...")
            project_link = page.get_by_text("Kinetic-Poster-1")
            project_link.click()

            # Wait for iframe
            expect(page.locator("#project-frame")).to_be_visible()

            # Wait for transition
            print("Waiting for theme transition...")
            page.wait_for_timeout(3000)

            # Check new background color
            new_bg = body.evaluate("element => getComputedStyle(element).backgroundColor")
            print(f"New Background: {new_bg}")

            # Expect dark background (rgb(0,0,0) or rgb(17,17,17))
            if "0, 0, 0" in new_bg or "17, 17, 17" in new_bg:
                print("SUCCESS: Background changed to dark.")
            else:
                print(f"FAILURE: Background did not change to expected dark value. Got {new_bg}")

            # Check text color (should be white)
            text_color = body.evaluate("element => getComputedStyle(element).color")
            print(f"New Text Color: {text_color}")
            if "255, 255, 255" in text_color:
                 print("SUCCESS: Text color changed to white.")
            else:
                 print(f"FAILURE: Text color did not change to white. Got {text_color}")

            page.screenshot(path="verification/theme_verification.png")

            browser.close()
    finally:
        server_process.terminate()
        print("Stopped HTTP server")

if __name__ == "__main__":
    verify_theme()
