
from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen for console logs
        page.on('console', lambda msg: print(f'CONSOLE: {msg.text}'))
        page.on('pageerror', lambda err: print(f'ERROR: {err}'))

        print('Navigating...')
        page.goto('http://localhost:8000/p5-js-1/index.html')

        print('Waiting for canvas...')
        try:
            page.wait_for_selector('canvas', timeout=5000)
            print('Canvas found!')
            time.sleep(2)
            page.screenshot(path='verification/p5-js-1-screenshot.png')
        except Exception as e:
            print(f'Timed out or error: {e}')
            # Take screenshot of whatever is there (maybe blank or error)
            page.screenshot(path='verification/debug.png')

        browser.close()

if __name__ == '__main__':
    run()
