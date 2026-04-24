import { test, expect } from '@playwright/test'
import { waitForPageData, waitForFilterReload, resetFilters } from './helpers/navigation.js'

test.describe('Reports page — filter regression', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/reports')
    await waitForPageData(page)
  })

  test.afterEach(async ({ page }) => {
    await resetFilters(page)
  })

  test('quarterly performance table has four rows (Q1–Q4)', async ({ page }) => {
    const rows = page.locator('.reports-table').first().locator('tbody tr')
    await expect(rows).toHaveCount(4)
    await expect(rows.first().locator('td').first()).toHaveText(/Q[1-4]/)
  })

  test('warehouse filter changes the displayed stats', async ({ page }) => {
    const stat = page.locator('.stat-card .stat-value').first()
    const before = await stat.innerText()

    await page.locator('.filter-select').nth(1).selectOption('San Francisco')
    await waitForFilterReload(page)

    const after = await stat.innerText()
    expect(after).not.toBe(before)
  })

  test('month filter reduces total orders below full-year total', async ({ page }) => {
    const totalOrdersStat = page.locator('.stat-card .stat-value').nth(2)
    const fullYear = parseInt((await totalOrdersStat.innerText()).replace(/,/g, ''), 10)

    await page.locator('.filter-select').nth(0).selectOption('2025-01')
    await waitForFilterReload(page)

    const oneMonth = parseInt((await totalOrdersStat.innerText()).replace(/,/g, ''), 10)
    expect(oneMonth).toBeLessThan(fullYear)
  })

  test('month filter reduces monthly trend table to one row', async ({ page }) => {
    await page.locator('.filter-select').nth(0).selectOption('2025-05')
    await waitForFilterReload(page)

    // When a single month is selected, the monthly trend table shows only that month.
    const trendRows = page.locator('.reports-table').nth(1).locator('tbody tr')
    await expect(trendRows).toHaveCount(1)
  })

  test('no error appears after applying a location filter', async ({ page }) => {
    await page.locator('.filter-select').nth(1).selectOption('Tokyo')
    await waitForPageData(page)
    await expect(page.locator('.error')).not.toBeVisible()
  })

  test('no error appears after applying a month filter', async ({ page }) => {
    await page.locator('.filter-select').nth(0).selectOption('2025-06')
    await waitForPageData(page)
    await expect(page.locator('.error')).not.toBeVisible()
  })

})
