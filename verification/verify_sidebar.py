from playwright.sync_api import sync_playwright
import os

def verify_sidebar():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        url = "file:///app/task-tracker/index.html"
        print(f"Navigating to {url}")
        page.goto(url)

        # Verify Sidebar exists
        print("Verifying sidebar...")
        if page.locator(".sidebar").count() == 0:
            raise Exception("Sidebar not found")

        # Verify initial tasks
        print("Verifying initial tasks...")
        page.wait_for_selector("text=Task 1")
        page.wait_for_selector("text=Task 2")

        # Verify Add button
        add_btn = page.locator("#add-task-btn")
        if add_btn.count() == 0:
            raise Exception("Add button not found")

        # Add new task
        print("Adding new task...")
        add_btn.click()
        page.wait_for_selector("text=Task 3")
        print("Task 3 appeared.")

        # Click new task and verify content update
        print("Clicking Task 3...")
        page.click("text=Task 3")

        # Check if main content header updated
        header = page.locator(".content h1")
        if header.inner_text() != "Task 3":
            raise Exception(f"Header text mismatch. Expected 'Task 3', got '{header.inner_text()}'")
        print("Content header updated correctly.")

        # Screenshot
        if not os.path.exists("verification"):
            os.makedirs("verification")
        screenshot_path = "verification/sidebar_test.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_sidebar()
