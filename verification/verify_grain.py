from playwright.sync_api import sync_playwright
import os

def verify_grain():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Set viewport to something standard
        page.set_viewport_size({"width": 1280, "height": 800})

        # Load index.html
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Wait a bit for any animations to start
        page.wait_for_timeout(1000)

        # Take screenshot
        page.screenshot(path="verification/grain_after.png")
        print("Screenshot saved to verification/grain_after.png")

        browser.close()

if __name__ == "__main__":
    verify_grain()
