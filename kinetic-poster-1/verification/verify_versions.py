from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        # Use swiftshader to avoid GPU issues in headless env
        browser = p.chromium.launch(headless=True, args=['--use-gl=swiftshader'])
        page = browser.new_page()

        cwd = os.getcwd()
        # Verify from repo root perspective or relative to script?
        # I'll assume running from kinetic-poster-1 dir
        page.goto(f"file://{cwd}/index.html")

        # Check Version 1
        print("Verifying Version 1...")
        page.wait_for_selector("#v1.active")
        # Check if canvas exists in v1
        page.wait_for_selector("#v1 canvas")
        page.screenshot(path="verification_v1.png")

        # Click Version 2
        print("Verifying Version 2...")
        page.click('a[href="#v2"]')
        time.sleep(0.5) # Wait for transition/setup
        page.wait_for_selector("#v2.active")
        page.wait_for_selector("#v2 canvas")
        page.screenshot(path="verification_v2.png")

        # Click Version 3
        print("Verifying Version 3...")
        page.click('a[href="#v3"]')
        time.sleep(0.5)
        page.wait_for_selector("#v3.active")
        page.wait_for_selector("#v3 canvas")
        page.screenshot(path="verification_v3.png")

        browser.close()
        print("Verification Complete!")

if __name__ == "__main__":
    run()
