from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Open the local index.html file
        url = "file://" + os.path.abspath("index.html")
        page.goto(url)
        
        # Wait for the canvas to be present
        page.wait_for_selector("canvas")
        
        # Wait a bit for p5.js to render the initial frame
        page.wait_for_timeout(2000)
        
        # Take a screenshot of the initial state
        page.screenshot(path="verification_initial.png")
        print("Initial screenshot captured: verification_initial.png")
        
        # Test Interaction: Change Main Title Text
        print("Changing text...")
        page.fill("#text-line-1", "TEST")
        page.fill("#text-line-2", "ING")
        page.fill("#text-line-3", "123")
        page.wait_for_timeout(1000) # Wait for update
        
        # Test Interaction: Toggle Jitter (Turn off)
        print("Toggling Jitter...")
        page.click(".section-jitter .toggle-switch") 
        page.wait_for_timeout(500)
        
        # Test Interaction: Enable Gradient Map
        print("Enabling Gradient Map...")
        page.click(".section-gradient .toggle-switch")
        page.wait_for_timeout(1000)
        
        # Test Interaction: Enable Grain (Fixing the previous ambiguous selector)
        print("Enabling Grain...")
        # Use a more specific selector targeting the header toggle inside section-grain
        page.click(".section-grain .section-header .toggle-switch")
        page.wait_for_timeout(1000)
        
        # Take a screenshot after interactions
        page.screenshot(path="verification_final.png")
        print("Final screenshot captured: verification_final.png")
        
        browser.close()

if __name__ == "__main__":
    run()
