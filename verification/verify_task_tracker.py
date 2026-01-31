from playwright.sync_api import sync_playwright
import subprocess
import time

def test_task_tracker():
    server = subprocess.Popen(["python3", "-m", "http.server", "8002"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            page.goto("http://localhost:8002/task-tracker/index.html")

            # Wait for task list to populate
            page.wait_for_selector('.task-row')
            page.wait_for_selector('.check-circle')

            check_circle = page.locator('.check-circle').first
            check_circle.focus()
            page.keyboard.press('Space')

            time.sleep(0.5)

            page.screenshot(path="verification/task_tracker.png")

            browser.close()
            print("SUCCESS: Task Tracker verified")
    finally:
        server.kill()

if __name__ == "__main__":
    test_task_tracker()
