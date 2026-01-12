
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the file locally
        # Assuming the script runs from root
        cwd = os.getcwd()
        file_path = f"file://{cwd}/more-is-more/index.html"

        print(f"Navigating to: {file_path}")
        page.goto(file_path)

        # Wait for the canvas to load and the animation to run a bit
        # 60 layers at 60fps, let's wait a second to let it stabilize and swing
        page.wait_for_timeout(2000)

        # Screenshot
        screenshot_path = "verification/screenshot.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run()
