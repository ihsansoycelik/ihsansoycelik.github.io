import os
import time
import subprocess
import sys
from playwright.sync_api import sync_playwright

def verify_a11y():
    # Start HTTP server
    server = subprocess.Popen([sys.executable, "-m", "http.server", "8000"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("Started HTTP server on port 8000")

    try:
        # Give server a moment to start
        time.sleep(2)

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Load the page
            page.goto("http://localhost:8000/task-tracker/index.html")

            # Wait for content to load
            page.wait_for_selector(".smart-card")

            print("Navigating with keyboard...")

            # Focus search input
            page.keyboard.press("Tab")

            # Tab to the first smart card (Today)
            page.keyboard.press("Tab")

            # Take screenshot of focused state
            time.sleep(0.5) # Wait for focus styles
            page.screenshot(path="verification/task_tracker_focus.png")
            print("Screenshot taken: verification/task_tracker_focus.png")

            is_smart_card = page.evaluate("document.activeElement.classList.contains('smart-card')")
            active_id = page.evaluate("document.activeElement.dataset.list")

            print(f"Is focused element a smart card? {is_smart_card}")
            if active_id:
                print(f"Focused smart card ID: {active_id}")

            if not is_smart_card:
                print("FAIL: Smart card did not receive focus.")
                return False

            if active_id == 'today':
                print("Pressing Enter on 'Today' card...")
                page.keyboard.press("Enter")

                # Verify view title changed to "Today"
                time.sleep(0.5)
                title = page.inner_text("#list-title")
                print(f"List title is now: {title}")

                page.screenshot(path="verification/task_tracker_today_view.png")
                print("Screenshot taken: verification/task_tracker_today_view.png")

                if title == "Today":
                    print("SUCCESS: View switched to Today via keyboard.")
                    return True
                else:
                    print("FAIL: View did not switch.")
                    return False

            return False

    finally:
        server.terminate()
        print("Stopped HTTP server")

if __name__ == "__main__":
    success = verify_a11y()
    if not success:
        sys.exit(1)
