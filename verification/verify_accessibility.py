from playwright.sync_api import sync_playwright, expect
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local index.html
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        print("Checking initial state...")

        # 1. Check active links have aria-current="page"
        active_nav = page.locator("#type-list a.nav-link.active")
        expect(active_nav).to_have_attribute("aria-current", "page")
        print("✅ Active nav link has aria-current='page'")

        active_tag = page.locator("#topic-list a.tag-link.active")
        expect(active_tag).to_have_attribute("aria-current", "page")
        print("✅ Active tag link has aria-current='page'")

        # 2. Check disabled links have aria-disabled="true" and tabindex="-1"
        disabled_nav = page.locator("#type-list a.nav-link.disabled").first
        expect(disabled_nav).to_have_attribute("aria-disabled", "true")
        # tabindex property vs attribute: HTML attribute is what we set
        expect(disabled_nav).to_have_attribute("tabindex", "-1")
        print("✅ Disabled nav link has aria-disabled='true' and tabindex='-1'")

        # 3. Test Interaction: Click 'Physics' tag
        print("Testing interaction...")
        physics_link = page.locator("a.tag-link[data-tag='Physics']")
        physics_link.click()

        # Verify 'Physics' became active and has aria-current="page"
        expect(physics_link).to_have_class("tag-link active")
        expect(physics_link).to_have_attribute("aria-current", "page")
        print("✅ Clicked link has aria-current='page'")

        # Verify previous active link (All) lost aria-current
        all_link = page.locator("a.tag-link[data-tag='all']")
        expect(all_link).not_to_have_attribute("aria-current", "page")
        print("✅ Previous link lost aria-current")

        browser.close()

if __name__ == "__main__":
    run()
