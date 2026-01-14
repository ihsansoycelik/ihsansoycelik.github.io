from playwright.sync_api import sync_playwright
import os

def verify_sidebar():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        url = "file:///app/task-tracker/index.html"
        print(f"Navigating to {url}")
        page.goto(url)

        # Verify Sidebar Categories
        print("Verifying sidebar categories...")
        page.wait_for_selector("text=My Lists")
        page.wait_for_selector("text=Personal")
        page.wait_for_selector("text=Work")

        # Verify Main Content for 'Personal' (Default)
        print("Verifying default Personal list...")
        page.wait_for_selector("h1:has-text('Personal')")
        page.wait_for_selector("text=Buy groceries for the week")

        # Click 'Work' and verify update
        print("Switching to Work list...")
        page.click("text=Work")
        page.wait_for_selector("h1:has-text('Work')")
        page.wait_for_selector("text=Review Q1 Reports")

        # Add a new task to Work
        print("Adding new task to Work...")
        page.fill("input[placeholder='New Reminder']", "Submit Audit")
        page.press("input[placeholder='New Reminder']", "Enter")
        page.wait_for_selector("text=Submit Audit")
        print("New task added.")

        # Toggle a task completion
        print("Toggling task completion...")
        # Checkbox for "Review Q1 Reports" (first item)
        # Using a more specific selector
        page.click(".task-row:has-text('Review Q1 Reports') .checkbox-btn")

        # Verify completed class
        if page.locator(".task-row:has-text('Review Q1 Reports')").get_attribute("class").find("completed") == -1:
             # Wait a moment for class update if needed?
             page.wait_for_timeout(200)
             if page.locator(".task-row:has-text('Review Q1 Reports')").get_attribute("class").find("completed") == -1:
                 raise Exception("Task did not mark as completed")
        print("Task marked completed.")

        # Screenshot
        if not os.path.exists("verification"):
            os.makedirs("verification")
        screenshot_path = "verification/sidebar_categories_test.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_sidebar()
