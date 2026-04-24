import { test, expect } from '@playwright/test'
import { NAV_LINKS, waitForPageData } from './helpers/navigation.js'

test.describe('Navigation bar', () => {

  test('app loads and nav bar is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.top-nav')).toBeVisible()
    await expect(page.locator('.logo h1')).toBeVisible()
    await expect(page.locator('.filters-bar')).toBeVisible()
  })

  test('all seven nav links are rendered', async ({ page }) => {
    await page.goto('/')
    const navLinks = page.locator('.nav-tabs a')
    await expect(navLinks).toHaveCount(7)
  })

  for (const [name, { href, label }] of Object.entries(NAV_LINKS)) {
    test(`clicking "${name}" navigates to ${href}`, async ({ page }) => {
      await page.goto('/')
      await page.locator('.nav-tabs a', { hasText: label }).click()
      await expect(page).toHaveURL(href)
      await expect(page.locator(`.nav-tabs a[href="${href}"]`)).toHaveClass(/active/)
    })
  }

  test('direct URL navigation works for every route', async ({ page }) => {
    for (const { href } of Object.values(NAV_LINKS)) {
      await page.goto(href)
      await expect(page).toHaveURL(href)
      await expect(page.locator('.main-content')).toBeVisible()
    }
  })

})
