from playwright.sync_api import sync_playwright
import os
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to crt-simulation
        url = "file://" + os.path.abspath("crt-simulation/index.html")
        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for canvas
        page.wait_for_selector("canvas")
        print("Canvas loaded.")

        # Initial wait (Boot sequence starts automatically)
        print("Waiting for boot sequence...")
        page.wait_for_timeout(4000) # Boot takes ~3.5s + load

        # Check if we are in running state (or at least canvas is rendering)
        page.screenshot(path="verification/crt_boot_done.png")
        print("Screenshot verification/crt_boot_done.png captured.")

        # Click Reboot
        print("Clicking Reboot...")
        page.click("#BtnReboot")

        # Wait a bit for BIOS text
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/crt_reboot_bios.png")
        print("Screenshot verification/crt_reboot_bios.png captured.")

        browser.close()

if __name__ == "__main__":
    run()
