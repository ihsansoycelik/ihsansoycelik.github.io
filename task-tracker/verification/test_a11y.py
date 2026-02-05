import os
import sys
from playwright.sync_api import sync_playwright

def test_task_tracker_a11y():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Determine the absolute path to index.html
        repo_root = "/app"
        file_path = f"file://{repo_root}/task-tracker/index.html"

        print(f"Navigating to {file_path}")
        page.goto(file_path)

        # Wait for script to initialize (setupEventListeners)
        page.wait_for_selector(".smart-card")

        # 1. Verify attributes on static smart cards
        print("Verifying attributes on smart cards...")
        today_card = page.locator('.smart-card[data-list="today"]')

        role = today_card.get_attribute("role")
        tabindex = today_card.get_attribute("tabindex")

        if role != "button":
            print(f"FAILURE: Expected role='button', got '{role}'")
            sys.exit(1)
        if tabindex != "0":
            print(f"FAILURE: Expected tabindex='0', got '{tabindex}'")
            sys.exit(1)

        print("Success: Attributes verified.")

        # 2. Verify attributes on dynamic list items (Personal list)
        print("Verifying attributes on dynamic list items...")
        personal_list_item = page.locator('.list-row[data-id="personal"]')

        # It might take a moment for JS to render
        personal_list_item.wait_for(state="attached")

        role = personal_list_item.get_attribute("role")
        tabindex = personal_list_item.get_attribute("tabindex")

        if role != "button":
            print(f"FAILURE: Expected role='button' on list item, got '{role}'")
            sys.exit(1)
        if tabindex != "0":
            print(f"FAILURE: Expected tabindex='0' on list item, got '{tabindex}'")
            sys.exit(1)

        print("Success: List item attributes verified.")

        # 3. Test Keyboard Navigation & Interaction (Enter key)
        print("Testing keyboard interaction...")

        # Click 'Today' to set state away from 'All' (default 'all' is active)
        # We start with 'all' active. Let's switch to 'today' using keyboard on 'today' card.

        # Focus on Today card
        today_card.focus()

        # Verify focus style (optional, hard to check computed style via script easily but we can check active element)
        if page.evaluate("document.activeElement === document.querySelector('.smart-card[data-list=\"today\"]')"):
            print("Focus confirmed on Today card.")
        else:
            print("FAILURE: Focus not on Today card.")
            sys.exit(1)

        # Press Enter
        page.keyboard.press("Enter")

        # Verify Today is now active
        # The class 'active' should be on the today card
        page.wait_for_selector('.smart-card[data-list="today"].active')
        print("Success: Activated 'Today' view via Enter key.")

        # 4. Test Space key on List Item (Personal)
        personal_list_item.focus()
        page.keyboard.press("Space")

        # Verify Personal is now active
        page.wait_for_selector('.list-row[data-id="personal"].active')
        print("Success: Activated 'Personal' list via Space key.")

        # Take screenshot
        page.screenshot(path="task-tracker/verification/verification.png")
        print("Screenshot saved to task-tracker/verification/verification.png")

        browser.close()
        print("All accessibility tests passed!")

if __name__ == "__main__":
    test_task_tracker_a11y()
