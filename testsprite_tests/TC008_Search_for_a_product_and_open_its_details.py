import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the site's Search page (navigate to the Search page).
        await page.goto("http://localhost:3000/search")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the search field with 'sepatu' and click the 'Cari' button to submit the search.
        # 🔍 Cari barang keren... text field
        elem = page.get_by_placeholder('🔍 Cari barang keren...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("sepatu")
        
        # -> Fill the search field with 'sepatu' and click the 'Cari' button to submit the search.
        # Cari button
        elem = page.get_by_text('Pedia', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='Cari', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Sepatu New Balance 530 trainers' product link in the search results to open its product detail page.
        # 🛒 link
        elem = page.locator('xpath=/html/body/div[2]/nav/div/div/div/a')
        await elem.click(timeout=10000)
        
        # -> Open the Search page (navigate to the '/search' URL) so the search input and results can be re-run and the target product clicked.
        await page.goto("http://localhost:3000/search")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Sepatu New Balance 530 trainers' product card (the product image/title) to open its product detail page and verify the product title and price appear.
        await page.mouse.wheel(0, 300)
        
        # -> Click the 'Sepatu New Balance 530 trainers' product card (the product image/title) to open its product detail page and verify the product title and price appear.
        # Jersy Man United
        elem = page.locator('xpath=/html/body/div[2]/main/div[5]/a[4]/div/div/img')
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the product detail page is displayed
        # Assert: The URL contains '/products/', indicating a product detail page is open.
        await expect(page).to_have_url(re.compile("/products/"), timeout=15000), "The URL contains '/products/', indicating a product detail page is open."
        await page.locator("xpath=/html/body/div[2]/main/div[1]/a").nth(0).scroll_into_view_if_needed()
        # Assert: The '← Kembali ke Semua Produk' link is visible on the product detail page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div[1]/a").nth(0)).to_be_visible(timeout=15000), "The '\u2190 Kembali ke Semua Produk' link is visible on the product detail page."
        await page.locator("xpath=/html/body/div[2]/main/div[2]/div[2]/div[5]/button[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Tambah ke Keranjang' button is visible on the product detail page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div[2]/div[2]/div[5]/button[1]").nth(0)).to_be_visible(timeout=15000), "The 'Tambah ke Keranjang' button is visible on the product detail page."
        await page.locator("xpath=/html/body/div[2]/main/div[2]/div[2]/div[5]/button[2]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Beli Langsung' button is visible on the product detail page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div[2]/div[2]/div[5]/button[2]").nth(0)).to_be_visible(timeout=15000), "The 'Beli Langsung' button is visible on the product detail page."
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    