
from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--use-gl=swiftshader'])
        page = browser.new_page()
        
        # Load the local HTML file
        cwd = os.getcwd()
        # Ensure we point to index.html in the current directory (kinetic-poster-2)
        page.goto(f"file://{cwd}/index.html")
        
        # 1. Verify Main Title Inputs
        print("Checking Main Title Inputs...")
        page.wait_for_selector("#text-line-1")
        page.wait_for_selector("#text-line-2")
        page.wait_for_selector("#text-line-3")
        
        # 2. Verify Grain Controls exist
        print("Checking Grain Controls...")
        # Toggle grain section if needed (it might be hidden in details or just collapsed)
        # In index.html, it's a checkbox #grain-enabled inside .section-header
        # The content #grain-controls is hidden by default.

        # Click the toggle to reveal controls
        # The structure is: <label class="toggle-switch"><input type="checkbox" id="grain-enabled"><span class="slider"></span></label>
        # We click the slider or the input
        page.locator("#grain-enabled + .slider").click()

        # Now wait for grain controls to be visible
        # Note: The script.js removes 'hidden' class.
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
