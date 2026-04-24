import { test, expect } from '@playwright/test'
import { waitForPageData } from './helpers/navigation.js'

test.describe('Dashboard page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await waitForPageData(page)
  })

  test('KPI section renders with five cards', async ({ page }) => {
    await expect(page.locator('.kpi-card')).toHaveCount(5)
  })

  test('each KPI card has a non-empty value', async ({ page }) => {
    const kpiValues = page.locator('.kpi-value')
    const count = await kpiValues.count()
    for (let i = 0; i < count; i++) {
      const text = (await kpiValues.nth(i).innerText()).trim()
      expect(text).not.toBe('')
    }
  })

  test('no error message is shown on load', async ({ page }) => {
    await expect(page.locator('.error')).not.toBeVisible()
  })

})
