from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the local index.html
        # Assuming the script runs from root, we can use absolute path
        import os
        cwd = os.getcwd()
        page.goto(f"file://{cwd}/index.html")

        # Verify navigation items
        # Check "Articles" exists and has disabled class
        articles_link = page.locator("a.nav-link.disabled").filter(has_text="Articles")
        expect(articles_link).to_be_visible()

        # Check "Other Works" exists and has disabled class
        other_works_link = page.locator("a.nav-link.disabled").filter(has_text="Other Works")
        expect(other_works_link).to_be_visible()

        # Verify text color (computed style)
        color = articles_link.evaluate("el => window.getComputedStyle(el).color")
        # #999999 is rgb(153, 153, 153)
        if color != "rgb(153, 153, 153)":
             print(f"Warning: Expected color rgb(153, 153, 153), got {color}")

        # Verify cursor
        cursor = articles_link.evaluate("el => window.getComputedStyle(el).cursor")
        if cursor != "not-allowed":
             print(f"Warning: Expected cursor not-allowed, got {cursor}")

        # Check "More is More" is NOT present in the project list
        # We need to wait for JS to render projects.
        # The projects are in #project-list
        page.wait_for_selector("#project-list .project-item")

        # Check text of project titles
        project_titles = page.locator(".project-title").all_inner_texts()
        print("Project titles found:", project_titles)

        if "More is More" in project_titles:
            raise Exception("Error: 'More is More' should not be present")

        if "Kinetic-Poster-1" not in project_titles:
             raise Exception("Error: 'Kinetic-Poster-1' should be present")

        # Take screenshot
        page.screenshot(path="verification/verification.png")
        print("Verification complete. Screenshot saved to verification/verification.png")

        browser.close()

if __name__ == "__main__":
    run()
