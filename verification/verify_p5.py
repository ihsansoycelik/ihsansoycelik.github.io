
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local server
        page.goto('http://localhost:8000/p5-js-1/index.html')

        # Wait for canvas to be present
        page.wait_for_selector('canvas')

        # Wait a bit for the sketch to render (fonts loading, etc)
        # p5.js 'setup' runs after preload.
        time.sleep(2)

        # Take screenshot
        page.screenshot(path='verification/p5-js-1-screenshot.png')

        browser.close()

if __name__ == '__main__':
    run()
