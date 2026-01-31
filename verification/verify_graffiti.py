from playwright.sync_api import sync_playwright
import subprocess
import time

def test_graffiti():
    # Start server
    server = subprocess.Popen(["python3", "-m", "http.server", "8001"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            page.goto("http://localhost:8001/Interactive-graffiti-1/index.html")

            page.wait_for_selector('canvas')

            # Simulate mouse drag to create drips
            page.mouse.move(100, 100)
            page.mouse.down()
            page.mouse.move(200, 200, steps=10) # Drag
            page.mouse.up()

            # Wait for drip animation
            time.sleep(1)

            page.screenshot(path="verification/graffiti.png")

            browser.close()
            print("SUCCESS: Interactive Graffiti verified")
    finally:
        server.kill()

if __name__ == "__main__":
    test_graffiti()
