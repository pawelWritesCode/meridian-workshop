import { test, expect } from '@playwright/test'
import { waitForPageData } from './helpers/navigation.js'

test.describe('Inventory page — search filter', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory')
    await waitForPageData(page)
  })

  test('search input is visible and empty on load', async ({ page }) => {
    const input = page.locator('.search-input')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('')
  })

  test('typing a search term reduces the table row count', async ({ page }) => {
    const rows = page.locator('table tbody tr')
    const totalCount = await rows.count()
    expect(totalCount).toBeGreaterThan(5)

    await page.locator('.search-input').fill('sensor')
    const filteredCount = await rows.count()
    expect(filteredCount).toBeLessThan(totalCount)
    expect(filteredCount).toBeGreaterThan(0)
  })

  test('search results all contain the term in the item name column', async ({ page }) => {
    await page.locator('.search-input').fill('sensor')
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    for (let i = 0; i < count; i++) {
      const nameCell = rows.nth(i).locator('td').nth(1)
      const text = (await nameCell.innerText()).toLowerCase()
      expect(text).toContain('sensor')
    }
  })

  test('clearing search restores all rows', async ({ page }) => {
    const rows = page.locator('table tbody tr')
    const totalBefore = await rows.count()

    await page.locator('.search-input').fill('sensor')
    await page.locator('.clear-search').click()

    const totalAfter = await rows.count()
    expect(totalAfter).toBe(totalBefore)
  })

  test('SKU count in card title updates when search is active', async ({ page }) => {
    const cardTitle = page.locator('.card-title')
    const fullTitle = await cardTitle.innerText()
    const fullMatch = fullTitle.match(/\((\d+) SKUs?\)/i)
    expect(fullMatch).toBeTruthy()
    const fullCount = parseInt(fullMatch[1], 10)

    await page.locator('.search-input').fill('sensor')
    const filteredTitle = await cardTitle.innerText()
    const filteredMatch = filteredTitle.match(/\((\d+) SKUs?\)/i)
    expect(filteredMatch).toBeTruthy()
    expect(parseInt(filteredMatch[1], 10)).toBeLessThan(fullCount)
  })

})
