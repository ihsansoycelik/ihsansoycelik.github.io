
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Open the local file directly
        file_path = os.path.abspath("more-is-more/index.html")
        page.goto(f"file://{file_path}")

        # Wait a bit for the animation to start and canvas to be ready
        page.wait_for_timeout(1000)

        # Take screenshot
        page.screenshot(path="verification/screenshot.png")
        browser.close()

if __name__ == "__main__":
    run()
