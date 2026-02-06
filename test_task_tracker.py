import os
import time
from playwright.sync_api import sync_playwright

def test_task_tracker():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Determine absolute path to task-tracker/index.html
        repo_root = os.getcwd()
        file_url = f"file://{repo_root}/task-tracker/index.html"

        print(f"Loading {file_url}...")
        page.goto(file_url)

        # Wait for load
        page.wait_for_selector(".smart-card")

        # Check initial state
        print("Checking initial state...")
        initial_tasks = page.locator(".task-row:not(.is-placeholder)").count()
        print(f"Initial tasks: {initial_tasks}")

        # Test Flagging
        print("Testing Flag feature...")

        # Find the first task's flag button
        first_flag_btn = page.locator(".task-row:not(.is-placeholder) .flag-btn").first

        # Hover over the row to make it visible (in case CSS opacity blocks interaction, though Playwright can force)
        page.locator(".task-row:not(.is-placeholder)").first.hover()

        # Click flag
        # force=True allows clicking even if hidden/transparent
        first_flag_btn.click(force=True)

        # Verify it has 'active' class
        # Wait a moment for DOM update
        time.sleep(0.5)

        classes = first_flag_btn.get_attribute("class")
        print(f"Button classes: {classes}")
        assert "active" in classes
        print("Flag button activated.")

        # Switch to Flagged view
        print("Switching to Flagged view...")
        page.click(".smart-card[data-list='flagged']")

        # Verify we see the task
        time.sleep(0.5)
        flagged_count = page.locator(".task-row:not(.is-placeholder)").count()
        print(f"Flagged tasks visible: {flagged_count}")
        assert flagged_count >= 1

        # Verify Title
        title = page.locator("#list-title").inner_text()
        assert title == "Flagged"

        print("Flag feature verification passed!")

        browser.close()

if __name__ == "__main__":
    test_task_tracker()
