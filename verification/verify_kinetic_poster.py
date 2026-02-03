from playwright.sync_api import sync_playwright
import time

def verify_poster():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the page
        page.goto("http://localhost:8000/kinetic-poster-1/index.html")

        # Wait for V1 to render
        time.sleep(2)
        page.screenshot(path="verification/verification_v1.png")
        print("V1 Screenshot taken")

        # Switch to V2
        page.click("a[href='#v2']")
        time.sleep(2)
        page.screenshot(path="verification/verification_v2.png")
        print("V2 Screenshot taken")

        # Switch to V3
        page.click("a[href='#v3']")
        time.sleep(2)
        page.screenshot(path="verification/verification_v3.png")
        print("V3 Screenshot taken")

        browser.close()

if __name__ == "__main__":
    verify_poster()
