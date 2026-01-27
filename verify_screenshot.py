from playwright.sync_api import sync_playwright
import time

def take_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Use file protocol directly since server is killed, but attributes check might fail if strict
        # But for screenshot of a static page it might be fine if JS runs fast enough or I wait
        # Actually I need the server for clean loading usually, but let's try file://
        page.goto("file:///app/task-tracker/index.html")

        # Wait for JS to run (simulated by waiting for attribute)
        try:
            page.wait_for_selector(".smart-card[role='button']", timeout=5000)
        except:
            pass

        page.locator(".check-circle").first.focus()
        page.screenshot(path="verification_focus.png")
        browser.close()

if __name__ == "__main__":
    take_screenshot()
