from playwright.sync_api import sync_playwright, expect
import time
import subprocess
import sys

def verify_monoblock():
    # Start HTTP server
    port = 8002
    server_process = subprocess.Popen([sys.executable, "-m", "http.server", str(port)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Started HTTP server on port {port}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            url = f"http://localhost:{port}/index.html"
            print(f"Navigating to {url}...")
            page.goto(url)

            # 1. Verify Structure (Grid should be back)
            print("Verifying Grid Layout...")
            expect(page.locator(".grid-container")).to_be_visible()
            expect(page.locator("#connections-layer")).to_be_visible()

            # 2. Check Initial Background (White)
            body = page.locator("body")
            nav_wrapper = page.locator("#fixed-nav-wrapper")

            initial_bg = body.evaluate("element => getComputedStyle(element).backgroundColor")
            print(f"Initial Background: {initial_bg}")

            # 3. Load Project (Kinetic Poster 1 -> Dark)
            print("Clicking Kinetic-Poster-1...")
            page.get_by_text("Kinetic-Poster-1").click()

            # Wait for transition
            print("Waiting for theme transition...")
            page.wait_for_timeout(3000)

            # 4. Verify Monoblock (Body + Nav Wrapper should be dark)
            new_body_bg = body.evaluate("element => getComputedStyle(element).backgroundColor")
            new_nav_bg = nav_wrapper.evaluate("element => getComputedStyle(element).backgroundColor")

            print(f"New Body BG: {new_body_bg}")
            print(f"New Nav BG: {new_nav_bg}")

            # Expect dark
            if "17, 17, 17" in new_body_bg or "0, 0, 0" in new_body_bg:
                print("SUCCESS: Body background is dark.")
            else:
                 print("FAILURE: Body background is NOT dark.")

            if new_body_bg == new_nav_bg:
                print("SUCCESS: Nav wrapper matches Body background (Monoblock).")
            else:
                print("FAILURE: Nav wrapper mismatch.")

            # 5. Verify Text Color Correction
            header_color = page.locator("h1").evaluate("element => getComputedStyle(element).color")
            print(f"Header Color: {header_color}")
            if "255, 255, 255" in header_color:
                print("SUCCESS: Header text converted to white.")
            else:
                print("FAILURE: Header text is not white.")

            page.screenshot(path="verification/monoblock_verification.png")
            print("Screenshot saved.")

            browser.close()
    finally:
        server_process.terminate()

if __name__ == "__main__":
    verify_monoblock()
