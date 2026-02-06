from playwright.sync_api import sync_playwright
import sys

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Ensure we are serving from root, so path is /task-tracker/index.html
        page.goto("http://localhost:8000/task-tracker/index.html")

        print("Checking Search Input...")
        # 1. Check Search Input
        search_input = page.locator(".search-bar input")
        aria_label = search_input.get_attribute("aria-label")
        if not aria_label:
            print("FAIL: Search input missing aria-label")
            sys.exit(1)
        print("PASS: Search input has aria-label")

        print("Checking Smart Cards...")
        # 2. Check Smart Cards
        smart_cards = page.locator(".smart-card").all()
        if not smart_cards:
            print("FAIL: No smart cards found")
            sys.exit(1)

        for i, card in enumerate(smart_cards):
            role = card.get_attribute("role")
            tabindex = card.get_attribute("tabindex")
            if role != "button":
                print(f"FAIL: Smart card {i} missing role='button'")
                sys.exit(1)
            if tabindex != "0":
                print(f"FAIL: Smart card {i} missing tabindex='0'")
                sys.exit(1)
        print(f"PASS: Checked {len(smart_cards)} smart cards for attributes")

        print("Checking List Rows...")
        # 3. Check List Rows (Dynamic)
        # Wait for them to render
        try:
            page.wait_for_selector(".list-row", timeout=5000)
        except:
             print("FAIL: List rows did not render")
             sys.exit(1)

        list_rows = page.locator(".list-row").all()
        for i, row in enumerate(list_rows):
            role = row.get_attribute("role")
            tabindex = row.get_attribute("tabindex")
            if role != "button":
                print(f"FAIL: List row {i} missing role='button'")
                sys.exit(1)
            if tabindex != "0":
                print(f"FAIL: List row {i} missing tabindex='0'")
                sys.exit(1)
        print(f"PASS: Checked {len(list_rows)} list rows for attributes")

        print("Checking Keyboard Interaction...")
        # 4. Keyboard Interaction Test
        # Focus the second smart card ('Scheduled' usually)
        card_scheduled = page.locator(".smart-card[data-list='scheduled']")
        # Make sure it's visible before focusing
        card_scheduled.wait_for()
        card_scheduled.focus()

        # Take screenshot of focus state
        print("Taking screenshot of focus state...")
        page.screenshot(path="task-tracker/verification/focus_state.png")

        page.keyboard.press("Enter")

        # Check if title changed to "Scheduled"
        # Wait for title to update
        page.wait_for_function("document.getElementById('list-title').textContent === 'Scheduled'")

        title = page.locator("#list-title").text_content()
        if title != "Scheduled":
             print(f"FAIL: Keyboard Enter on Scheduled card did not change view. Title is: {title}")
             sys.exit(1)
        print("PASS: Keyboard Enter interaction works")

        browser.close()

if __name__ == "__main__":
    run()
