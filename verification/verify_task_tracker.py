from playwright.sync_api import sync_playwright
import os

def verify_task_tracker():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Open the page
        # Using absolute path inside the container
        url = "file:///app/task-tracker/index.html"
        print(f"Navigating to {url}")
        page.goto(url)

        # Verify initial items
        print("Verifying initial items...")
        page.wait_for_selector("text=Home", timeout=5000)
        page.wait_for_selector("text=Projects", timeout=5000)
        page.wait_for_selector("text=About", timeout=5000)
        page.wait_for_selector("text=Contact", timeout=5000)

        # Verify Add button exists
        add_btn = page.locator("#add-task-btn")
        if add_btn.count() == 0:
            raise Exception("Add button not found")

        # Click Add button
        print("Clicking Add button...")
        add_btn.click()

        # Verify new item "Task 1" appears
        # The new task should be inserted before the add button
        page.wait_for_selector("text=Task 1", timeout=5000)
        print("Task 1 appeared.")

        # Click on Home to make it active (it's already active but let's click to be sure)
        page.click("text=Home")

        # Take screenshot
        if not os.path.exists("verification"):
            os.makedirs("verification")

        screenshot_path = "verification/task_tracker.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_task_tracker()
