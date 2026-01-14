from playwright.sync_api import sync_playwright, expect
import time
import subprocess
import sys

def verify_sidebar():
    # Start HTTP server
    port = 8001
    server_process = subprocess.Popen([sys.executable, "-m", "http.server", str(port)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Started HTTP server on port {port}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            url = f"http://localhost:{port}/index.html"
            print(f"Navigating to {url}...")
            page.goto(url)

            # 1. Verify Structure
            print("Verifying sidebar existence...")
            expect(page.locator("#sidebar")).to_be_visible()
            expect(page.locator("#content")).to_be_visible()

            # 2. Verify Task List
            print("Verifying Task List...")
            tasks = page.locator(".nav-link")
            count = tasks.count()
            print(f"Found {count} tasks.")

            if count == 0:
                print("FAILURE: No task links found.")
                return

            # Check label "Task 1"
            first_task = tasks.nth(0)
            text = first_task.text_content()
            print(f"First task label: {text}")
            if "Task 1" not in text:
                print(f"FAILURE: Expected 'Task 1', got '{text}'")
            else:
                print("SUCCESS: Task naming convention verified.")

            # 3. Verify Navigation
            print("Verifying Navigation...")
            # Click Task 2
            if count > 1:
                print("Clicking Task 2...")
                tasks.nth(1).click()

                # Check active class
                # Playwright to_have_class requires exact match or regex.
                # Our class is "nav-link active"
                expect(tasks.nth(1)).to_have_class("nav-link active")
                print("SUCCESS: Active state applied.")

                # Check Iframe src (we need to wait a bit for JS to update src)
                page.wait_for_timeout(500)
                frame_src = page.locator("#project-frame").get_attribute("src")
                print(f"Iframe Source: {frame_src}")
                if "kinetic-poster-2" in frame_src:
                     print("SUCCESS: Iframe loaded correct URL.")
                else:
                     print("FAILURE: Iframe source mismatch.")

            page.screenshot(path="verification/sidebar_verification.png")
            print("Screenshot saved.")

            browser.close()
    finally:
        server_process.terminate()

if __name__ == "__main__":
    verify_sidebar()
