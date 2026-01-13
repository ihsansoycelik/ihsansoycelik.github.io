
import os
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Open index.html (main project)
        page.goto(f"file://{os.getcwd()}/index.html")

        # Wait for the page to be fully loaded
        page.wait_for_selector(".project-item")

        # Wait a bit for the grain animation to run a few frames (though screenshot is static)
        page.wait_for_timeout(1000)

        # Take a screenshot
        screenshot_path = "verification/index_grain_verified.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run()
