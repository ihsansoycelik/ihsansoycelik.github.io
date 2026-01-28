from playwright.sync_api import sync_playwright
import time
import sys

def run():
    try:
        with sync_playwright() as p:
            print("Launching browser...")
            browser = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
            page = browser.new_page()
            print("Navigating to page...")
            page.goto("http://localhost:8000/kinetic-poster-1/index.html")

            # Test V1
            print("Testing V1...")
            page.wait_for_selector("#v1 canvas", timeout=10000)
            time.sleep(2)
            page.screenshot(path="kinetic-poster-1/verification_v1.png")
            print("V1 screenshot captured.")

            # Switch to V2
            print("Switching to V2...")
            page.click("a[href='#v2']")
            page.wait_for_selector("#v2 canvas", timeout=10000)
            time.sleep(2)
            page.screenshot(path="kinetic-poster-1/verification_v2.png")
            print("V2 screenshot captured.")

            # Switch to V3
            print("Switching to V3...")
            page.click("a[href='#v3']")
            page.wait_for_selector("#v3 canvas", timeout=10000)
            time.sleep(2)
            page.screenshot(path="kinetic-poster-1/verification_v3.png")
            print("V3 screenshot captured.")

            browser.close()
            print("Verification complete.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run()
