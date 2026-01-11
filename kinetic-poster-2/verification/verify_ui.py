
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Load the local HTML file
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")
        
        # 1. Verify Project Settings Inputs exist
        print("Checking Project Settings...")
        page.wait_for_selector("#canvas-width")
        page.wait_for_selector("#canvas-height")
        page.wait_for_selector("#apply-size")
        
        # 2. Verify Grain Controls exist
        print("Checking Grain Controls...")
        # Click the label or slider, not the hidden checkbox
        # We target the slider span next to the input
        page.locator("#grain-enabled + .slider").click()
            
        page.wait_for_selector("#grain-amount")
        page.wait_for_selector("#grain-frequency")
        page.wait_for_selector("#grain-blend")
        
        # 3. Take Screenshot of the UI
        print("Taking screenshot...")
        page.screenshot(path="verification/ui_verification.png", full_page=True)
        
        browser.close()
        print("Verification complete.")

if __name__ == "__main__":
    run()
