import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://localhost:3000/login')
        await page.locator('[id="login-email"]').fill('seller@test.com')
        await page.locator('[id="login-password"]').fill('password123')
        await page.locator('[id="login-submit-btn"]').click()
        print('Clicked login')
        await page.wait_for_url('**/seller/**', timeout=5000)
        print('Redirected to:', page.url)
        await page.goto('http://localhost:3000/seller/products')
        print('After goto products:', page.url)
        print('H1 text:', await page.locator('h1').inner_text())
        await browser.close()

asyncio.run(run())
